import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

interface IAddress {
	street?: string;
	complement?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
	postalCode?: string;
}

interface IShippingConfig {
	shippingOperator?: string;
	modalityOptions?: string[];
	credential?: string;
}

// Interface tipando os dados que irão no Banco de Dados.
interface IPartner {
	accountStatus: string;
	accountType: string;
	profileImage: string;
	logoImage: string;
	name: string;
	nickname: string;
	verifiedBadge: string;
	email: string;
	password: string;
	cpfCnpj: number;
	description: string;
	address: IAddress[];
	shippingConfiguration: IShippingConfig[];
	cashback: string;
	followers: number;
	rating: number;
	numberOfReviews: number;
	totalProducts: number;
	productsSold: number;
	viewAdultContent: boolean;
	otakupayID: string;
}

// Schema que corresponda a Interface.
const partnerSchema = new Schema<IPartner>(
	{
		accountStatus: {
			type: String,
			required: true,
		},
		accountType: {
			type: String,
			required: true,
		},
		profileImage: {
			type: String,
			required: false,
		},
		logoImage: {
			type: String,
			required: false,
		},
		name: {
			type: String,
			requered: true,
		},
		nickname: {
			type: String,
			unique: true,
		},
		verifiedBadge: {
			type: String,
			required: false,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
			min: 6,
			max: 64,
		},
		cpfCnpj: {
			type: Number,
			required: false,
		},
		description: {
			type: String,
			required: false,
		},
		address: {
			type: [{}],
			required: false,
		},
		shippingConfiguration: {
			type: [{}],
			required: false,
		},
		cashback: {
			type: String,
			required: true,
		},
		followers: {
			type: Number,
		},
		rating: {
			type: Number,
		},
		numberOfReviews: {
			type: Number,
		},
		totalProducts: {
			type: Number,
		},
		productsSold: {
			type: Number,
		},
		viewAdultContent: {
			type: Boolean,
		},
		otakupayID: {
			type: String,
			ref: "OtakupayModel",
		},
	},
	{ timestamps: true }
);

// Criação de um Model com conexão ao banco de dados
const PartnerModel = mainDB.model<IPartner>("Partner", partnerSchema);

// Esperando a resposta da conexão entre Mongoose e MongoDB.
// async function run() {
// 	await mongoose;
// }

// run().catch((err) => console.log(err));

export { PartnerModel };
