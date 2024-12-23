import { Request, Response } from "express";
import { ProductModel } from "../models/ProductModel.js";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Multer } from "multer";
import mongoose, { ObjectId, isValidObjectId } from "mongoose";

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

class ProductController {
	static async searchProductsInOtamart(req: Request, res: Response) {
		const { productTitle } = req.body;

		if (!productTitle) {
			res.status(422).json({
				message: "O nome do produto é obrigatório!",
			});
			return;
		}

		try {
			const products = await ProductModel.find({
				productTitle: { $regex: productTitle, $options: "i" },
			});

			if (products.length > 0) {
				res.status(200).json({ products: products });
			} else {
				res.status(404).json({ message: "Produto não encontrado!" });
			}
		} catch (error) {
			console.log(error);
		}
	}

	static async searchProductsInStore(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(422).json({ message: "ID da Loja não encontrado!" });
			return;
		}

		const { productTitle } = req.body;

		if (!productTitle) {
			res.status(422).json({
				message: "O nome do produto é obrigatório!",
			});
			return;
		}

		try {
			const products = await ProductModel.find({
				partnerID: id,
				productTitle: { $regex: productTitle, $options: "i" },
			});

			if (products.length > 0) {
				res.status(200).json({ products: products });
			} else {
				res.status(404).json({ message: "Produto não encontrado!" });
			}
		} catch (error) {
			console.log(error);
		}
	}

	static async searchProductByCategory(req: Request, res: Response) {
		const { category } = req.body;

		if (!category) {
			res.status(422).json({
				message: "A categoria do produto é obrigatória!",
			});
			return;
		}

		try {
			const products = await ProductModel.find({
				category: category,
			}).sort("-createdAt");

			res.status(200).json({ products: products });
		} catch (error) {
			console.log(error);
		}
	}
}

export default ProductController;
