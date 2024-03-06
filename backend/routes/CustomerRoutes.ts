import { Router } from "express";
import CustomerController from "../controllers/CustomerController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";
import { validateRegisterInput } from "../helpers/validate-register-input.js";

router.post(
	"/register",
	validateRegisterInput,
	imageUpload.single("image"),
	CustomerController.register
);
router.get("/:id", CustomerController.getCustomerById);
router.patch(
	"/edit/:id",
	verifyToken,
	imageUpload.single("image"),
	CustomerController.editCustomer
);

export default router;
