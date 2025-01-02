import mainDB from "../db/mainconn.js";
import { Schema, model } from "mongoose";

// Interface para a estrutura das variações do produto
interface IVariationOption {
	imageUrl?: string; // URL da imagem associada (opcional)
	name: string; // Nome da opção (ex: "rosa")
	originalPrice: number;
	promotionalPrice: number;
	stock: number;
}

interface IProductVariation {
	title: string; // Título da variação (ex: "Cor")
	options: IVariationOption[]; // Opções para essa variação (ex: [{ name: "rosa", imageUrl: "url_da_imagem" }, { name: "preto", imageUrl: "url_da_imagem" }])
}

// Interface para a estrutura de um objeto de revisão
interface IProduct {
	productTitle: string;
	slugTitle: string;
	imagesProduct: string[];
	description: string;
	productVariations: IProductVariation[];
	originalPrice: number;
	promotionalPrice: number;
	stock: number;
	category: string;
	weight: number;
	length: number;
	width: number;
	height: number;
	condition: string;
	preOrder: boolean;
	daysShipping: number;
	freeShipping: boolean;
	freeShippingRegion: string;
	adultProduct: boolean;
	productsSold: number;
	rating: number;
	reviews: [Object];
	partnerID: Schema.Types.ObjectId;
}

// Schema que corresponda a Interface
const productSchema = new Schema<IProduct>(
	{
		productTitle: {
			type: String,
		},
		slugTitle: {
			type: String,
		},
		imagesProduct: {
			type: [String],
		},
		description: {
			type: String,
		},
		productVariations: {
			type: [
				{
					title: {
						type: String,
						// required: true, // Título da variação é obrigatório
					},
					options: [
						{
							imageUrl: {
								type: String,
								// required: false, // URL da imagem é opcional
							},
							name: {
								type: String,
								// required: true, // Nome da opção é obrigatório
							},
							originalPrice: {
								type: Number,
								// required: false,
							},
							promotionalPrice: {
								type: Number,
								// 	required: true,
							},
							stock: {
								type: Number,
								// required: false,
							},
						},
					],
				},
			],
			default: [], // Valor padrão como array vazio
		},
		originalPrice: {
			type: Number,
		},
		promotionalPrice: {
			type: Number,
		},
		stock: {
			type: Number,
		},
		category: {
			type: String,
		},
		weight: {
			type: Number,
		},
		length: {
			type: Number,
		},
		width: {
			type: Number,
		},
		height: {
			type: Number,
		},
		condition: {
			type: String,
		},
		preOrder: {
			type: Boolean,
		},
		daysShipping: {
			type: Number,
		},
		freeShipping: {
			type: Boolean,
		},
		freeShippingRegion: {
			type: String,
		},
		adultProduct: {
			type: Boolean,
		},
		productsSold: {
			type: Number,
		},
		rating: {
			type: Number,
		},
		reviews: {
			type: [Object],
		},
		partnerID: {
			type: Schema.Types.ObjectId,
			ref: "PartnerModel",
		},
	},
	{ timestamps: true }
);

const ProductModel = mainDB.model<IProduct>("Product", productSchema);

export { ProductModel };
