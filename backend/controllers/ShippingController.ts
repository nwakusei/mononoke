import { Request, Response } from "express";
import { PartnerModel } from "../models/PartnerModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { ShippingModel } from "../models/ShippingModel.js";

import slugify from "slugify";

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

class ProductController {
	static async createCustomShipping(req: Request, res: Response) {
		try {
			const {
				shippingOperator,
				shippingModalityID,
				shippingName,
				shippingPrice,
				shippingCurrency,
				shippingWeightMin,
				shippingWeightMax,
				shippingDeliveryTime,
				shippingCompanyID,
				shippingCompanyName,
				shippingCompanyPicture,
			} = req.body;

			// Criando a modalidade de frete
			const newModality = {
				id: shippingModalityID,
				name: shippingName,
				price: shippingPrice,
				currency: shippingCurrency,
				weight: {
					min: shippingWeightMin,
					max: shippingWeightMax,
				},
				delivery_time: shippingDeliveryTime,
				company: {
					id: shippingCompanyID,
					name: shippingCompanyName,
					picture: shippingCompanyPicture,
				},
			};

			// Verifica se já existe um operador com esse nome
			let shippingEntry = await ShippingModel.findOne({
				shippingOperator,
			});

			if (shippingEntry) {
				// Verifica se a modalidade já existe dentro da transportadora
				const existingModality = shippingEntry.modalityOptions.find(
					(modality) => modality.id === shippingModalityID
				);

				if (existingModality) {
					return res.status(400).json({
						error: "Já existe uma modalidade com esse ID!",
					});
				}

				// Se não existir, adiciona a nova modalidade ao array existente
				shippingEntry.modalityOptions.push(newModality);
			} else {
				// Se não existir, cria um novo operador com a modalidade inicial
				shippingEntry = new ShippingModel({
					shippingOperator,
					modalityOptions: [newModality],
				});
			}

			// Salva no banco de dados
			await shippingEntry.save();

			res.status(201).json({
				message: "Transportadora criada/atualizada com sucesso!",
				shipping: shippingEntry,
			});
		} catch (error) {
			console.error("Erro ao criar a transportadora:", error);
			res.status(500).json({ error: "Erro ao criar a transportadora!" });
		}
	}

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

		// Cálculo total do valor e peso
		const productPriceTotal = productPrice * quantityThisProduct;
		const weightTotal = weight * quantityThisProduct;

		try {
			// Busca o produto pelo ID
			const product = await ProductModel.findById(productID);
			if (!product) {
				return res
					.status(404)
					.json({ message: "Produto não encontrado!" });
			}

			// Busca o parceiro pelo partnerID do produto
			const partner = await PartnerModel.findById(product.partnerID);
			if (!partner) {
				return res
					.status(404)
					.json({ message: "Parceiro não encontrado!" });
			}

			// Mapeamento de modalidades para códigos numéricos
			const modalityCodeMap: Record<string, number> = {
				"Mini Envios": 17,
				PAC: 1,
				SEDEX: 2,
				Ponto: 34,
				Express: 31,
				Coleta: 32,
				".Package": 3,
				".Com": 4,
				".Package Centralizado": 27,
				Standard: 33,
				Rodoviário: 22,
				éFácil: 12,
				Expresso: 15,
				"e-commerce": 16,
			};

			// Transportadoras suportadas e suas modalidades
			const supportedOperators = [
				"Correios",
				"Loggi",
				"Jadlog",
				"JeT",
				"Buslog",
				"LatamCargo",
				"AzulCargo",
			];

			// Armazena os códigos das modalidades encontradas
			const selectedModalityCodes: number[] = [];

			partner.shippingConfiguration?.forEach((service) => {
				if (supportedOperators.includes(service.shippingOperator)) {
					service.modalityOptions?.forEach((modality) => {
						const code = modalityCodeMap[modality];
						if (code) {
							selectedModalityCodes.push(code);
						}
					});
				}
			});

			// Gera a string final de códigos
			const modalityCodesString = selectedModalityCodes.join(", ");

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

			// Monta o corpo da requisição
			const body = {
				from: { postal_code: cepOrigem },
				to: { postal_code: cepDestino },
				package: {
					height,
					width,
					length,
					weight: weightTotal,
				},
				options: {
					insurance_value: productPriceTotal,
					receipt: false,
					own_hand: false,
				},
				services: modalityCodesString, // Modalidades convertidas para código
			};

			// Configura os cabeçalhos da requisição
			const headers = {
				Accept: "application/json",
				Authorization: `Bearer ${process.env.TOKEN_ACCESS_PRODUCAO_MELHOR_ENVIO}`,
				"Content-Type": "application/json",
				"User-Agent": "support@mononoke.com.br",
			};

			// Faz a requisição para a API do Melhor Envio
			const response = await fetch(
				"https://melhorenvio.com.br/api/v2/me/shipment/calculate",
				{
					method: "POST",
					headers,
					body: JSON.stringify(body),
				}
			);

			// Processa a resposta
			const data = await response.json();
			if (!response.ok) {
				throw new Error("Erro ao calcular frete: " + data.message);
			}

			// Filtra transportadoras sem erro
			const filteredData = data.filter(
				(transportadora: any) => !transportadora.error
			);

			// Ordena os resultados pelo preço
			const sortedData = filteredData.sort(
				(a: any, b: any) => a.price - b.price
			);

			return res.status(200).json(sortedData);
		} catch (error: any) {
			return res.status(500).json({ error: error.message });
		}
	}

	// static async simulateShippingMelhorEnvio(req: Request, res: Response) {
	// 	const {
	// 		productID,
	// 		cepDestino,
	// 		weight,
	// 		height,
	// 		width,
	// 		length,
	// 		productPrice,
	// 		quantityThisProduct,
	// 	} = req.body;

	// 	// Calculo total do valor
	// 	const productPriceTotal = productPrice * quantityThisProduct;

	// 	// Calculo total do peso
	// 	const weightTotal = weight * quantityThisProduct;

	// 	try {
	// 		// Busca o produto pelo ID
	// 		const product = await ProductModel.findById(productID);

	// 		if (!product) {
	// 			res.status(404).json({ message: "Produto não encontrado!" });
	// 			return;
	// 		}

	// 		// Busca o parceiro pelo partnerID do produto
	// 		const partner = await PartnerModel.findById(product.partnerID);

	// 		if (!partner) {
	// 			res.status(404).json({ message: "Parceiro não encontrado!" });
	// 			return;
	// 		}

	// 		let melhorEnvioModalitiesString = "";

	// 		const melhorEnvioOperator = partner.shippingConfiguration?.find(
	// 			(service) => service.shippingOperator === "MelhorEnvio"
	// 		);

	// 		if (melhorEnvioOperator) {
	// 			const melhorEnvioModalities =
	// 				melhorEnvioOperator.modalityOptions || [];

	// 			melhorEnvioModalitiesString = melhorEnvioModalities.join(", ");
	// 		} else {
	// 			console.log("Operador MelhorEnvio não encontrado.");
	// 		}

	// 		// Obtém o CEP de origem do parceiro
	// 		const cepOrigem =
	// 			partner.address.length > 0
	// 				? partner.address[0].postalCode
	// 				: undefined;

	// 		if (!cepOrigem) {
	// 			res.status(422).json({
	// 				message: "CEP de origem não encontrado!",
	// 			});
	// 			return;
	// 		}

	// 		// Define o corpo da requisição
	// 		const body = {
	// 			from: {
	// 				postal_code: cepOrigem,
	// 			},
	// 			to: {
	// 				postal_code: cepDestino,
	// 			},
	// 			package: {
	// 				height: height,
	// 				width: width,
	// 				length: length,
	// 				weight: weightTotal,
	// 			},
	// 			options: {
	// 				insurance_value: productPriceTotal,
	// 				receipt: false,
	// 				own_hand: false,
	// 			},
	// 			services: melhorEnvioModalitiesString, // Agora acessível globalmente
	// 		};

	// 		// Configura os cabeçalhos da requisição
	// 		const headers = {
	// 			Accept: "application/json",
	// 			Authorization: `Bearer ${process.env.TOKEN_ACCESS_PRODUCAO_MELHOR_ENVIO}`,
	// 			"Content-Type": "application/json",
	// 			"User-Agent": "support@mononoke.com.br",
	// 		};

	// 		// Faz a requisição ao endpoint do Melhor Envio
	// 		const response = await fetch(
	// 			"https://melhorenvio.com.br/api/v2/me/shipment/calculate",
	// 			{
	// 				method: "POST",
	// 				headers: headers,
	// 				body: JSON.stringify(body),
	// 			}
	// 		);

	// 		// Processa a resposta
	// 		const data = await response.json();

	// 		if (!response.ok) {
	// 			throw new Error("Erro ao calcular frete: " + data.message);
	// 		}

	// 		// Filtra transportadoras sem o campo 'error'
	// 		const filteredData = data.filter(
	// 			(transportadora: any) => !transportadora.error
	// 		);

	// 		// Ordena os resultados pelo preço em ordem crescente
	// 		const sortedData = filteredData.sort(
	// 			(a: any, b: any) => a.price - b.price
	// 		);

	// 		// Retorna os dados filtrados para o cliente
	// 		res.status(200).json(sortedData);
	// 	} catch (error: any) {
	// 		// Retorna erro em caso de falha
	// 		res.status(500).json({ error: error.message });
	// 		return;
	// 	}
	// }

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

		// Cálculo total do peso
		const weightTotal = weight * quantityThisProduct;

		console.log("PESO TOTAL RECEBIDO: ", weightTotal);

		try {
			// Busca o produto pelo ID
			const product = await ProductModel.findById(productID);

			if (!product) {
				res.status(404).json({ message: "Produto não encontrado!" });
				return;
			}

			if (product.category !== "Impresso") {
				res.status(400).json({
					message: "Produto não é do tipo Impresso!",
				});
				return;
			}

			const partnerID = product.partnerID;

			const partner = await PartnerModel.findById(partnerID);

			if (!partner) {
				res.status(404).json({ message: "Parceiro não encontrado!" });
				return;
			}

			// Verifica se a transportadora configurada pelo parceiro é Modico
			const shippingOperator = partner.shippingConfiguration?.find(
				(service) => service.shippingOperator === "Modico"
			);

			if (!shippingOperator) {
				res.status(400).json({
					message:
						"Transportadora não é a Correios - Registro Módico!",
				});
				return;
			}

			// 🔎 Busca no banco a transportadora 'Modico' e suas modalidades
			const shippingEntry = await ShippingModel.findOne({
				shippingOperator: "Correios",
			});

			if (!shippingEntry) {
				res.status(404).json({
					message:
						"Nenhuma configuração de frete encontrada para Modico.",
				});
				return;
			}

			// Filtra a modalidade de frete adequada ao peso total
			const shippingFound = shippingEntry.modalityOptions.find(
				(shipping) =>
					weightTotal >= shipping.weight.min &&
					weightTotal <= shipping.weight.max
			);

			if (shippingFound) {
				res.status(200).json([shippingFound]); // Retorna o objeto dentro de um array
				return;
			} else {
				res.status(400).json({
					error: "Peso excede o limite do Registro Módico.",
				});
				return;
			}
		} catch (error: any) {
			return res.status(500).json({ error: error.message });
		}
	}

	static async editShipping(req: Request, res: Response) {
		const { shippingConfiguration } = req.body;

		console.log(req.body.shippingConfiguration);

		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		// Verificar se o usuário existe
		if (!partner) {
			res.status(422).json({
				message: "Usuário não encontrado!",
			});
			return;
		}

		try {
			// Verifique se o partner é de fato um parceiro e não um cliente
			if (partner instanceof PartnerModel) {
				// Verificar se o shippingConfiguration enviado é uma string e parsear para array
				if (typeof req.body.shippingConfiguration === "string") {
					try {
						req.body.shippingConfiguration = JSON.parse(
							req.body.shippingConfiguration
						);
					} catch (error) {
						console.error(
							"Erro ao parsear shippingConfiguration:",
							error
						);
						req.body.shippingConfiguration = []; // Garantir que não quebre a aplicação
					}
				}

				// Garantir que shippingConfiguration seja um array válido
				const shippingConfigurationArray = Array.isArray(
					req.body.shippingConfiguration
				)
					? req.body.shippingConfiguration
					: [];

				// Se shippingConfiguration estiver vazio, limpe as configurações
				if (shippingConfigurationArray.length === 0) {
					partner.shippingConfiguration = [];
				} else {
					// Itera sobre as configurações de envio já existentes
					partner.shippingConfiguration.forEach(
						(existingConfig, index) => {
							// Verifica se o operador da configuração existente ainda existe na requisição
							const newConfig = shippingConfigurationArray.find(
								(config) =>
									config.shippingOperator ===
									existingConfig.shippingOperator
							);

							if (!newConfig) {
								// Se o operador não está mais presente, remove a configuração
								partner.shippingConfiguration.splice(index, 1);
							}
						}
					);

					// Agora, adicionamos ou atualizamos as configurações recebidas
					shippingConfigurationArray.forEach((newConfig) => {
						const existingShippingConfig =
							partner.shippingConfiguration.find(
								(config) =>
									config.shippingOperator ===
									newConfig.shippingOperator
							);

						if (!existingShippingConfig) {
							// Se o operador não existe, adicionamos a nova configuração
							partner.shippingConfiguration.push({
								shippingOperator: newConfig.shippingOperator,
								modalityOptions: newConfig.modalityOptions,
							});
						} else {
							// Se o operador já existe, vamos remover o antigo e adicionar a nova configuração
							const indexToRemove =
								partner.shippingConfiguration.findIndex(
									(config) =>
										config.shippingOperator ===
										newConfig.shippingOperator
								);
							if (indexToRemove !== -1) {
								partner.shippingConfiguration.splice(
									indexToRemove,
									1
								);
							}

							// Adiciona a nova configuração de modalidades
							partner.shippingConfiguration.push({
								shippingOperator: newConfig.shippingOperator,
								modalityOptions: newConfig.modalityOptions,
							});
						}
					});
				}

				await partner.save();

				const updatedUser = await PartnerModel.findById(
					partner._id
				).select("-password");

				res.status(200).json({
					message: "Usuário atualizado com sucesso!",
					updatedUser,
				});
			} else {
				res.status(400).json({
					message: "O usuário não é um parceiro válido.",
				});
			}
		} catch (err) {
			res.status(500).json({ message: err });
		}
	}

	static async trackingMelhorEnvio(req: Request, res: Response) {
		const { orders } = req.body;

		console.log(orders);

		const response = await fetch(
			"https://melhorenvio.com.br/api/v2/me/shipment/tracking",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.TOKEN_ACCESS_PRODUCAO_MELHOR_ENVIO}`,
					Accept: "application/json",
					"Content-Type": "application/json",
					"User-Agent": "MinhaAplicacao <email@contato.com>",
				},
				body: JSON.stringify({
					orders: orders, // Corrigido para enviar diretamente o array
				}),
			}
		);

		const data = await response.json(); // Parse do JSON de resposta
		res.status(response.status).json(data); // Retorna o status e o corpo da resposta
	}
}

export default ProductController;
