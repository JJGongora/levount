import express, { Router } from "express";
import permissionsVerification from "../../middlewares/permissionsVerification.js";
import apiController from "../../controllers/api/apiController.js";
import clientController from "../../controllers/clientController.js";
import authMiddleware from "../../middlewares/authMiddleware.js";
import queryParser from "../../middlewares/queryParser.js";
import multer from "multer";

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
router.post(`/auth/admin/signup`, permissionsVerification.checkPermission("users:create"), apiController.admin.signUp)
router.get('/auth/logout', apiController.logout);
router.post('/signup', apiController.signUp);
router.get('/auth/userVersion', apiController.user.get.userVersion);
router.post('/auth/authenticateUser', apiController.user.post.authenticateUser);

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
    apiController.clients.get
);

// ===================================
//        GESTIÓN DE PRODUCTOS
// ===================================
const upload = multer({ storage: multer.memoryStorage() });
router.post('/products',
    permissionsVerification.checkPermission('inventory:create'),
    upload.array("product[photos]", 5), // 'product[photos]' es el nombre del input que contiene las imágenes. El número a un lado es el máximo de elementos por subida.
    apiController.products.create
);
router.put(`/products/:material/:sku`,
    permissionsVerification.checkPermission(`inventory:update`), 
    upload.array("product[photos]", 5),
    apiController.products.create
);
router.delete(`/products/:material/:sku/image/:index`,
    (req, res, next) => {
        return permissionsVerification.checkPermission(`inventory:${ (req?.params?.material == 'gold') ? 'gold' : 'silver' }:update`)(req, res, next);
    },
    apiController.products.images.delete
);
router.get(`/products`, apiController.products.get);

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