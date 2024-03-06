import mainDB from "../db/mainconn.js";
import { Schema } from "mongoose";

interface ICoupon {
	discountPercentage: number;
	couponCode: string;
	expirationDate: string;
	partnerID: object;
}

const couponSchema = new Schema<ICoupon>(
	{
		discountPercentage: {
			type: Number,
		},
		couponCode: {
			type: String,
		},
		expirationDate: {
			type: String,
		},
		partnerID: Object,
	},
	{ timestamps: true }
);

const CouponModel = mainDB.model<ICoupon>("Coupon", couponSchema);

export { CouponModel };
