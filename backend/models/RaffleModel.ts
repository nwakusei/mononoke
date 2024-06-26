import mainDB from "../db/mainconn.js";
import { Schema, model } from "mongoose";

// Interface para a estrutura de um objeto de revisão
interface IRaffle {
	rafflePrize: string;
	raffleDate: Date;
	raffleCost: number;
	raffleOrganizer: string;
	partnerID: Schema.Types.ObjectId;
}

// Schema que corresponda a Interface
const raffleSchema = new Schema<IRaffle>(
	{
		rafflePrize: {
			type: String,
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
		raffleOrganizer: {
			type: String,
			required: true,
		},
		partnerID: {
			type: Schema.Types.ObjectId,
			ref: "PartnerModel",
		},
	},

	{ timestamps: true }
);

const RaffleModel = mainDB.model<IRaffle>("Raffle", raffleSchema);

export { RaffleModel };
