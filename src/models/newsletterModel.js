import db from "../config/db.js";
import emailTemplates from "../utils/emailTemplates.js";
import sendEmail from "../services/emailSending.js";
import authHelpers from "../utils/authHelpers.js";
import { v4 as uuidv4 } from 'uuid';
import emailModel from "./emailModel.js";

const newsletterModel = {

    subscribe: async(email, storeId) => {
        const confirmationToken = uuidv4();
        const query = `
            INSERT IGNORE INTO 
                newsletterSubscribers
                    (address, registerDate, verifiedEmail, confirmationToken, storeId)                    
                VALUES
                    (?, NOW(), 'active', ?, ?)`;
        const [result] = await db.query(query, [email, confirmationToken, storeId]); //console.log(result);
        if (result.affectedRows == 0) { 

            return { message: "You're already an Le Vount's Insider.", success: false, errorType: "user_exists" }; 

        } else {

            const sender = (storeId == 0) ? `levount-noreply` : `silverbest-noreply`;
            const emailData = await authHelpers.senderEmailData(sender);
            const emailParams = {
                username: emailData.user,
                pass: emailData.pass,
                display: emailData.display,
                recipient: email,
                subject: (storeId == 0) ? `Welcome to Le Vount's newsletter.` : `¡Bienvenido al club Silver!`,
                text: (storeId == 0) ? `Welcome to Le Vount's newsletter.` : `¡Bienvenido al club Silver!`,
                attachments: null /*[
                    {
                        filename: `Logo_KCA-${ data?.Logo }.png`,
                        path: `/public/images/email/`,
                        cid: 'logo'
                    }
                ]*/,
                html: (storeId == 0) ? emailTemplates.newsletterSubscription() : emailTemplates.SilverBest.newsletterSubscription(email, confirmationToken)
            };
            const sendingEmail = await sendEmail(emailParams);
            if (sendingEmail.success) { await emailModel.registerSend(email, emailData.user, email); }
            
        }

        return {success: true};
    },

    getByToken: async(token) => {
        const query = `
            SELECT * FROM newsletterSubscribers
            WHERE confirmationToken = ?
        `;
        const [result] = await db.query(query, [token]);
        return result[0];
    },

    registerClientEmail: async(clientId, email, storeId) => {
        const token = uuidv4();
        const query = `
            INSERT IGNORE INTO 
                newsletterSubscribers (address, registerDate, verifiedEmail, clientId, confirmationToken, storeId) 
            VALUES (?, NOW(), 'pending', ?, ?, ?);
        `;
        const [result] = await db.query(query, [email, clientId, token, storeId]);
        return { affectedRows: result.affectedRows, newsletterToken: token };
    },

    sendNewClientEmail: async(email, clientName, newsletterToken, docDate, branch, username, sender) => {
        
        const emailData = await authHelpers.senderEmailData(sender);
        const emailParams = {
            username: emailData.user,
            pass: emailData.pass,
            display: emailData.display,
            recipient: email,
            subject: "Thanks for your recent purchase",
            text: "Thanks for your recent purchase",
            attachments: null /*[
                {
                    filename: `Logo_KCA-${ data?.Logo }.png`,
                    path: `/public/images/email/`,
                    cid: 'logo'
                }
            ]*/,
            html: emailTemplates.emailVerification(clientName, newsletterToken, docDate, branch)
        };
        const sendingEmail = await sendEmail(emailParams);
        if (sendingEmail.success) { await emailModel.registerSend(email, emailData.user, username); }
        return sendingEmail;
    },

    sendPurchaseThanksEmail: async(email, clientName, docDate, branch, username, sender) => {
    
        const emailData = await authHelpers.senderEmailData(sender);
        const emailParams = {
            username: emailData.user,
            pass: emailData.pass,
            display: emailData.display,
            recipient: email,
            subject: "Thanks for your recent purchase",
            text: "Thanks for your recent purchase",
            attachments: null /*[
                {
                    filename: `Logo_KCA-${ data?.Logo }.png`,
                    path: `/public/images/email/`,
                    cid: 'logo'
                }
            ]*/,
            html: emailTemplates.thanksForPurchasing(clientName, docDate, branch)
        };
        const sendingEmail = await sendEmail(emailParams);
        if (sendingEmail.success) { await emailModel.registerSend(email, emailData.user, username); }
        return sendingEmail;
    
    },

    confirmSubscription: async(token) => {
        const query = `
        UPDATE newsletterSubscribers 
        SET 
            verifiedEmail = 'active', 
            confirmationToken = NULL
        WHERE confirmationToken = ?`;
        const result = db.query(query, [token]);
        return result;
    }

};

export default newsletterModel;