import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";
import { Decimal128 } from "mongodb";

// Interface para a estrutura de um objeto de revisão
interface IReview extends Document {
	orderID: mongoose.Types.ObjectId;
	customerName: string;
	reviewRating: number;
	imagesReview: string[];
	reviewDescription: string;
}

interface IProduct {
	productName: string;
	imagesProduct: string[];
	description: string;
	originalPrice: Decimal128;
	promocionalPrice: Decimal128;
	stock: number;
	category: string;
	weight: number;
	length: number;
	width: number;
	height: number;
	condition: string;
	preOrder: boolean;
	daysShipping: number;
	freeShipping: boolean;
	freeShippingRegion: string;
	productsSold: number;
	rating: number;
	reviews: [Object];
	partnerID: Schema.Types.ObjectId;
}

const productSchema = new Schema<IProduct>(
	{
		productName: {
			type: String,
		},
		imagesProduct: {
			type: [String],
		},
		description: {
			type: String,
		},
		originalPrice: {
			type: Decimal128,
		},
		promocionalPrice: {
			type: Decimal128,
		},
		stock: {
			type: Number,
		},
		category: {
			type: String,
		},
		weight: {
			type: Number,
		},
		length: {
			type: Number,
		},
		width: {
			type: Number,
		},
		height: {
			type: Number,
		},
		condition: {
			type: String,
		},
		preOrder: {
			type: Boolean,
		},
		daysShipping: {
			type: Number,
		},
		freeShipping: {
			type: Boolean,
		},
		freeShippingRegion: {
			type: String,
		},
		productsSold: {
			type: Number,
		},
		rating: {
			type: Number,
		},
		reviews: {
			type: [Object],
		},
		partnerID: {
			type: Schema.Types.ObjectId,
			ref: "PartnerModel",
		},
	},
	{ timestamps: true }
);

const ProductModel = mainDB.model<IProduct>("Product", productSchema);

export { ProductModel };
