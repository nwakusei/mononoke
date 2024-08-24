import ProductController from "../controllers/ProductController.js";
import { Router } from "express";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

router.post(
	"/create",
	verifyToken,
	imageUpload.array("imagesProduct"),
	ProductController.create
);

router.get("/", ProductController.getAllProducts);
router.get(
	"/partner-products",
	verifyToken,
	ProductController.getAllProductsPartner
);

router.get(
	"/getall-products-store/:id",
	ProductController.getAllProductsStoreByID
);

router.get("/:id", ProductController.getProductById);

router.delete("/:id", verifyToken, ProductController.removeProductById);

router.get("/recommended-product/:id", ProductController.recommendedProduct);

// router.get("/search-otamart", ProductController.searchProductsInOtamart);

router.get("/search-store", ProductController.searchProductsInStore);

router.post("/simulate-shipping/", ProductController.simulateShipping);

export default router;
