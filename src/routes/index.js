import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas para la tienda online (Le Vount)
import webRoutes from "./web/public.js";
router.use("/", webRoutes);

import adminRoutes from "./web/admin.js";
router.use("/admin", adminRoutes);

import apiRoutes from "./api/api.js";
router.use("/api", apiRoutes);

import documentRoutes from "./documents.js";
router.use("/documents", documentRoutes);

import ordersRoutes from "./orders.js";
router.use("/orders", ordersRoutes);

export default router;