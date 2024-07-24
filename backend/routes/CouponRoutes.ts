import CouponController from "../controllers/CouponsController.js";
import { Router } from "express";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token.js";
import { imageUpload } from "../helpers/image-upload.js";

router.post("/create", verifyToken, CouponController.create);
router.get("/allcoupons", CouponController.getAllCoupons);
router.get(
	"/partner-coupons",
	verifyToken,
	CouponController.getAllCouponsByPartner
);
router.delete("/remove", verifyToken, CouponController.removeCouponById);

export default router;
