import { Router } from "express";
import InterApiController from "../controllers/InterApiController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";

// Rotas
router.post("/createPixInter", verifyToken, InterApiController.createPixInter);
router.post("/createWebhookPixInter", InterApiController.createWebhookPixInter);
router.get("/getWebhooksInter", InterApiController.getWebhooksInter);
router.delete("/deleteWebhooksInter", InterApiController.deleteWebhooksInter);
router.get("/getCallbacksInter", InterApiController.getCallbacksInter);
router.get(
	"/getCallbacksErrorInter",
	InterApiController.getCallbacksErrorInter
);
router.get("/getCobPixInter", InterApiController.getCobPixInter);
router.post("/addBalanceByPixInter", InterApiController.addBalanceByPixInter);

export default router;
