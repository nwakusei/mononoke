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
router.get("/get-raffles", RaffleController.getAllRaffles);
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

export default router;
