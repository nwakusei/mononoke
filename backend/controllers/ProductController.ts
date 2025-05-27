import { Request, Response } from "express";
import { ProductModel } from "../models/ProductModel.js";
import { PartnerModel } from "../models/PartnerModel.js";
import { ShippingModel } from "../models/ShippingModel.js";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Multer } from "multer";
import mongoose, { ObjectId, isValidObjectId } from "mongoose";

import slugify from "slugify";

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import { ProductOtaclubModel } from "../models/ProductOtaclubModel.js";

class ProductController {
	static async createProduct(req: Request, res: Response) {
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

		const files = req.files as {
			[fieldname: string]: Express.Multer.File[];
		};

		const productImages = files.productImages || []; // Garante que seja um array

		// Acessar as imagens das variações
		const variationImages = req.files as {
			[key: string]: Express.Multer.File[];
		};

		console.log("Variation Images:", variationImages); // Debug para verificar a estrutura

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

		// adultProduct;

		if (!productImages || productImages.length === 0) {
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
			imagesProduct: [],
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
			sponsoredProduct: false,
			productsSold: 0,
			rating: 0,
			reviews: [],
			partnerID: partner._id.toString(),
		});

		// Percorrer o Array de imagens e adicionar cada uma a uma ao produto/anúncio que será criado
		productImages.forEach((productImage: Express.Multer.File) => {
			console.log(productImage);
			let image = "";

			if (productImage) {
				if ("key" in productImage) {
					// Estamos usando o armazenamento na AWS S3
					if (typeof productImage.key === "string") {
						image = productImage.key;
					}
				} else {
					// Estamos usando o armazenamento em ambiente local (Desenvolvimento)
					if (typeof productImage.filename === "string") {
						image = productImage.filename;
					}
				}
			}

			// Adicionar a imagem ao produto/anúncio
			product.productImages.push(image);
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

	static async createProductOtaclub(req: Request, res: Response) {
		const {
			productTitle,
			description,
			productPrice,
			stock,
			category,
			weight,
			length,
			width,
			height,
			condition,
			daysShipping,
			adultProduct,
		} = req.body;

		const files = req.files as {
			[fieldname: string]: Express.Multer.File[];
		};

		const productImages = files.productImages || []; // Garante que seja um array

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

		if (!productPrice) {
			res.status(422).json({
				message: "O preço do produto é obrigatório!",
			});
			return;
		}

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

		if (!daysShipping) {
			res.status(422).json({
				message: "Informe em quantos dias o produto será enviado!",
			});
			return;
		}

		if (!productImages || productImages.length === 0) {
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
			const lastProduct = await ProductOtaclubModel.findOne({})
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
		const productOtaclub = new ProductOtaclubModel({
			productTitle: productTitle,
			slugTitle: slugWithCode,
			description: description,
			productPrice: productPrice,
			stock: stock,
			category: category,
			weight: weight,
			length: length,
			width: width,
			height: height,
			condition: condition,
			daysShipping: daysShipping,
			adultProduct: adultProduct,
			imagesProduct: [],
			partnerID: partner._id.toString(),
		});

		// Percorrer o Array de imagens e adicionar cada uma a uma ao produto/anúncio que será criado
		productImages.forEach((productImage: Express.Multer.File) => {
			console.log(productImage);
			let image = "";

			if (productImage) {
				if ("key" in productImage) {
					// Estamos usando o armazenamento na AWS S3
					if (typeof productImage.key === "string") {
						image = productImage.key;
					}
				} else {
					// Estamos usando o armazenamento em ambiente local (Desenvolvimento)
					if (typeof productImage.filename === "string") {
						image = productImage.filename;
					}
				}
			}

			// Adicionar a imagem ao produto/anúncio
			productOtaclub.productImages.push(image);
		});

		try {
			const newProductOtaclub = await productOtaclub.save();

			if ("totalProducts" in partner) {
				partner.totalProducts += 1;

				await partner.save();
			}

			res.status(201).json({
				message: "Produto cadastrado com sucesso!",
				newProductOtaclub,
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: "Erro ao cadastrar o produto!",
			});
			return;
		}
	}

	// Pegar todos os Produtos OtaMart
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

	// Pegar todos os Produtos OtaMart
	static async getAllProductsOtaclub(req: Request, res: Response) {
		try {
			const products = await ProductOtaclubModel.find()
				.select("-createdAt -updatedAt -__v")
				.sort("-createdAt");

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

	static async getAllProductsOtaclubPartner(req: Request, res: Response) {
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
			const products = await ProductOtaclubModel.find({
				partnerID: partner._id,
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
						_id: { $ne: new mongoose.Types.ObjectId(id) },
					},
				},
				{
					$sample: { size: 4 }, // Seleciona até 4 produtos aleatórios
				},
			]);

			// Passo 3: Se não houver produtos suficientes, buscar mais produtos independentemente da categoria
			if (recommendedProducts.length < 4) {
				const additionalProducts = await ProductModel.aggregate([
					{
						$match: {
							_id: { $ne: new mongoose.Types.ObjectId(id) },
						},
					},
					{
						$sample: { size: 4 - recommendedProducts.length },
					},
				]);

				// Concatenar os produtos adicionais com os produtos recomendados
				recommendedProducts =
					recommendedProducts.concat(additionalProducts);
			}

			// 🔥 **Remover duplicatas com base no _id**
			recommendedProducts = recommendedProducts.filter(
				(product, index, self) =>
					index ===
					self.findIndex(
						(p) => p._id.toString() === product._id.toString()
					)
			);

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
}

export default ProductController;
