import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

interface IRegisteredTickets {
	customerID: string;
	customerName: string;
	ticketNumber: string;
}

// Interface para a estrutura de um vencedor
interface IWinner {
	customerID: string;
	customerName: string;
	ticketNumber: string;
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
	adultRaffle: boolean;
	partnerID: Schema.Types.ObjectId;
	registeredTickets: IRegisteredTickets[];
	winner: IWinner;
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
		adultRaffle: {
			type: Boolean,
			required: true,
		},
		minNumberParticipants: {
			type: Number,
			required: true,
		},
		partnerID: {
			type: Schema.Types.ObjectId,
			ref: "PartnerModel",
			required: true,
		},
		registeredTickets: [
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
				ticketNumber: {
					type: String,
					required: true,
				},
			},
		],
		winner: {
			customerID: {
				type: String,
				ref: "CustomerModel",
			},
			customerName: {
				type: String,
			},
			ticketNumber: {
				type: String, // Deve corresponder ao campo ticketNumber da interface IWinner
			},
		},
	},
	{ timestamps: true }
);

const RaffleModel = mainDB.model<IRaffle>("Raffle", raffleSchema);

export { RaffleModel };
