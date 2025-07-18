import { Router } from "express";
import OrderController from "../controllers/OrderController.js";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

router.get("/partner-orders", verifyToken, OrderController.getAllPartnerOrders);

router.get(
	"/partner-otaclub-orders",
	verifyToken,
	OrderController.getAllPartnerOrdersOtaclub
);

router.get(
	"/partner-orders/:id",
	verifyToken,
	OrderController.getPartnerOrderByID
);

router.get(
	"/partner-otaclub-orders/:id",
	verifyToken,
	OrderController.getPartnerOrderOtaclubByID
);

router.get(
	"/customer-orders",
	verifyToken,
	OrderController.getAllCustomerOrders
);

router.get(
	"/customer-otaclub-orders",
	verifyToken,
	OrderController.getAllCustomerOrdersOtaclub
);

router.get(
	"/customer-orders/:id",
	verifyToken,
	OrderController.getCustomerOrderByID
);

router.get(
	"/customer-otaclub-orders/:id",
	verifyToken,
	OrderController.getCustomerOrderOtaclubByID
);

router.patch(
	"/customer-receiptorder/:id",
	verifyToken,
	OrderController.confirmReceiptCustomerOrder
);

router.patch("/mark-packed/:id", verifyToken, OrderController.markPacked);

router.patch(
	"/otaclub-mark-packed/:id",
	verifyToken,
	OrderController.OtaclubMarkPacked
);

router.patch(
	"/mark-delivered/:id",
	verifyToken,
	OrderController.markOrderDelivered
);

router.patch(
	"/otaclub-mark-delivered/:id",
	verifyToken,
	OrderController.OtaclubMarkOrderDelivered
);

router.patch(
	"/mark-not-delivered/:id",
	verifyToken,
	OrderController.markOrderNotDelivered
);

router.patch(
	"/update-trackingcode/:id",
	verifyToken,
	OrderController.updateTrackingCode
);

router.patch(
	"/otaclub-update-trackingcode/:id",
	verifyToken,
	OrderController.updateTrackingCodeOtaclub
);

router.delete(
	"/partner-cancel-order/:id",
	verifyToken,
	OrderController.partnerCancelOrderByID
);

// router.post("/review-order", verifyToken, OrderController.reviewOrder);

export default router;
