import db from "../config/db.js";
import newsletterModel from "./newsletterModel.js";
import documentModel from "./documentModel.js";
import appError from "../utils/appError.js";
import filterHelper from "../utils/filterHelper.js";
import storesModel from "./storesModel.js";
import { methods as utils } from "../../public/js/utils.js";

const clientModel = {

    getClients: async(filters) => {
        let limit = filters?.limit ? parseInt(filters?.limit) : 30;
        const page = filters?.page ? parseInt(filters?.page) : 1;        
        const offset = (page - 1) * limit; //console.log(filters);
        
        let conditions = [];
        let params = [];   
        let sort = "";    

        if (filters?.name) {
            conditions.push("c.clientName LIKE ?");
            params.push(`%${filters?.name}%`);
        } if (filters?.captured) {
            conditions.push("c.registeredDate LIKE ?");
            params.push(`%${filters?.captured}%`);
        } if (filters?.email) {
            conditions.push("c.clientEmail LIKE ?");
            params.push(`%${filters?.email}%`);
        } if (filters?.id) {
            conditions.push("c.id = ?");
            params.push(filters?.id);
        }

        let whereClause = ``;
        if (conditions.length > 0) {
            whereClause += " WHERE " + conditions.join(" AND ");
        }

        let query = ""; let queryParams = [];

        if (filters?.id) {
            query = `
                SELECT 
                    c.*,
                    s.documentNumber,
                    s.docDate,
                    s.roomNumber,
                    s.status,
                    s.id,
                    st.name as store,
                    IFNULL(sp_agg.totalSaleMXN, 0) as saleTotal
                FROM 
                    clients c
                LEFT JOIN
                    sales s
                        ON s.clientId = c.id
                LEFT JOIN
                    stores st
                        ON s.storeId = st.id
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
                ORDER BY s.docDate DESC;
            `;
            queryParams = [...params]; 
        } else {
            query = `
                WITH lastSales AS (
                    SELECT 
                        clientId,
                        storeId,
                        documentNumber,
                        docDate,
                        roomNumber,
                        ROW_NUMBER() OVER(
                            PARTITION BY
                                clientId
                            ORDER BY
                                docDate DESC
                        ) as saleRow
                    FROM
                        sales
                )
                SELECT 
                    c.id,
                    c.clientName as name,
                    c.clientEmail as email,
                    c.clientTel as phone,
                    s.documentNumber,
                    s.docDate,
                    s.roomNumber,
                    st.name as store
                FROM
                    clients c
                LEFT JOIN
                    lastSales s
                        ON s.clientId = c.id AND s.saleRow = 1
                LEFT JOIN
                    stores st
                        ON s.storeId = st.id
                ${whereClause}
                LIMIT ? OFFSET ?;
            `;
            queryParams = [...params, limit, offset];
        }

        const sqlCount = `
            SELECT
                COUNT(c.id) as total
            FROM 
                clients c
            ${whereClause}
        `;
        const paramsCount = [...params];

        const [result, countResult] = await Promise.all([
            db.query(query, queryParams),
            db.query(sqlCount, paramsCount)
        ]);

        const rows = result[0]; 
        const totalItems = countResult[0][0]?.total || 0;

        if (filters?.id) {
            if (rows.length === 0) return null;

            const cleanHistory = rows.map(r => ({
                id: r.id,
                documentNumber: r.documentNumber,
                docDate: r.docDate,
                roomNumber: r.roomNumber,
                store: r.store,
                total: parseFloat(r.saleTotal) || 0,
                status: r.status
            })).filter(r => r.documentNumber !== null);

            const grandTotalMXN = cleanHistory?.reduce((acumulador, venta) => acumulador + venta.total, 0);
            
            const clientProfile = {
                id: rows[0].id,
                name: rows[0].clientName,
                email: rows[0].clientEmail,
                phone: rows[0].clientTel,
                register: rows[0].registeredDate,
                registeredBy: rows[0].registeredBy,
                edited: rows[0].lastEdition,
                editedBy: rows[0].editedBy,
                birthday: rows[0].clientBirthday,                
                remarks: rows[0].remarks,
                totalPurchased: grandTotalMXN,
                history: cleanHistory
            };
            
            return clientProfile;
        }

        return {
            clients: rows, 
            pagination: {
                page: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        };
    },

    register: async(data, username, storeId) => {
        //console.log(data?.client);
        if (!data?.client?.name || data.client.name == null) { data.clientName = 'Sin Nombre'; }
        const responseSteps = [];

        let query = `
            INSERT INTO clients
                (
                    clientName, clientEmail, clientTel, clientCountry,
                    clientState, remarks, clientBirthday, registeredBy,
                    registeredDate, lastEdition, editedBy                    
                )
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)
            ON DUPLICATE KEY UPDATE
                clientEmail     = COALESCE(VALUES(clientEmail), clientEmail),
                clientTel       = COALESCE(VALUES(clientTel), clientTel),
                clientCountry   = COALESCE(VALUES(clientCountry), clientCountry),
                clientState     = COALESCE(VALUES(clientState), clientState),
                remarks         = COALESCE(VALUES(remarks), remarks),
                clientBirthday  = COALESCE(VALUES(clientBirthday), clientBirthday),
                lastEdition     = COALESCE(VALUES(lastEdition), lastEdition),
                editedBy        = COALESCE(VALUES(editedBy), editedBy)
        `;
        const insertData = [
            utils.toTitleCase(data?.client?.name) || 'Sin nombre',
            data?.client?.email || null,
            data?.client?.phone || null,
            data?.client?.country || data?.telCountryCode || 'US',
            data?.client?.state || null,
            data?.client?.remarks || null,
            data?.client?.birthday || '1000-01-01',
            username || 'System',
            username || 'System'
        ];
        const [result] = await db.query(query, insertData);
        responseSteps.push(filterHelper.dbResultStatus(result, "el cliente"));

        let newDocument = null;
        if (data?.documentType && data?.documentNumber) {
            newDocument = await documentModel.register(data, username, result?.insertId); //console.log(newDocument);
            responseSteps.push(filterHelper.dbResultStatus(newDocument, "el documento"));
        }

        let newsletterRow = null;
        if (result?.affectedRows != 0 && data?.client?.email && data?.client?.sendEmail) {
            newsletterRow = await newsletterModel.registerClientEmail(result?.insertId, data?.client?.email, storeId);
            responseSteps.push(filterHelper.dbResultStatus(newsletterRow, "el correo al newsletter"));
            console.log(newsletterRow);
        } 
        
        //Si se insertó el cliente como nuevo...
        if (newsletterRow?.affectedRows == 1) {
            const sendNewClientEmail = await newsletterModel.sendNewClientEmail(
                data?.client?.email, 
                data?.client?.name?.split(" ")[0] || data?.client?.name, 
                newsletterRow.newsletterToken,
                filterHelper.inputDateToEnglish(data?.docDate),
                await storesModel.getBranchName(data?.storeId),
                username,
                "levount-customercare"
            );

            responseSteps.push({
                step: "envio_correo",
                status: sendNewClientEmail.success ? "success" : "failed", // Corregí el typo 'sucess'
                message: sendNewClientEmail.success 
                    ? "Se ha enviado el correo de bienvenida." 
                    : "No se pudo enviar el correo electrónico."
            });
        } else if (newsletterRow?.affectedRows == 0 && newDocument?.affectedRows == 1) {
            const sendThanksEmail = await newsletterModel.sendPurchaseThanksEmail(
                data?.client?.email, 
                data?.client?.name?.split(" ")[0] || data?.client?.name, 
                filterHelper.inputDateToEnglish(data?.docDate),
                await storesModel.getBranchName(data?.storeId),
                username,
                "levount-customercare"
            );

            responseSteps.push({
                step: "envio_correo",
                status: sendThanksEmail.success ? "success" : "failed",
                message: sendThanksEmail.success 
                    ? "Se ha enviado el correo de agradecimiento." 
                    : "No se pudo enviar el correo electrónico."
            });
        }

        return responseSteps;
    }

};

export default clientModel;