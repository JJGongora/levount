import db from "../config/db.js";
import appError from "../utils/appError.js";

const documentModel = {

    register: async (data, username, clientId) => {
        let result = [];
        let query = ""; let insertData = [];  
        
        const connection = await db.getConnection();
        await connection.beginTransaction();

        //console.log(data);
        try {

            if (data?.documentType == 'sale') {
            
                // Se inserta el registro de la nota de venta.
                query = `
                    INSERT INTO sales
                        (
                            documentNumber, storeId, docDate, preparedBy,
                            status,
                            registeredBy, registeredAt, containsGold,
                            clientId, roomNumber, lastEdition, editedBy, shift
                        )
                    VALUES
                        (
                            ?, ?, ?, ?,
                            ?,
                            ?, NOW(), ?,
                            ?, ?, NOW(), ?, ?
                        )
                    ON DUPLICATE KEY UPDATE
                        preparedBy      = COALESCE(VALUES(preparedBy), preparedBy),
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
                    data?.docStatus || 'active',
                    username || 'System',
                    data?.sale?.containsGold || null,
                    clientId || null,
                    data?.client?.room || null,
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
                            item?.description || null 
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

                    if (Object.values(data?.sale?.payment || {}).some(item => !item.amount)) {
                        throw (new appError("El monto de los métodos de pago no puede ser 0. Verifique los métodos de pago.", 400));
                    };

                    await connection.query(`DELETE FROM salePayments WHERE saleId = ?`, [saleId]);

                    const paymInsQuery = `
                        INSERT INTO salePayments
                        (saleId, method, amount, currency, exchangeRate, reference)
                        VALUES ?
                        ON DUPLICATE KEY UPDATE
                            method       = COALESCE(VALUES(method), method),
                            amount       = COALESCE(VALUES(amount), amount),
                            currency     = COALESCE(VALUES(currency), currency),
                            exchangeRate = COALESCE(VALUES(exchangeRate), exchangeRate),
                            reference    = COALESCE(VALUES(reference), reference)
                    `;

                    // Mapear directamente desde el array original sin usar un Map intermedio
                    const paymentValues = data.sale.payment.map(payment => [
                        saleId,
                        payment?.method || null,
                        Number(payment?.amount) || null,
                        payment?.currency || null,
                        Number(payment?.exchange) || null,
                        payment?.reference || null
                    ]); //console.log(paymentValues);

                    if (paymentValues.length > 0) {
                        // Asegúrate de pasar [paymentValues] para que el driver de MySQL lo trate como inserción múltiple
                        await connection.query(paymInsQuery, [paymentValues]);
                    }
                }

                await connection.commit();
                result = headerResult;            

            } else if (data?.documentType == 'warranty') {
                

                
            }

        } catch (error) {
            connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
        return result;
    },

    getAllData: async(data) => {
        let result = [];

        if (data?.documentType == 'sale') {
            const whereClause = (data?.id) ? `s.id = ?` : `s.documentNumber = ? AND s.storeId = ? AND s.docDate = ?`;
            const queryParams = (data?.id) ? [data?.id] : [data?.documentNumber, data?.storeId, data?.docDate];

            const headerQuery = `
                SELECT 
                    s.*, 
                    c.clientName as name,
                    c.clientEmail as email,
                    c.clientTel as phone,
                    c.clientCountry as country,
                    c.clientState as state,
                    c.remarks as remarks,
                    c.clientBirthday as birthday,
                    s.roomNumber as room
                FROM sales s
                LEFT JOIN clients c ON c.id = s.clientId
                WHERE ${whereClause}
                LIMIT 1
            `;

            const itemsQuery = `
                SELECT si.* FROM saleItems si
                INNER JOIN sales s ON s.id = si.saleId
                WHERE ${whereClause}
            `;

            const paymentsQuery = `
                SELECT p.* from salePayments p
                INNER JOIN sales s ON s.id = p.saleId
                WHERE ${whereClause}
            `;

            const [headerRows, itemRows, paymentRows] = await Promise.all([
                db.query(headerQuery, queryParams),
                db.query(itemsQuery, queryParams),
                db.query(paymentsQuery, queryParams)
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