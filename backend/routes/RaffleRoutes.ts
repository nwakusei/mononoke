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
router.get("/", RaffleController.getAllRaffle);
router.get("/:id", RaffleController.getRaffleByID);

router.post("/register/:id", verifyToken, RaffleController.registerInRaffle);

export default router;
