import { Router } from "express";
import MononokeController from "../controllers/MononokeController.js";

// Middlewares
import verifyToken from "../helpers/verify-token.js";

const router = Router();

router.post("/login", MononokeController.login);
router.get("/check-user", verifyToken, MononokeController.checkUser);

export default router;
