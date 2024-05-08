import { Router } from "express";
import OrderController from "../controllers/OrderController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

router.get("/partner-orders", verifyToken, OrderController.getAllPartnerOrders);

router.get(
	"/partner-orders/:id",
	verifyToken,
	OrderController.getPartnerOrderByID
);
// router.patch(
// 	"/partner-cancel/:id",
// 	verifyToken,
// 	OrderController.partnerCancelOrderByID
// );

router.get(
	"/customer-orders",
	verifyToken,
	OrderController.getAllCustomerOrders
);
router.get(
	"/customer-orders/:id",
	verifyToken,
	OrderController.getCustomerOrderByID
);

router.patch(
	"/customer-receiptorder/:id",
	verifyToken,
	OrderController.confirmReceiptCustomerOrder
);

router.patch(
	"/update-trackingcode/:id",
	verifyToken,
	OrderController.updateTrackingCode
);

router.get(
	"/get-order-tracking/:id",
	verifyToken,
	OrderController.getOrderTracking
);

// router.post("/review-order", verifyToken, OrderController.reviewOrder);

export default router;
