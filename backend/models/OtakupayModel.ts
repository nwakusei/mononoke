import otakupayDB from "../db/otakupayconn.js";
import { Schema, model } from "mongoose";

interface ICryptocurrency {
	cryptocurrencyID: string;
	cryptocurrencyImage: string;
	cryptocurrencyName: string;
	cryptocurrencySymbol: string;
	cryptocurrencyBalanceAvailable: number;
}

// Interface tipando os dados que irão no Banco de Dados.
interface IOtakuPayCustomer {
	accountStatus: string;
	accountType: string;
	name: string;
	email: string;
	password: string;
	image: string;
	balanceAvailable: string;
	balancePending: string;
	otakuPointsAvailable: string;
	otakuPointsPending: string;
	cryptocurrencies: ICryptocurrency[];
	cashback: String;
}

// Schema que corresponda a Interface.
const OtakupaySchema = new Schema<IOtakuPayCustomer>(
	{
		accountStatus: {
			type: String,
			required: false,
		},
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
			select: false,
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
		cryptocurrencies: [
			{
				cryptocurrencyID: {
					type: String,
				},
				cryptocurrencyImage: {
					type: String,
				},
				cryptocurrencyName: {
					type: String,
				},
				cryptocurrencySymbol: {
					type: String,
				},
				cryptocurrencyBalanceAvailable: {
					type: Number, // Aqui corrigido para Number, já que na interface ICryptocurrency era Number
				},
			},
		], // Definição correta de um array de objetos
		cashback: {
			type: String,
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
