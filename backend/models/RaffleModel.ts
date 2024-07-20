import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

interface IActiveParticipant {
	customerID: string;
	customerName: string;
	ticket: string;
}

// Interface para a estrutura de um objeto de revisão
interface IRaffle {
	rafflePrize: string;
	imagesRaffle: string[];
	raffleDate: Date;
	raffleCost: number;
	raffleDescription: string;
	raffleRules: string;
	minNumberParticipants: Number;
	raffleOrganizer: string;
	partnerID: Schema.Types.ObjectId;
	activeParticipants: IActiveParticipant[];
}

// Schema que corresponda a Interface
const raffleSchema = new Schema<IRaffle>(
	{
		rafflePrize: {
			type: String,
			required: true,
		},
		imagesRaffle: {
			type: [String],
			required: true,
		},
		raffleDate: {
			type: Date,
			required: true,
		},
		raffleCost: {
			type: Number,
			required: true,
		},
		raffleDescription: {
			type: String,
			required: true,
		},
		raffleRules: {
			type: String,
			required: true,
		},
		raffleOrganizer: {
			type: String,
			required: true,
		},
		minNumberParticipants: {
			type: Number,
			required: true,
		},
		partnerID: {
			type: Schema.Types.ObjectId,
			ref: "PartnerModel",
		},
		activeParticipants: [
			{
				customerID: {
					type: String,
					ref: "CustomerModel",
					required: true,
				},
				customerName: {
					type: String,
					required: true,
				},
				ticket: {
					type: String,
					required: true,
				},
			},
		],
	},

	{ timestamps: true }
);

const RaffleModel = mainDB.model<IRaffle>("Raffle", raffleSchema);

export { RaffleModel };
