import express, { Router } from "express";
import permissionsVerification from "../../middlewares/permissionsVerification.js";
import apiController from "../../controllers/api/apiController.js";
import clientController from "../../controllers/clientController.js";
import authMiddleware from "../../middlewares/authMiddleware.js";
import queryParser from "../../middlewares/queryParser.js";

const router = express.Router();
//router.use(apiTokenVerification);

// ===================================
//        PASARELAS DE PAGOS
// ===================================
router.get('/payments/payPalId', apiController.getPayPalClient);
router.post('/payments/paypal/create-order', apiController.paypal_create);
router.post('/payments/paypal/capture', apiController.paypal_capture);

// ===================================
//              CARRITO
// ===================================
router.get("/cart", apiController.get);
router.post(['/cart', '/cart/:quantity'], apiController.add);
router.delete(['/cart', '/cart/:quantity'], apiController.delete);

// ===================================
//           AUTENTICACIÓN
// ===================================
router.post('/auth/login', apiController.login);
router.post('/auth/signup', apiController.signUp);
router.get('/auth/logout', apiController.logout);
router.post('/signup', apiController.signUp);

// ===================================
//          GESTIÓN DE CLIENTES
// ===================================
router.post('/clients', 
    authMiddleware.protect, 
    permissionsVerification.checkPermission('customers:create'),
    apiController.clients.post
);
router.get(['/clients', '/clients/:id'],
    permissionsVerification.checkPermission('customers:read'),
    queryParser,
    apiController.clients.get
);

// ===================================
//       GESTIÓN DE NEWSLETTER
// ===================================
router.post('/newsletter', apiController.newsletter.post);

// ===================================
//          GESTIÓN DE DOCUMENTOS
// ===================================
router.get('/documents/sale/:docDate/:documentNumber/:storeId', apiController.sales.get);


//router.use(apiVerification);

export default router;