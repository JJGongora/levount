import nodemailer from "nodemailer";

async function sendEmail(params) {
    const transporter = nodemailer.createTransport({
        host: params?.host || process.env.EMAIL_HOST || process.env.SMTP_SERVER,
        port: params?.port || process.env.SMTP_PORT,
        secure: (process.env.SMTP_PORT == 587) ? false : true,
        tls: {
            rejectUnauthorized: false
        },
        auth: {
            user: process.env.SMTP_USER || params.username,
            pass: process.env.SMTP_KEY || params.pass,
        }
    }); //console.log(transporter);

    const info = await transporter.sendMail({
        from: `${params.display} <${params.username}>`,
        to: params.recipient,
        bcc: (params.username == 'customercare@levount.com') ? params.username : [ params.username,
            'customercare@levount.com' ],
        subject: params.subject,
        text: params.text,
        attachments: params?.attachments || null,
        html: params.html
    }); //console.log(info);

    return (info.accepted.length > 0) ? { success: true } : {success: false};
};

export default sendEmail;