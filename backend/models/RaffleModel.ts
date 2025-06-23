import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

interface IRegisteredTickets {
	customerID: string;
	customerNickname: string;
	customerName: string;
	customerProfileImage: string;
	ticketNumber: string;
}

// interface IAddress {
// 	street?: string;
// 	complement?: string;
// 	neighborhood?: string;
// 	city?: string;
// 	state?: string;
// 	postalCode?: string;
// }

// Interface para a estrutura de um vencedor
interface IWinner {
	customerID: string;
	customerNickname: string;
	customerName: string;
	customerProfileImage: string;
	ticketNumber: string;
	address: {};
}

// Interface para a estrutura de um objeto de revisão
interface IRaffle {
	rafflePrize: string;
	raffleStatus: string; // "active", "completed", "canceled"
	imagesRaffle: string[];
	raffleDate: Date;
	raffleCost: number;
	raffleAccumulatedValue: string;
	rafflePartnerCommission: string;
	raffleDescription: string;
	raffleRules: string;
	minNumberParticipants: Number;
	raffleOrganizer: string;
	raffleOrganizerNickname: string;
	adultRaffle: boolean;
	partnerID: Schema.Types.ObjectId;
	registeredTickets: IRegisteredTickets[];
	winner: IWinner;
	statusShipping: string; // "pending", "shipped", "delivered", "canceled"
	logisticOperator: string; // Operadora logística responsável pelo envi
	trackingCode: string; // Código de rastreamento do envio
	markedDeliveredBy: string;
	markedDeliveredAt: Date;
}

// Schema que corresponda a Interface
const raffleSchema = new Schema<IRaffle>(
	{
		rafflePrize: {
			type: String,
			required: true,
		},
		raffleStatus: {
			type: String,
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
		raffleAccumulatedValue: {
			type: String,
			required: true,
		},
		rafflePartnerCommission: {
			type: String,
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
		raffleOrganizerNickname: {
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
				customerNickname: {
					type: String,
					required: true,
				},
				customerName: {
					type: String,
					required: true,
				},
				customerProfileImage: {
					type: String,
					require: true,
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
			customerNickname: {
				type: String,
			},
			customerName: {
				type: String,
			},
			customerProfileImage: {
				type: String,
			},
			ticketNumber: {
				type: String,
			},
			address: {
				type: {},
			},
		},
		statusShipping: {
			type: String,
		},
		logisticOperator: {
			type: String,
		},
		trackingCode: {
			type: String,
		},
		markedDeliveredBy: {
			type: String,
		},
		markedDeliveredAt: {
			type: Date,
		},
	},
	{ timestamps: true }
);

const RaffleModel = mainDB.model<IRaffle>("Raffle", raffleSchema);

export { RaffleModel };
