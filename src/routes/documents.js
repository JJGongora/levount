import express from "express";
import documentController from "../controllers/documentController.js";
import permissionsVerification from "../middlewares/permissionsVerification.js";
import verifyToken from "../middlewares/verifyToken.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router = express.Router();


export default router;