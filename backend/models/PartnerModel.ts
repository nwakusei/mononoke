import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

interface IAddress {
	logradouro?: string;
	compl?: string;
	bairro?: string;
	city?: string;
	uf?: string;
	cep?: string;
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
	email: string;
	password: string;
	cnpj: number;
	cpf: number;
	description: string;
	address: IAddress[];
	site: string;
	shippingConfiguration: IShippingConfig[];
	cashback: number;
	followers: number;
	rating: number;
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
		cnpj: {
			type: Number,
		},
		cpf: {
			type: Number,
		},
		description: {
			type: String,
		},
		address: {
			type: [{}],
		},
		site: {
			type: String,
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
