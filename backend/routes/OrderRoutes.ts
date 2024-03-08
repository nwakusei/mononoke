import { Router } from "express";
import OrderController from "../controllers/OrderController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

router.get("/partner-orders", verifyToken, OrderController.getAllPartnerOrders);
router.get(
	"/partner-order/:id",
	verifyToken,
	OrderController.getPartnerOrderByID
);
router.patch(
	"/partner-cancel/:id",
	verifyToken,
	OrderController.partnerCancelOrderByID
);

router.get(
	"/customer-orders",
	verifyToken,
	OrderController.getAllCustomerOrders
);
router.get(
	"/customer-order/:id",
	verifyToken,
	OrderController.getCustomerOrderByID
);

router.patch(
	"/customer-receiptorder/:id",
	verifyToken,
	OrderController.confirmReceiptCustomerOrder
);

router.patch("/create-review/:id", verifyToken, OrderController.createReview);

export default router;
