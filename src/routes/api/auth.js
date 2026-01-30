import express from "express";
import authController from "../../controllers/api/authController.js";
import verifyToken from "../../middlewares/verifyToken.js";
import notLogged from "../../middlewares/notLogged.js";
const router = express.Router();

router.get('/login', notLogged, authController.getLogin);
router.get('/signup', verifyToken, authController.getSignup);
router.get('/logout', verifyToken, authController.logout);

export default router;