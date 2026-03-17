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
        res.locals.storeId = 0;

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
            const decoded = jwt.verify(token, process.env.JWT_SECRET); //console.log(decoded);
            const username = decoded.userSession.username;
            const tokenVersion = decoded.userSession.sessionVersion;

            // 1. Vamos a Redis PRIMERO
            let currentVersion = await redisClient.get(`session_v:${username}`); 
            
            // 2. SOLO si Redis no lo tiene, vamos a la Base de Datos
            if (!currentVersion) {
                const dbUser = await authModel.userVersion(username); 
                
                if (!dbUser || dbUser.active !== 1) {
                    res.clearCookie('jwt');
                    return next(); 
                }
                
                currentVersion = dbUser.sessionVersion.toString();
                await redisClient.set(`session_v:${username}`, currentVersion, {
                    EX: 3600 // Tiempo de vida: 1 hora.
                });
            }

            // 3. Comparación de versiones
            if (currentVersion.toString() !== tokenVersion.toString()) {
                
                // La versión cambió, hay que actualizar el token
                const updatedSession = await authModel.getFullUserSession(username);
                
                await redisClient.set(`session_v:${username}`, updatedSession.sessionVersion.toString(), { EX: 3600 });

                const newToken = jwt.sign({ userSession: updatedSession }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
                
                res.cookie("jwt", newToken, {
                     expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRATION) * 24 * 60 * 60 * 1000),
                     path: "/", 
                     httpOnly: true,
                     secure: process.env.NODE_ENV === 'production'
                });
                
                req.userSession = updatedSession;
                res.locals.userSession = updatedSession;
            } else {
                req.userSession = decoded.userSession;
                res.locals.userSession = decoded.userSession;
            } //console.log(res.locals.userSession);

            return next();

        } catch (error) {
            res.clearCookie('jwt');
            return next();
        }
    }
};

export default authMiddleware;