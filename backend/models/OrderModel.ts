import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

// Interface tipando os dados que irão no Banco de Dados.
interface IOrderItem {
	productID: mongoose.Schema.Types.ObjectId;
	productName: string;
	productImage: string;
	productPrice: number;
	productQuantity: number;
	daysShipping: number;
}

// Interface tipando os dados que irão no Banco de Dados.
interface IOrder {
	orderID: string;
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
	customerCPF: string;
	customerAddress: {
		id: mongoose.Schema.Types.ObjectId;
		logradouro: string;
		complemento: string;
		bairro: string;
		cidade: string;
		uf: string;
		cep: string;
	}[];
	shippingMethod: string;
	statusShipping: string;
	trackingCode: string;
	discountsApplied: number;
	orderNote: string;
}

// Schema que corresponda a Interface
const orderSchema = new Schema<IOrder>(
	{
		orderID: {
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
				productImage: {
					type: String,
				},
				productPrice: {
					type: Number,
				},
				productQuantity: {
					type: Number,
				},
				daysShipping: {
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
		customerCPF: {
			type: String,
		},
		customerAddress: [
			{
				id: mongoose.Schema.Types.ObjectId,
				logradouro: {
					type: String,
				},
				complemento: {
					type: String,
				},
				bairro: {
					type: String,
				},
				cidade: {
					type: String,
				},
				uf: {
					type: String,
				},
				cep: {
					type: String,
				},
			},
		],
		shippingMethod: {
			type: String,
		},
		statusShipping: {
			type: String,
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
