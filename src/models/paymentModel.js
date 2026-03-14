import db from "../config/db.js";
import appError from "../utils/appError.js";
import cartModel from "./cartModel.js";
import emailModel from "./emailModel.js";
import emailTemplates from "../utils/emailTemplates.js";

const paymentModel = {

    registerPayPalPurchase: async(paypalData, clientData, cartItems) => {
        console.log("\n\n\n\nInsertando nueva compra de PayPal");
        let connection;

        try {
            connection = await db.getConnection();
            await connection.beginTransaction(); //console.log(paypalData, clientData, cartItems);
        
            const storeId = cartItems?.storeId;
            const paidAmount = parseFloat(paypalData?.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value).toFixed(2);
            const currency = paypalData?.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.currencyCode?.toLowerCase();
            let exchange = parseFloat(paypalData?.purchaseUnits?.[0]?.payments?.captures?.[0]?.sellerReceivableBreakdown?.exchangeRate?.value || 0)?.toFixed(4) || null;
            exchange = (exchange == 0.0000) ? null : exchange;
            
            const containsGold = cartItems?.items?.some(item => item.material == 'gold') || null;
            const paymentStatus = paypalData?.purchaseUnits?.[0]?.payments?.captures?.[0]?.status?.toLowerCase();
            const clientAddress = `${clientData?.clientInfo?.address} ${clientData?.clientInfo?.apartment} ${clientData?.clientInfo?.city} ${clientData?.clientInfo?.zipCode}`;
            const clientEmail = clientData?.clientInfo?.email || paypalData?.payer?.emailAddress;
            
            // Inserción del registro del cliente.
            const insertClientQuery = `
                INSERT INTO clients
                    (
                        clientName, clientEmail, clientTel, clientCountry,
                        clientState, registeredBy,
                        registeredDate, lastEdition, editedBy,
                        name, lastName, address                  
                    )
                VALUES
                    (?, ?, ?, ?, 
                    ?, ?,
                    NOW(), NOW(), ?, 
                    ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    clientEmail     = COALESCE(VALUES(clientEmail), clientEmail),
                    clientTel       = COALESCE(VALUES(clientTel), clientTel),
                    clientCountry   = COALESCE(VALUES(clientCountry), clientCountry),
                    clientState     = COALESCE(VALUES(clientState), clientState),
                    lastEdition     = COALESCE(VALUES(lastEdition), lastEdition),
                    editedBy        = COALESCE(VALUES(editedBy), editedBy)
            `;
            const insertClientValues = [
                `${clientData?.clientInfo?.firstName} ${clientData?.clientInfo?.lastName}`,
                clientEmail,
                clientData?.clientInfo?.phone,
                clientData?.clientInfo?.country,

                clientData?.clientInfo?.state,
                `System`,

                `System`,

                clientData?.clientInfo?.firstName,
                clientData?.clientInfo?.lastName,
                clientAddress
            ];
            const [insertClientResult] = await connection.query(insertClientQuery, insertClientValues);
            
            // Inserción del registro de la venta.
            const insertSaleQuery = `
                INSERT INTO sales
                    (
                        id, storeId, docDate, total, status, registeredAt, registeredBy,
                        paymentMethod, currency, exchange, containsGold, clientId
                    )
                VALUES
                    (?, ?, NOW(), ?, ?, ?, ?,
                    ?, ?, ?, ?, ?)
            `;
            const insertSaleValues = [
                paypalData?.id,
                cartItems?.storeId,
                paidAmount,
                paymentStatus,
                (paypalData?.purchaseUnits?.[0]?.payments?.captures?.[0]?.updateTime).replace('T', ' ').replace('Z', ''),
                'System',

                'paypal',
                currency,
                exchange || null,
                containsGold,
                insertClientResult?.insertId
            ];
            const [insertSaleResult] = await connection.query(insertSaleQuery, insertSaleValues);

            // Inserción del registro del pago.
            const insertPaymentDetailsQuery = `
                INSERT INTO salePayments
                    (saleId, method, amount, currency, 
                    exchangeRate, reference, cardLastDigits, cardBrand, cardType,
                    rawResponse)
                VALUES 
                    (?, ?, ?, ?, 
                    ?, ?, ?, ?, ?,
                    ?)
            `;
            const insertPaymentDetailsValues = [
                paypalData?.id,
                'paypal',
                paidAmount,
                currency,

                exchange,
                paypalData?.purchaseUnits?.[0]?.referenceId,
                paypalData?.paymentSource?.card?.lastDigits,
                paypalData?.paymentSource?.card?.brand?.toLowerCase(),
                paypalData?.paymentSource?.card?.type?.toLowerCase(),
                
                JSON.stringify(paypalData)
            ];
            const [insertPaymentDetailsResult] = await connection.query(insertPaymentDetailsQuery, insertPaymentDetailsValues);

            // Inserción de los items adquiridos a la venta.
            const itemsMap = new Map();
            cartItems.items.forEach(item => {
                itemsMap.set(item?.id, {
                    id: item?.id,
                    quantity: item?.quantity,
                    unitPrice: item?.finalUnitPrice,
                    tagPrice: item?.tagPrice,
                    levountCode: item?.levountCode,
                    alternateCode: item?.alternateCode,
                    material: item?.material
                });
            });
            const mergedList = Array.from(itemsMap.values());
            let insertSaleItemsResult = [];
            const insertSaleItemsQuery = `
                INSERT INTO saleItems 
                    (saleId, productId, quantity, unitPrice, tagPrice, levountCode, alternateCode, material) 
                VALUES ? 
            `;
            const insertSaleItemsValues = mergedList.map(item => [
                paypalData?.id,
                item?.id,
                item?.quantity,
                item?.unitPrice,
                item?.tagPrice,
                item?.levountCode,
                item?.alternateCode,
                item?.material
            ]); //console.log(insertSaleItemsValues);
            if (insertSaleItemsValues.length > 0) {
                [insertSaleItemsResult] = await connection.query(insertSaleItemsQuery, [insertSaleItemsValues]);
            }

            await cartModel.deleteCart(paypalData?.purchaseUnits?.[0]?.referenceId); // Se elimina el carrito.
            await connection.commit();

            // Envío de email de confirmación (solo usado para LeVount).
            const emailTempData = {
                name: clientData?.clientInfo?.firstName,
                orderNumber: paypalData?.id,
                items: cartItems?.items,
                total: paidAmount,
                currency: currency,
                address: clientAddress,
                paymentMethod: 'paypal',
                paymentReference: paypalData?.paymentSource?.card?.lastDigits || paypalData?.payer?.emailAddress // Almacena la cuenta del cliente o los últimos 4 dígitos de la tarjeta con que se pagó.
            };
            const emailData = (storeId == 0)
                ? {
                    sender: 'levount-noreply',
                    recipient: clientEmail,
                    subject: "Thank your for your purchase!",
                    text: `Your purchase from ${paypalData?.purchaseUnits?.[0]?.description} has been confirmed.`,
                    attachments: null,
                    html: emailTemplates.leVount_orderConfirm(emailTempData)
                } : {
                    sender: 'silverbest-noreply',
                    recipient: clientEmail,
                    subject: "¡Gracias por tu compra!",
                    text: `Su ${paypalData?.purchaseUnits?.[0]?.description} ha sido confirmada.`,
                    attachments: null,
                    html: emailTemplates.SilverBest.orderConfirm(emailTempData)
                };
            const emailSending = await emailModel.sendEmail(emailData);

            return { success: true, purchaseId: paypalData?.id };

        } catch (error) {
            console.log(error);
            await connection.rollback();
            throw(new appError("<b>Payment register error: </b>", error));
        } finally {
            if (connection) connection.release();
        }
    },

};

export default paymentModel;