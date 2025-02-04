import mainDB from "../db/mainconn";
import { Schema } from "mongoose";

interface IModalityOptions {
	id: string;
	name: string;
	price: string;
	weight: {
		min: number;
		max: number;
	};
	delivery_time: number;
	company: {
		id: number;
		name: string;
		picture: string;
	};
}

interface IShipping {
	shippingOperator: string;
	modalityOptions: IModalityOptions[];
}

const shippingSchema = new Schema<IShipping>(
	{
		shippingOperator: {
			type: String,
		},
		modalityOptions: {
			type: [{}],
		},
	},
	{ timestamps: true }
);

const ShippingModel = mainDB.model<IShipping>("Shipping", shippingSchema);

export { ShippingModel };
