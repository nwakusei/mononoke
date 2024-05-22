import { Router } from "express";
import OtakupayController from "../controllers/OtakupayController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";

// Rotas
router.post("/add-balance", verifyToken, OtakupayController.addBalance);
router.post("/buy-otamart", verifyToken, OtakupayController.buyOtamart);
router.post("/card-otamart", OtakupayController.creditCardOtamart);
router.post("/sending-money", verifyToken, OtakupayController.sendingMoney);
router.get(
	"/get-user-otakupay",
	verifyToken,
	OtakupayController.getUserOtakupay
);
router.get(
	"/send-public-key",
	verifyToken,
	OtakupayController.stripeSendPublicKey
);
router.post(
	"/create-payment-intent",
	verifyToken,
	OtakupayController.createPaymentIntent
);

router.post("/credit-card-otamart", OtakupayController.creditCardOtamart);

export default router;
