import { Router } from "express";

import RaffleController from "../controllers/RaffleController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

router.post("/create-raffle", RaffleController.createRaffle);

export default router;
