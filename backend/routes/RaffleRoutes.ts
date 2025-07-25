import { Router } from "express";

import RaffleController from "../controllers/RaffleController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

router.post(
	"/create-raffle",
	verifyToken,
	imageUpload.array("imagesRaffle"),
	RaffleController.createRaffle
);
router.get("/getall-raffles", RaffleController.getAllRaffles);
router.get("/get-raffle/:id", RaffleController.getRaffleByID);

router.post(
	"/subscription/:id",
	verifyToken,
	RaffleController.subscriptionRaffle
);

router.post("/sorteio/:id", verifyToken, RaffleController.drawRaffle);

router.get(
	"/partner-raffles",
	verifyToken,
	RaffleController.getAllRafflesByPartner
);

router.get(
	"/partner-raffle/:id",
	verifyToken,
	RaffleController.getRafflePartnerByID
);

router.get(
	"/customer-raffle/:id",
	verifyToken,
	RaffleController.getRaffleCustomerByID
);

router.get(
	"/customer-raffles",
	verifyToken,
	RaffleController.getAllRafflesByCustomer
);

router.get(
	"/customer-tickets/:id",
	verifyToken,
	RaffleController.getAllTicketsByCustomer
);

router.patch("/mark-packed/:id", RaffleController.markRafflePacked);

router.patch(
	"/raffle-update-trackingcode/:id",
	verifyToken,
	RaffleController.updateTrackingCodeRaffle
);

router.patch(
	"/raffle-mark-delivered/:id",
	verifyToken,
	RaffleController.raffleMarkDelivered
);

export default router;
