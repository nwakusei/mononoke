import { Router } from "express";

// Model
import { CryptcurrencyModel } from "../models/CryptocurrencyModel";

// Instânciar o Router
const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token";
import { imageUpload } from "../helpers/image-upload";
import CryptocurrencyController from "../controllers/CryptocurrencyController";

// Rotas
router.post(
	"/create-cryptocurrency",
	CryptocurrencyController.createCryptocurrency
);

router.post(
	"/buy-cryptocurrency/:id",
	verifyToken,
	CryptocurrencyController.buyCryptocurrency
);

export default router;
