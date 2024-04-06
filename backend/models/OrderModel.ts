import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

// Interface tipando os dados que irão no Banco de Dados.
interface IOrderItem {
	productID: mongoose.Schema.Types.ObjectId;
	productName: string;
	productQuantity: number;
	// productsCostTotal: number;
}

// Interface tipando os dados que irão no Banco de Dados.
interface IOrder {
	orderNumber: string;
	statusOrder: string;
	paymentMethod: string;
	shippingCostTotal: number;
	customerOrderCostTotal: number;
	partnerCommissionOtamart: String;
	customerOtakuPointsEarned: string;
	partnerOtakuPointsPaid: string;
	itemsList: IOrderItem[];
	orderDetail: string;
	partnerID: object;
	partnerName: string;
	customerID: object;
	customerName: string;
	customerAdress: [{}];
	shippingMethod: string;
	statusShipping: string;
	daysShipping: number;
	trackingCode: string;
	discountsApplied: number;
	orderNote: string;
}

// Schema que corresponda a Interface
const orderSchema = new Schema<IOrder>(
	{
		orderNumber: {
			type: String,
		},
		statusOrder: {
			type: String,
		},
		paymentMethod: {
			type: String,
		},
		shippingCostTotal: {
			type: Number,
		},
		customerOrderCostTotal: {
			type: Number,
		},
		partnerCommissionOtamart: {
			type: String,
		},
		customerOtakuPointsEarned: {
			type: String,
		},
		partnerOtakuPointsPaid: {
			type: String,
		},
		itemsList: [
			{
				productID: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "ProductModel",
				},
				productName: {
					type: String,
				},
				productQuantity: {
					type: Number,
				},
				// productsCostTotal: {
				// 	type: Number,
				// },
			},
		],
		orderDetail: {
			type: String,
		},
		partnerID: Object,
		partnerName: {
			type: String,
		},
		customerID: Object,
		customerName: {
			type: String,
		},
		customerAdress: {
			type: [{}],
		},
		shippingMethod: {
			type: String,
		},
		statusShipping: {
			type: String,
		},
		daysShipping: {
			type: Number,
		},
		trackingCode: {
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

export { OrderModel, IOrderItem };
