import express from "express";
import orderController from "../controllers/orderController.js";
import permissionsVerification from "../middlewares/permissionsVerification.js";
import verifyToken from "../middlewares/verifyToken.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get('/:id', orderController.get);

export default router;