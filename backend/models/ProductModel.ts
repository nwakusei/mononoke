import mainDB from "../db/mainconn.js";
import { Schema, model } from "mongoose";

// Interface para a estrutura de um objeto de revisão
interface IProduct {
	productName: string;
	imagesProduct: string[];
	description: string;
	originalPrice: number;
	promocionalPrice: number;
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

// Schema que corresponda a Interface
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
			type: Number,
		},
		promocionalPrice: {
			type: Number,
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
