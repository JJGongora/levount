import appError from "../utils/appError.js";

const apiTokenVerification = (req, res, next) => {

    try {
        const apiKey = req?.headers['x-api-key'];
        if (apiKey) {
            if (apiKey == process.env.MAIN_API_KEY) {
                return next();
            }

            return next(appError("Access denied: Invalid API key.", 403));
        }

        if (req?.session && req?.session?.user) {
            return next();
        }
    } catch (error) {
        return next(error);
    }

};

export default apiTokenVerification;