import { Router } from "express";
import ResetPasswordController from "../controllers/ResetPasswordControler";

// Middlewares
import verifyToken from "../helpers/verify-token.js";

const router = Router();

router.post("/send-email", ResetPasswordController.SendEmail);
router.post("/reset-password", ResetPasswordController.ResetPassword);

export default router;
