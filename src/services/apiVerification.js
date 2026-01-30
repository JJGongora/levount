import appError from "../utils/appError.js";

// Esta función verifica la validez dee la API Key del cliente, tomada del header de su petición HTTP.
const apiVerification = (req, res, next) => {
    
    try {
        const apiKey = req?.headers?.['x-api-key'] || null;       

        if (!apiKey) { next(new appError("La clave de API no es válida. Acceso denegado.", 403)); }
        if (apiKey == process.env.API_KEY) {
            next();
        } else {
            next(new appError("La clave de API no es válida. Acceso denegado.", 403));
        }
    } catch (error) {
        next(error);
    }

}

export default apiVerification;