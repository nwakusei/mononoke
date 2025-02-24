import { Request, Response } from "express";
import { OrderModel } from "../models/OrderModel.js";
import { ProductModel } from "../models/ProductModel.js";
import mongoose, { isValidObjectId } from "mongoose";
import axios, { AxiosRequestConfig } from "axios";

// Middlewares
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import { PartnerModel } from "../models/PartnerModel.js";

class ReviewController {
	static async createReview(req: Request, res: Response) {
		const { id } = req.params;

		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "ID inválido!" });
			return;
		}

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!customer) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		try {
			const order = await OrderModel.findById(id);

			if (!order) {
				res.status(422).json({ message: "O pedido não existe!" });
				return;
			}

			if (order.customerID.toString() !== customer._id.toString()) {
				res.status(422).json({
					message: "O pedido não pertence a esse Customer!",
				});
				return;
			}

			if (order.statusShipping !== "Entregue") {
				res.status(422).json({
					message:
						"Não é possível avaliar, pois o pedido ainda está em andamento!",
				});
				return;
			}

			if (order?.statusOrder === "Concluído") {
				res.status(422).json({
					message: "Pedido já concluído, não é possível avaliar!",
				});
				return;
			}

			const productIDs = order.itemsList.map((item) => item.productID);

			const products = await ProductModel.find({
				_id: { $in: productIDs },
			});

			if (!products || products.length === 0) {
				res.status(422).json({ message: "Produtos não encontrados" });
				return;
			}

			// Define a interface para a estrutura de um objeto review
			interface IReview {
				orderID: mongoose.Types.ObjectId;
				customerName: string;
				reviewRating: number;
				reviewDescription: string;
			}

			// Validação comentada para realizar testes, ativar novamente no final
			// // Verificar se já existe uma avaliação do mesmo comprador para o pedido
			// const existingReview = products.some((product) =>
			// 	product.reviews.some(
			// 		(review: any) =>
			// 			(review as IReview).orderID?.toString() ===
			// 				order._id.toString() &&
			// 			(review as IReview).customerName === order.customerName
			// 	)
			// );

			// if (existingReview) {
			// 	res.status(422).json({
			// 		message: "Você já avaliou este pedido!",
			// 	});
			// 	return;
			// }

			const { reviewRating, reviewDescription } = req.body;

			// Upload de imagens
			const imagesReview = req.files as Express.Multer.File[];

			if (!reviewRating) {
				res.status(422).json({ message: "A nota é obrigatória!" });
				return;
			}

			if (reviewRating < 0 || reviewRating > 5) {
				res.status(422).json({
					message: "Nota inválida, o valor precisa ser entre 0 e 5!",
				});
				return;
			}

			// if (!reviewDescription) {
			// 	res.status(422).json({ message: "A descrição é obrigatória!" });
			// 	return;
			// }

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
				reviewRating: parseFloat(reviewRating),
				imagesReview: imagePaths,
				reviewDescription: reviewDescription,
				date: new Date(),
			};

			// Adicionar o novo review ao array de reviews do produto
			products.forEach((product) => product.reviews.push(newReview));

			// Calcular o novo rating ponderado
			products.forEach((product) => {
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
			});

			// Atualizar a quantidade vendida de cada produto
			for (const item of order.itemsList) {
				const product = products.find(
					(p) => p._id.toString() === item.productID.toString()
				);
				if (product) {
					product.productsSold += item.productQuantity;
				}
			}

			// Salvar os produtos no banco de dados
			await Promise.all(
				products.map((product) => {
					product.save();
				})
			);

			// Atualizar a quantidade vendida da Loja Parceira
			const partnerID = order?.partnerID;

			const partner = await PartnerModel.findById(partnerID);

			if (!partner) {
				res.status(422).json({ message: "Partner não encontrado" });
				return;
			}

			// Buscar todos os produtos do parceiro
			const partnerProducts = await ProductModel.find({ partnerID });

			// Calcular a média de todos os produtos do parceiro
			let totalPartnerRating = 0;
			let totalReviewsCount = 0;
			let totalProductsSold = 0;

			partnerProducts.forEach((product) => {
				totalPartnerRating += product.rating * product.reviews.length;
				totalReviewsCount += product.reviews.length;
				totalProductsSold += product.productsSold;
			});

			if (totalReviewsCount > 0) {
				partner.rating = totalPartnerRating / totalReviewsCount;
			} else {
				partner.rating = 0;
			}

			// Atualizar productsSold do partner
			partner.productsSold = totalProductsSold;

			// Atualizar Quantidade de Avaliações do partner
			partner.numberOfReviews += 1;

			order.statusOrder = "Concluído";

			// VERICAÇÃO DE QUANTIDADE DE PRODUTOS VENDIDOS PELA LOJA, E ATUALIZAÇÃO DO TIPO DE SELO
			if (partner.productsSold >= 18) {
				partner.verifiedBadge = "Esmeralda";
			} else if (partner.productsSold >= 15) {
				partner.verifiedBadge = "Blue";
			}

			await order.save();

			await partner.save();

			// Requisição teste para ativar outra requisição dentro da API
			const transactionRequestConfig: AxiosRequestConfig = {
				method: "post",
				url: "http://localhost:5000/otakupay/realease-values",
				headers: {
					"Content-Type": "application/json",
					// Authorization: `Bearer ${accessToken}`, // Se precisar de um token de autenticação
				},
				// data: {
				// 	// Dados que precisam ser enviados para a transação
				// 	orderId: order._id,
				// 	customerId: customer._id,
				// 	reviewId: newReview.orderID, // ou outro dado necessário
				// },
				// httpsAgent: new https.Agent({
				// 	cert: "caminho/do/seu/certificado.pem",
				// 	key: "caminho/da/sua/chave.key",
				// }),
			};

			const transactionResponse = await axios(transactionRequestConfig);

			if (transactionResponse.status !== 200) {
				console.log(
					"Erro ao processar a transação, status:",
					transactionResponse.status
				);
				res.status(500).json({
					message: "Erro ao processar a transação!",
				});
				return;
			} else {
				res.status(200).json({
					message: "Avaliação enviada com sucesso!",
					newReview,
				});
			}
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: "Erro ao tentar enviar a avaliação!",
			});
		}
	}
}

export default ReviewController;
