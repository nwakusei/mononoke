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
	credential?: string;
}

// Interface tipando os dados que irão no Banco de Dados.
interface IPartner {
	profileImage: string;
	logoImage: string;
	accountType: string;
	name: string;
	nickname: string;
	email: string;
	password: string;
	cpfCnpj: number;
	description: string;
	address: IAddress[];
	shippingConfiguration: IShippingConfig[];
	cashback: number;
	followers: number;
	rating: number;
	productsSold: number;
	accountStatus: string;
	otakupayID: mongoose.Schema.Types.ObjectId;
}

// Schema que corresponda a Interface.
const partnerSchema = new Schema<IPartner>(
	{
		profileImage: {
			type: String,
		},
		logoImage: {
			type: String,
		},
		accountType: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			requered: true,
		},
		nickname: {
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
			required: true,
		},
		followers: {
			type: Number,
		},
		rating: {
			type: Number,
		},
		productsSold: {
			type: Number,
		},
		accountStatus: {
			type: String,
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
