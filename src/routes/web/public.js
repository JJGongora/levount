import express from "express";
import pageController from "../../controllers/web/pageController.js";
import permissionsVerification from "../../middlewares/permissionsVerification.js";
import verifyToken from "../../middlewares/verifyToken.js";
import authMiddleware from "../../middlewares/authMiddleware.js";
import initSession from "../../middlewares/initSession.js";

const router = express.Router();

// Se establece por defecto el layout de la tienda online.
router.use((req, res, next) => {
    res.locals.layout = 'layouts/webstore-main';
    next();
});
router.use(authMiddleware.protect);

router.get('/', pageController.home);
router.get('/privacy', pageController.privacy);
router.get('/terms', pageController.terms);
router.get(['/checkout', '/checkout/:environment'], pageController.checkout);

router.get(['/thanks', '/thanks/:orderId'], pageController.thanks);

router.get(['/products', '/products/:category'], pageController.products);
router.get('/products/:category/:id', pageController.product);

export default router;