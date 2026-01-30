import appError from "../utils/appError.js";
import permissionsModel from "../models/permissionsModel.js";

const permissionsVerification = {

    checkPermission: (requiredPermission) => {
        return async (req, res, next) => {
            try {

                const session = res?.locals?.userSession; //console.log(session);

                if (!session) {
                    return next(new appError("No cuenta con una sesión activa. Por favor, loguearse.", 403));
                }

                if (session.roleId === 1 || session.roleId === 4) {
                    return next();
                }

                const userPermissions = session.permissions || [];

                if (userPermissions.includes(requiredPermission)) {
                    return next();
                }

                return next(new appError("No cuenta con los permisos necesarios para acceder a este recurso.", 403));
            } catch (error) {
                return next(error);
            }
        };
    }
};

export default permissionsVerification;