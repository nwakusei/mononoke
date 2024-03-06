import otakupayDB from "../db/otakupayconn.js";
import { Schema, model } from "mongoose";

// Interface tipando os dados que irão no Banco de Dados.
interface IOtakuPayCustomer {
	accountType: string;
	name: string;
	email: string;
	password: string;
	image: string;
	balanceAvailable: string;
	balancePending: string;
	otakuPointsAvailable: string;
	otakuPointsPending: string;
	cashback: number;
}

// Schema que corresponda a Interface.
const OtakupaySchema = new Schema<IOtakuPayCustomer>(
	{
		accountType: {
			type: String,
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
		image: {
			type: String,
		},
		balanceAvailable: {
			type: String,
		},
		balancePending: {
			type: String,
		},
		otakuPointsAvailable: {
			type: String,
		},
		otakuPointsPending: {
			type: String,
		},
		cashback: {
			type: Number,
		},
	},

	{ timestamps: true }
);

// Criação de um Model com conexão ao banco de dados
const OtakupayModel = otakupayDB.model<IOtakuPayCustomer>(
	"Otakupay",
	OtakupaySchema,
	"users"
);

// Esperando a resposta da conexão entre Mongoose e MongoDB.
// async function run() {
// 	await mongoose;
// }

// run().catch((err) => console.log(err));

export { OtakupayModel };
