import { Request, Response } from "express";
import { OtakupayModel } from "../models/OtakupayModel.js";
import { PartnerModel } from "../models/PartnerModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { OrderModel } from "../models/OrderModel.js";
// import { CustomerModel } from "../models/CustomerModel.js";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Multer } from "multer";
import { ObjectId } from "mongodb";

import https from "https";
import * as fs from "fs";
import * as path from "path";
import axios, { AxiosRequestConfig } from "axios";
import qs from "qs";

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import mongoose, { isValidObjectId } from "mongoose";
import { CouponModel } from "../models/CouponModel.js";

// Chave para criptografar e descriptografar dados sensíveis no Banco de Dados
const secretKey = process.env.AES_SECRET_KEY as string;

if (secretKey.length !== 32) {
	throw new Error("A chave precisa ter 32 caracteres para o AES-256");
}

// Função para Criptografar dados sensíveis no Banco de Dados
function encrypt(balance: string): string {
	const cipher = crypto.createCipheriv(
		"aes-256-cbc",
		Buffer.from(secretKey, "utf-8"),
		Buffer.alloc(16, 0) // Alteração aqui: criando um IV nulo
	);
	let encrypted = cipher.update(balance, "utf8", "hex");
	encrypted += cipher.final("hex");
	return encrypted;
}

// Função para Descriptografar dados sensíveis no Banco de Dados
function decrypt(encryptedBalance: string): number | null {
	let decrypted = ""; // Declarando a variável fora do bloco try

	try {
		const decipher = crypto.createDecipheriv(
			"aes-256-cbc",
			Buffer.from(secretKey, "utf-8"),
			Buffer.alloc(16, 0)
		);

		decipher.setAutoPadding(false);

		decrypted = decipher.update(encryptedBalance, "hex", "utf8");
		decrypted += decipher.final("utf8");

		const balanceNumber = parseFloat(decrypted);
		if (isNaN(balanceNumber)) {
			return null;
		}
		return parseFloat(balanceNumber.toFixed(2));
	} catch (error) {
		console.error("Erro ao descriptografar o saldo:", error);
		return null;
	}
}

class OtakupayController {
	static async addBalance(req: Request, res: Response) {
		const { value } = req.body;

		if (!value) {
			res.status(422).json({
				message: "O valor a ser adicionado é obrigatório!",
			});
			return;
		}

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!customer || null) {
			res.status(422).json({
				message: "Customer inexistente!",
			});
			return;
		}

		try {
			const customerOtakupay: any = await OtakupayModel.findOne({
				_id: customer.otakupayID,
			});

			const currentCustomerBalanceAvailable =
				customerOtakupay.balanceAvailable;

			const currentCustomerBalanceAvailableDecrypted = decrypt(
				currentCustomerBalanceAvailable
			);

			if (currentCustomerBalanceAvailableDecrypted === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar o Customer Balance Available!",
				});
				return;
			}

			console.log(
				"Balance Available Atual do Customer",
				currentCustomerBalanceAvailableDecrypted?.toFixed(2)
			);

			const newCustomerBalanceAvailable =
				currentCustomerBalanceAvailableDecrypted + parseFloat(value);

			console.log(
				"Novo Balance Available Atual do Customer",
				newCustomerBalanceAvailable?.toFixed(2)
			);

			const newCustomerBalanceAvailableEncrypted = encrypt(
				newCustomerBalanceAvailable.toString()
			);

			console.log(
				"Novo Balance Available Atual do Customer Criptografado",
				newCustomerBalanceAvailableEncrypted
			);

			customerOtakupay.balanceAvailable =
				newCustomerBalanceAvailableEncrypted;

			await customerOtakupay.save();

			res.status(200).json({ messsage: "Saldo Adicionado com Sucesso!" });
		} catch (error) {
			console.error("Erro ao adicionar saldo:", error);
			return;
		}
	}

	static async buyOtamart(req: Request, res: Response) {
		const { products, shippingCost, coupons } = req.body;

		// Verificar se o array de produtos é válido
		if (!products || products.length === 0) {
			res.status(404).json({
				error: "Nenhum produto encontrado na requisição!",
			});
			return;
		}

		// Verificar se todos os produtos possuem quantidade especificada
		if (
			products.some(
				(product: { productQuantity: number }) =>
					product.productQuantity <= 0
			)
		) {
			res.status(400).json({
				error: "Quantidade inválida para um ou mais produtos!",
			});
			return;
		}

		// Pegar o Customer logado que irá realizar o pagamento
		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!token || !customer || customer.accountType !== "customer") {
			res.status(422).json({
				message: "Usuário sem permissão para realizar pagamento!",
			});
			return;
		}

		try {
			// Pegar os IDs dos produtos da Requisição
			const productIDs = products.map(
				(product: any) => product.productID
			);

			// Verificar se todos os IDs possuem o formato correto de ObjectId
			for (const id of productIDs) {
				if (!mongoose.Types.ObjectId.isValid(id)) {
					res.status(400).json({
						error: `ID do produto '${id}' é inválido`,
					});
					return;
				}
			}

			const productsFromDB = await ProductModel.find({
				_id: productIDs,
			});

			// Verificar se todos os produtos foram encontrados no banco de dados
			if (productsFromDB.length !== productIDs.length) {
				// Se algum dos IDs não forem encontrados, interromper a transação
				const missingProductIDs = productIDs.filter(
					(id: any) =>
						!productsFromDB.find((product) => product._id === id)
				);
				res.status(400).json({
					message: "Alguns produtos não estão mais disponíveis",
					missingProductIDs,
				});
				return;
			}

			// Verificar se algum dos produtos possui estoque indisponível
			const produtoSemEstoque = productsFromDB.find(
				(product: any) => product.stock <= 0
			);
			if (produtoSemEstoque) {
				return res.status(422).json({
					message:
						"Um ou mais produtos encontram-se esgotados, não é possível realizar o pagamento!",
				});
			}

			// Pegar o OtakuPay do Customer
			const customerOtakupay: any = await OtakupayModel.findOne({
				_id: customer.otakupayID,
			});

			// Verificar se o saldo do Customer existe
			if (!customerOtakupay || !customerOtakupay.balanceAvailable) {
				res.status(422).json({
					message: "Customer Balance Available não encontrado!",
				});
				return;
			}

			// Pegar o Balance Available do Customer Criptografado
			const encryptedCustomerBalanceAvailable =
				customerOtakupay.balanceAvailable;

			// Descriptografar o Balance Available do Customer
			const decryptedCustomerBalanceAvailable = decrypt(
				encryptedCustomerBalanceAvailable
			);

			if (decryptedCustomerBalanceAvailable === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar o Customer Balance Available!",
				});
				return;
			}

			console.log(
				"BALANCE AVAILABLE DO CUSTOMER DESCRIPTOGRAFADO:",
				decryptedCustomerBalanceAvailable
			);

			// Array para armazenar os custos totais dos produtos por PartnerID
			const partnersTotalCost: {
				partnerID: string;
				totalCost: number;
			}[] = [];

			// Iterar sobre cada produto para calcular o custo total com base no parceiro
			for (const product of products) {
				// Encontrar o produto correspondente na lista de produtos do banco de dados
				const productFromDB = productsFromDB.find(
					(p: any) =>
						p._id.toString() === product.productID.toString()
				);

				// Se o produto correspondente não for encontrado, continuar para o próximo produto
				if (!productFromDB) {
					continue;
				}

				// Calcular o custo total do produto levando em consideração a quantidade
				const productCost =
					productFromDB.promocionalPrice > 0
						? productFromDB.promocionalPrice
						: productFromDB.originalPrice;
				const totalProductCost = productCost * product.productQuantity;

				// Verificar se já existe um registro para esse parceiro no array
				const partnerIndex = partnersTotalCost.findIndex(
					(item) => item.partnerID === product.partnerID
				);

				if (partnerIndex === -1) {
					// Se não existir, adicionar um novo registro ao array
					partnersTotalCost.push({
						partnerID: product.partnerID,
						totalCost: totalProductCost,
					});
				} else {
					// Se existir, adicionar o custo total do produto ao custo total existente
					partnersTotalCost[partnerIndex].totalCost +=
						totalProductCost;
				}
			}

			// Aplicar desconto do cupom, se houver
			if (coupons && coupons.length > 0) {
				for (const coupon of coupons) {
					const couponCode = coupon.couponCode;

					// Buscar o cupom no banco de dados usando o código do cupom
					const couponData = await CouponModel.findOne({
						couponCode: couponCode,
					});

					if (couponData) {
						// Iterar sobre cada parceiro para aplicar o desconto do cupom
						for (const partner of partnersTotalCost) {
							if (
								String(partner.partnerID) ===
								String(couponData.partnerID)
							) {
								// Calcular o valor do desconto com base na porcentagem do cupom
								const discountAmount =
									(partner.totalCost *
										couponData.discountPercentage) /
									100;

								// Subtrair o valor do desconto do custo total do parceiro
								partner.totalCost -= discountAmount;
							}
						}
					} else {
						// Se algum cupom não for encontrado, enviar resposta de erro
						res.status(404).json({
							message: "Cupom de desconto não encontrado.",
						});
						return;
					}
				}
			}

			// Verificar se algum parceiro possui produtos
			if (partnersTotalCost.length === 0) {
				res.status(422).json({
					message:
						"Nenhum produto encontrado para os parceiros especificados.",
				});
				return;
			}

			console.log(
				"CUSTO TOTAL DOS PRODUTOS POR PARCEIRO:",
				partnersTotalCost
			);

			console.log("CUSTO TOTAL DO FRETE POR PARCEIRO:", shippingCost);

			// Função para calcular o custo total de um produto
			function getProductCost(product: any): number {
				// Encontrar o produto correspondente na lista de produtos do banco de dados
				const productFromDB = productsFromDB.find(
					(p: any) =>
						p._id.toString() === product.productID.toString()
				);

				// Se o produto correspondente não for encontrado, retornar -1
				if (!productFromDB) {
					return -1;
				}

				// Calcular o custo total do produto levando em consideração a quantidade
				const productCost =
					productFromDB.promocionalPrice > 0
						? productFromDB.promocionalPrice
						: productFromDB.originalPrice;
				return productCost * product.productQuantity;
			}

			// Array para armazenar os custos totais dos produtos por parceiro, incluindo o frete
			const partnersTotalCostWithShipping: {
				partnerID: string;
				totalCostWithShipping: number;
			}[] = [];

			// Iterar sobre cada produto para calcular o custo total com base no partnerID e no frete correspondente
			// Iterar sobre cada parceiro para calcular o custo total com base nos valores já descontados e no frete correspondente
			for (const partner of partnersTotalCost) {
				// Encontrar o frete correspondente ao parceiro
				const shipping = shippingCost.find(
					(cost: any) => cost.partnerID === partner.partnerID
				);

				// Se o frete for encontrado, calcular o custo total com frete, caso contrário, considerar apenas o valor já descontado
				const totalCostWithShipping = shipping
					? partner.totalCost + shipping.vlrFrete
					: partner.totalCost;

				// Adicionar o custo total com frete ao array partnersTotalCostWithShipping
				partnersTotalCostWithShipping.push({
					partnerID: partner.partnerID,
					totalCostWithShipping: totalCostWithShipping,
				});
			}

			console.log(
				"CUSTO TOTAL DOS PRODUTOS + FRETE POR PARCEIRO:",
				partnersTotalCostWithShipping
			);

			// Calcular o valor total do pedido com frete (PARA O CUSTOMER PAGAR)
			let customerOrderCostTotal = partnersTotalCostWithShipping.reduce(
				(total, item) => total + item.totalCostWithShipping,
				0
			);

			console.log(
				"VALOR TOTAL DOS PEDIDOS COM FRETE",
				customerOrderCostTotal
			);

			// Verificar se orderCostTotal é um número válido
			if (isNaN(customerOrderCostTotal)) {
				res.status(422).json({
					message: "Custo total do pedido inválido!",
				});
				return;
			}

			if (
				isNaN(decryptedCustomerBalanceAvailable) ||
				isNaN(customerOrderCostTotal)
			) {
				res.status(422).json({
					message: "Valores em formatos inválidos!",
				});
				return;
			}

			if (decryptedCustomerBalanceAvailable < customerOrderCostTotal) {
				res.status(422).json({
					message: "Customer Balance Available insuficiente!",
				});
				return;
			}

			// Limitando o Customer Balance Available para duas casas decimais
			const newCustomerBalanceAvailable = (
				decryptedCustomerBalanceAvailable - customerOrderCostTotal
			).toFixed(2);

			// Criptografar o novo Customer Balance Available para armazenar no banco de dados
			const newEncryptedCustomerBalanceAvailable = encrypt(
				newCustomerBalanceAvailable.toString()
			);

			// Atualizar o Customer Balance Available criptografado no banco de dados
			customerOtakupay.balanceAvailable =
				newEncryptedCustomerBalanceAvailable;

			// Console log para exibir o Customer Balance Available descriptografado
			const logDecryptedCustomerBalanceAvailable = decrypt(
				customerOtakupay.balanceAvailable
			);

			if (logDecryptedCustomerBalanceAvailable !== null) {
				console.log(
					"NOVO CUSTOMER BALANCE AVAILABLE DISPONÍVEL:",
					logDecryptedCustomerBalanceAvailable.toFixed(2) // Exibindo o saldo com 2 casas decimais
				);
			} else {
				console.error(
					"Erro ao descriptografar o Customer Balance Available"
				);
			}

			// Array para armazenar os parceiros
			const partners = [];

			// Array para armazenar os OtakuPays associados aos parceiros
			const partnerOtakupays = [];

			// Map para armazenar os Partner Balance Pending Criptografados por partnerID
			const encryptedPartnerBalancePendingMap = new Map<string, string>();

			// Iterar sobre cada produto para obter os parceiros e seus Otakupays associados
			for (const product of products) {
				// Buscar o parceiro pelo ID do produto
				const partner = await PartnerModel.findById(product.partnerID);

				// Verificar se o parceiro existe
				if (!partner) {
					// Se o parceiro não existir, retornar um erro
					return res.status(422).json({
						message: "Parceiro não encontrado para este produto!",
					});
				}

				// Acessar o OtakuPay do parceiro usando o otakupayID
				const partnerOtakupay = await OtakupayModel.findOne({
					_id: partner.otakupayID,
				});

				// Verificar se o OtakuPay do parceiro existe
				if (!partnerOtakupay) {
					// Se o OtakuPay do parceiro não existir, retornar um erro
					return res.status(422).json({
						message: "Otakupay do Partner não encontrado!",
					});
				}

				// Adicionar o parceiro ao array de parceiros
				partners.push(partner);

				// Adicionar o OtakuPay associado ao array de Otakupays
				partnerOtakupays.push(partnerOtakupay);

				// Adicionar o Partner Balance Pending ao mapa, se existir
				if (
					partnerOtakupay.balancePending &&
					!encryptedPartnerBalancePendingMap.has(
						partner._id.toString()
					)
				) {
					encryptedPartnerBalancePendingMap.set(
						partner._id.toString(),
						partnerOtakupay.balancePending
					);
				}
			}

			// Converter o map para um array de Partner Balance Pending Criptografados
			const encryptedPartnerBalancePendingList = Array.from(
				encryptedPartnerBalancePendingMap.entries()
			).map(([partnerID, balancePending]) => ({
				partnerID,
				balancePending,
			}));

			// Descriptografar os Partner Balance Pending
			const decryptedPartnerBalancePendingList =
				encryptedPartnerBalancePendingList.map(
					({ partnerID, balancePending }) => {
						const decryptedValue = decrypt(balancePending);
						return { partnerID, balancePending: decryptedValue };
					}
				);

			console.log(
				"Partner Balance Pending Descriptografados por ID de parceiro:",
				decryptedPartnerBalancePendingList
			);

			if (decryptedPartnerBalancePendingList === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar o Partner Balance Pending!",
				});
				return;
			}

			// Array para armazenar os novos Partner Balance Pending
			const newBalances = [];

			// Iterar sobre cada parceiro para calcular o novo balancePending
			for (const partner of decryptedPartnerBalancePendingList) {
				// Verificar se balancePending não é nulo
				if (partner.balancePending !== null) {
					// Encontrar o total da compra com frete correspondente ao parceiro
					const partnerTotalCostWithShipping =
						partnersTotalCostWithShipping.find(
							(item) => item.partnerID === partner.partnerID
						);

					// Se o parceiro não tiver um total da compra com frete, atribuir 0
					const partnerTotalCost = partnerTotalCostWithShipping
						? partnerTotalCostWithShipping.totalCostWithShipping
						: 0;

					// Calcular o novo balancePending somando o total da compra com frete ao balancePending existente
					const newBalance =
						partner.balancePending + partnerTotalCost;

					// Adicionar o novo balancePending ao array de novos balanços - São esses valores que serão armazenados
					newBalances.push({
						partnerID: partner.partnerID,
						balancePending: newBalance,
					});
				}
			}

			// Console log para exibir os novos balanços pendentes dos parceiros
			console.log("NOVO PARTNER BALANCE PENDING:", newBalances);

			// Array para armazenar os novos Partner Balance Pending criptografados
			const newEncryptedBalances = [];

			// Iterar sobre cada novo balancePending para criptografá-los
			for (const balance of newBalances) {
				// Criptografar o balancePending usando a função encrypt
				const encryptedBalance = encrypt(
					balance.balancePending.toString()
				);

				// Adicionar o balancePending criptografado ao array de novos Balance Pending criptografados
				newEncryptedBalances.push({
					partnerID: balance.partnerID,
					balancePending: encryptedBalance,
				});
			}

			// Console log para exibir os novos balanços pendentes criptografados dos parceiros
			console.log(
				"NOVOS PARTNER BALANCE PENDING CRIPTOGRAFADOS:",
				newEncryptedBalances
			);

			// Array para armazenar os cashbacks (Otaku Points) que serão pagos por parceiro
			const partnerCashbacks: {
				partnerID: string;
				cashbackAmount: number;
			}[] = [];

			// Iterar sobre cada parceiro para calcular o cashback
			for (const partnerCost of partnersTotalCost) {
				// Calcular o valor do cashback (2% do custo total dos produtos)
				const cashbackAmount = partnerCost.totalCost * 0.02;

				// Adicionar o cashback ao array de cashbacks
				partnerCashbacks.push({
					partnerID: partnerCost.partnerID,
					cashbackAmount: cashbackAmount,
				});
			}

			console.log(
				"CASHBACKS/OTAKU POINTS A SEREM PAGOS PELO PARTNER INDIVIDUALMENTE:",
				partnerCashbacks
			);

			// Array para armazenar os cashbacks (Otaku Points) criptografados, a serem pagos por parceiro
			const encryptedPartnerCashbacks: {
				partnerID: string;
				encryptedCashback: string;
			}[] = [];

			// Iterar sobre cada parceiro para calcular e criptografar o cashback (Otaku Points)
			for (const partnerCost of partnersTotalCost) {
				// Calcular o valor do cashback (2% do custo total dos produtos)
				const cashbackAmount = partnerCost.totalCost * 0.02;

				// Criptografar o valor do cashback usando a função encrypt
				const encryptedCashback = encrypt(cashbackAmount.toString());

				// Adicionar o cashback criptografado ao array de cashbacks criptografados
				encryptedPartnerCashbacks.push({
					partnerID: partnerCost.partnerID,
					encryptedCashback: encryptedCashback,
				});
			}

			console.log(
				"CASHBACKS/OTAKU POINTS A SEREM PAGOS PELO PARTNER INDIVIDUALMENTE, CRIPTOGRAFADOS:",
				encryptedPartnerCashbacks
			);

			// Array para armazenar os cashbacks (Otaku Points) do Customer por parceiro
			const customerCashbacks: {
				partnerID: string;
				customerCashbackAmount: number;
			}[] = [];

			// Iterar sobre cada parceiro para calcular o cashback do cliente
			for (const partnerCost of partnersTotalCost) {
				// Buscar o parceiro pelo ID
				const partner = await PartnerModel.findById(
					partnerCost.partnerID
				);

				// Verificar se o parceiro existe
				if (!partner) {
					// Se o parceiro não existir, retornar um erro
					return res.status(422).json({
						message: "Parceiro não encontrado!",
					});
				}

				// Acessar o OtakuPay do Partner usando o otakupayID
				const partnerOtakupay = await OtakupayModel.findOne({
					_id: partner.otakupayID,
				});

				// Verificar se o OtakuPay do parceiro existe
				if (!partnerOtakupay) {
					// Se o Otakupay do parceiro não existir, retornar um erro
					return res.status(422).json({
						message: "Otakupay do Partner não encontrado!",
					});
				}

				// Verificar se o parceiro oferece cashback
				if (!partnerOtakupay.cashback) {
					// Se o parceiro não oferecer cashback, continuar para o próximo parceiro
					continue;
				}

				// Calcular o cashback do cliente com base na porcentagem de cashback do parceiro
				const customerCashbackAmount =
					partnerCost.totalCost * (partnerOtakupay.cashback / 100);

				// Adicionar o cashback do cliente ao array de cashbacks do cliente
				customerCashbacks.push({
					partnerID: partnerCost.partnerID,
					customerCashbackAmount: customerCashbackAmount,
				});
			}

			console.log(
				"CASHBACK/OTAKU POINTS DO CUSTOMER POR PARCEIRO:",
				customerCashbacks
			);

			// Variável para armazenar o total de cashback (Otaku Points) do Customer
			let totalCustomerCashback = 0;

			// Iterar sobre cada cashback (Otaku Points) do cliente por parceiro para calcular o total de cashback
			for (const customerCashback of customerCashbacks) {
				// Adicionar o valor do cashback do cliente ao total
				totalCustomerCashback +=
					customerCashback.customerCashbackAmount;
			}

			console.log(
				"TOTAL DE CASHBACK/OTAKU POINTS DO CUSTOMER GANHO NA COMPRA:",
				totalCustomerCashback
			);

			// Descriptografar o Otaku Points Pending do Customer
			const decryptedOtakuPointsPending = decrypt(
				customerOtakupay.otakuPointsPending
			);

			// Verificar se a descriptografia foi bem-sucedida
			if (decryptedOtakuPointsPending === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar saldo de pontos pendentes do cliente!",
				});
				return;
			}

			// Somar o total de cashback (Otaku Points) ao Otaku Points Pending do Customer
			const newOtakuPointsPending =
				Number(decryptedOtakuPointsPending) + totalCustomerCashback;

			console.log(
				"NOVO OTAKU POINTS PENDING DO CUSTOMER EM NÚMEROS:",
				newOtakuPointsPending
			);

			// Criptografar o novo Otaku Points Pending do Customer
			const encryptedNewOtakuPointsPending = encrypt(
				newOtakuPointsPending.toString()
			);

			console.log(
				"NOVO OTAKU POINTS PENDING DO CUSTOMER CRIPTOGRAFADO:",
				encryptedNewOtakuPointsPending
			);

			// Atualizar os Customer Otaku Points Pending criptografados no banco de dados
			customerOtakupay.otakuPointsPending =
				encryptedNewOtakuPointsPending;

			// *********************************************************************************************** //

			// Array para armazenar as comissões por parceiros
			const partnerCommissions: {
				partnerID: string;
				commissionAmount: number;
			}[] = [];

			// Iterar sobre cada parceiro para calcular a comissão
			for (const partnerCost of partnersTotalCost) {
				// Calcular a comissão de 10% em cima do total dos produtos transacionados por parceiro
				const commissionAmount = partnerCost.totalCost * 0.1;

				// Buscar o parceiro pelo ID
				const partner = await PartnerModel.findById(
					partnerCost.partnerID
				);

				// Verificar se o parceiro existe
				if (!partner) {
					// Se o parceiro não existir, retornar um erro
					return res.status(422).json({
						message: "Parceiro não encontrado!",
					});
				}

				// Acessar o OtakuPay do parceiro usando o otakupayID
				const partnerOtakupay = await OtakupayModel.findOne({
					_id: partner.otakupayID,
				});

				// Verificar se o OtakuPay do parceiro existe
				if (!partnerOtakupay) {
					// Se o OtakuPay do parceiro não existir, retornar um erro
					return res.status(422).json({
						message: "Otakupay do Partner não encontrado!",
					});
				}

				// Verificar se o parceiro oferece cashback
				if (!partnerOtakupay.cashback) {
					// Se o parceiro não oferecer cashback, o valor do cashback é 0
					const cashbackAmount = 0;
					// Somar o cashback ao valor da comissão
					const totalAmount = commissionAmount + cashbackAmount;

					// Adicionar a comissão a ser paga pelo Parceiro ao array de comissões
					partnerCommissions.push({
						partnerID: partnerCost.partnerID,
						commissionAmount: totalAmount,
					});
				} else {
					// Calcular o cashback que o parceiro está oferecendo
					const cashbackAmount =
						partnerCost.totalCost *
						(partnerOtakupay.cashback / 100);

					console.log("VALOR DO CASHBACK", cashbackAmount);

					// Somar o cashback ao valor da comissão
					const totalAmount = commissionAmount + cashbackAmount;

					console.log("VALOR DO CASHBACK + COMISSÃO", totalAmount);

					// Adicionar a comissão do parceiro ao array de comissões
					partnerCommissions.push({
						partnerID: partnerCost.partnerID,
						commissionAmount: totalAmount,
					});
				}
			}

			console.log(
				"COMISSÕES A SEREM PAGAS PELOS PARTNERS:",
				partnerCommissions
			);

			// Array para armazenar as comissões criptografadas por parceiros
			const encryptedPartnerCommissions: {
				partnerID: string;
				encryptedCommissionAmount: string;
			}[] = [];

			// Iterar sobre cada comissão dos parceiros para criptografar o valor
			for (const commission of partnerCommissions) {
				// Criptografar o valor da comissão por Parceiro
				const encryptedCommissionAmount = encrypt(
					commission.commissionAmount.toString()
				);

				// Adicionar a comissão criptografada ao array de comissões criptografadas
				encryptedPartnerCommissions.push({
					partnerID: commission.partnerID,
					encryptedCommissionAmount,
				});
			}

			// Agrupar os produtos por partnerID
			const productsByPartner: Record<string, any[]> = {};
			for (const product of products) {
				if (!productsByPartner[product.partnerID]) {
					productsByPartner[product.partnerID] = [];
				}
				productsByPartner[product.partnerID].push(product);
			}

			let orders: any[] = []; // Array para armazenar todas as Ordens

			// CRIAR UM NOVO PEDIDO (NEW ORDER)
			// Iterar sobre cada grupo de produtos por partnerID
			for (const partnerID in productsByPartner) {
				if (
					Object.prototype.hasOwnProperty.call(
						productsByPartner,
						partnerID
					)
				) {
					const partnerProducts = productsByPartner[partnerID];
					let partnerOrderCostTotal = 0;

					// Encontrar o custo total dos produtos com frete para este parceiro
					const partnerTotalCostWithShipping =
						partnersTotalCostWithShipping.find(
							(cost) => cost.partnerID === partnerID
						);

					if (!partnerTotalCostWithShipping) {
						console.error(
							`Custo total dos produtos com frete não encontrado para o parceiro ${partnerID}`
						);
						continue; // Pular para a próxima iteração do loop
					}

					// Atribuir o custo total dos produtos com frete ao partnerOrderCostTotal
					partnerOrderCostTotal =
						partnerTotalCostWithShipping.totalCostWithShipping;

					// Encontrar o custo de envio para este parceiro
					const shippingCostForPartner = shippingCost.find(
						(cost: any) => cost.partnerID === partnerID
					);

					// Verificar se o custo de envio para este parceiro foi encontrado
					if (shippingCostForPartner) {
						// Extrair o valor do custo de envio
						const { vlrFrete } = shippingCostForPartner;

						// Encontrar a comissão correspondente ao parceiro
						const partnerCommission = partnerCommissions.find(
							(commission) => commission.partnerID === partnerID
						);

						// Verificar se a comissão foi encontrada
						if (partnerCommission) {
							const { commissionAmount } = partnerCommission;

							// Buscar o nome do parceiro no banco de dados usando o partnerID
							const partner = await PartnerModel.findOne({
								_id: partnerID,
							});

							if (!partner) {
								console.error(
									`Parceiro não encontrado para o ID ${partnerID}`
								);
								continue; // Pular para a próxima iteração do loop
							}

							// Criar uma nova Order para cada PartnerID
							const order = new OrderModel({
								orderNumber: new ObjectId()
									.toHexString()
									.toUpperCase(),
								statusOrder: "Aprovado",
								paymentMethod: "OtakuPay",
								shippingCostTotal: vlrFrete,
								customerOrderCostTotal: partnerOrderCostTotal,
								partnerCommissionOtamart: commissionAmount,
								itemsList: [],
								partnerID: partnerID,
								partnerName: partner.name,
								customerID: customer._id,
								customerName: customer.name,
								customerAdress: [],
								shippingMethod: "Loggi",
								trackingCode: "",
								statusShipping: "Envio Pendente",
								discountsApplied: 0,
								orderNote: "",
							});

							// Adicionar os itens do pedido
							for (const product of partnerProducts) {
								// Encontrar o produto correspondente na lista de produtos do banco de dados
								const productFromDB = productsFromDB.find(
									(p: any) =>
										p._id.toString() ===
										product.productID.toString()
								);

								console.log(product);

								// Se o produto correspondente não for encontrado, continuar para o próximo produto
								if (!productFromDB) {
									continue;
								}

								// Calcular o custo total do produto levando em consideração a quantidade
								const productCost =
									productFromDB.promocionalPrice > 0
										? productFromDB.promocionalPrice
										: productFromDB.originalPrice;

								// Adicionar o item ao pedido
								order.itemsList.push({
									productID: product.productID,
									productName: product.productName,
									productImage: product.productImage,
									productPrice: productCost,
									daysShipping:
										shippingCostForPartner.daysShipping,
									productQuantity: product.productQuantity,
								});
							}

							// Adicionar a Order ao array de ordens
							orders.push(order);
						} else {
							console.error(
								`Comissão não encontrada para o parceiro ${partnerID}`
							);
						}
					} else {
						console.error(
							`Custo de envio não encontrado para o parceiro ${partnerID}`
						);
					}
				}
			}

			// ************************* ATUALIZAÇÕES EM BANCO DE DADOS ********************************************//

			// Criar um novo pedido se tudo der certo
			const savedOrders = await OrderModel.insertMany(orders);

			// Reduzir uma unidade do estoque do Produto
			for (const product of products) {
				try {
					// Encontrar o produto correspondente no banco de dados usando o productID
					const dbProduct = await ProductModel.findById(
						product.productID
					);

					if (!dbProduct) {
						console.error(
							`Produto não encontrado para o ID ${product.productID}`
						);
						continue; // Pular para o próximo produto
					}

					// Reduzir a quantidade no estoque
					dbProduct.stock -= product.productQuantity;
					await dbProduct.save();
					console.log(
						`Estoque do produto ${dbProduct.productName} atualizado.`
					);
				} catch (error) {
					console.error(
						`Erro ao atualizar o estoque do produto ${product.productID}:`,
						error
					);
				}
			}

			// Atualizar Customer (Balance Available e Otaku Points Pending)
			await customerOtakupay.save();

			// Iterar sobre cada par de ID de parceiro e balancePending criptografado
			for (const { partnerID, balancePending } of newEncryptedBalances) {
				try {
					// Encontrar o parceiro pelo ID
					const partner = await PartnerModel.findById(partnerID);

					if (!partner) {
						console.error(
							`Parceiro não encontrado para o ID ${partnerID}`
						);
						continue; // Pular para o próximo parceiro
					}

					// Acessar o Otakupay do parceiro usando o otakupayID
					const partnerOtakupay = await OtakupayModel.findOne({
						_id: partner.otakupayID,
					});

					if (!partnerOtakupay) {
						console.error(
							`Otakupay não encontrado para o parceiro ${partnerID}`
						);
						continue; // Pular para o próximo parceiro
					}

					// Atualizar o balancePending do Otakupay do parceiro com o novo valor criptografado
					partnerOtakupay.balancePending = balancePending;

					// Salvar as alterações no Otakupay do parceiro
					await partnerOtakupay.save();

					console.log(
						`BalancePending do parceiro ${partnerID} atualizado com sucesso.`
					);
				} catch (error) {
					console.error(
						`Erro ao atualizar o balancePending do parceiro ${partnerID}:`,
						error
					);
				}
			}

			res.status(200).json({
				message: "Pagamento processado com sucesso!",
				savedOrders,
			});
		} catch (error) {
			console.log(error);
		}
	}

	static async sendingMoney(req: Request, res: Response) {
		const { destinyEmail, amoutSent } = req.body;

		if (!destinyEmail) {
			res.status(422).json({
				message: "O email de destino é obrigatório!",
			});
			return;
		}

		if (!amoutSent) {
			res.status(422).json({
				message: "O valor a ser enviado é obrigatório!",
			});
			return;
		}

		// Pegar o Customer logado que irá realizar o pagamento
		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!token || !customer || customer.accountType !== "customer") {
			res.status(422).json({
				message:
					"Usuário sem permição para realizar envio de dinheiro!",
			});
			return;
		}

		try {
			const customerOtakupay: any = await OtakupayModel.findOne({
				_id: customer.otakupayID,
			});

			// Verifica se o Balance Available do Customer existe
			if (!customerOtakupay || !customerOtakupay.balanceAvailable) {
				res.status(422).json({
					message: "Customer Balance Available não encontrado!",
				});
				return;
			}

			// Pegar o Customer Balance Available no OtakuPay
			const encryptedCustomerBalanceAvalable =
				customerOtakupay.balanceAvailable;

			const decryptedCustomerBalanceAvailable = decrypt(
				encryptedCustomerBalanceAvalable
			);

			if (decryptedCustomerBalanceAvailable === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar os Customer OtakuPay Balance Avalable!",
				});
				return;
			}

			if (decryptedCustomerBalanceAvailable < amoutSent) {
				res.status(401).json({
					message: "O Saldo do Customer é insuficiente!",
				});
				return;
			}

			// Convertendo para números
			const amountSentNumber = parseFloat(amoutSent);
			const currentCustomerBalanceAvailable =
				decryptedCustomerBalanceAvailable;

			if (
				isNaN(amountSentNumber) ||
				isNaN(currentCustomerBalanceAvailable)
			) {
				res.status(422).json({
					message: "Valores inválidos!",
				});
				return;
			}

			// Realizando a operação de subtração e convertendo de volta para string com duas casas decimais
			const newCustomerBalanceAvailable = (
				currentCustomerBalanceAvailable - amountSentNumber
			).toFixed(2);

			// Criptografar o novo Customer Balance Available para armazenar no Otakupay
			const newCustomerEncryptedBalanceAvalable = encrypt(
				newCustomerBalanceAvailable.toString()
			);

			customerOtakupay.balanceAvailable =
				newCustomerEncryptedBalanceAvalable.toString();

			const logDecryptedCustomerBalanceAvailable = decrypt(
				customerOtakupay.balanceAvailable
			);

			if (logDecryptedCustomerBalanceAvailable !== null) {
				console.log(
					"Novo Customer Balance Available disponível:",
					logDecryptedCustomerBalanceAvailable.toFixed(2) // Exibindo o saldo com 2 casas decimais
				);
			} else {
				console.error(
					"Erro ao descriptografar o Customer Balance Available"
				);
			}

			//********************************************************************************************************//

			const partnerOtakupay = await OtakupayModel.findOne({
				email: destinyEmail,
			});

			if (!partnerOtakupay) {
				res.status(401).json({
					message: "Distinatário inexistente!",
				});
				return;
			}

			// Pegar o Partner Balance Available criptografado em OtakuPay
			const encryptedPartnerBalanceAvalable =
				partnerOtakupay.balanceAvailable;

			const decryptedPartnerBalanceAvailable = decrypt(
				encryptedPartnerBalanceAvalable
			);

			if (decryptedPartnerBalanceAvailable === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar os Partner OtakuPay Balance Avalable!",
				});
				return;
			}

			const currentPartnerBalanceAvailable =
				decryptedPartnerBalanceAvailable;

			if (
				isNaN(amountSentNumber) ||
				isNaN(currentPartnerBalanceAvailable)
			) {
				res.status(422).json({
					message: "Valores inválidos!",
				});
				return;
			}

			// Realizando a operação de adição e convertendo de volta para string com duas casas decimais
			const newPartnerBalanceAvailable = (
				currentPartnerBalanceAvailable + amountSentNumber
			).toFixed(2);

			// Criptografar o novo Customer Balance Available para armazenar no Otakupay
			const newPartnerEncryptedBalanceAvalable = encrypt(
				newPartnerBalanceAvailable.toString()
			);

			partnerOtakupay.balanceAvailable =
				newPartnerEncryptedBalanceAvalable.toString();

			const logDecryptedPartnerBalanceAvailable = decrypt(
				partnerOtakupay.balanceAvailable
			);

			if (logDecryptedPartnerBalanceAvailable !== null) {
				console.log(
					"Novo Partner Balance Available disponível:",
					logDecryptedPartnerBalanceAvailable.toFixed(2) // Exibindo o saldo com 2 casas decimais
				);
			} else {
				console.error(
					"Erro ao descriptografar o Partner Balance Available"
				);
			}

			//********************************************************************************************************//

			// Atualizar Partner Balance Available
			await partnerOtakupay.save();

			// Atualizar Customer Balance Available
			await customerOtakupay.save();

			res.status(200).json({ message: "Valor enviado com sucesso!" });
		} catch (err) {
			console.log(err);
		}
	}

	static async getUserOtakupay(req: Request, res: Response) {
		const token: any = getToken(req);
		const user = await getUserByToken(token);

		if (!user) {
			res.status(422).json({ message: "Customer inválido!" });
			return;
		}

		try {
			const userOtakupay = await OtakupayModel.findOne({
				_id: user.otakupayID,
			}).select("-password");

			if (!userOtakupay) {
				res.status(422).json({
					message: "OtakuPay do customer inexistente!",
				});
			}

			const otakupayNotNull = userOtakupay!;

			const newUserBalanceAvailable = decrypt(
				otakupayNotNull.balanceAvailable
			)?.toFixed(2);

			const newUserBalancePending = decrypt(
				otakupayNotNull.balancePending
			)?.toFixed(2);

			const newUserOtakuPointsAvailable = decrypt(
				otakupayNotNull.otakuPointsAvailable
			)?.toFixed(2);

			const newUserOtakuPointsPending = decrypt(
				otakupayNotNull.otakuPointsPending
			)?.toFixed(2);

			const newUserOtakupay = {
				balanceAvailable: newUserBalanceAvailable,
				balancePending: newUserBalancePending,
				otakuPointsAvailable: newUserOtakuPointsAvailable,
				otakuPointsPending: newUserOtakuPointsPending,
			};

			res.status(200).json(newUserOtakupay);
		} catch (error) {
			res.status(422).json({
				message: "Erro ao retornar dados do OtakuPay do cliente!",
				error,
			});
		}
	}
}

export default OtakupayController;
