import otakupayDB from "../db/otakupayconn.js";
import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

interface ITransactionDetails {
	detailProductServiceTitle: string;
	detailCost: string;
	detailPaymentMethod: string;
	detailShippingCost: string;
	detailSalesFee: string;
	detailCashback: string;
}

interface ITransaction {
	transactionType: string;
	transactionTitle: string;
	transactionDescription: string;
	transactionValue: string;
	transactionDetails: {};
	plataformName: string;
	payerID: string;
	payerName: string;
	receiverID: string;
	receiverName: string;
	transactionHash: string;
}

const transactionSchema = new Schema<ITransaction>(
	{
		transactionType: {
			type: String,
			required: true,
		},
		transactionTitle: {
			type: String,
			required: true,
		},
		transactionDescription: {
			type: String,
		},
		transactionValue: {
			type: String,
			required: true,
		},
		transactionDetails: {
			detailProductServiceTitle: { type: String, required: true },
			detailCost: { type: String, required: true },
			detailPaymentMethod: { type: String, required: true },
			detailShippingCost: { type: String, required: true },
			detailSalesFee: { type: String, required: true },
			detailCashback: { type: String, required: true },
		},
		plataformName: {
			type: String,
			required: true,
		},
		payerID: {
			type: String,
			required: true,
		},
		payerName: {
			type: String,
			required: true,
		},
		receiverID: {
			type: String,
			required: true,
		},
		receiverName: {
			type: String,
			required: true,
		},
		transactionHash: {
			type: String,
		},
	},
	{ timestamps: true }
);

// Middleware para gerar hash antes de salvar
transactionSchema.pre("save", function (next) {
	const createdAt = Date.now();

	// Converte transactionDetails para uma string JSON para garantir consistência
	const transactionDetailsStr = JSON.stringify(this.transactionDetails);

	// Concatenate all data for the hash generation
	const transactionData = `${this.transactionTitle}|${this.transactionDescription}|${this.transactionValue}|${transactionDetailsStr}|${this.plataformName}|${this.payerID}|${this.payerName}|${this.receiverID}|${this.receiverName}|${createdAt}`;

	this.transactionHash = crypto
		.createHash("sha256")
		.update(transactionData)
		.digest("hex");

	next();
});

const TransactionModel = otakupayDB.model<ITransaction>(
	"Transaction",
	transactionSchema
);

export { TransactionModel };
