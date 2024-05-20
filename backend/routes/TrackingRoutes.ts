import TrackingController from "../controllers/TrackingController.js";
import { Router } from "express";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";

router.get("/check-address", TrackingController.checkAddressByCep);
router.get(
	"/correios-tracking/:id",
	verifyToken,
	TrackingController.getTrackingCorreios
);

router.get(
	"/kangu-tracking/:id",
	verifyToken,
	TrackingController.getTrackingKangu
);

router.get("/dhl-tracking", TrackingController.getTrackingDHL);

export default router;
