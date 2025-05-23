import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

interface IFollowingStores {
	storeID: string;
	storeName: string;
}

// Interface tipando os dados que irão no Banco de Dados.
interface ICustomer {
	accountStatus: string;
	accountType: string;
	profileImage: string;
	name: string;
	nickname: string;
	email: string;
	password: string;
	cpf: string;
	address: [{}];
	viewAdultContent: boolean;
	followingStores: IFollowingStores[];
	newsletters: boolean;
	otakupayID: string;

	resetPasswordToken?: string;
	resetPasswordExpires?: Date;
}

// Schema que corresponda a Interface.
const customerSchema = new Schema<ICustomer>(
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
		},
		name: {
			type: String,
			required: true,
		},
		nickname: {
			type: String,
			unique: true,
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
		cpf: {
			type: String,
			unique: true,
		},
		address: {
			type: [{}],
		},
		viewAdultContent: {
			type: Boolean,
		},
		followingStores: {
			type: [{}],
		},
		newsletters: {
			type: Boolean,
		},
		otakupayID: {
			type: String,
			required: true,
			ref: "OtakupayModel",
		},

		resetPasswordToken: {
			type: String,
			default: null,
		},
		resetPasswordExpires: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

// Criação de um Model com conexão ao banco de dados
const CustomerModel = mainDB.model<ICustomer>("Customer", customerSchema);

// Esperando a resposta da conexão entre Mongoose e MongoDB.
// async function run() {
// 	await mongoose;
// }

// run().catch((err) => console.log(err));

export { CustomerModel };
