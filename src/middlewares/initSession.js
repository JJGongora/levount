import { v4 as uuidv4 } from "uuid";
import userModel from "../models/userModel.js";
import authHelpers from "../utils/authHelpers.js";
import { env } from "process";

const initSession = async (req, res, next) => {
    try {
        
        // Lógica de sesión del carrito de compras.
        if (!req.cookies.cartSession) {
            const sessionId = uuidv4();
            res.cookie('cartSession', sessionId, { 
                maxAge: 30 * 24 * 60 * 60 * 1000, 
                httpOnly: true 
            });
            req.cartSession = sessionId;
        } else {
            req.cartSession = req.cookies.cartSession;
        }        
        res.locals.cartId = req.cartSession;         
        res.locals.userSession = null;
        const Logged = await authHelpers.checkCookie(req);
        //console.log(req);

        if (Logged) {
            const sessionData = await userModel.getSession(Logged.Id);
            
            if (sessionData && sessionData[0]) {
                const user = sessionData[0];

                if (user.passwordReset == 1 && req.path !== '/password-update') {
                    return res.redirect("/password-update");
                }

                res.locals.userSession = user;
                req.user = user;
            }
        }

        next();

    } catch (error) {
        console.error("Error en initSession:", error);
        next();
    }
};

export default initSession;