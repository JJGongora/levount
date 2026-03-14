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
router.get(`/products`,
    permissionsVerification.checkPermission("inventory:read"),
    adminController.products.getAll
);
router.get(`/products/:sku`,
    permissionsVerification.checkPermission("inventory:read"),
    adminController.products.get
);

// ===========================
//          USUARIOS
// ===========================
router.get(`/users`,
    permissionsVerification.checkPermission("users:read"),
    adminController.users.get
);
router.get([`/labels`, `/labels/:material`],
    permissionsVerification.checkPermission(`inventory:read`),
    adminController.labels.get
);

export default router;
