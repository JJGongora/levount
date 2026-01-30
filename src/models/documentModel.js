import db from "../config/db.js";

const documentModel = {

    register: async (data, username, clientId) => {
        let result = [];
        let query = ""; let insertData = [];       

        if (data?.documentType == 'sale') {
            
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Se inserta el registro de la nota de venta.
                query = `
                    INSERT INTO sales
                        (
                            documentNumber, storeId, docDate, preparedBy,
                            paymentMethod, status,
                            registeredBy, registeredAt, containsGold,
                            clientId, roomNumber, lastEdition, editedBy, shift
                        )
                    VALUES
                        (
                            ?, ?, ?, ?,
                            ?, ?,
                            ?, NOW(), ?,
                            ?, ?, NOW(), ?, ?
                        )
                    ON DUPLICATE KEY UPDATE
                        preparedBy      = COALESCE(VALUES(preparedBy), preparedBy),
                        paymentMethod   = COALESCE(VALUES(paymentMethod), paymentMethod),
                        status  = COALESCE(VALUES(status), status),
                        containsGold    = COALESCE(VALUES(containsGold), containsGold),
                        clientId        = COALESCE(VALUES(clientId), clientId),
                        roomNumber      = COALESCE(VALUES(roomNumber), roomNumber),
                        lastEdition     = COALESCE(VALUES(lastEdition), lastEdition),
                        editedBy        = COALESCE(VALUES(editedBy), editedBy),
                        shift        = COALESCE(VALUES(shift), shift);
                `;
                insertData = [
                    data?.documentNumber || null,
                    data?.storeId || null,
                    data?.docDate || null,
                    data?.sale?.preparedBy || null,
                    data?.sale?.paymentMethod || null,
                    data?.docStatus || 'active',
                    username || 'System',
                    data?.sale?.containsGold || null,
                    clientId || null,
                    data?.roomNumber || null,
                    username || 'System',
                    data?.sale?.shift
                ];
                const [headerResult] = await connection.query(query, insertData);

                let saleId = headerResult?.insertId;            
                // Si la nota ya existía, y no se puede devolver un saleId...
                if (!saleId && data?.documentNumber) {
                    const [existing] = await connection.query(`
                        SELECT id 
                        FROM sales 
                        WHERE 
                            documentNumber = ?
                            AND storeId = ?
                            AND docDate = ?
                        `, [
                            data?.documentNumber,
                            data?.storeId,
                            data?.docDate
                        ]
                    );
                    if(existing?.length) saleId = existing?.[0]?.id;
                }

                // Gestión de Items.
                if (saleId) { await connection.query(`DELETE FROM saleItems WHERE saleId = ?`, [saleId]); }
                if (saleId && data?.sale?.saleItems && data?.sale?.saleItems?.length > 0) {

                        const itemsMap = new Map();
                        data?.sale?.saleItems?.forEach(item => {
                        
                            const pId = item?.levCode || item?.altCode;
                            if (!pId) return;
                            const uniqueKey = `${pId}_${item?.unitPrice}`;

                            if (itemsMap.has(uniqueKey)) {
                                // SI YA EXISTE: Sumamos la cantidad
                                const existing = itemsMap.get(uniqueKey);
                                existing.quantity += Number(item.quantity); 
                            } else {
                                // SI ES NUEVO: Lo guardamos en el mapa
                                // Parseamos quantity a Number para asegurar sumas matemáticas, no concatenación de texto
                                itemsMap.set(uniqueKey, {
                                    productId: item?.itemId,
                                    quantity: Number(item?.quantity),
                                    unitPrice: item?.unitPrice,
                                    tagPrice: item?.tagPrice,
                                    levCode: item?.levCode,
                                    altCode: item?.altCode,
                                    material: item?.material,
                                    description: item?.description
                                });
                            }
                        });

                        const mergedList = Array.from(itemsMap.values());

                    // Inserción masiva de los artículos.
                    if (mergedList?.length > 0) {
                        const itemsValues = mergedList.map(item => [
                            saleId,            // saleId (Foreign Key)
                            item?.productId,    // productId (levCode o altCode)
                            item?.quantity,     // quantity (Ya fusionada/sumada)
                            item?.unitPrice,    // unitPrice
                            item?.tagPrice,
                            item?.levCode?.toUpperCase(),
                            item?.altCode?.toUpperCase() ,
                            item?.material,
                            item?.description 
                        ]);

                        const itemsQuery = `
                            INSERT INTO saleItems 
                            (saleId, productId, quantity, unitPrice, tagPrice, levountCode, alternateCode, material, description) 
                            VALUES ? 
                        `;
                        
                        await connection.query(itemsQuery, [itemsValues]);
                    }
                }

                // Inserción de los pagos.
                if (data?.sale?.payment) {
                    await connection.query(`DELETE FROM salePayments WHERE saleId = ?`, [saleId]);
                    const paymInsQuery = `
                        INSERT INTO salePayments
                        (saleId, method, amount, currency, exchangeRate, reference)
                        VALUES ?
                        ON DUPLICATE KEY UPDATE
                            method      = COALESCE(VALUES(method), method),
                            amount      = COALESCE(VALUES(amount), amount),
                            currency      = COALESCE(VALUES(currency), currency),
                            exchangeRate      = COALESCE(VALUES(exchangeRate), exchangeRate),
                            reference      = COALESCE(VALUES(reference), reference)
                    `;

                    const paymentsMap = new Map();
                    data?.sale?.payment?.forEach(payment => {
                        paymentsMap.set(payment?.currency, {
                            method: payment?.method,
                            amount: Number(payment?.amount) || null,
                            currency: payment?.currency,
                            exchangeRate: Number(payment?.exchange) || null,
                            reference: payment?.reference
                        });
                    });                    

                    const paymentsArray = Array.from(paymentsMap.values());
                    const paymentValues = paymentsArray.map(pay => [
                        saleId,
                        pay?.method || null,
                        pay?.amount || null,
                        pay?.currency || null,
                        pay?.exchangeRate || null,
                        pay?.reference || null
                    ]); //console.log("===== ", paymInsQuery, paymentValues);

                    if (paymentValues.length > 0) {
                        await connection.query(paymInsQuery, [paymentValues]);
                    }
                }

                await connection.commit();
                result = headerResult;

            } catch (error) {
                connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        }

        return result;
    },

    getAllData: async(data) => {
        let result = [];

        if (data?.documentType == 'sale') {

            const headerQuery = `
                SELECT 
                    s.*, 
                    c.clientName,
                    c.clientEmail,
                    c.clientTel,
                    c.clientCountry,
                    c.clientState,
                    c.remarks
                FROM sales s
                LEFT JOIN clients c ON c.id = s.clientId
                WHERE s.documentNumber = ? AND s.storeId = ? AND s.docDate = ?
                LIMIT 1
            `;

            const itemsQuery = `
                SELECT si.* FROM saleItems si
                INNER JOIN sales s ON s.id = si.saleId
                WHERE s.documentNumber = ? AND s.storeId = ? AND s.docDate = ?
            `;

            const paymentsQuery = `
                SELECT p.* from salePayments p
                INNER JOIN sales s ON s.id = p.saleId
                WHERE s.documentNumber = ? AND s.storeId = ? AND s.docDate = ?
            `;

            const [headerRows, itemRows, paymentRows] = await Promise.all([
                db.query(headerQuery, [data?.documentNumber, data?.storeId, data?.docDate]),
                db.query(itemsQuery, [data?.documentNumber, data?.storeId, data?.docDate]),
                db.query(paymentsQuery, [data?.documentNumber, data?.storeId, data?.docDate])
            ]);

            const saleHeader = headerRows[0][0]; 
            if (!saleHeader) return null;

            saleHeader.items = itemRows[0]; 
            saleHeader.payments = paymentRows[0];
            result = saleHeader;
        }

        return result;
    }

}

export default documentModel;