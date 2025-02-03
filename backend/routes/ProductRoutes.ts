import ProductController from "../controllers/ProductController.js";
import { Router } from "express";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

// Obtendo o número de variações e opções de uma forma dinâmica
const numberOfVariations = 10; // Defina isso conforme necessário, ou calcule dinamicamente
const optionsPerVariation = 50; // Defina o número de opções por variação conforme necessário

const fields = [{ name: "imagesProduct", maxCount: 10 }];

// Adicionando campos de imagem para cada variação e suas opções
for (let i = 0; i < numberOfVariations; i++) {
	for (let j = 0; j < optionsPerVariation; j++) {
		fields.push({
			name: `productVariations[${i}][options][${j}][imageUrl]`,
			maxCount: 1,
		});
	}
}

router.post(
	"/create",
	verifyToken,
	imageUpload.fields(fields),
	ProductController.create
);

// router.post(
// 	"/create",
// 	verifyToken,
// 	imageUpload.fields([
// 		{ name: "imagesProduct", maxCount: 10 },
// 		{ name: "productVariations[0][options][0][imageUrl]", maxCount: 1 },
// 		{ name: "productVariations[0][options][1][imageUrl]", maxCount: 1 },
// 	]),
// 	ProductController.create
// );

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

router.get("/convert/:slug", ProductController.convertSlugProductToID);

router.get("/:id", ProductController.getProductById);

router.delete("/:id", verifyToken, ProductController.removeProductById);

router.get("/recommended-product/:id", ProductController.recommendedProduct);

export default router;
