import { Request, Response } from "express";
import { ProductModel } from "../models/ProductModel.js";
import { PartnerModel } from "../models/PartnerModel.js";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Multer } from "multer";
import mongoose, { ObjectId, isValidObjectId } from "mongoose";

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

class ProductController {
	static async create(req: Request, res: Response) {
		const {
			productName,
			description,
			originalPrice,
			promocionalPrice,
			stock,
			category,
			weight,
			length,
			width,
			height,
			condition,
			preOrder,
			daysShipping,
			freeShipping,
			freeShippingRegion,
		} = req.body;

		// Upload de imagens
		const imagesProduct = req.files as Express.Multer.File[];

		// Validações
		if (!productName) {
			res.status(422).json({
				message: "O nome do produto é obrigatório!",
			});
			return;
		}

		if (!description) {
			res.status(422).json({
				message: "A descrição do produto é obrigatória!",
			});
			return;
		}

		if (!originalPrice) {
			res.status(422).json({
				message: "O preço do produto é obrigatório!",
			});
			return;
		}

		// if (!promocionalPrice) {
		// 	res.status(422).json({
		// 		message: "O título do produto é obrigatório!",
		// 	});
		// 	return;
		// }

		if (!stock) {
			res.status(422).json({
				message: "A quantidade de produtos em estoque é obrigatória!",
			});
			return;
		}

		if (!category) {
			res.status(422).json({
				message: "A categoria do produto é obrigatória!",
			});
			return;
		}

		if (!weight) {
			res.status(422).json({
				message: "O peso do produto é obrigatório!",
			});
			return;
		}

		if (!length) {
			res.status(422).json({
				message: "O comprimento do produto é obrigatório!",
			});
			return;
		}

		if (!width) {
			res.status(422).json({
				message: "A largura do produto é obrigatória!",
			});
			return;
		}

		if (!height) {
			res.status(422).json({
				message: "A altura do produto é obrigatória!",
			});
			return;
		}

		if (!condition) {
			res.status(422).json({
				message: "A condição do produto é obrigatória!",
			});
			return;
		}

		if (!preOrder) {
			res.status(422).json({
				message: "Informe se o produto é uma encomenda!",
			});
			return;
		}

		if (!daysShipping) {
			res.status(422).json({
				message: "Informe em quantos dias o produto será enviado!",
			});
			return;
		}

		if (!freeShipping) {
			res.status(422).json({
				message: "Informe se o produto possui frete grátis!",
			});
			return;
		}

		if (!imagesProduct || imagesProduct.length === 0) {
			// Validação de Imagem
			res.status(422).json({ message: "A imagem é obrigatória!" });
			return;
		}

		// Pegar o Administrador (Partner) que será o responsável pelo cadastro do Produto
		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(401).json({ message: "Usuário não encontrado" });
			return;
		}

		if (partner.accountType !== "partner") {
			res.status(422).json({
				message: "Você não tem permissão para cadastrar produtos!",
			});
			return;
		}

		// Criar um novo produto
		const product = new ProductModel({
			productName: productName,
			description: description,
			originalPrice: originalPrice,
			promocionalPrice: promocionalPrice || 0.0,
			stock: stock,
			category: category,
			weight: weight,
			length: length,
			width: width,
			height: height,
			condition: condition,
			preOrder: preOrder,
			daysShipping: daysShipping,
			freeShipping: freeShipping,
			freeShippingRegion: freeShippingRegion,
			imagesProduct: [],
			productsSold: 0,
			rating: 0,
			reviews: [],
			partnerID: partner._id,
		});

		// Percorrer o Array de imagens e adicionar cada uma a uma ao produto/anúncio que será criado
		imagesProduct.forEach((imageProduct: Express.Multer.File) => {
			console.log(imageProduct);
			let image = "";

			if (imageProduct) {
				if ("key" in imageProduct) {
					// Estamos usando o armazenamento na AWS S3
					if (typeof imageProduct.key === "string") {
						image = imageProduct.key;
					}
				} else {
					// Estamos usando o armazenamento em ambiente local (Desenvolvimento)
					if (typeof imageProduct.filename === "string") {
						image = imageProduct.filename;
					}
				}
			}

			// Adicionar a imagem ao produto/anúncio
			product.imagesProduct.push(image);
		});

		try {
			const newProduct = await product.save();

			res.status(201).json({
				message: "Produto cadastrado com sucesso!",
				newProduct,
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: "Erro ao cadastrar o produto!",
			});
			return;
		}
	}

	// Pegar todos os Produtos
	static async getAllProducts(req: Request, res: Response) {
		const products = await ProductModel.find().sort("-createdAt");

		res.status(200).json({ products: products });
	}

	static async getAllProductsPartner(req: Request, res: Response) {
		// Verificar o Administrador que cadastrou oss Produtos
		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(401).json({ message: "Usuário não encontrado" });
			return;
		}

		if (partner.accountType !== "partner") {
			res.status(422).json({
				message:
					"Você não possui autorização para visualizar essa página!",
			});
			return;
		}
		// Falta bloquear acesso de Customers

		try {
			const products = await ProductModel.find({
				partnerID: partner._id,
			}).sort("-createdAt");

			res.status(200).json({ products: products });
		} catch (error) {
			res.status(500).json({ error: "Erro ao carregar os Produtos" });
			return;
		}
	}

	static async getProductById(req: Request, res: Response) {
		const { id } = req.params;

		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "O ID do produto é inválido" });
			return;
		}

		// Verificar se o Produto existe
		const product = await ProductModel.findOne({ _id: id });

		if (!product) {
			res.status(404).json({ message: "Produto não encontrado" });
			return;
		}

		res.status(200).json({ product: product });
	}

	// Remover um produto
	static async removeProductById(req: Request, res: Response) {
		const { id } = req.params;

		// Verificar se o ID é válido
		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "ID inválido!" });
			return;
		}

		// Verificar se o Mangá Existe
		const product = await ProductModel.findOne({ _id: id });

		if (!product) {
			res.status(404).json({ message: "Produto não encontrado!" });
			return;
		}

		// Verificar o Administrador que cadastrou o Produto
		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(401).json({ message: "Usuário não encontrado" });
			return;
		}

		if (product.partnerID as mongoose.Schema.Types.ObjectId) {
			res.status(401).json({
				message: "Acesso não autorizado para esta solicitação!",
			});
			return;
		}

		console.log(product.partnerID as mongoose.Schema.Types.ObjectId);

		await ProductModel.findByIdAndRemove(id);

		res.status(200).json({ message: "Produto removido com sucesso!" });
	}

	// static async updateProduct(req: Request, res: Response) {
	// 	const { id } = req.params;
	// 	const {
	// 		productName,
	// 		description,
	// 		price,
	// 		discountPrice,
	// 		stock,
	// 		category,
	// 		weight,
	// 		dimensions,
	// 		condition,
	// 		preOrder,
	// 		deadline,
	// 	} = req.body;

	// 	// const images = req.files;

	// 	const updateData: {
	// 		productName?: String;
	// 		description?: String;
	// 		price?: String;
	// 		discountPrice?: String;
	// 		stock?: String;
	// 		category?: String;
	// 		weight?: string[];
	//      dimensions;
	// 		condition;
	// 		preOrder;
	// 		deadline;
	// 	} = {};

	// 	// Verificar se o Produto Existe
	// 	const product = await ProductModel.findOne({ _id: id });

	// 	if (!product) {
	// 		res.status(404).json({ message: "Produto não encontrado!" });
	// 		return;
	// 	}

	// 	// Verificar o Administrador é o mesmo cadastrou o Produto
	// 	const token: any = getToken(req);
	// 	const user = await getUserByToken(token);

	// 	if (!user) {
	// 		res.status(401).json({ message: "Usuário não encontrado" });
	// 		return;
	// 	}

	// 	if (
	// 		(product.user as { _id: ObjectId })._id.toString() !==
	// 		user._id.toString()
	// 	) {
	// 		res.status(401).json({
	// 			message: "Acesso não autorizado para esta solicitação.",
	// 		});
	// 		return;
	// 	}

	// 	// Validações
	// 	if (!title) {
	// 		res.status(422).json({ message: "O título é obrigatório!" });
	// 		return;
	// 	} else {
	// 		updateData.title = title;
	// 	}

	// 	if (!description) {
	// 		res.status(422).json({ message: "A descrição é obrigatória!" });
	// 		return;
	// 	} else {
	// 		updateData.description = description;
	// 	}

	// 	if (!mangaka) {
	// 		res.status(422).json({
	// 			message: "O nome do Mangaka é obrigatório!",
	// 		});
	// 		return;
	// 	} else {
	// 		updateData.mangaka = mangaka;
	// 	}

	// 	if (!status) {
	// 		res.status(422).json({
	// 			message: "O status do projeto é obrigatório!",
	// 		});
	// 		return;
	// 	} else {
	// 		updateData.status = status;
	// 	}

	// 	if (!format) {
	// 		res.status(422).json({ message: "O formato é obrigatório!" });
	// 		return;
	// 	} else {
	// 		updateData.format = format;
	// 	}

	// 	if (Array.isArray(images) && images.length > 0) {
	// 		updateData.images = updateData.images ? [...updateData.images] : [];
	// 		(images as Express.Multer.File[]).map(
	// 			(image: Express.Multer.File) => {
	// 				if (updateData.images) {
	// 					updateData.images.push(image.filename);
	// 				}
	// 			}
	// 		);
	// 	}

	// 	await ProductModel.findByIdAndUpdate(id, updateData);

	// 	res.status(200).json({ message: "Produto atualizado com sucesso!" });
	// }

	// static async simularFrete(req: Request, res: Response) {
	// 	const { cepDestino } = req.body;

	// 	if (!cepDestino) {
	// 		res.status(422).json({ message: "O CEP é obrigatório!" });
	// 		return;
	// 	}

	// 	const kanguApiUrl =
	// 		"https://portal.kangu.com.br/tms/transporte/simular";
	// 	const tokenKangu = "8bdcdd65ac61c68aa615f3da4a3754b4";

	// 	const requestBody = {
	// 		cepOrigem: "04812010",
	// 		cepDestino: cepDestino,
	// 		vlrMerc: 0,
	// 		pesoMerc: 0,
	// 		volumes: [
	// 			{
	// 				peso: 0.25,
	// 				altura: 3,
	// 				largura: 13,
	// 				comprimento: 21,
	// 				tipo: "string",
	// 				valor: 49.9,
	// 				quantidade: 1,
	// 			},
	// 		],
	// 		produtos: [
	// 			{
	// 				peso: 0.25,
	// 				altura: 3,
	// 				largura: 13,
	// 				comprimento: 21,
	// 				valor: 49.9,
	// 				quantidade: 1,
	// 			},
	// 		],
	// 		servicos: ["string"],
	// 		ordernar: "string",
	// 	};

	// 	try {
	// 		const response = await fetch(kanguApiUrl, {
	// 			method: "POST",
	// 			headers: {
	// 				"Content-Type": "application/json",
	// 				token: tokenKangu,
	// 			},
	// 			body: JSON.stringify(requestBody),
	// 		});

	// 		const data = await response.json();

	// 		console.log(data);
	// 		res.json(data); // Retorna os dados recebidos da API como resposta
	// 	} catch (error) {
	// 		console.error("Ocorreu um erro:", error);
	// 		res.status(500).json({ error: "Erro ao fazer a requisição à API" }); // Retorna um erro 500 em caso de falha na requisição
	// 	}
	// }

	static async simulateShipping(req: Request, res: Response) {
		const {
			cepDestino,
			weight,
			height,
			width,
			length,
			productPrice,
			productPriceTotal,
			quantityThisProduct,
		} = req.body;

		if (!cepDestino) {
			res.status(422).json({ message: "O CEP é obrigatório!" });
			return;
		}

		const kanguApiUrl =
			"https://portal.kangu.com.br/tms/transporte/simular";

		const tokenKangu = "8bdcdd65ac61c68aa615f3da4a3754b4";

		const requestBody = {
			cepOrigem: "04812010",
			cepDestino: cepDestino,
			vlrMerc: productPriceTotal,
			pesoMerc: weight * quantityThisProduct,
			produtos: [
				{
					peso: weight,
					altura: height,
					largura: width,
					comprimento: length,
					valor: productPrice,
					quantidade: quantityThisProduct,
				},
			],
			servicos: ["string"],
			ordernar: "string",
		};

		try {
			const response = await fetch(kanguApiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					token: tokenKangu,
				},
				body: JSON.stringify(requestBody),
			});

			let data = await response.json();

			// Filtrar apenas as transportadoras dos Correios com os serviços desejados (X, E, M)
			data = data.filter((transportadora: any) => {
				const servico = transportadora.servico;
				return servico === "X" || servico === "E" || servico === "M";
			});

			// Ordenar as transportadoras pelo valor do frete (do mais barato ao mais caro)
			data.sort((a: any, b: any) => a.vlrFrete - b.vlrFrete);

			console.log(data);
			res.json(data); // Retorna os dados recebidos da API como resposta
		} catch (error) {
			console.error("Ocorreu um erro:", error);
			res.status(500).json({ error: "Erro ao fazer a requisição à API" }); // Retorna um erro 500 em caso de falha na requisição
		}
	}
}

export default ProductController;
