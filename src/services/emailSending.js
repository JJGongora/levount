import nodemailer from "nodemailer";

async function sendEmail(params) {
    const transporter = nodemailer.createTransport({
        host: params?.host || process.env.EMAIL_HOST,
        port: params?.port || process.env.SMTP_PORT,
        secure: true,
        tls: {
            rejectUnauthorized: false
        },
        auth: {
            user: params.username,
            pass: params.pass,
        }
    }); //console.log(transporter);

    const info = await transporter.sendMail({
        from: `${params.display} <${params.username}>`,
        to: params.recipient,
        bcc: params.username,
        subject: params.subject,
        text: params.text,
        attachments: params?.attachments || null,
        html: params.html
    }); //console.log(info);

    return (info.accepted.length > 0) ? { success: true } : {success: false};
};

export default sendEmail;