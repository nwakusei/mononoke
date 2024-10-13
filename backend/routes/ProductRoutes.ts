import ProductController from "../controllers/ProductController.js";
import { Router } from "express";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

router.post(
	"/create",
	verifyToken,
	imageUpload.fields([
		{ name: "imagesProduct", maxCount: 10 },
		{ name: "productVariations[*].options[*].imageUrl", maxCount: 10 },
	]),
	ProductController.create
);

router.get("/", ProductController.getAllProducts);

router.get(
	"/partner-products",
	verifyToken,
	ProductController.getAllProductsPartner
);

router.get(
	"/partner-product/:id",
	verifyToken,
	ProductController.getPartnerProductByID
);

router.get(
	"/getall-products-store/:id",
	ProductController.getAllProductsStoreByID
);

router.get("/:id", ProductController.getProductById);

router.delete("/:id", verifyToken, ProductController.removeProductById);

router.get("/recommended-product/:id", ProductController.recommendedProduct);

router.post("/simulate-shipping/", ProductController.simulateShipping);

export default router;
