const sendErrorAPI = (err, req, res) => {
    if (process.env.ENVIRONMENT == 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });
    }

    console.error('ERROR 💥', err);
    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong on the server side.'
    });
};

const sendErrorWeb = (err, req, res) => {
    let title = 'SYSTEM_ERROR';
    let description = 'Critical failure in runtime execution.';
    let button = { text: 'RETRY_CONNECTION', url: '/' };

    if (err.statusCode == 404) {
        title = 'A HIDDEN GEM?';
        description = `We looked in every velvet box, but we couldn't find <strong>${req.originalUrl}</strong>. It seems this page is as rare as a flawless diamond... or simply doesn't exist.`;
        button = { text: 'RETURN_TO_COLLECTION', url: '/admin/dashboard' };
    } 
    else if (err.statusCode == 403) {
        title = 'THE PRIVATE VAULT'; 
        description = 'Sorry, darling. This area is reserved for the master jewelers. Some treasures are strictly "Look, Don\'t Touch."';
        button = { text: 'BACK_TO_SAFETY', url: '/admin/dashboard' };
    }
    else if (err.statusCode == 401) {
        title = 'LET\'S VERIFY YOUR SPARKLE';
        description = 'Your session has lost its shine. We need to check your credentials again to ensure you are the authentic owner of this account.';
        button = { text: 'POLISH_CREDENTIALS', url: '/auth/login' };
    }
    else {
        title = 'A TANGLED CHAIN';
        description = (res?.locals?.userSession?.accessLevel >= 10) ? err.message : "Our wires got a little tangled behind the scenes. We are carefully unknotting them right now.";
    }

    res.status(err.statusCode).render('pages/error', {
        title: `Le Vount Jewelry | ${err.statusCode} Error`,
        layout: 'layouts/webstore-main',        
        error: {
            code: err.statusCode,
            title: title,
            description: description,
            button: button,
            
            meta: {
                requestId: (Math.random().toString(36).substring(7)).toUpperCase(),
                timestamp: new Date().toISOString(),
                method: req.method,
                path: req.originalUrl,
                ip: req.ip,
                user: res.locals.userSession ? `${res.locals.userSession.username} [ID:${res.locals.userSession.id}]` : 'GUEST',
                env: process.env.ENVIRONMENT
            }
        },
        metaDescription: null,
        err: (process.env.ENVIRONMENT == 'development' || res?.locals?.userSession?.accessLevel >= 10) ? err.stack : null
    });
};

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.ENVIRONMENT == 'development') {
        console.error('\n\n\n\n🔥 ERROR LOG:', err);
    }

    const isApiRoute = req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/services');
    const isAsset = /\.(css|js|png|jpg|ico|svg|webp|jpeg|woff|woff2|ttf)$/i.test(req.originalUrl);
    const wantsHtml = req.accepts('html');

    if (isApiRoute || isAsset || !wantsHtml) {
        if (isAsset) return res.status(err.statusCode).send('Resource not found.');
        return sendErrorAPI(err, req, res);
    }

    return sendErrorWeb(err, req, res);
};

export default globalErrorHandler;