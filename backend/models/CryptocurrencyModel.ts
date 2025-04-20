import otakupayDB from "../db/otakupayconn";
import { Schema, model } from "mongoose";

interface ILiquidityPool {
	USD: number;
	CRYPTOCURRENCY: number;
}

interface ICryptocurrency {
	devID: string;
	devBalance: number;
	cryptocurrencyImage: string;
	cryptocurrencyName: string;
	cryptocurrencySymbol: string;
	cryptocurrencyValueInUSD: number;
	maxSupply: number;
	mintedCryptocurrency: number;
	burnedCryptocurrency: number;
	totalSupply: number;
	circulatingSupply: number;
	marketCap: number;
	volume: number;
	volMktCap: number;
	liquidityPool: ILiquidityPool;
}

const CryptcurrencySchema = new Schema<ICryptocurrency>(
	{
		devID: {
			type: String,
		},
		devBalance: {
			type: Number,
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
		cryptocurrencyValueInUSD: {
			type: Number,
		},
		maxSupply: {
			type: Number,
		},
		mintedCryptocurrency: {
			type: Number,
		},
		burnedCryptocurrency: {
			type: Number,
		},
		totalSupply: {
			type: Number,
		},
		circulatingSupply: {
			type: Number,
		},
		marketCap: {
			type: Number,
		},
		volume: {
			type: Number,
		},
		volMktCap: {
			type: Number,
		},
		liquidityPool: {
			USD: { type: Number, required: true, default: 0 },
			CRYPTOCURRENCY: { type: Number, required: true, default: 0 },
		},
	},
	{ timestamps: true }
);

const CryptcurrencyModel = otakupayDB.model<ICryptocurrency>(
	"Cryptocurrency",
	CryptcurrencySchema
);

export { CryptcurrencyModel };
