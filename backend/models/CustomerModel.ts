import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

// Interface tipando os dados que irão no Banco de Dados.
interface ICustomer {
	profileImage: string;
	accountType: string;
	name: string;
	email: string;
	password: string;
	cpf: number;
	address: [{}];
	accountStatus: string;
	otakupayID: mongoose.Schema.Types.ObjectId;
}

// Schema que corresponda a Interface.
const customerSchema = new Schema<ICustomer>(
	{
		profileImage: {
			type: String,
		},
		accountType: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
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
			type: Number,
		},
		address: {
			type: [{}],
		},
		otakupayID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "OtakupayModel",
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
