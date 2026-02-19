import db from "../config/db.js";
import emailTemplates from "../utils/emailTemplates.js";
import sendEmail from "../services/emailSending.js";
import authHelpers from "../utils/authHelpers.js";
import { v4 as uuidv4 } from 'uuid';
import emailModel from "./emailModel.js";

const newsletterModel = {

    subscribe: async(email) => {
        const query = `INSERT IGNORE INTO newsletterSubscribers (address, registerDate, verifiedEmail) VALUES (?, NOW(), 'active');`;
        const [result] = await db.query(query, [email]); //console.log(result);
        if (result.affectedRows == 0) { 

            return { message: "You're already an Le Vount's Insider."}; 

        } else {

            const emailData = await authHelpers.senderEmailData("levount-noreply");
            const emailParams = {
                username: emailData.user,
                pass: emailData.pass,
                display: emailData.display,
                recipient: email,
                subject: "Welcome to our inner circle",
                text: "Welcome to Le Vount's newsletter",
                attachments: null /*[
                    {
                        filename: `Logo_KCA-${ data?.Logo }.png`,
                        path: `/public/images/email/`,
                        cid: 'logo'
                    }
                ]*/,
                html: emailTemplates.newsletterSubscription()
            }; //console.log(emailParams);
            const sendingEmail = await sendEmail(emailParams); //console.log(sendingEmail);
            
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

    registerClientEmail: async(clientId, email) => {
        const token = uuidv4();
        const query = `
            INSERT IGNORE INTO 
                newsletterSubscribers (address, registerDate, verifiedEmail, clientId, confirmationToken) 
            VALUES (?, NOW(), 'pending', ?, ?);
        `;
        const [result] = await db.query(query, [email, clientId, token]);
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