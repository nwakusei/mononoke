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
		const { productID } = req.body;
		const {
			productName,
			orderNumber,
			statusOrder,
			paymentMethod,
			shippingCostTotal,
			orderCostTotal,
			commission,
			otakuPointsEarned,
			otakuPointsPaid,
			itemsList,
			amount,
			orderDetail,
			customerID,
			customerName,
			customerAdress,
			shippingMethod,
			statusShipping,
			daysShipping,
			trackingNumber,
			discountsApplied,
			orderNote,
		} = req.body;

		const product = await ProductModel.findById(productID);

		if (!isValidObjectId(productID)) {
			res.status(422).json({
				message: "O ID do é produto inválido!",
			});
			return;
		}

		// Pegar o Customer logado que irá realizar o pagamento
		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!token || !customer || customer.accountType !== "customer") {
			res.status(422).json({
				message: "Usuário sem permição para realizar pagamento!",
			});
			return;
		}

		try {
			if (!product) {
				res.status(422).json({ message: "Produto não encontrado!" });
				return;
			}

			if (product.stock <= 0) {
				res.status(422).json({
					message: "Produto esgotado, pagamento não permitido!",
				});
				return;
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

			// Pegar o preço do produto
			const productPrice =
				Number(product?.promocionalPrice) > 0
					? product.promocionalPrice
					: product.originalPrice;

			// AINDA SERÁ NECESSÁRIO CRIAR UMA LÓGICA PARA SOMAR O VALOR DE TODOS OS PRODUTOS DO CARRINHO
			const productsCostTotal = productPrice;

			// SOMA DO VALOR DE TODOS OS PRODUTOS + FRETE SE FOR MAIOR QUE 0
			const orderCostTotal =
				Number(productPrice) + Number(shippingCostTotal);

			console.log(
				"BALANCE AVAILABLE DO CUSTOMER DESCRIPTOGRAFADO:",
				decryptedCustomerBalanceAvailable
			);
			console.log(
				"PREÇO DO(s) PRODUTO(s) A SER TRANSACIONADO:",
				productsCostTotal
			);

			console.log("VALOR TOTAL TO PEDIDO COM FRETE", orderCostTotal);

			if (
				isNaN(decryptedCustomerBalanceAvailable) ||
				isNaN(orderCostTotal)
			) {
				res.status(422).json({
					message: "Valores em formatos inválidos!",
				});
				return;
			}

			if (decryptedCustomerBalanceAvailable < orderCostTotal) {
				res.status(422).json({
					message: "Customer Balance Available insuficiente!",
				});
				return;
			}

			// Limitando o Customer Balance Available para duas casas decimais
			const newCustomerBalanceAvailable = (
				decryptedCustomerBalanceAvailable - orderCostTotal
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

			// Pegar o parceiro associado ao produto (Responsável pelo cadastro do produto)
			const partner = await PartnerModel.findById(product.partnerID);

			console.log(partner);

			// Verificar se o Partner existe
			if (!partner) {
				res.status(422).json({
					message: "Parceiro não encontrado para este produto!",
				});
				return;
			}

			// Acessar o Otakupay do Partner usando o otakupayID
			const partnerOtakupay = await OtakupayModel.findOne({
				_id: partner.otakupayID,
			});

			if (!partnerOtakupay) {
				res.status(422).json({
					message: "Otakupay do Partner não encontrado!",
				});
				return;
			}

			// Pegar o Partner Balance Pending no otakupay
			const encryptedPartnerBalancePending =
				partnerOtakupay.balancePending;

			const decryptedPartnerBalancePending = decrypt(
				encryptedPartnerBalancePending
			);

			if (decryptedPartnerBalancePending === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar o Partner Balance Pending!",
				});
				return;
			}

			// ATENÇÃO: ESTOU CALCULANDO O FRETE + VALOR TOTAL DOS ITENS COM O BALANCE PENDING, MAS TALVEZ SEJA MAIS INTERESSANTE DISPONIBILIZAR O FRETE NA HORA
			if (isNaN(orderCostTotal)) {
				// Tratar erro, preço do produto inválido
				res.status(422).json({ message: "Preço do produto inválido." });
				return;
			}

			// Calculando o novo Partner Balance pending após a transação
			const newPartnerBalancePending =
				decryptedPartnerBalancePending + orderCostTotal;

			console.log(
				"Novo Partner Balance Pending disponível:",
				newPartnerBalancePending.toFixed(2)
			);

			// Criptografar o novo Partner Balance Pending para armazenar no Otakupay
			const newPartnerEncryptedBalancePending = encrypt(
				newPartnerBalancePending.toString()
			);

			// Atualizar o Partner Balance Pending criptografado no Otakupay
			partnerOtakupay.balancePending = newPartnerEncryptedBalancePending;

			// Essa etapa poderá ser deletada
			// Calculo e atualização do Cashback Otakupay a ser Pago pelo Partner (Cashback precisa ser multiplicado por dois para pagar plataforma e customer)
			const partnerCashbackPercentage =
				(partnerOtakupay.cashback * 2) / 100;

			const partnerCashbackPaidOrder =
				Math.floor(
					partnerCashbackPercentage * Number(productsCostTotal) * 100
				) / 100;

			console.log(
				"OTAKUPOINTS PAGO PELO PARTNER",
				partnerCashbackPaidOrder
			);

			// Criptografar o Cashback a ser pago pelo Partner para Salvar na Order criada
			const encryptedPartnerOtakuPointsPaid = encrypt(
				partnerCashbackPaidOrder.toString()
			);

			// Calculo e atualização do Cashback Otakupay do Customer
			const customerCashbackPercentage = partnerOtakupay.cashback / 100;

			const customerCashbackEarnedOrder =
				Math.floor(
					customerCashbackPercentage * Number(productsCostTotal) * 100
				) / 100;

			console.log(
				"OTAKUPOINTS GANHO PELO CUSTOMER",
				customerCashbackEarnedOrder
			);

			// Criptografar o Cashback a ser Ganho pelo Customer para Salvar na Order criada
			const encryptedCustomerOtakuPointsEarned = encrypt(
				customerCashbackEarnedOrder.toString()
			);

			// Verificar se os Customer Otaku Points Pending existe
			if (!customerOtakupay || !customerOtakupay.otakuPointsPending) {
				res.status(422).json({
					message: "Customer Otaku Points Pending não encontrado!",
				});
				return;
			}

			const encryptedCustomerOtakuPointsPending =
				customerOtakupay.otakuPointsPending;

			const decryptedCustomerOtakuPointsPending = decrypt(
				encryptedCustomerOtakuPointsPending
			);

			if (decryptedCustomerOtakuPointsPending === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar os Customer Otaku Points Pending!",
				});
				return;
			}

			// Somar os Otaku Poits ganhos em cashback com os Customer Otaku Points Pending | ESSA É A SAÍDA PARA DUAS CASAS DECIMAIS EXATAS, SEM ARREDONDAMENTO
			const newCustomerOtakuPointsPending =
				Math.floor(
					(decryptedCustomerOtakuPointsPending +
						customerCashbackEarnedOrder) *
						100
				) / 100;

			console.log("MATH FLOOR", newCustomerOtakuPointsPending);

			console.log(
				"Novo Customer Otaku Points Pending disponível:",
				newCustomerOtakuPointsPending.toFixed(2)
			);

			// Criptografar os novos Customer Otaku Points Pending para armazenar no banco de dados
			const newEncryptedOtakuPointsPending = encrypt(
				newCustomerOtakuPointsPending.toString()
			);

			// Atualizar os Customer Otaku Points Pending criptografados no banco de dados
			customerOtakupay.otakuPointsPending =
				newEncryptedOtakuPointsPending;

			// *********************************************************************************************** //

			// COMISSÃO A SER PAGA PELO PARTNER (COMO EXEMPLO: 10% POR VENDA NO OTAMART)
			const commissionOtamart = Number(productsCostTotal) * 0.1;

			const partnerCommissionAndCashbackPaid =
				Math.floor(
					(commissionOtamart + partnerCashbackPaidOrder) * 100
				) / 100;

			const encryptPartnerCommissionAndCashbackPaid = encrypt(
				partnerCommissionAndCashbackPaid.toString()
			);

			const decryptCommission = decrypt(
				encryptPartnerCommissionAndCashbackPaid
			)?.toFixed(2);

			console.log(
				"COMISSÃO PAGA PELO PARTNER CRIPTOGRAFADA:",
				encryptPartnerCommissionAndCashbackPaid
			);
			console.log(
				"COMISSÃO PAGA PELO PARTNER EM NÚMERO:",
				decryptCommission
			);

			// CRIAR UM NOVO PEDIDO
			const order = new OrderModel({
				productID: product._id,
				productName: product.productName,
				orderNumber: new ObjectId().toHexString().toUpperCase(),
				statusOrder: "Aprovado",
				paymentMethod,
				productsCostTotal,
				shippingCostTotal,
				orderCostTotal,
				commissionOtamart: commissionOtamart, // Necessário criptografar para armaznear no banco (ou não)
				totalCommissionOtamart: encryptPartnerCommissionAndCashbackPaid,
				otakuPointsEarned: encryptedCustomerOtakuPointsEarned,
				otakuPointsPaid: encryptedPartnerOtakuPointsPaid,
				itemsList,
				amount,
				orderDetail,
				partnerID: partner?._id,
				partnerName: partner?.name,
				customerID: customer._id,
				customerName: customer.name,
				customerAdress,
				shippingMethod,
				statusShipping: "Aguardando envio",
				daysShipping: product.daysShipping,
				trackingNumber,
				discountsApplied,
				orderNote,
			});

			// Criar um novo pedido se tudo der certo
			const newOrder = await order.save();

			// Reduzir uma unidade do estoque do Produto
			product.stock -= amount;
			await product.save();

			// Atualizar Customer (Balance Available e Otaku Points Pending)
			await customerOtakupay.save();

			// Atualizar Partner Balance Pending
			await partnerOtakupay.save();

			res.status(200).json({
				message: "Pagamento processado com sucesso!",
				newOrder,
			});
		} catch (err) {
			console.log(err);
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
