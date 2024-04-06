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
import { Console } from "console";

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
		const { products, shippingCost } = req.body;

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
			// Obter informações completas sobre os produtos do banco de dados
			const productIDs = products.map(
				(product: any) => product.productID
			);

			// Verificar se todos os IDs têm o formato correto de ObjectId
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
				// Alguns IDs não foram encontrados, interromper a transação
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

			// Verificar se algum dos produtos possui estoque disponível
			const produtoSemEstoque = productsFromDB.find(
				(product: any) => product.stock <= 0
			);
			if (produtoSemEstoque) {
				return res.status(422).json({
					message:
						"Um ou mais produtos encontram-se esgotados, não é possível realizar o pagamento!",
				});
			}

			const customerOtakupay: any = await OtakupayModel.findOne({
				_id: customer.otakupayID,
			});

			// Verifica se o saldo do Customer existe
			if (!customerOtakupay || !customerOtakupay.balanceAvailable) {
				res.status(422).json({
					message: "Customer Balance Available não encontrado!",
				});
				return;
			}

			const encryptedCustomerBalanceAvailable =
				customerOtakupay.balanceAvailable;

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

			// Array para armazenar os custos totais dos produtos por parceiro
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

			// Verificar se algum parceiro não teve produtos
			if (partnersTotalCost.length === 0) {
				res.status(422).json({
					message:
						"Nenhum produto encontrado para os parceiros especificados.",
				});
				return;
			}

			console.log(
				"Custo total dos produtos por parceiro:",
				partnersTotalCost
			);

			console.log("Custo total do Frete por parceiro:", shippingCost);

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

			// Iterar sobre cada produto para calcular o custo total com base no parceiro e no frete correspondente
			for (const product of products) {
				// Calcular o custo total do produto
				const productCost = getProductCost(product);

				// Se o produto tiver um custo válido
				if (productCost >= 0) {
					// Encontrar o frete correspondente ao parceiro do produto
					const shipping = shippingCost.find(
						(cost: any) => cost.partnerID === product.partnerID
					);

					// Calcular o custo total com frete
					const totalCostWithShipping =
						productCost + (shipping ? shipping.vlrFrete : 0);

					// Verificar se já existe um registro para esse parceiro no array
					const partnerIndex =
						partnersTotalCostWithShipping.findIndex(
							(item) => item.partnerID === product.partnerID
						);

					if (partnerIndex === -1) {
						// Se não existir, adicionar um novo registro ao array
						partnersTotalCostWithShipping.push({
							partnerID: product.partnerID,
							totalCostWithShipping: totalCostWithShipping,
						});
					} else {
						// Se existir, adicionar o custo total com frete ao custo total existente
						partnersTotalCostWithShipping[
							partnerIndex
						].totalCostWithShipping += totalCostWithShipping;
					}
				}
			}

			console.log(
				"Custo total dos produtos + frete por parceiro:",
				partnersTotalCostWithShipping
			);

			// Calcular o valor total do pedido com frete (PARA O CUSTOMER PAGAR)
			const customerOrderCostTotal = partnersTotalCostWithShipping.reduce(
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
					message: "Custo total do pedido inválido.",
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
					"Novo Customer Balance Available disponível:",
					logDecryptedCustomerBalanceAvailable.toFixed(2) // Exibindo o saldo com 2 casas decimais
				);
			} else {
				console.error(
					"Erro ao descriptografar o Customer Balance Available"
				);
			}

			// Array para armazenar os parceiros
			const partners = [];

			// Array para armazenar os Otakupays associados aos parceiros
			const partnerOtakupays = [];

			// Mapa para armazenar os Partner Balance Pending Criptografados por ID de parceiro
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

				// Acessar o Otakupay do parceiro usando o otakupayID
				const partnerOtakupay = await OtakupayModel.findOne({
					_id: partner.otakupayID,
				});

				// Verificar se o Otakupay do parceiro existe
				if (!partnerOtakupay) {
					// Se o Otakupay do parceiro não existir, retornar um erro
					return res.status(422).json({
						message: "Otakupay do Partner não encontrado!",
					});
				}

				// Adicionar o parceiro ao array de parceiros
				partners.push(partner);

				// Adicionar o Otakupay associado ao array de Otakupays
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

			// Converter o mapa para um array de Partner Balance Pending Criptografados
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

			// Array para armazenar os novos balanços pendentes dos parceiros
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
			console.log("Novos Balanços Pendentes dos Parceiros:", newBalances);

			// Array para armazenar os novos balanços pendentes criptografados dos parceiros
			const newEncryptedBalances = [];

			// Iterar sobre cada novo balancePending para criptografá-lo
			for (const balance of newBalances) {
				// Criptografar o balancePending usando a função encrypt
				const encryptedBalance = encrypt(
					balance.balancePending.toString()
				);

				// Adicionar o balancePending criptografado ao array de novos balanços criptografados
				newEncryptedBalances.push({
					partnerID: balance.partnerID,
					balancePending: encryptedBalance,
				});
			}

			// Console log para exibir os novos balanços pendentes criptografados dos parceiros
			console.log(
				"Novos Balanços Pendentes Criptografados dos Parceiros:",
				newEncryptedBalances
			);

			// Array para armazenar os cashbacks por parceiro
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
				"Cashbacks a serem pagos pelo Partner individualmente:",
				partnerCashbacks
			);

			// Array para armazenar os cashbacks criptografados por parceiro
			const encryptedPartnerCashbacks: {
				partnerID: string;
				encryptedCashback: string;
			}[] = [];

			// Iterar sobre cada parceiro para calcular e criptografar o cashback
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
				"Cashbacks a serem pagos pelo Partner individualmente, CRIPTOGRAFADOS:",
				encryptedPartnerCashbacks
			);

			// // Criptografar o Cashback a ser pago pelo Partner para Salvar na Order criada
			// const encryptedPartnerOtakuPointsPaid = encrypt(
			// 	partnerCashbackPaidOrder.toString()
			// );

			// Array para armazenar os cashbacks do cliente por parceiro
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

				// Acessar o Otakupay do parceiro usando o otakupayID
				const partnerOtakupay = await OtakupayModel.findOne({
					_id: partner.otakupayID,
				});

				// Verificar se o Otakupay do parceiro existe
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
				"Cashbacks do cliente por parceiro:",
				customerCashbacks
			);

			// Variável para armazenar o total de cashback do cliente
			let totalCustomerCashback = 0;

			// Iterar sobre cada cashback do cliente por parceiro para calcular o total de cashback
			for (const customerCashback of customerCashbacks) {
				// Adicionar o valor do cashback do cliente ao total
				totalCustomerCashback +=
					customerCashback.customerCashbackAmount;
			}

			console.log(
				"Total de cashback do cliente ganho na compra:",
				totalCustomerCashback
			);

			// Descriptografar o saldo de pontos pendentes do cliente
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

			// Somar o total de cashback ao saldo de pontos pendentes do cliente
			const newOtakuPointsPending =
				Number(decryptedOtakuPointsPending) + totalCustomerCashback;

			console.log(
				"Novo saldo de pontos pendentes do cliente EM NÚMEROS:",
				newOtakuPointsPending
			);

			// Criptografar o novo saldo de pontos pendentes do cliente
			const encryptedNewOtakuPointsPending = encrypt(
				newOtakuPointsPending.toString()
			);

			console.log(
				"Novo saldo de pontos pendentes do cliente CRIPTOGRAFADO:",
				encryptedNewOtakuPointsPending
			);

			// Atualizar os Customer Otaku Points Pending criptografados no banco de dados
			customerOtakupay.otakuPointsPending =
				encryptedNewOtakuPointsPending;

			// *********************************************************************************************** //

			// Array para armazenar as comissões dos parceiros
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

				// Acessar o Otakupay do parceiro usando o otakupayID
				const partnerOtakupay = await OtakupayModel.findOne({
					_id: partner.otakupayID,
				});

				// Verificar se o Otakupay do parceiro existe
				if (!partnerOtakupay) {
					// Se o Otakupay do parceiro não existir, retornar um erro
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

					// Adicionar a comissão do parceiro ao array de comissões
					partnerCommissions.push({
						partnerID: partnerCost.partnerID,
						commissionAmount: totalAmount,
					});
				} else {
					// Calcular o cashback que o parceiro está oferecendo
					const cashbackAmount =
						partnerCost.totalCost *
						(partnerOtakupay.cashback / 100);

					// Somar o cashback ao valor da comissão
					const totalAmount = commissionAmount + cashbackAmount;

					// Adicionar a comissão do parceiro ao array de comissões
					partnerCommissions.push({
						partnerID: partnerCost.partnerID,
						commissionAmount: totalAmount,
					});
				}
			}

			console.log("Comissões dos parceiros:", partnerCommissions);

			// Array para armazenar as comissões criptografadas dos parceiros
			const encryptedPartnerCommissions: {
				partnerID: string;
				encryptedCommissionAmount: string;
			}[] = [];

			// Iterar sobre cada comissão dos parceiros para criptografar o valor
			for (const commission of partnerCommissions) {
				// Criptografar o valor da comissão usando a função encrypt
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

					// Calcular os custos totais para este parceiro
					let partnerOrderCostTotal = 0;
					for (const product of partnerProducts) {
						// Calcule o custo total do produto para este parceiro
						// Isso depende da sua lógica específica para calcular o custo total do produto
						partnerOrderCostTotal += getProductCost(product);
					}

					// CRIAR UM NOVO PEDIDO para este parceiro
					const order = new OrderModel({
						orderNumber: new ObjectId().toHexString().toUpperCase(),
						statusOrder: "Aprovado",
						paymentMethod: "OtakuPay",
						// shippingCostTotal, // Aqui você pode definir o custo total de envio com base na lógica da sua aplicação
						customerOrderCostTotal: partnerOrderCostTotal,
						// Outros campos de pedido...
						partnerID: partnerID,
						// Outros campos de pedido...
					});

					// Adicionar os itens do pedido
					for (const product of partnerProducts) {
						order.itemsList.push({
							productID: product.productID,
							productName: product.productName,
							productQuantity: product.productQuantity,
						});
					}

					// Salvar o pedido no banco de dados ou executar outras ações necessárias
					await order.save();
				}
			}

			// // Iterar sobre os custos de frete por parceiro e adicionar cada valor à ordem
			// for (const partnerCost of partnersTotalCostWithShipping) {
			// 	const shipping = shippingCost.find(
			// 		(cost: any) => cost.partnerID === partnerCost.partnerID
			// 	);
			// 	if (shipping) {
			// 		order.shippingCostTotal = shipping.vlrFrete;
			// 		// Adicionar mais lógica aqui conforme necessário
			// 	}
			// }

			// ************************* ATUALIZAÇÕES EM BANCO DE DADOS ********************************************//

			// // Criar um novo pedido se tudo der certo
			// const newOrder = await order.save();

			// // Reduzir uma unidade do estoque do Produto
			// product.stock -= productQuantity;
			// await product.save();

			// // Atualizar Customer (Balance Available e Otaku Points Pending)
			// await customerOtakupay.save();

			// // Atualizar Partner Balance Pending
			// await partnerOtakupay.save();

			res.status(200).json({
				message: "Pagamento processado com sucesso!",
			});
		} catch (error) {
			console.log(error);
		}
	}

	// static async buyOtamart(req: Request, res: Response) {
	// 	const { productsID } = req.body;

	// 	const {
	// 		productName,
	// 		orderNumber,
	// 		statusOrder,
	// 		paymentMethod,
	// 		shippingCostTotal,
	// 		orderCostTotal,
	// 		commission,
	// 		otakuPointsEarned,
	// 		otakuPointsPaid,
	// 		itemsList,
	// 		productQuantity,
	// 		orderDetail,
	// 		customerID,
	// 		customerName,
	// 		customerAdress,
	// 		shippingMethod,
	// 		statusShipping,
	// 		daysShipping,
	// 		discountsApplied,
	// 		orderNote,
	// 	} = req.body;

	// 	const product = await ProductModel.findById(productsID);

	// 	if (!productsID) {
	// 		res.status(422).json({
	// 			message: "O ID do(s) produto(s) é inválido!",
	// 		});
	// 		return;
	// 	}

	// 	// Pegar o Customer logado que irá realizar o pagamento
	// 	const token: any = getToken(req);
	// 	const customer = await getUserByToken(token);

	// 	if (!token || !customer || customer.accountType !== "customer") {
	// 		res.status(422).json({
	// 			message: "Usuário sem permissão para realizar pagamento!",
	// 		});
	// 		return;
	// 	}

	// 	try {
	// 		if (!product) {
	// 			res.status(422).json({ message: "Produto não encontrado!" });
	// 			return;
	// 		}

	// if (product.stock <= 0) {
	// 	res.status(422).json({
	// 		message: "Produto esgotado, pagamento não permitido!",
	// 	});
	// 	return;
	// }

	// 		const customerOtakupay: any = await OtakupayModel.findOne({
	// 			_id: customer.otakupayID,
	// 		});

	// 		// Verifica se o saldo do Customer existe
	// 		if (!customerOtakupay || !customerOtakupay.balanceAvailable) {
	// 			res.status(422).json({
	// 				message: "Customer Balance Available não encontrado!",
	// 			});
	// 			return;
	// 		}

	// 		const encryptedCustomerBalanceAvailable =
	// 			customerOtakupay.balanceAvailable;

	// 		const decryptedCustomerBalanceAvailable = decrypt(
	// 			encryptedCustomerBalanceAvailable
	// 		);

	// 		if (decryptedCustomerBalanceAvailable === null) {
	// 			res.status(500).json({
	// 				message:
	// 					"Erro ao descriptografar o Customer Balance Available!",
	// 			});
	// 			return;
	// 		}

	// 		// Pegar o preço do produto
	// 		const productPrice =
	// 			Number(product?.promocionalPrice) > 0
	// 				? product.promocionalPrice
	// 				: product.originalPrice;

	// 		// Calcular o custo total dos produtos
	// 		const productsCostTotal = productPrice * productQuantity;

	// 		console.log("PREÇO TOTAL DOS PRODUTOS SOMADOS", productsCostTotal);

	// 		// Verificar se productsCostTotal é um número válido
	// 		if (isNaN(productsCostTotal)) {
	// 			res.status(422).json({
	// 				message: "Custo total dos produtos inválido.",
	// 			});
	// 			return;
	// 		}

	// 		// SOMA DO VALOR DE TODOS OS PRODUTOS + FRETE SE FOR MAIOR QUE 0
	// 		const orderCostTotal = productsCostTotal + shippingCostTotal;

	// 		// Verificar se orderCostTotal é um número válido
	// 		if (isNaN(orderCostTotal)) {
	// 			res.status(422).json({
	// 				message: "Custo total do pedido inválido.",
	// 			});
	// 			return;
	// 		}

	// 		console.log(
	// 			"BALANCE AVAILABLE DO CUSTOMER DESCRIPTOGRAFADO:",
	// 			decryptedCustomerBalanceAvailable
	// 		);
	// 		console.log(
	// 			"PREÇO DO(s) PRODUTO(s) A SER TRANSACIONADO:",
	// 			productsCostTotal
	// 		);

	// 		console.log("VALOR TOTAL TO PEDIDO COM FRETE", orderCostTotal);

	// 		if (
	// 			isNaN(decryptedCustomerBalanceAvailable) ||
	// 			isNaN(orderCostTotal)
	// 		) {
	// 			res.status(422).json({
	// 				message: "Valores em formatos inválidos!",
	// 			});
	// 			return;
	// 		}

	// 		if (decryptedCustomerBalanceAvailable < orderCostTotal) {
	// 			res.status(422).json({
	// 				message: "Customer Balance Available insuficiente!",
	// 			});
	// 			return;
	// 		}

	// 		// Limitando o Customer Balance Available para duas casas decimais
	// 		const newCustomerBalanceAvailable = (
	// 			decryptedCustomerBalanceAvailable - orderCostTotal
	// 		).toFixed(2);

	// 		// Criptografar o novo Customer Balance Available para armazenar no banco de dados
	// 		const newEncryptedCustomerBalanceAvailable = encrypt(
	// 			newCustomerBalanceAvailable.toString()
	// 		);

	// 		// Atualizar o Customer Balance Available criptografado no banco de dados
	// 		customerOtakupay.balanceAvailable =
	// 			newEncryptedCustomerBalanceAvailable;

	// 		// Console log para exibir o Customer Balance Available descriptografado
	// 		const logDecryptedCustomerBalanceAvailable = decrypt(
	// 			customerOtakupay.balanceAvailable
	// 		);

	// 		if (logDecryptedCustomerBalanceAvailable !== null) {
	// 			console.log(
	// 				"Novo Customer Balance Available disponível:",
	// 				logDecryptedCustomerBalanceAvailable.toFixed(2) // Exibindo o saldo com 2 casas decimais
	// 			);
	// 		} else {
	// 			console.error(
	// 				"Erro ao descriptografar o Customer Balance Available"
	// 			);
	// 		}

	// 		// Pegar o parceiro associado ao produto (Responsável pelo cadastro do produto)
	// 		const partner = await PartnerModel.findById(product.partnerID);

	// 		// Verificar se o Partner existe
	// 		if (!partner) {
	// 			res.status(422).json({
	// 				message: "Parceiro não encontrado para este produto!",
	// 			});
	// 			return;
	// 		}

	// 		// Acessar o Otakupay do Partner usando o otakupayID
	// 		const partnerOtakupay = await OtakupayModel.findOne({
	// 			_id: partner.otakupayID,
	// 		});

	// 		if (!partnerOtakupay) {
	// 			res.status(422).json({
	// 				message: "Otakupay do Partner não encontrado!",
	// 			});
	// 			return;
	// 		}

	// 		// Pegar o Partner Balance Pending no otakupay
	// 		const encryptedPartnerBalancePending =
	// 			partnerOtakupay.balancePending;

	// 		const decryptedPartnerBalancePending = decrypt(
	// 			encryptedPartnerBalancePending
	// 		);

	// 		if (decryptedPartnerBalancePending === null) {
	// 			res.status(500).json({
	// 				message:
	// 					"Erro ao descriptografar o Partner Balance Pending!",
	// 			});
	// 			return;
	// 		}

	// 		// ATENÇÃO: ESTOU CALCULANDO O FRETE + VALOR TOTAL DOS ITENS COM O BALANCE PENDING, MAS TALVEZ SEJA MAIS INTERESSANTE DISPONIBILIZAR O FRETE NA HORA
	// 		if (isNaN(orderCostTotal)) {
	// 			// Tratar erro, preço do produto inválido
	// 			res.status(422).json({ message: "Preço do produto inválido." });
	// 			return;
	// 		}

	// 		// Calculando o novo Partner Balance pending após a transação
	// 		const newPartnerBalancePending =
	// 			decryptedPartnerBalancePending + orderCostTotal;

	// 		console.log(
	// 			"Novo Partner Balance Pending disponível:",
	// 			newPartnerBalancePending.toFixed(2)
	// 		);

	// 		// Criptografar o novo Partner Balance Pending para armazenar no Otakupay
	// 		const newPartnerEncryptedBalancePending = encrypt(
	// 			newPartnerBalancePending.toString()
	// 		);

	// 		// Atualizar o Partner Balance Pending criptografado no Otakupay
	// 		partnerOtakupay.balancePending = newPartnerEncryptedBalancePending;

	// 		// Essa etapa poderá ser deletada
	// 		// Calculo e atualização do Cashback Otakupay a ser Pago pelo Partner (Cashback precisa ser multiplicado por dois para pagar plataforma e customer)
	// 		const partnerCashbackPercentage =
	// 			(partnerOtakupay.cashback * 2) / 100;

	// 		const partnerCashbackPaidOrder =
	// 			Math.floor(
	// 				partnerCashbackPercentage * Number(productsCostTotal) * 100
	// 			) / 100;

	// 		console.log(
	// 			"OTAKUPOINTS PAGO PELO PARTNER",
	// 			partnerCashbackPaidOrder
	// 		);

	// 		// Criptografar o Cashback a ser pago pelo Partner para Salvar na Order criada
	// 		const encryptedPartnerOtakuPointsPaid = encrypt(
	// 			partnerCashbackPaidOrder.toString()
	// 		);

	// 		// Calculo e atualização do Cashback Otakupay do Customer
	// 		const customerCashbackPercentage = partnerOtakupay.cashback / 100;

	// 		const customerCashbackEarnedOrder =
	// 			Math.floor(
	// 				customerCashbackPercentage * Number(productsCostTotal) * 100
	// 			) / 100;

	// 		console.log(
	// 			"OTAKUPOINTS GANHO PELO CUSTOMER",
	// 			customerCashbackEarnedOrder
	// 		);

	// 		// Criptografar o Cashback a ser Ganho pelo Customer para Salvar na Order criada
	// 		const encryptedCustomerOtakuPointsEarned = encrypt(
	// 			customerCashbackEarnedOrder.toString()
	// 		);

	// 		// Verificar se os Customer Otaku Points Pending existe
	// 		if (!customerOtakupay || !customerOtakupay.otakuPointsPending) {
	// 			res.status(422).json({
	// 				message: "Customer Otaku Points Pending não encontrado!",
	// 			});
	// 			return;
	// 		}

	// 		const encryptedCustomerOtakuPointsPending =
	// 			customerOtakupay.otakuPointsPending;

	// 		const decryptedCustomerOtakuPointsPending = decrypt(
	// 			encryptedCustomerOtakuPointsPending
	// 		);

	// 		if (decryptedCustomerOtakuPointsPending === null) {
	// 			res.status(500).json({
	// 				message:
	// 					"Erro ao descriptografar os Customer Otaku Points Pending!",
	// 			});
	// 			return;
	// 		}

	// 		// Somar os Otaku Poits ganhos em cashback com os Customer Otaku Points Pending | ESSA É A SAÍDA PARA DUAS CASAS DECIMAIS EXATAS, SEM ARREDONDAMENTO
	// 		const newCustomerOtakuPointsPending =
	// 			Math.floor(
	// 				(decryptedCustomerOtakuPointsPending +
	// 					customerCashbackEarnedOrder) *
	// 					100
	// 			) / 100;

	// 		console.log("MATH FLOOR", newCustomerOtakuPointsPending);

	// 		console.log(
	// 			"Novo Customer Otaku Points Pending disponível:",
	// 			newCustomerOtakuPointsPending.toFixed(2)
	// 		);

	// 		// Criptografar os novos Customer Otaku Points Pending para armazenar no banco de dados
	// 		const newEncryptedOtakuPointsPending = encrypt(
	// 			newCustomerOtakuPointsPending.toString()
	// 		);

	// 		// Atualizar os Customer Otaku Points Pending criptografados no banco de dados
	// 		customerOtakupay.otakuPointsPending =
	// 			newEncryptedOtakuPointsPending;

	// 		// *********************************************************************************************** //

	// 		// COMISSÃO A SER PAGA PELO PARTNER (COMO EXEMPLO: 10% POR VENDA NO OTAMART)
	// 		const commissionOtamart = Number(productsCostTotal) * 0.1;

	// 		const partnerCommissionAndCashbackPaid =
	// 			Math.floor(
	// 				(commissionOtamart + partnerCashbackPaidOrder) * 100
	// 			) / 100;

	// 		const encryptPartnerCommissionAndCashbackPaid = encrypt(
	// 			partnerCommissionAndCashbackPaid.toString()
	// 		);

	// 		const decryptCommission = decrypt(
	// 			encryptPartnerCommissionAndCashbackPaid
	// 		)?.toFixed(2);

	// 		console.log(
	// 			"COMISSÃO PAGA PELO PARTNER CRIPTOGRAFADA:",
	// 			encryptPartnerCommissionAndCashbackPaid
	// 		);
	// 		console.log(
	// 			"COMISSÃO PAGA PELO PARTNER EM NÚMERO:",
	// 			decryptCommission
	// 		);

	// 		// CRIAR UM NOVO PEDIDO
	// 		const order = new OrderModel({
	// 			orderNumber: new ObjectId().toHexString().toUpperCase(),
	// 			statusOrder: "Aprovado",
	// 			paymentMethod,
	// 			shippingCostTotal,
	// 			orderCostTotal,
	// 			commissionOtamart: commissionOtamart,
	// 			totalCommissionOtamart: encryptPartnerCommissionAndCashbackPaid,
	// 			otakuPointsEarned: encryptedCustomerOtakuPointsEarned,
	// 			otakuPointsPaid: encryptedPartnerOtakuPointsPaid,
	// 			itemsList: [],
	// 			orderDetail,
	// 			partnerID: partner?._id,
	// 			partnerName: partner?.name,
	// 			customerID: customer._id,
	// 			customerName: customer.name,
	// 			customerAdress,
	// 			shippingMethod,
	// 			statusShipping: "Aguardando envio",
	// 			daysShipping: product.daysShipping,
	// 			trackingCode: "",
	// 			discountsApplied,
	// 			orderNote,
	// 		});

	// 		// Iterar sobre a lista de itens e Verificar se itemsList está definido e é um array
	// 		if (Array.isArray(itemsList)) {
	// 			// Iterar sobre a lista de itens
	// 			itemsList.forEach(async (item: any) => {
	// 				try {
	// 					const { productID, productName, productQuantity } =
	// 						item;
	// 					// Adicionar o item diretamente à lista de itens do pedido
	// 					order.itemsList.push({
	// 						productID,
	// 						productName,
	// 						productQuantity,
	// 						productsCostTotal,
	// 					});
	// 				} catch (error) {
	// 					console.error(
	// 						"Erro ao processar item do pedido:",
	// 						error
	// 					);
	// 					// Lidar com o erro conforme necessário
	// 				}
	// 			});
	// 		} else {
	// 			console.error("itemsList não está definido ou não é um array");
	// 			// Lidar com a situação em que itemsList não está definido ou não é um array
	// 		}

	// 		// Criar um novo pedido se tudo der certo
	// 		const newOrder = await order.save();

	// 		// Reduzir uma unidade do estoque do Produto
	// 		product.stock -= productQuantity;
	// 		await product.save();

	// 		// Atualizar Customer (Balance Available e Otaku Points Pending)
	// 		await customerOtakupay.save();

	// 		// Atualizar Partner Balance Pending
	// 		await partnerOtakupay.save();

	// 		res.status(200).json({
	// 			message: "Pagamento processado com sucesso!",
	// 			newOrder,
	// 		});
	// 	} catch (err) {
	// 		console.log(err);
	// 		res.status(500).json({ message: "Erro interno do servidor." });
	// 	}
	// }

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
