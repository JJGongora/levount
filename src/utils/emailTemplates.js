import { methods as utils } from "../../public/js/utils.js";

const emailTemplates = {
    newsletterSubscription: () => {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Le Vount</title>
                <style>
                    body { margin: 0; padding: 0; background-color: #FAF9F6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
                    
                    @media only screen and (max-width: 600px) {
                        .container { width: 100% !important; }
                        .content-padding { padding: 20px !important; }
                        .mobile-font { font-size: 24px !important; }
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #FAF9F6;">

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #FFFFFF; max-width: 600px; width: 100%; border: 1px solid #EEEEEE;">

                                <tr>
                                    <td align="center">
                                        <img src="https://assets.levount.com/images/email/subscribe-001.jpg" alt="Le Vount Jewelry" width="600" style="width: 100%; max-width: 600px; display: block;">
                                    </td>
                                </tr>

                                <tr>
                                    <td class="content-padding" style="padding: 50px 60px; text-align: center;">
                                        
                                        <h1 class="mobile-font" style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 28px; font-weight: normal; color: #1A1A1A; margin: 0 0 20px 0; font-style: italic;">
                                            Welcome to the Inner Circle.
                                        </h1>

                                        <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.8; color: #555555; margin: 0 0 30px 0;">
                                            You have successfully joined the <strong>Le Vount</strong> list. 
                                            <br><br>
                                            We believe jewelry is not just an accessory, but the punctuation mark of your life. As an insider, you will be the first to know about new drops, limited editions, and private atelier events.
                                        </p>

                                        <br>

                                        <a href="https://levount.com/products" style="background-color: #1A1A1A; color: #FFFFFF; padding: 15px 30px; text-decoration: none; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
                                            Explore The Collection
                                        </a>

                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding-bottom: 50px;">
                                        <img src="https://assets.levount.com/images/logos/LeVount_Logo.png" alt="Signature" width="100" style="display: block; width: 100px;">
                                        <p style="font-family: 'Georgia', serif; font-size: 12px; color: #999999; margin-top: 10px; font-style: italic;">
                                            The Le Vount Team
                                        </p>
                                    </td>
                                </tr>

                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container">
                                <tr>
                                    <td align="center" style="padding: 30px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #999999;">
                                        <p style="margin: 0 0 10px 0;">
                                            &copy; 2026 Le Vount Jewelry. All Rights Reserved.
                                        </p>
                                        <p style="margin: 0;">
                                            <a href="https://levount.com/unsuscribe-newsletter/" style="color: #999999; text-decoration: underline;">Unsubscribe</a> 
                                            &nbsp;|&nbsp; 
                                            <a href="https://levount.com/privacy" style="color: #999999; text-decoration: underline;">Privacy Policy</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>

            </body>
            </html>
        `;
    },

    purchaseConfirmation: (clientName, newsletterToken, orderNumber) => {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thank You - Le Vount</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #FAF9F6;">

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #FFFFFF; max-width: 600px; width: 100%; border: 1px solid #EEEEEE; border-spacing: 0;">
                                
                                <tr>
                                    <td align="center" style="padding: 50px 0 30px 0;">
                                        <img src="https://assets.levount.com/images/logos/LeVount_Logo.png" style="width: 40%;">
                                    </td>
                                </tr>

                                <tr>
                                    <td class="content-padding" align="center" style="padding: 0 60px 40px 60px;">
                                        <h1 style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 30px; font-weight: normal; color: #1A1A1A; margin: 0 0 20px 0; font-style: italic;">
                                            An Excellent Choice
                                        </h1>
                                        <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.8; color: #555555; margin: 0 0 20px 0;">
                                            Dear ${clientName || 'client'}, thank you for your acquisition. Your order <strong>${orderNumber || ''}</strong> has been confirmed.
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 0 20px 40px 20px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF9F6; border: 1px solid #F0F0F0;">
                                            <tr>
                                                <td align="center" style="padding: 40px;">
                                                    
                                                    <img src="https://img.icons8.com/ios/50/C5A059/invite.png" width="30" style="display:block; margin-bottom:15px; border:0;">
                                                    
                                                    <h3 style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 18px; color: #1A1A1A; margin: 0 0 10px 0;">
                                                        Invitation to the Inner Circle
                                                    </h3>
                                                    
                                                    <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #666666; margin: 0 0 25px 0; max-width: 400px;">
                                                        Join our private list for early access to drops and concierge styling tips.
                                                    </p>

                                                    <div>
                                                        <a href="https://levount.com/newsletter/confirm/${newsletterToken}" class="mobile-btn" style="background-color:#1A1A1A; color:#FFFFFF; display:inline-block; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:13px; font-weight:bold; line-height:50px; text-align:center; text-decoration:none; width:220px; text-transform:uppercase; letter-spacing:2px; -webkit-text-size-adjust:none;">
                                                            Activate Access
                                                        </a>
                                                    </div>

                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td class="content-padding" align="center" style="padding: 0 60px 50px 60px; border-bottom: 1px solid #EEEEEE;">
                                        
                                        <div>
                                            <a href="https://levount.com/orders/${orderNumber || ''}" class="mobile-btn" style="background-color:#C5A059; color:#FFFFFF; display:inline-block; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:11px; font-weight:bold; line-height:45px; text-align:center; text-decoration:none; width:200px; text-transform:uppercase; letter-spacing:1.5px; border-radius:3px; -webkit-text-size-adjust:none;">
                                                View Order Details
                                            </a>
                                        </div>

                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 40px 0;">
                                        <p style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 12px; color: #999999; font-style: italic; margin-bottom: 10px; margin-top: 0;">
                                            2026 &copy; Le Vount Jewelry
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>

            </body>
            </html>
        `;
    },

    emailVerification: (clientName, newsletterToken, docDate, branch) => {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thank You - Le Vount</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #FAF9F6;">

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #FFFFFF; max-width: 600px; width: 100%; border: 1px solid #EEEEEE; border-spacing: 0;">
                                
                                <tr>
                                    <td align="center" style="padding: 50px 0 30px 0;">
                                        <img src="https://assets.levount.com/images/logos/LeVount_Logo.png" style="width: 40%;">
                                    </td>
                                </tr>

                                <tr>
                                    <td class="content-padding" align="center" style="padding: 0 60px 40px 60px;">
                                        <h1 style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 30px; font-weight: normal; color: #1A1A1A; margin: 0 0 20px 0; font-style: italic;">
                                            An Excellent Choice
                                        </h1>
                                        <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.8; color: #555555; margin: 0 0 20px 0;">
                                            Dear ${clientName || 'valued customer'}, we truly appreciate your recent purchase at <u>${branch || 'our store'}</u>${(docDate) ? ` on <b>${docDate}</b>` : ''}. It was a pleasure to help you find your perfect match piece.
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 0 20px 40px 20px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF9F6; border: 1px solid #F0F0F0;">
                                            <tr>
                                                <td align="center" style="padding: 40px;">
                                                    
                                                    <img src="https://img.icons8.com/ios/50/C5A059/invite.png" width="30" style="display:block; margin-bottom:15px; border:0;">
                                                    
                                                    <h3 style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 18px; color: #1A1A1A; margin: 0 0 10px 0;">
                                                        Invitation to the Inner Circle
                                                    </h3>
                                                    
                                                    <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #666666; margin: 0 0 25px 0; max-width: 400px;">
                                                        Join our private list for early access to drops and concierge styling tips.
                                                    </p>

                                                    <div>
                                                        <a href="https://levount.com/newsletter/confirm/${newsletterToken}" style="background-color:#1A1A1A; padding: 5px 8px; color:#FFFFFF; display:inline-block; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:13px; font-weight:bold; line-height:50px; text-align:center; text-decoration:none; width:220px; text-transform:uppercase; letter-spacing:2px; -webkit-text-size-adjust:none;">
                                                            Activate Access
                                                        </a>
                                                    </div>

                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td class="content-padding" align="center" style="padding: 0 60px 50px 60px; border-bottom: 1px solid #EEEEEE;">
                                        
                                        <div>
                                            <a href="https://levount.com" style="background-color:#C5A059; pading: 5px 8px; color:#FFFFFF; display:inline-block; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:11px; font-weight:bold; line-height:45px; text-align:center; text-decoration:none; width:200px; text-transform:uppercase; letter-spacing:1.5px; border-radius:3px; -webkit-text-size-adjust:none;">
                                                Explore other products
                                            </a>
                                        </div>

                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 40px 0;">
                                        <p style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 12px; color: #999999; font-style: italic; margin-bottom: 10px; margin-top: 0;">
                                            2026 &copy; Le Vount Jewelry
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>

            </body>
            </html>
        `;
    },

    thanksForPurchasing: (clientName, docDate, branch) => {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Thank You - Le Vount</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #FAF9F6;">

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #FFFFFF; max-width: 600px; width: 100%; border: 1px solid #EEEEEE; border-spacing: 0;">
                                
                                <tr>
                                    <td align="center" style="padding: 50px 0 30px 0;">
                                        <img src="https://assets.levount.com/images/logos/LeVount_Logo.png" style="width: 180px; max-width: 40%; display: block;" alt="Le Vount">
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 0 0 40px 0;">
                                        <img src="https://levount.com/images/emails/thank-you-hero.jpg" alt="Timeless Elegance" style="width: 100%; max-width: 600px; height: auto; display: block;" onerror="this.style.display='none'"> 
                                    </td>
                                </tr>

                                <tr>
                                    <td class="content-padding" align="center" style="padding: 0 60px 20px 60px;">
                                        <h1 style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 30px; font-weight: normal; color: #1A1A1A; margin: 0 0 20px 0; font-style: italic;">
                                            An Excellent Choice.
                                        </h1>
                                        <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.8; color: #555555; margin: 0 0 20px 0;">
                                            Dear ${clientName || 'valued client'},<br><br>
                                            We truly appreciate your recent visit to <strong>${branch || 'our boutique'}</strong>${(docDate) ? ` on ${docDate}` : ''}. 
                                            Since you are already part of our Inner Circle, we simply wanted to extend our gratitude. It was a pleasure helping you find a piece that speaks to your style.
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 0 40px 40px 40px;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FAF9F6; border: 1px solid #F0F0F0;">
                                            <tr>
                                                <td align="center" style="padding: 30px;">
                                                    <h3 style="font-family: 'Georgia', serif; font-size: 16px; color: #1A1A1A; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">The Art of Care</h3>
                                                    <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 13px; line-height: 1.6; color: #666666; margin: 0;">
                                                        To ensure your Le Vount piece maintains its brilliance:<br>
                                                        &bull; Store exclusively in its original pouch.<br>
                                                        &bull; Avoid direct contact with perfumes.<br>
                                                        &bull; Polish gently with a soft cloth.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 0 60px 50px 60px; border-bottom: 1px solid #EEEEEE;">
                                        <div>
                                            <a href="https://levount.com/collections/new-arrivals" style="background-color:#C5A059; padding: 15px 30px; color:#FFFFFF; display:inline-block; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; font-size:11px; font-weight:bold; text-align:center; text-decoration:none; text-transform:uppercase; letter-spacing:2px; border-radius:2px;">
                                                Discover New Arrivals
                                            </a>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 40px 0;">
                                        <p style="font-family: 'Georgia', 'Times New Roman', serif; font-size: 12px; color: #999999; font-style: italic; margin-bottom: 10px; margin-top: 0;">
                                            Le Vount Jewelry
                                        </p>
                                        <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #AAAAAA; margin: 0;">
                                            New York, NY &bull; <a href="mailto:concierge@levount.com" style="color:#AAAAAA; text-decoration:underline;">Contact Concierge</a>
                                        </p>
                                        <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #CCCCCC; margin-top: 15px;">
                                            &copy; 2026 Le Vount Jewelry. All rights reserved.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>

            </body>
            </html>
        `;
    },

    leVount_orderConfirm: (data) => {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Confirmed - Le Vount</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #FAF9F6;">

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #FFFFFF; max-width: 600px; width: 100%; border: 1px solid #EEEEEE; border-spacing: 0;">
                                
                                <tr>
                                    <td align="center" style="padding: 50px 0 30px 0; border-bottom: 2px solid #C5A059;">
                                        <img src="https://assets.levount.com/images/logos/LeVount_Logo.png" alt="LE VOUNT" style="width: 160px; max-width: 80%; display: block; font-family: Georgia, serif; font-size: 20px; color: #1A1A1A;">
                                    </td>
                                </tr>

                                <tr>
                                    <td class="content-padding" style="padding: 40px 50px;">
                                        <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: normal; color: #1A1A1A; margin: 0 0 20px 0;">
                                            Splendid Choice.
                                        </h1>
                                        <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #555555; margin: 0 0 25px 0;">
                                            Dear ${data?.name || 'Client'},<br><br>
                                            We are honored to confirm your order. Your acquisition is being prepared with the utmost care in our atelier. You will receive a notification once it begins its journey to you.
                                        </p>

                                        <div style="background-color: #FAF9F6; border: 1px solid #EEEEEE; padding: 20px; text-align: center;">
                                            <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999999; margin: 0 0 5px 0;">
                                                Order Reference
                                            </p>
                                            <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #1A1A1A; margin: 0; font-weight: bold;">
                                                ${data?.orderNumber}
                                            </p>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td class="content-padding" style="padding: 0 50px 30px 50px;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-bottom: 10px; border-bottom: 1px solid #DDDDDD; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; text-transform: uppercase; color: #999999; letter-spacing: 1px;">Item</td>
                                                <td align="right" style="padding-bottom: 10px; border-bottom: 1px solid #DDDDDD; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; text-transform: uppercase; color: #999999; letter-spacing: 1px;">Price</td>
                                            </tr>

                                            ${data?.items?.map(item => `
                                            <tr>
                                                <td style="padding: 20px 0; border-bottom: 1px solid #EEEEEE;">
                                                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="70" style="padding-right: 15px; vertical-align: top;">
                                                                <img src="https://assets.levount.com/products/${item?.material}/${item?.category}/${item?.sku?.toUpperCase()}/${item?.sku?.toLowerCase()}-thumb.webp" alt="Product" class="mobile-img" style="width: 70px; height: 70px; object-fit: cover; border: 1px solid #F0F0F0; display: block;">
                                                            </td>
                                                            <td style="vertical-align: top;">
                                                                <span style="font-family: Georgia, serif; font-size: 15px; color: #1A1A1A; display: block; margin-bottom: 5px;">${item?.shortName || item?.name}</span>
                                                                <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #888888;">
                                                                    ${item?.purity?.toUpperCase()} ${item?.material?.toUpperCase()}<br>
                                                                    Quantity: ${item.quantity}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td align="right" style="padding: 20px 0; border-bottom: 1px solid #EEEEEE; vertical-align: top; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #1A1A1A;">
                                                    ${utils.toCurrency(item?.rowTotal)}
                                                </td>
                                            </tr>
                                            `).join('')}
                                            
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td class="content-padding" style="padding: 0 50px 40px 50px;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="right" style="padding-top: 20px; font-family: Georgia, serif; font-size: 16px; color: #1A1A1A; font-weight: bold;">Total</td>
                                                <td align="right" style="padding-top: 20px; font-family: Georgia, serif; font-size: 18px; color: #C5A059; font-weight: bold;">${utils.toCurrency(data?.total)} ${data?.currency?.toUpperCase()}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td class="content-padding" style="padding: 0 50px 50px 50px; border-bottom: 1px solid #EEEEEE;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td class="mobile-block" width="50%" valign="top" style="padding-right: 20px;">
                                                    <h4 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; text-transform: uppercase; color: #999999; letter-spacing: 1px; margin: 0 0 10px 0;">Shipping To</h4>
                                                    <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #1A1A1A; line-height: 1.5; margin: 0;">
                                                        ${data?.address}
                                                    </p>
                                                </td>
                                                <td class="mobile-block" width="50%" valign="top">
                                                    <h4 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; text-transform: uppercase; color: #999999; letter-spacing: 1px; margin: 0 0 10px 0;">Payment</h4>
                                                    <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #1A1A1A; line-height: 1.5; margin: 0;">
                                                        ${data?.paymentMethod?.toUpperCase() || 'Credit Card'}<br>
                                                        <span style="color: #666;">${ (data?.paymentMethod != 'paypal') ? 'Ending in:' : 'Account:' } ${ data?.paymentReference }</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 40px 0 10px 0;">
                                        <div>
                                            <a href="https://levount.com/order/${data?.orderNumber}" style="background-color: #1A1A1A; color: #FFFFFF; display: inline-block; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; line-height: 50px; text-align: center; text-decoration: none; width: 220px; text-transform: uppercase; letter-spacing: 2px; border-radius: 0;">
                                                View Order
                                            </a>
                                        </div>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="padding: 30px;">
                                        <p style="font-family: Georgia, serif; font-size: 12px; color: #999999; font-style: italic; margin-bottom: 10px;">
                                            Le Vount Jewelry &copy; 2026
                                        </p>
                                        <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #AAAAAA; line-height: 1.5;">
                                            Questions? Contact <a href="mailto:customercare@levount.com" style="color: #AAAAAA; text-decoration: underline;">Concierge</a>.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>

            </body>
            </html>
        `;
    },

    LeVount: {

        redeemedGift: (clientName) => {
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                    <title>A Gift from Le Vount</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 40px 0;">
                        <tr>
                            <td align="center">
                                
                                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e0e0e0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                                    
                                    <tr>
                                        <td align="center" style="padding: 50px 0 40px 0; background-color: #111111;">
                                            <img src="https://assets.levount.com/images/logos/LeVount_Logo_White.png" style="max-width: 60%; max-height: 75px;">
                                        </td>
                                    </tr>

                                    <tr>
                                        <td align="center" style="padding: 0;">
                                            <a href="https://levount.com" target="_blank" style="text-decoration: none; display: block;">
                                                <img src="https://assets.levount.com/images/email/gift-002.jpg" alt="Your Exclusive Gift" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;" />
                                            </a>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td align="center" style="padding: 50px 40px;">
                                            
                                            <h1 style="font-family: Georgia, 'Times New Roman', serif; color: #111111; font-size: 24px; margin: 0 0 20px 0; font-weight: normal; letter-spacing: 1px;">
                                                A Timeless Token of Gratitude
                                            </h1>
                                            
                                            <table border="0" cellpadding="0" cellspacing="0" width="60" style="margin: 0 auto;">
                                                <tr>
                                                    <td style="border-bottom: 2px solid #c5a059; font-size: 1px; line-height: 1px;">&nbsp;</td>
                                                </tr>
                                            </table>

                                            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 30px 0 40px 0;">
                                                Dear <b>${clientName}</b>,<br><br>
                                                It was a true pleasure to welcome you to <strong>Le Vount</strong>. We hope your visit was as memorable for you as it was for us.
                                                <br><br>
                                                Your gift card has been successfully redeemed. Thank you for allowing us to be a part of your day. It was truly an honor to have you with us, and we look forward to welcoming you back to Le Vount in the near future.
                                            </p>

                                            <table border="0" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center" bgcolor="#c5a059" style="border-radius: 2px;">
                                                        <a href="https://levount.com" target="_blank" style="font-size: 14px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; text-transform: uppercase; padding: 15px 40px; border: 1px solid #c5a059; display: inline-block; letter-spacing: 2px; font-weight: bold;">
                                                            Discover More
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td align="center" style="padding: 30px; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
                                            <p style="font-family: Helvetica, Arial, sans-serif; color: #999999; font-size: 12px; line-height: 1.5; margin: 0;">
                                                &copy; 2026 Le Vount Jewelry. <br>
                                            </p>
                                            <p style="font-family: Helvetica, Arial, sans-serif; color: #999999; font-size: 12px; line-height: 1.5; margin: 15px 0 0 0;">
                                                <a href="#" style="color: #999999; text-decoration: underline;">Unsubscribe</a> &nbsp;|&nbsp; <a href="#" style="color: #999999; text-decoration: underline;">Privacy Policy</a>
                                            </p>
                                        </td>
                                    </tr>

                                </table>
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" height="40">
                                    <tr><td>&nbsp;</td></tr>
                                </table>

                            </td>
                        </tr>
                    </table>

                </body>
                </html>
            `;
        },

        newAccount: (name, email) => {
            return `
                <!DOCTYPE html PUBLIC>
                <html>
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                    <title>Welcome to Le Vount</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 40px 0;">
                        <tr>
                            <td align="center">
                                
                                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e0e0e0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                                    
                                    <tr>
                                        <td align="center" style="padding: 20px 0; background-color: #111111;">
                                            <img src="https://assets.levount.com/images/logos/LeVount_Logo_White.png"
                                            style="max-height: 60px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center">
                                            <img src="https://assets.levount.com/images/email/welcome-001.jpg"
                                            style="width: 100%;">
                                        </td>
                                    </tr>

                                    <tr>
                                        <td align="center" style="padding: 30px 50px;">
                                            
                                            <h1 style="font-family: Georgia, 'Times New Roman', serif; color: #111111; font-size: 26px; margin: 0 0 25px 0; font-weight: normal; letter-spacing: 0.5px;">
                                                Welcome
                                            </h1>
                                            
                                            <table border="0" cellpadding="0" cellspacing="0" width="40" style="margin: 0 auto;">
                                                <tr>
                                                    <td style="border-bottom: 2px solid #c5a059; font-size: 1px; line-height: 1px;">&nbsp;</td>
                                                </tr>
                                            </table>

                                            <p style="color: #555555; font-size: 16px; line-height: 1.8; margin: 30px 0 30px 0;">
                                                Dear ${name},<br><br>
                                                We are honored to welcome you to the Le Vount community. Your account has been successfully created and is now active.
                                                <br><br>
                                                You can now enjoy a seamless shopping experience, including faster checkouts, order tracking, and exclusive access to our latest collections and curated offers.
                                            </p>

                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9f9f9; border: 1px solid #eeeeee; margin-bottom: 35px;">
                                                <tr>
                                                    <td align="center" style="padding: 15px;">
                                                        <p style="margin: 0; color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Login Email</p>
                                                        <p style="margin: 5px 0 0 0; color: #333333; font-size: 16px; font-weight: bold;">
                                                            ${email}
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <table border="0" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center" bgcolor="#c5a059" style="border-radius: 2px;">
                                                        <a href="https://levount.com/account" target="_blank" style="font-size: 14px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; text-transform: uppercase; padding: 16px 45px; border: 1px solid #c5a059; display: inline-block; letter-spacing: 2px; font-weight: bold;">
                                                            Visit Our Store
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="margin-top: 30px;">
                                                <a href="https://levount.com/products" style="color: #111111; text-decoration: underline; font-size: 14px;">Browse New Arrivals</a>
                                            </p>

                                        </td>
                                    </tr>

                                    <tr>
                                        <td align="center" style="padding: 35px; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
                                            <p style="font-family: Helvetica, Arial, sans-serif; color: #999999; font-size: 12px; line-height: 1.6; margin: 0;">
                                                If you have any questions about your account, simply reply to this email or contact our <a href="mailto:customercare@levount.com" style="color: #888888; text-decoration: underline;">concierge team</a>.
                                            </p>
                                            <p style="font-family: Helvetica, Arial, sans-serif; color: #999999; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0;">
                                                &copy; 2026 Le Vount Jewelry. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>

                                </table>
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" height="40">
                                    <tr><td>&nbsp;</td></tr>
                                </table>

                            </td>
                        </tr>
                    </table>

                </body>
                </html>
            `;
        }

    }
};

export default emailTemplates;