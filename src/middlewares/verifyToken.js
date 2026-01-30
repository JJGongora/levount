import jwt from 'jsonwebtoken';
import appError from '../utils/appError.js';

const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            if (req.accepts('html')) {            
                return res.redirect('/auth/login')
            } else {
                next(new appError('Su sesión ha expirado.', 403));
            }
        };

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded.userSession; 
        res.locals.userSession = decoded.userSession;

        next();
    } catch (err) {
        res.locals.userSession = null;
        next(err);
    }
};

export default verifyToken;