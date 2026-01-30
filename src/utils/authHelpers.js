import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";

const authHelpers = {

    checkCookie: async(req) => {
        const Username = decodeURIComponent(req?.headers?.cookie?.split("; ")?.find(cookie => cookie?.startsWith("username="))?.slice(9)) || null;
        
        if (!Username) {
            return false;
        } else {
            const DBUser = await userModel.getUserLoginData(Username);

            const cookieJWT = req?.headers?.cookie?.split("; ")?.find(cookie => cookie?.startsWith("jwt="))?.slice(4) || null;         
            if (!cookieJWT) { return false };
            const decodified = jsonwebtoken.verify(cookieJWT, process.env.JWT_SECRET);

            if (!DBUser) { 
                return false;
            }
            if (DBUser.username != decodified.user) {
                return false;
            }
            const userCheck = DBUser;
    
            return (!userCheck)
                ? false
                : userCheck;
        }
    },

    comparePasswords: async(passwordPlain, passwordHash) => {
        return await bcrypt.compare(passwordPlain, passwordHash);
    },

    verifyCloudflareToken: async(token, ip) => {
        const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const formData = new URLSearchParams();
        const turnstileSecret = process.env.TURNSTILE_SECRET;
        formData.append('secret', turnstileSecret);
        formData.append('response', token);
        formData.append('remoteip', ip);

        const result = await fetch(verificationUrl, {
            method: 'POST',
            body: formData,
        });

        const outcome = await result.json();
        return (outcome.success)
            ? {success: true}
            : {success: false};
    },

    senderEmailData: async(user) => {
        const emailsString = process.env.SENDER_EMAILS;
        const emailsConfig = JSON.parse(emailsString);
        return emailsConfig[user];
    }
}

export default authHelpers;