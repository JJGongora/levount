import tenants from "../config/tenants.js";
import getTenantDb from "../config/db.js";
import appError from "../utils/appError.js";

const tenantHandler = async(req, res, next) => {
    
    const tenantId = req.headers.tenantid;
    if (!tenantId) {
        throw new appError("No se ha seleccionado un inquilino.", 400);
    }

    const tenantConfig = tenants[tenantId];
    if (!tenantConfig) {
        throw new appError("Este inquilino no está registrado en la aplicación.", 400);
    }

    try {
        req.db = await getTenantDb(tenantConfig.db);
        req.tenantName = tenantConfig.name;
        req.logo = tenantConfig?.domain || "Logo"; // El logo debe tener el mismo nombre que el dominio.
        next();
    } catch (error) {
        throw error;
    }

};

export default tenantHandler;