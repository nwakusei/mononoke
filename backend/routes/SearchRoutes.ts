import SearchController from "../controllers/SearchController.js";
import { Router } from "express";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

router.post("/search-store/:id", SearchController.searchProductsInStore);

router.post("/search-otamart", SearchController.searchProductsInOtamart);

router.post("/search-category", SearchController.searchProductByCategory);

export default router;
