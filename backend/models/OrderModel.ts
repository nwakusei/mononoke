import { StringDecoder } from "string_decoder";
import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

// Interface tipando os dados que irão no Banco de Dados.
interface IOrder {
	productID: mongoose.Schema.Types.ObjectId;
	orderNumber: string;
	statusOrder: string;
	paymentMethod: string;
	productsCostTotal: number;
	shippingCostTotal: number;
	orderCostTotal: number;
	commissionOtamart: String;
	totalCommissionOtamart: String;
	otakuPointsEarned: string;
	otakuPointsPaid: string;
	itemsList: [];
	amount: number;
	orderDetail: string;
	partnerID: object;
	partnerName: string;
	customerID: object;
	customerName: string;
	customerAdress: [{}];
	shippingMethod: string;
	statusShipping: string;
	trackingNumber: string;
	discountsApplied: number;
	orderNote: string;
}

// Schema que corresponda a Interface
const orderSchema = new Schema<IOrder>(
	{
		productID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ProductModel",
			required: true,
		},
		orderNumber: {
			type: String,
			required: true,
		},
		statusOrder: {
			type: String,
			required: true,
		},
		paymentMethod: {
			type: String,
			required: true,
		},
		productsCostTotal: {
			type: Number,
			required: true,
		},
		shippingCostTotal: {
			type: Number,
			required: true,
		},
		orderCostTotal: {
			type: Number,
			required: true,
		},
		commissionOtamart: {
			type: String,
			required: true,
		},
		totalCommissionOtamart: {
			type: String,
			required: true,
		},
		otakuPointsEarned: {
			type: String,
		},
		otakuPointsPaid: {
			type: String,
		},
		itemsList: {
			type: [],
			required: true,
		},
		amount: {
			type: Number,
			required: true,
		},
		orderDetail: {
			type: String,
			required: true,
		},
		partnerID: Object,
		partnerName: {
			type: String,
			required: true,
		},
		customerID: Object,
		customerName: {
			type: String,
			required: true,
		},
		customerAdress: {
			type: [{}],
			required: true,
		},
		shippingMethod: {
			type: String,
			required: true,
		},
		statusShipping: {
			type: String,
			required: true,
		},
		trackingNumber: {
			type: String,
		},
		discountsApplied: {
			type: Number,
		},
		orderNote: {
			type: String,
		},
	},
	{ timestamps: true }
);

// Criação de um Model com conexão ao banco de dados
const OrderModel = mainDB.model<IOrder>("Order", orderSchema);

export { OrderModel };
