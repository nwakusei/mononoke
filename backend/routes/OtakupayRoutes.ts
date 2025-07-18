import { Router } from "express";
import OtakupayController from "../controllers/OtakupayController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";

// Rotas
router.post("/add-balance", verifyToken, OtakupayController.addBalance);

router.post("/add-otakupoints", verifyToken, OtakupayController.addOtakuPoints);

router.post("/buy-otamart", verifyToken, OtakupayController.buyOtamart);

// router.post("/card-otamart", OtakupayController.creditCardOtamart);
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

router.post("/credit-card-otamart", OtakupayController.paymentCreditCardStripe);

router.post(
	"/payment-creditcard-MP",
	verifyToken,
	OtakupayController.paymentCreditcardMP
);
router.post(
	"/finish-payment-creditcard-MP",
	verifyToken,
	OtakupayController.finishPaymentCreditcard
);

router.post(
	"/create-payment-pix-otakupay",
	verifyToken,
	OtakupayController.createPaymentPixOtakuPay
);
router.post(
	"/finish-payment-pix-otakupay",
	OtakupayController.finishPaymentPixOtakuPay
);

router.post("/release-values", verifyToken, OtakupayController.releaseOfValues);

router.post(
	"/otamart-lambda-release-values",
	OtakupayController.webhookAWSLambdaReleaseValuesOtamart
);

router.post(
	"/otaclub-release-values",
	verifyToken,
	OtakupayController.releaseOfValuesOtaclub
);

router.post(
	"/otaclub-lambda-release-values",
	OtakupayController.webhookAWSLambdaReleaseValuesOtaclub
);

router.post(
	"/raffle-release-values",
	verifyToken,
	OtakupayController.releaseOfValuesRaffle
);

// router.post(
// 	"/raffle-lambda-release-values",
// 	OtakupayController.webhookAWSLambdaReleaseValuesOtaclub
// );

router.get(
	"/transactions",
	verifyToken,
	OtakupayController.getAllUserTransactions
);

router.post("/withdraw-money", verifyToken, OtakupayController.withdrawMoney);

router.post("/swap-otaclub", verifyToken, OtakupayController.swapOtaclub);

export default router;
