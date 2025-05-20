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

router.patch(
	"/add-liquidity/:id",
	verifyToken,
	CryptocurrencyController.addLiquidity
);

router.post(
	"/buy-cryptocurrency/:id",
	verifyToken,
	CryptocurrencyController.buyCryptocurrency
);

router.get(
	"/get-balance-by-user",
	verifyToken,
	CryptocurrencyController.getCryptocurrencyBalanceByCustomer
);
router.get(
	"/get-all-cryptocurrencies",
	CryptocurrencyController.getAllCryptocurrencies
);

router.get(
	"/get-cryptocurrency/:id",
	CryptocurrencyController.getCryptocurrencyByID
);

export default router;
