import appError from "../utils/appError.js";
import authModel from "../models/authModel.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import redisClient from "../utils/redisClient.js";

const authMiddleware = {

    protect: async (req, res, next) => {

        // Inicializamos variables locales para la vista
        res.locals.userSession = null;
        res.locals.cartId = null;

        // ---------------------------------------------------------
        // 1. GESTIÓN DEL CARRITO (Lógica Síncrona - Muy Rápida)
        // ---------------------------------------------------------
        let cartId = req.cookies.cartSession;

        if (!cartId) {
            cartId = uuidv4();
            // Nota: secure: true es vital si usas HTTPS
            res.cookie('cartSession', cartId, { 
                maxAge: 30 * 24 * 60 * 60 * 1000, 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' 
            });
        }
        
        req.cartSession = cartId;
        res.locals.cartId = cartId;

        // ---------------------------------------------------------
        // 2. VERIFICACIÓN DE TOKEN (Lógica Principal)
        // ---------------------------------------------------------
        const token = req.cookies.jwt;
        if (!token) return next();

        try {
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const username = decoded.userSession.username;
            const tokenVersion = decoded.userSession.sessionVersion;

            let currentVersion = await redisClient.get(`session_v:${username}`);
            if (!currentVersion) {
                const dbUser = await authModel.userVersion(username);
                
                if (!dbUser || dbUser.active !== 1) {
                    res.clearCookie('jwt');
                    return next(); 
                }
                
                currentVersion = dbUser.sessionVersion.toString();
                await redisClient.set(`session_v:${username}`, currentVersion, {
                    EX: 3600 // Tiempo de vida de la variable: 1 hora.
                });
            }

            if (currentVersion != tokenVersion) {
                
                // La versión cambió, hay que actualizar el token
                // Aquí sí consultamos la DB completa porque necesitamos todos los datos nuevos
                const updatedSession = await authModel.getFullUserSession(username);
                
                // Actualizamos Redis con la nueva versión (por si acaso)
                await redisClient.set(`session_v:${username}`, updatedSession.sessionVersion.toString(), { EX: 3600 });

                // Generamos nuevo token y cookie
                const newToken = jwt.sign({ userSession: updatedSession }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
                res.cookie("jwt", newToken, {
                     expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRATION * 24 * 60 * 60 * 1000),
                     path: "/", httpOnly: true
                });
                
                req.userSession = updatedSession;
                res.locals.userSession = updatedSession;
            } else {
                // CAMINO FELIZ: Todo coincide, usamos datos del token.
                // TIEMPO TOTAL: < 1ms
                req.userSession = decoded.userSession;
                res.locals.userSession = decoded.userSession;
            }

            return next();

        } catch (error) {
            // Si el token expiró o es inválido, simplemente limpiamos y seguimos como invitado
            // No hacemos console.error para no ensuciar logs con "Token ExpiredError" que es normal
            res.clearCookie('jwt');
            return next();
        }
    }
};

export default authMiddleware;