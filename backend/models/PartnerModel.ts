import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

interface IAddress {
	street?: string; // logradouro
	complement?: string; // complemento
	neighborhood?: string; // bairro
	city?: string; // cidade
	state?: string; // uf
	postalCode?: string; // cep
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
	cashback: number;
	followers: number;
	rating: number;
	totalProducts: number;
	productsSold: number;
	viewAdultContent: boolean;
	otakupayID: mongoose.Schema.Types.ObjectId;
}

// Schema que corresponda a Interface.
const partnerSchema = new Schema<IPartner>(
	{
		accountStatus: {
			type: String,
			required: false,
		},
		accountType: {
			type: String,
		},
		profileImage: {
			type: String,
		},
		logoImage: {
			type: String,
		},

		name: {
			type: String,
			requered: true,
		},
		nickname: {
			type: String,
			required: false,
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
		},
		description: {
			type: String,
		},
		address: {
			type: [{}],
		},
		shippingConfiguration: {
			type: [{}],
		},
		cashback: {
			type: Number,
			required: false,
		},
		followers: {
			type: Number,
		},
		rating: {
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
			type: mongoose.Schema.Types.ObjectId,
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
