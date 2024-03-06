import otakupayDB from "../db/otakupayconn.js";
import { Schema, model } from "mongoose";

// Interface tipando os dados que irão no Banco de Dados.
interface IInterPixCustomer {
	txid: string;
	devedor: {
		cpf: string;
		nome: string;
	};
	pixCopiaECola: string;
	valor: {
		original: string;
		modalidadeAlteracao: number;
	};
	status: string;
	calendario: {
		criacao: string;
		expiracao: number;
	};
	infoAdicionais: [
		{
			nome: string;
			valor: string;
		}
	];
	userID: string;
}

// Schema que corresponda a Interface.
const InterPixSchema = new Schema<IInterPixCustomer>(
	{
		txid: {
			type: String,
			required: true,
		},
		devedor: {
			cpf: {
				type: String,
				required: true,
			},
			nome: {
				type: String,
				required: true,
			},
		},
		pixCopiaECola: {
			type: String,
			required: true,
		},
		valor: {
			original: {
				type: String,
				required: true,
			},
			modalidadeAlteracao: {
				type: Number,
				required: true,
			},
		},
		status: {
			type: String,
			required: true,
		},
		calendario: {
			criacao: {
				type: String,
			},
			expiracao: {
				type: Number,
				required: true,
			},
		},
		infoAdicionais: [
			{
				nome: {
					type: String,
				},
				valor: {
					type: String,
				},
			},
		],
		userID: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

// Criação de um Model com conexão ao banco de dados
const InterPixModel = otakupayDB.model<IInterPixCustomer>(
	"InterPix",
	InterPixSchema,
	"interpixhistory"
);

// Esperando a resposta da conexão entre Mongoose e MongoDB.

export { InterPixModel };
