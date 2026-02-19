import db from "../config/db.js";
import newsletterModel from "./newsletterModel.js";
import documentModel from "./documentModel.js";
import appError from "../utils/appError.js";
import filterHelper from "../utils/filterHelper.js";
import storesModel from "./storesModel.js";
import { methods as utils } from "../../public/js/utils.js";

const clientModel = {

    getClients: async(filters) => {
        let query = `SELECT Id, clientName, clientEmail, clientTel FROM clients`;
        let conditions = [];
        let queryParams = [];

        console.log(filters);

        if (filters?.name) {
            conditions.push("clientName LIKE ?");
            queryParams.push(`%${filters.name}%`);
        } if (filters?.registeredDate) {
            conditions.push("registeredDate LIKE ?");
            queryParams.push(`%${filters.captured}%`);
        } if (filters?.email) {
            conditions.push("clientEmail LIKE ?");
            queryParams.push(`%${filters.email}%`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += ` LIMIT 100`;

        const result = await db.query(query, queryParams); //console.log(result[0]);
        return result[0]; 
    },

    register: async(data, username) => {

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
            utils.toTitleCase(data?.client?.name) || null,
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
        if (result?.affectedRows != 0 && data?.client?.email) {
            newsletterRow = await newsletterModel.registerClientEmail(result?.insertId, data?.client?.email);
            responseSteps.push(filterHelper.dbResultStatus(newsletterRow, "el correo al newsletter"));
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