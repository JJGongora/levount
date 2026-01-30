import express from "express";
import clientController from "../controllers/clientController.js";
import permissionsVerification from "../middlewares/permissionsVerification.js";
import verifyToken from "../middlewares/verifyToken.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get('/', authMiddleware.protect, clientController.clients);

// Crear nuevos usuarios.
router.get('/create', authMiddleware.protect, clientController.getCreate);

export default router;