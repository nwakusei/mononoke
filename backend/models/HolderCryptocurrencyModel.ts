import otakupayDB from "../db/otakupayconn";
import mongoose, { Schema, model } from "mongoose";

interface IHolder {
	cryptoCurrencyID: string;
	customerOtakupayID: string;
	amountOfCryptocurrency: number;
}

const HolderSchema = new Schema<IHolder>(
	{
		cryptoCurrencyID: {
			type: String,
		},
		customerOtakupayID: {
			type: String,
		},
		amountOfCryptocurrency: {
			type: Number,
		},
	},
	{ timestamps: true }
);

const HolderModel = otakupayDB.model<IHolder>("Holder", HolderSchema);

export { HolderModel };
