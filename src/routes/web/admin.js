import express from "express";
import adminController from "../../controllers/web/adminController.js";
import permissionsVerification from "../../middlewares/permissionsVerification.js";

const router = express.Router();

router.use((req, res, next) => {
    res.locals.layout = 'layouts/admin-main';
    next();
});

// ===========================
//          CLIENTES
// ===========================
router.get('/clients', 
    permissionsVerification.checkPermission("customers:read"),
    adminController.clients
);
router.get('/clients/create',
    permissionsVerification.checkPermission("customers:create"),
    adminController.createClient
);

// ===========================
//          PRODUCTOS
// ===========================
router.get('/products/create',
    permissionsVerification.checkPermission("inventory:create"),
    adminController.products.create
);

export default router;
