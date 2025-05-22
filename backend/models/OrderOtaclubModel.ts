import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

// Interface tipando os dados que irão no Banco de Dados.
interface IOrderOtaclubItem {
	productID: string;
	productTitle: string;
	productImage: string;
	productPrice: number;
	daysShipping: number;
}

interface ICustomerAddress {
	street?: string; // logradouro
	complement?: string; // complemento
	neighborhood?: string; // bairro
	city?: string; // cidade
	state?: string; // uf
	postalCode?: string; // cep
}

// Interface tipando os dados que irão no Banco de Dados.
interface IOrderOtaclub {
	orderOtaclubID: string;
	statusOrder: string;
	paymentMethod: string;
	customerOrderCostTotal: string;
	partnerCommissionOtamart: String;
	itemsList: IOrderOtaclubItem[];
	partnerID: object;
	partnerName: string;
	partnerCNPJ: string;
	customerID: object;
	customerName: string;
	customerCPF: string;
	customerAddress: ICustomerAddress[];
	statusShipping: string;
	markedDeliveredBy: string;
	dateMarkedPacked: Date;
	trackingCode: string;
	logisticOperator: string;
}

// Schema que corresponda a Interface
const orderOtaclubSchema = new Schema<IOrderOtaclub>(
	{
		orderOtaclubID: {
			type: String,
		},
		statusOrder: {
			type: String,
		},
		paymentMethod: {
			type: String,
		},
		customerOrderCostTotal: {
			type: String,
		},
		partnerCommissionOtamart: {
			type: String,
		},
		itemsList: [
			{
				productID: {
					type: String,
					ref: "ProductOtaclubModel",
				},
				productTitle: {
					type: String,
				},
				productImage: {
					type: String,
				},
				productPrice: {
					type: Number,
				},
				productVariation: {
					type: String,
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
		partnerID: Object,
		partnerName: {
			type: String,
		},
		partnerCNPJ: {
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
				street: {
					type: String,
				},
				complement: {
					type: String,
				},
				neighborhood: {
					type: String,
				},
				city: {
					type: String,
				},
				state: {
					type: String,
				},
				postalCode: {
					type: String,
				},
			},
		],
		statusShipping: {
			type: String,
		},
		markedDeliveredBy: {
			type: String,
		},
		dateMarkedPacked: {
			type: Date,
		},
		trackingCode: {
			type: String,
		},
		logisticOperator: {
			type: String,
		},
	},
	{ timestamps: true }
);

// Criação de um Model com conexão ao banco de dados
const OrderOtaclubModel = mainDB.model<IOrderOtaclub>(
	"OrderOtaclub",
	orderOtaclubSchema
);

export { OrderOtaclubModel, IOrderOtaclubItem };
