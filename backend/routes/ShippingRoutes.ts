import ShippingController from "../controllers/ShippingController";
import { Router } from "express";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token";
import { imageUpload } from "../helpers/image-upload";

router.post(
	"/create-shipping-modality",
	verifyToken,
	ShippingController.createCustomShipping
);

router.post(
	"/simulate-melhor-envio",
	ShippingController.simulateShippingMelhorEnvio
);

router.post(
	"/simulate-modico",
	ShippingController.simulateShippingCorreiosModico
);

export default router;
