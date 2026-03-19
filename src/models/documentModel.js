import { count } from "console";
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
                
                // =================================
                //       Condiciones de emisión
                // =================================
                if (!data?.documentNumber) { throw(new appError("<strong>Error en el modelo de documentos</strong>: Por favor, ingrese un número de documento mayor a 0.", 400)); }
                if (!data?.storeId) { throw(new appError("<strong>Error en el modelo de documentos</strong>: Por favor, seleccione una sucursal de emisión.", 400)); }
                if (!data?.docDate) { throw(new appError("<strong>Error en el modelo de documentos</strong>: Por favor, ingrese la fecha de emisión del documento.", 400)); }
                if (data?.docStatus == 'active' && (data?.sale?.saleItems?.length == 0 || !data?.sale?.saleItems)) { throw(new appError("<strong>Error en el modelo de documentos</strong>: Por favor, ingrese mínimo un artículo vendido.", 400)); }
                
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
    },

    get: {
        sales: async(filters) => {

            //console.log(filters);
            let limit = filters?.limit ? parseInt(filters?.limit) : 30;
            const page = filters?.page ? parseInt(filters?.page) : 1;        
            const offset = (page - 1) * limit;

            let conditions = [];
            let params = [];   
            let sort = "ORDER BY s.registeredAt DESC";    

            if (filters?.id) {
                conditions.push("s.id = ?");
                params.push(filters?.id);
            } if (filters?.dateFrom) {
                conditions.push("s.docDate >= ?");
                params.push(filters?.dateFrom);
            } if (filters?.dateUntil) {
                conditions.push("s.docDate <= ?");
                params.push(filters?.dateUntil);
            } if (filters?.status) {
                conditions.push("s.status = ?");
                params.push(filters?.status);
            } if (filters?.storeId) {
                conditions.push("s.storeId = ?");
                params.push(filters?.storeId);
            }

            // ====================================
            //          Filtro del buscador
            // ====================================
            if (filters?.search) {

                const searchWords = filters?.search?.trim()?.split(/\s+/); // Se separan las palabras ingresadas en el buscador.
                
                searchWords?.forEach(word => { // Por cada palabra ingresada...
                    const searchTerm = `%${word}%`

                    conditions.push(`
                        (
                            s.documentNumber LIKE ? OR
                            s.preparedBy LIKE ?
                        )
                    `);

                    for (let i=0; i < 2; i++) { // Se inserta el término de búsqueda una vez por cada columna en la que se buscará.
                        params.push(searchTerm);
                    };
                });       

            }

            let whereClause = ``;
            if (conditions.length > 0) {
                whereClause += " WHERE " + conditions.join(" AND ");
            }

            let query = ""; let queryParams = [];
            queryParams = [...params, limit, offset];      

            query = `
                SELECT
                    ${
                        (filters?.id)
                            ? 's.*'
                            : `
                                s.id,
                                s.documentNumber,
                                s.storeId,
                                s.status,
                                s.preparedBy,
                                s.containsGold,
                                s.docDate,
                            `
                    }
                    IFNULL(sp_agg.totalSaleMXN, 0) as saleTotal,
                    JSON_OBJECT(
                        'id', c.id,
                        'name', c.clientName
                    ) AS client,
                    JSON_OBJECT(
                        'id', st.id,
                        'name', st.name
                    ) AS store
                FROM
                    sales s
                LEFT JOIN
                    clients c
                        ON c.id = s.clientId
                LEFT JOIN
                    stores st
                        ON st.id = s.storeId
                LEFT JOIN (
                    SELECT 
                        saleId,
                        SUM(
                            IF(exchangeRate IS NOT NULL, amount * exchangeRate, amount)
                        ) as totalSaleMXN
                    FROM 
                        salePayments
                    GROUP BY 
                        saleId
                ) sp_agg ON sp_agg.saleId = s.id
                ${whereClause}
                ${ sort }
                LIMIT ? OFFSET ?;
            `; //console.log(queryParams, query);

            const sqlCount = `
                SELECT
                    COUNT(s.id) as total,
                    SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
                    COALESCE(SUM(sp_agg.totalSaleMXN), 0) AS grandTotal
                FROM 
                    sales s
                LEFT JOIN (
                    SELECT 
                        saleId,
                        SUM(
                            IF(exchangeRate IS NOT NULL, amount * exchangeRate, amount)
                        ) as totalSaleMXN
                    FROM 
                        salePayments
                    GROUP BY 
                        saleId
                ) sp_agg ON sp_agg.saleId = s.id
                ${whereClause}
            `;
            const paramsCount = [...params];

            const [result, countResult] = await Promise.all([
                db.query(query, queryParams),
                db.query(sqlCount, paramsCount)
            ]);

            const rows = result[0]; 
            const totalItems = countResult[0][0]?.total || 0;

            const formattedSales = rows.map(sale => {
                return {
                    ...sale,
                    client: sale.client ? JSON.parse(sale.client) : null,
                    store: sale.store ? JSON.parse(sale.store) : null
                };
            });

            return {
                sales: formattedSales, 
                metrics: {
                    cancelled: parseInt(countResult?.[0]?.[0]?.cancelled),
                    total_documents: totalItems,
                    grandTotal: parseInt(countResult?.[0]?.[0]?.grandTotal)
                },
                pagination: {
                    page: page,
                    limit: limit,
                    totalItems: totalItems,
                    totalPages: Math.ceil(totalItems / limit)
                }
            };
        }
    }

}

export default documentModel;