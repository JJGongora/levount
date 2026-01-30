import db from "../config/db.js";
import sendEmail from "../services/emailSending.js";
import authHelpers from "../utils/authHelpers.js";

const emailModel = {

    registerSend: async(receiver, sender, user) => {
        const query = `
            INSERT INTO sentEmails
                (receiver, sender, processedBy, sendDate)
            VALUES (?, ?, ?, NOW());
        `;
        const [result] = await db.query(query, [receiver, sender, user]);
    },

    sendEmail: async(data) => {
        const emailData = await authHelpers.senderEmailData(data.sender);
        const username = data?.username || 'System';
        const emailParams = {
            username: emailData.user,
            pass: emailData.pass,
            display: emailData.display,
            recipient: data.recipient,
            subject: data.subject || 'Le Vount Jewelry',
            text: data?.text || '',
            attachments: data?.attachments || null /*[
                {
                    filename: `Logo_KCA-${ data?.Logo }.png`,
                    path: `/public/images/email/`,
                    cid: 'logo'
                }
            ]*/,
            html: data?.html || ''
        };
        const sendingEmail = await sendEmail(emailParams);
        if (sendingEmail.success) { await emailModel.registerSend(data.recipient, emailData.user, username); }
        return sendingEmail;
    },

}

export default emailModel;