import { Router } from "express";
import PartnerController from "../controllers/PartnerController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";
import { validateRegisterInput } from "../helpers/validate-register-input.js";

router.post(
	"/register",
	validateRegisterInput,
	imageUpload.single("image"),
	PartnerController.register
);

router.get("/allpartners", PartnerController.getAllPartners);

router.get("/:id", PartnerController.getPartnerById);

router.patch(
	"/edit",
	verifyToken,
	// imageUpload.single("profileImage"),
	imageUpload.fields([
		{ name: "profileImage", maxCount: 1 },
		{ name: "logoImage", maxCount: 1 },
	]),
	PartnerController.editPartner
);

router.get("/convert/:slug", PartnerController.convertSlugPartnerToID);

export default router;
