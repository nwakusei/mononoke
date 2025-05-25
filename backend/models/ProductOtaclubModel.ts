import mainDB from "../db/mainconn.js";
import { Schema, model } from "mongoose";

// Interface para a estrutura de um objeto de revisão
interface IProductOtaclub {
	productTitle: string;
	slugTitle: string;
	productImages: string[];
	description: string;
	productPrice: number;
	stock: number;
	category: string;
	weight: number;
	length: number;
	width: number;
	height: number;
	condition: string;
	adultProduct: boolean;
	partnerID: string;
}

// Schema que corresponda a Interface
const productOtaclubSchema = new Schema<IProductOtaclub>(
	{
		productTitle: {
			type: String,
		},
		slugTitle: {
			type: String,
		},
		productImages: {
			type: [String],
		},
		description: {
			type: String,
		},

		productPrice: {
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

		adultProduct: {
			type: Boolean,
		},

		partnerID: {
			type: String,
			ref: "PartnerModel",
		},
	},
	{ timestamps: true }
);

const ProductOtaclubModel = mainDB.model<IProductOtaclub>(
	"ProductOtaclub",
	productOtaclubSchema
);

export { ProductOtaclubModel };
