import { Request, Response } from "express";
import { ProductModel } from "../models/ProductModel.js";
import { PartnerModel } from "../models/PartnerModel.js";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Multer } from "multer";
import mongoose, { ObjectId, isValidObjectId } from "mongoose";

import slugify from "slugify";

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

class ProductController {
	static async create(req: Request, res: Response) {
		const {
			productTitle,
			description,
			productVariations,
			originalPrice,
			promotionalPrice,
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
			adultProduct,
		} = req.body;

		console.log(productVariations);

		// // Upload de imagens
		// const imagesProduct = req.files as Express.Multer.File[];

		const files = req.files as {
			[fieldname: string]: Express.Multer.File[];
		};

		const imagesProduct = files.imagesProduct || []; // Garante que seja um array

		// Acessar as imagens das variações
		const variationImages = req.files as {
			[key: string]: Express.Multer.File[];
		};

		console.log("Variation Images:", variationImages); // Debug para verificar a estrutura

		// Processar variações de produtos
		// const processedVariations = productVariations.map(
		// 	(variation: any, index: number) => {
		// 		const options = variation.options.map(
		// 			(option: any, optionIndex: number) => {
		// 				const imageUrlField = `productVariations[${index}][options][${optionIndex}][imageUrl]`;
		// 				const imageUrls = variationImages[imageUrlField] || []; // Use um array para múltiplas imagens

		// 				// Processar as imagens das variações
		// 				let imageUrl = ""; // Mude de array para string

		// 				if (imageUrls.length > 0) {
		// 					const image = imageUrls[0]; // Pegue apenas a primeira imagem
		// 					if (image) {
		// 						if ("key" in image) {
		// 							// Estamos usando o armazenamento na AWS S3
		// 							if (typeof image.key === "string") {
		// 								imageUrl = image.key;
		// 							}
		// 						} else {
		// 							// Estamos usando o armazenamento em ambiente local (Desenvolvimento)
		// 							if (typeof image.filename === "string") {
		// 								imageUrl = image.filename;
		// 							}
		// 						}
		// 					}
		// 				}

		// 				return {
		// 					name: option.name,
		// 					imageUrl: imageUrl, // Mantenha apenas uma string
		// 				};
		// 			}
		// 		);

		// 		return {
		// 			title: variation.title,
		// 			options: options,
		// 		};
		// 	}
		// );

		const processedVariations = Array.isArray(productVariations)
			? productVariations.map((variation: any, index: number) => {
					const options = Array.isArray(variation.options)
						? variation.options.map(
								(option: any, optionIndex: number) => {
									const imageUrlField = `productVariations[${index}][options][${optionIndex}][imageUrl]`;
									const imageUrls =
										variationImages[imageUrlField] || []; // Use um array para múltiplas imagens

									// Processar as imagens das variações
									let imageUrl = ""; // Mude de array para string

									if (imageUrls.length > 0) {
										const image = imageUrls[0]; // Pegue apenas a primeira imagem
										if (image) {
											if ("key" in image) {
												// Estamos usando o armazenamento na AWS S3
												if (
													typeof image.key ===
													"string"
												) {
													imageUrl = image.key;
												}
											} else {
												// Estamos usando o armazenamento em ambiente local (Desenvolvimento)
												if (
													typeof image.filename ===
													"string"
												) {
													imageUrl = image.filename;
												}
											}
										}
									}

									return {
										imageUrl: imageUrl, // Mantenha apenas uma string
										name: option.name,
										originalPrice: option.originalPrice,
										promotionalPrice:
											option.promotionalPrice,
										stock: option.stock,
									};
								}
						  )
						: [];

					return {
						title: variation.title,
						options: options,
					};
			  })
			: []; // Se não for um array, retorna um array vazio

		console.log(
			"Variação que sera armazenada: ",
			JSON.stringify(processedVariations, null, 2)
		);

		// Validações
		if (!productTitle) {
			res.status(422).json({
				message: "O título do produto é obrigatório!",
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

		// if (!promotionalPrice) {
		// 	res.status(422).json({
		// 		message: "O título do produto é obrigatório!",
		// 	});
		// 	return;
		// }

		// // Revisar lógica, precisa ter ou o estoque principal ou o estoque da variação
		// if (!stock) {
		// 	res.status(422).json({
		// 		message: "A quantidade de produtos em estoque é obrigatória!",
		// 	});
		// 	return;
		// }

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

		adultProduct;

		if (!imagesProduct || imagesProduct.length === 0) {
			// Validação de Imagem
			res.status(422).json({ message: "A imagem é obrigatória!" });
			return;
		}

		if (!adultProduct) {
			res.status(422).json({
				message: "Informe se é um produto adulto!",
			});
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

		if (!(partner.address as any[]).length) {
			res.status(422).json({
				message: "Configure um endereço de envio antes de prosseguir!",
			});
			return;
		}

		if ("shippingConfiguration" in partner) {
			if (!partner.shippingConfiguration.length) {
				res.status(422).json({
					message:
						"Configure as opções de envio antes de prosseguir!",
				});
				return;
			}
		}

		// // Título do produto no Banco de Dados
		// const rawTitle = productTitle;

		// // Substituição de ~ e . por -
		// const processedTitle = rawTitle.replace(/~/g, "-").replace(/\./g, "-");

		// // Conversão do título em Slug
		// const slug = slugify(processedTitle, {
		// 	lower: true,
		// 	strict: true,
		// 	replacement: "-", // Substitui espaços e outros separadores por "-"
		// });

		const createSlugWithCode = async (productTitle) => {
			// Substituição de ~ e . por -
			const processedTitle = productTitle
				.replace(/~/g, "-")
				.replace(/\./g, "-");

			// Conversão do título em Slug
			const slug = slugify(processedTitle, {
				lower: true,
				strict: true,
				replacement: "-", // Substitui espaços e outros separadores por "-"
			});

			// Buscar o último produto criado para obter o maior código
			const lastProduct = await ProductModel.findOne({})
				.sort({ createdAt: -1 })
				.exec();

			// Determinar o próximo código
			let nextCode = "M-0001"; // Default para o primeiro produto
			if (lastProduct && lastProduct.slugTitle) {
				const match = lastProduct.slugTitle.match(/M-(\d{4})$/);
				if (match) {
					const lastNumber = parseInt(match[1], 10);
					nextCode = `M-${String(lastNumber + 1).padStart(4, "0")}`;
				}
			}

			// Concatenar o código à slug
			const slugWithCode = `${slug}-${nextCode}`;

			return slugWithCode;
		};

		const slugWithCode = await createSlugWithCode(productTitle);

		// Criar um novo produto
		const product = new ProductModel({
			productTitle: productTitle,
			slugTitle: slugWithCode,
			description: description,
			productVariations: processedVariations,
			originalPrice: originalPrice,
			promotionalPrice: promotionalPrice || 0.0,
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
			adultProduct: adultProduct,
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

			if ("totalProducts" in partner) {
				partner.totalProducts += 1;

				await partner.save();
			}

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
		try {
			const products = await ProductModel.find({
				$or: [
					// Produtos sem variações, mas com stock maior que 0
					{
						productVariations: { $size: 0 },
						stock: { $gt: 0 },
					},
					// Produtos com variações onde pelo menos uma opção tem stock maior que 0
					{
						productVariations: {
							$elemMatch: {
								options: {
									$elemMatch: { stock: { $gt: 0 } },
								},
							},
						},
					},
					// Produtos com variações, mas o estoque principal é maior que 0
					{
						stock: { $gt: 0 },
						productVariations: {
							$elemMatch: {
								options: {
									$not: { $elemMatch: { stock: { $gt: 0 } } },
								},
							},
						},
					},
				],
			}).sort("-createdAt");

			res.status(200).json({ products });
		} catch (error) {
			res.status(500).json({
				message: "Erro ao buscar os produtos.",
				error,
			});
		}
	}

	static async getAllProductsPartner(req: Request, res: Response) {
		// Verificar o Administrador que cadastrou oss Produtos
		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(401).json({ message: "Usuário não encontrado!" });
			return;
		}

		if (partner.accountType !== "partner") {
			res.status(422).json({
				message:
					"Você não possui autorização para visualizar essa página!",
			});
			return;
		}

		try {
			const products = await ProductModel.find({
				partnerID: partner._id,
				$or: [
					// Produtos sem variações, mas com stock maior que 0
					{
						productVariations: { $size: 0 },
						stock: { $gt: 0 },
					},
					// Produtos com variações onde pelo menos uma opção tem stock maior que 0
					{
						productVariations: {
							$elemMatch: {
								options: {
									$elemMatch: { stock: { $gt: 0 } },
								},
							},
						},
					},
					// Produtos com variações, mas o estoque principal é maior que 0
					{
						stock: { $gt: 0 },
						productVariations: {
							$elemMatch: {
								options: {
									$not: { $elemMatch: { stock: { $gt: 0 } } },
								},
							},
						},
					},
				],
			}).sort("-createdAt");

			res.status(200).json({ products: products });
		} catch (error) {
			res.status(500).json({ error: "Erro ao carregar os Produtos" });
			return;
		}
	}

	static async getPartnerProductByID(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(404).json({ message: "Produto não encontrado!" });
			return;
		}

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

		try {
			const product = await ProductModel.findById({
				_id: id,
			}).sort("-createdAt");

			if (product?.partnerID.toString() !== partner._id.toString()) {
				res.status(422).json({
					message: "Você não tem permissão para editar este produto!",
				});
				return;
			}

			res.status(200).json({ product: product });
		} catch (error) {
			res.status(500).json({ error: "Erro ao carregar os Produtos" });
			return;
		}
	}

	static async getAllProductsStoreByID(req: Request, res: Response) {
		const { id } = req.params;

		console.log(id);

		if (!id) {
			res.status(422).json({ message: "Loja não encontrada!" });
			return;
		}

		try {
			const products = await ProductModel.find({ partnerID: id });

			if (!products || products.length === 0) {
				res.status(422).json({
					message: "Erro ao buscar os produtos!",
				});
				return;
			}

			res.status(200).json({ products: products });
		} catch (error) {
			console.log(error);
		}
	}

	static async convertSlugProductToID(req: Request, res: Response) {
		const { slug } = req.params;

		// Verificar se o Produto existe
		const product = await ProductModel.findOne({ slugTitle: slug });

		if (!product) {
			res.status(404).json({ message: "Produto não encontrado" });
			return;
		}

		res.status(200).json({ id: product._id });
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

	static async recommendedProduct(req: Request, res: Response) {
		const { id } = req.params;

		try {
			// Passo 1: Obter o produto atual
			const currentProduct = await ProductModel.findById(id);

			if (!currentProduct) {
				res.status(422).json({
					message: "Produto atual não encontrado!",
				});
				return;
			}

			// Passo 2: Buscar produtos com a mesma categoria e excluir o produto atual
			let recommendedProducts = await ProductModel.aggregate([
				{
					$match: {
						category: currentProduct.category,
						_id: { $ne: new mongoose.Types.ObjectId(id) }, // Exclui o produto atual da lista de recomendação ($ne = Not Equal)
					},
				},
				{
					$sample: { size: 4 }, // Seleciona 4 produtos aleatórios
				},
			]);

			// Passo 3: Se não houver produtos suficientes, buscar mais produtos independentemente da categoria
			if (recommendedProducts.length < 4) {
				const additionalProducts = await ProductModel.aggregate([
					{
						$match: {
							_id: { $ne: new mongoose.Types.ObjectId(id) }, // Exclui o produto atual da lista de recomendação
						},
					},
					{
						$sample: { size: 4 - recommendedProducts.length }, // Seleciona o número necessário para completar 4 produtos
					},
				]);

				// Concatenar os produtos adicionais com os produtos recomendados
				recommendedProducts =
					recommendedProducts.concat(additionalProducts);
			}

			// Passo 4: Enviar os produtos encontrados na resposta
			res.status(200).json({
				message: "Produtos recomendados encontrados!",
				recommendedProducts,
			});
		} catch (error) {
			console.error("Erro ao buscar produtos recomendados:", error);
			res.status(500).json({
				message: "Erro ao buscar produtos recomendados!",
			});
		}
	}

	// Função funcionando anteriormente, caso de problema retornar a ela
	// static async simulateShipping(req: Request, res: Response) {
	// 	const {
	// 		cepDestino,
	// 		weight,
	// 		height,
	// 		width,
	// 		length,
	// 		productPrice,
	// 		productPriceTotal,
	// 		quantityThisProduct,
	// 	} = req.body;

	// 	if (!cepDestino) {
	// 		res.status(422).json({ message: "O CEP é obrigatório!" });
	// 		return;
	// 	}

	// 	const kanguApiUrl =
	// 		"https://portal.kangu.com.br/tms/transporte/simular";

	// 	const tokenKangu = "8bdcdd65ac61c68aa615f3da4a3754b4";

	// 	const requestBody = {
	// 		cepOrigem: "04821180",
	// 		cepDestino: cepDestino,
	// 		vlrMerc: productPriceTotal,
	// 		pesoMerc: weight * quantityThisProduct,
	// 		volumes: [
	// 			{
	// 				peso: weight * quantityThisProduct + 0.011,
	// 				altura: height + 0.1,
	// 				largura: width,
	// 				comprimento: length,
	// 				valor: productPrice,
	// 				quantidade: quantityThisProduct,
	// 			},
	// 		],
	// 		servicos: ["string"],
	// 	};

	// 	console.log(requestBody);

	// 	try {
	// 		const response = await fetch(kanguApiUrl, {
	// 			method: "POST",
	// 			headers: {
	// 				"Content-Type": "application/json",
	// 				token: tokenKangu,
	// 			},
	// 			body: JSON.stringify(requestBody),
	// 		});

	// 		let data = await response.json();

	// 		// Verificar se data é um array
	// 		if (Array.isArray(data)) {
	// 			// Filtrar apenas as transportadoras dos Correios com os serviços desejados (X, E, M)
	// 			data = data.filter((transportadora: any) => {
	// 				const servico = transportadora.servico;
	// 				return (
	// 					servico === "X" || servico === "E" || servico === "M"
	// 				);
	// 			});

	// 			// Ordenar as transportadoras pelo valor do frete (do mais barato ao mais caro)
	// 			data.sort((a: any, b: any) => a.vlrFrete - b.vlrFrete);

	// 			console.log(data);
	// 			res.json(data); // Retorna os dados recebidos da API como resposta
	// 		} else {
	// 			console.error(
	// 				"Os dados retornados pela API não estão no formato esperado."
	// 			);
	// 			res.status(500).json({
	// 				error: "Erro ao processar os dados da API",
	// 			});
	// 		}
	// 	} catch (error) {
	// 		console.error("Ocorreu um erro:", error);
	// 		res.status(500).json({ error: "Erro ao fazer a requisição à API" }); // Retorna um erro 500 em caso de falha na requisição
	// 	}
	// }

	// static async searchProductsInOtamart(req: Request, res: Response) {
	// 	const { productName } = req.body;

	// 	if (!productName) {
	// 		res.status(422).json({
	// 			message: "O nome do produto é obrigatório!",
	// 		});
	// 		return;
	// 	}

	// 	try {
	// 		const products = await ProductModel.find({
	// 			productName: { $regex: productName, $options: "i" },
	// 		});

	// 		if (products.length > 0) {
	// 			res.status(200).json({ products: products });
	// 		} else {
	// 			res.status(404).json({ message: "Produto não encontrado!" });
	// 		}
	// 	} catch (error) {
	// 		console.log(error);
	// 	}
	// }

	// ******************************************************************************************************************** //

	// static async simulateShipping(req: Request, res: Response) {
	// 	const {
	// 		productID,
	// 		cepDestino,
	// 		weight,
	// 		height,
	// 		width,
	// 		length,
	// 		productPrice,
	// 		productPriceTotal,
	// 		quantityThisProduct,
	// 	} = req.body;

	// 	if (!productID) {
	// 		res.status(422).json({ message: "O ID do produto é obrigatório!" });
	// 		return;
	// 	}

	// 	if (!cepDestino) {
	// 		res.status(422).json({ message: "O CEP é obrigatório!" });
	// 		return;
	// 	}

	// 	// Buscar o produto pelo ID
	// 	const product = await ProductModel.findById(productID).exec();

	// 	if (!product) {
	// 		res.status(404).json({ message: "Produto não encontrado!" });
	// 		return;
	// 	}

	// 	// Buscar o parceiro pelo partnerID do produto
	// 	const partner = await PartnerModel.findById(product.partnerID).exec();

	// 	if (!partner) {
	// 		res.status(404).json({ message: "Parceiro não encontrado!" });
	// 		return;
	// 	}

	// 	// Obter o CEP de Origem do Partner
	// 	const cepOrigem =
	// 		partner.address.length > 0
	// 			? partner.address[0].postalCode
	// 			: undefined;

	// 	// Caso queira tratar casos onde pode não haver nenhum endereço
	// 	if (!cepOrigem) {
	// 		res.status(422).json({ message: "CEP de origem não encontrado!" });
	// 		return;
	// 	}

	// 	// Obter a credencial da shippingConfiguration
	// 	const shippingConfig = partner.shippingConfiguration.find(
	// 		(config: any) => config.shippingOperator === "Kangu" // Substitua "Kangu" conforme sua lógica
	// 	);

	// 	if (!shippingConfig || !shippingConfig.credential) {
	// 		res.status(422).json({
	// 			message: "Configuração de envio não encontrada!",
	// 		});
	// 		return;
	// 	}

	// 	const tokenKangu = shippingConfig.credential;

	// 	const kanguApiUrl =
	// 		"https://portal.kangu.com.br/tms/transporte/simular";

	// 	const requestBody = {
	// 		cepOrigem: cepOrigem,
	// 		cepDestino: cepDestino,
	// 		vlrMerc: productPriceTotal,
	// 		pesoMerc: weight * quantityThisProduct,
	// 		volumes: [
	// 			{
	// 				peso: weight * quantityThisProduct + 0.011,
	// 				altura: height + 0.1,
	// 				largura: width,
	// 				comprimento: length,
	// 				valor: productPrice,
	// 				quantidade: quantityThisProduct,
	// 			},
	// 		],
	// 		servicos: ["string"], // Atualize conforme necessário
	// 	};

	// 	console.log(requestBody);

	// 	try {
	// 		const response = await fetch(kanguApiUrl, {
	// 			method: "POST",
	// 			headers: {
	// 				"Content-Type": "application/json",
	// 				token: tokenKangu,
	// 			},
	// 			body: JSON.stringify(requestBody),
	// 		});

	// 		let data = await response.json();

	// 		// Verificar se data é um array
	// 		if (Array.isArray(data)) {
	// 			// Filtrar apenas as transportadoras dos Correios com os serviços desejados (X, E, M)
	// 			data = data.filter((transportadora: any) => {
	// 				const servico = transportadora.servico;
	// 				return (
	// 					servico === "X" || servico === "E" || servico === "M"
	// 				);
	// 			});

	// 			// Ordenar as transportadoras pelo valor do frete (do mais barato ao mais caro)
	// 			data.sort((a: any, b: any) => a.vlrFrete - b.vlrFrete);

	// 			console.log(data);
	// 			res.json(data); // Retorna os dados recebidos da API como resposta
	// 		} else {
	// 			console.error(
	// 				"Os dados retornados pela API não estão no formato esperado."
	// 			);
	// 			res.status(500).json({
	// 				error: "Erro ao processar os dados da API",
	// 			});
	// 		}
	// 	} catch (error) {
	// 		console.error("Ocorreu um erro:", error);
	// 		res.status(500).json({ error: "Erro ao fazer a requisição à API" }); // Retorna um erro 500 em caso de falha na requisição
	// 	}
	// }

	static async simulateShippingMelhorEnvio(req: Request, res: Response) {
		const {
			productID,
			cepDestino,
			weight,
			height,
			width,
			length,
			productPrice,
			quantityThisProduct,
		} = req.body;

		// Calculo total do valor
		const productPriceTotal = productPrice * quantityThisProduct;

		// Calculo total do peso
		const weightTotal = weight * quantityThisProduct;

		try {
			// Busca o produto pelo ID
			const product = await ProductModel.findById(productID).exec();
			if (!product) {
				return res
					.status(404)
					.json({ message: "Produto não encontrado!" });
			}

			// Busca o parceiro pelo partnerID do produto
			const partner = await PartnerModel.findById(
				product.partnerID
			).exec();
			if (!partner) {
				return res
					.status(404)
					.json({ message: "Parceiro não encontrado!" });
			}

			// Obtém o CEP de origem do parceiro
			const cepOrigem =
				partner.address.length > 0
					? partner.address[0].postalCode
					: undefined;

			if (!cepOrigem) {
				return res
					.status(422)
					.json({ message: "CEP de origem não encontrado!" });
			}

			// Define o corpo da requisição
			const body = {
				from: {
					postal_code: cepOrigem,
				},
				to: {
					postal_code: cepDestino,
				},
				package: {
					height: height,
					width: width,
					length: length,
					weight: weightTotal,
				},
				options: {
					insurance_value: productPriceTotal,
					receipt: false,
					own_hand: false,
				},
				services:
					"1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,28,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100",
			};

			// Configura os cabeçalhos da requisição
			const headers = {
				Accept: "application/json",
				Authorization: `Bearer ${process.env.TOKEN_ACCESS_MELHOR_ENVIO}`,
				"Content-Type": "application/json",
				"User-Agent": "support@mononoke.com.br",
			};

			// Faz a requisição ao endpoint do Melhor Envio
			const response = await fetch(
				"https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate",
				{
					method: "POST",
					headers: headers,
					body: JSON.stringify(body),
				}
			);

			// Processa a resposta
			const data = await response.json();

			if (!response.ok) {
				throw new Error("Erro ao calcular frete: " + data.message);
			}

			// Filtra transportadoras sem o campo 'error'
			const filteredData = data.filter(
				(transportadora: any) => !transportadora.error
			);

			// Ordena os resultados pelo preço em ordem crescente
			const sortedData = filteredData.sort(
				(a: any, b: any) => a.price - b.price
			);

			// Retorna os dados filtrados para o cliente
			return res.status(200).json(sortedData);
		} catch (error: any) {
			// Retorna erro em caso de falha
			return res.status(500).json({ error: error.message });
		}
	}

	static async simulateShippingCorreiosModico(req: Request, res: Response) {
		const {
			productID,
			cepDestino,
			weight,
			height,
			width,
			length,
			productPrice,
			quantityThisProduct,
		} = req.body;

		// Cálculo total do valor
		const productPriceTotal = productPrice * quantityThisProduct;

		// Cálculo total do peso
		const weightTotal = weight * quantityThisProduct;

		try {
			// Busca o produto pelo ID
			const product = await ProductModel.findById(productID).exec();

			if (!product) {
				return res
					.status(404)
					.json({ message: "Produto não encontrado!" });
			}

			if (product.category !== "Impresso") {
				res.status(400).json({
					message: "Produto não é do tipo Impresso!",
				});
				return;
			}

			// Tabela de preços do Registro Módico
			const precosFrete = [
				{
					id: "100",
					name: "Registro Módico",
					weight: {
						min: 0.0,
						max: 0.02,
					},
					price: "5.50",
					currency: "R$",
					delivery_time: 7,
					company: {
						id: 111,
						name: "Correios",
						picture: "https://logo.com/correios.png",
					},
				},
				{
					id: "120",
					name: "Registro Módico",
					weight: {
						min: 0.02,
						max: 0.05,
					},
					price: "6.25",
					currency: "R$",
					delivery_time: 7,
					company: {
						id: 121,
						name: "Correios",
						picture: "https://logo.com/correios.png",
					},
				},
				{
					id: "130",
					name: "Registro Módico",
					weight: {
						min: 0.25,
						max: 0.27,
					},
					price: "6.95",
					currency: "R$",
					delivery_time: 7,
					company: {
						id: 131,
						name: "Correios",
						picture: "https://logo.com/correios.png",
					},
				},
			];

			// Filtrar todas as opções compatíveis com o peso total
			const shippingFound = precosFrete.filter(
				(shipping) =>
					weightTotal >= shipping.weight.min &&
					weightTotal <= shipping.weight.max
			);

			if (shippingFound) {
				return res.status(200).json(shippingFound);
			} else {
				return res.status(400).json({
					error: "Peso excede o limite do Registro Módico.",
				});
			}
		} catch (error: any) {
			return res.status(500).json({ error: error.message });
		}
	}
}

export default ProductController;
