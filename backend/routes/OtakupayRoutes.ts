import { Router } from "express";
import OtakupayController from "../controllers/OtakupayController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";

// Rotas
router.post("/add-balance", verifyToken, OtakupayController.addBalance);
router.post("/buy-otamart", verifyToken, OtakupayController.buyOtamart);
router.post("/sending-money", verifyToken, OtakupayController.sendingMoney);
router.get(
	"/get-user-otakupay",
	verifyToken,
	OtakupayController.getUserOtakupay
);

export default router;
