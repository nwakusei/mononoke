import { Request, Response } from "express";
import { OrderModel } from "../models/OrderModel.js";
import { ProductModel } from "../models/ProductModel.js";
import mongoose, { isValidObjectId } from "mongoose";

// Middlewares
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

class ReviewController {
	// Lógica em desenvolvimento
	static async createReview(req: Request, res: Response) {
		// Esse é o ID do Pedido
		const { id } = req.params;

		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "ID inválido!" });
			return;
		}

		const order = await OrderModel.findById({ _id: id });

		if (!order) {
			res.status(422).json({ message: "O pedido não existe!" });
			return;
		}

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!customer) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		if (order.customerID.toString() !== customer._id.toString()) {
			res.status(422).json({
				message: "O pedido não pertece a esse Customer!",
			});
			return;
		}

		if (order.statusOrder !== "Recebido") {
			res.status(422).json({
				message:
					"Não é possível enviar a avaliação pois o pedido ainda está em andamento!",
			});
			return;
		}

		try {
			const productID = order.productID;

			const product = await ProductModel.findById(productID);

			if (!product) {
				res.status(422).json({ message: "Produto não encontrado" });
				return;
			}

			// Define a interface para a estrutura de um objeto review
			interface IReview {
				orderID: mongoose.Types.ObjectId;
				customerName: string;
				reviewRating: number;
				reviewDescription: string;
			}

			// Verificar se já existe uma avaliação do mesmo comprador para o pedido
			const existingReview = product.reviews.find(
				(review: any) =>
					(review as IReview).orderID?.toString() ===
						order._id.toString() &&
					(review as IReview).customerName === order.customerName
			);

			if (existingReview) {
				res.status(422).json({
					message: "Você já avaliou este pedido!",
				});
				return;
			}

			const { reviewRating, reviewDescription } = req.body;

			// Upload de imagens
			const imagesReview = req.files as Express.Multer.File[];

			if (!reviewRating) {
				res.status(422).json({ message: "A nota é obrigatória!" });
				return;
			}

			if (!reviewDescription) {
				res.status(422).json({ message: "A descrição é obrigatória!" });
				return;
			}

			// Criar um array para armazenar os caminhos das imagens
			const imagePaths: string[] = [];

			if (imagesReview && imagesReview.length > 0) {
				imagesReview.forEach((imageReview) => {
					console.log(imageReview);

					let imagePath = "";

					if (imageReview) {
						if ("key" in imageReview) {
							if (typeof imageReview.key === "string") {
								imagePath = imageReview.key;
							}
						} else {
							if (typeof imageReview.filename === "string") {
								imagePath = imageReview.filename;
							}
						}
					}

					if (imagePath) {
						imagePaths.push(imagePath);
					}
				});
			}

			const newReview = {
				orderID: order._id,
				customerName: order.customerName,
				reviewRating: reviewRating,
				imagesReview: imagePaths,
				reviewDescription: reviewDescription,
			};

			// Adicionar o novo review ao array de reviews do produto
			product.reviews.push(newReview);

			// Calcular o novo rating ponderado
			let totalRating = 0;
			let numberOfReviews = 0;

			product.reviews.forEach((review: any) => {
				if (!isNaN(review.reviewRating)) {
					// Limitar a avaliação a um máximo de 5
					const boundedRating = Math.min(review.reviewRating, 5);
					totalRating += boundedRating;
					numberOfReviews++;
				}
			});

			if (numberOfReviews > 0) {
				const newRating = totalRating / numberOfReviews;
				// Se a média for superior a 5, limitá-la a 5
				product.rating = Math.min(newRating, 5);
			} else {
				// Se não houver avaliações válidas, defina o rating como 0
				product.rating = 0;
			}

			// Salvar o produto no banco de dados
			await product.save();

			res.status(200).json({
				message: "Avaliação criada com sucesso!",
				newReview,
			});
		} catch (error) {
			console.log(error);
		}
	}
}

export default ReviewController;
