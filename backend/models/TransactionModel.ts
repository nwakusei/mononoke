import otakupayDB from "../db/otakupayconn.js";
import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

interface ITransaction {
	transactionType: string;
	transactionTitle: string;
	transactionDescription: string;
	transactionValue: string;
	transactionDetails: object;
	payerID: mongoose.Schema.Types.ObjectId;
	payerName: string;
	receiverID: mongoose.Schema.Types.ObjectId;
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
			type: Object,
			required: true,
		},
		payerID: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		payerName: {
			type: String,
			required: true,
		},
		receiverID: {
			type: mongoose.Schema.Types.ObjectId,
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
	// Se o createdAt ainda não foi definido, usamos a data atual
	const createdAt = Date.now();

	const transactionData = `${this.transactionTitle}|${this.transactionDescription}|${this.transactionValue}|${this.transactionDetails}|${this.payerID}|${this.payerName}|${this.receiverID}|${this.receiverName}|${createdAt}`;
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
