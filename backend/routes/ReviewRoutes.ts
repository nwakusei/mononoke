import { Router } from "express";
import ReviewController from "../controllers/ReviewController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

router.patch(
	"/create-review/:id",
	imageUpload.array("imagesReview"),
	verifyToken,
	ReviewController.createReview
);

export default router;
