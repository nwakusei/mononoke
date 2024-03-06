import { Router } from "express";
import OtakuPrimeController from "../controllers/OtakuPrimeController.js";

// Middlewares
import verifyToken from "../helpers/verify-token.js";

const router = Router();

router.post("/login", OtakuPrimeController.login);
router.get("/check-user", verifyToken, OtakuPrimeController.checkUser);

export default router;
