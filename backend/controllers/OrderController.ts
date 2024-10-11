import { Request, Response } from "express";
import { CustomerModel } from "../models/CustomerModel.js";
import { PartnerModel } from "../models/PartnerModel.js";
import { OtakupayModel } from "../models/OtakupayModel.js";
import { OrderModel } from "../models/OrderModel.js";
import { ProductModel } from "../models/ProductModel.js";
import crypto from "crypto";
import mongoose, { isValidObjectId } from "mongoose";

// Middlewares
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

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

// Função para Descriptografar dados sensíveis no Banco de Dados em String
function decryptString(encryptedData: string): string | null {
	let decrypted = ""; // Declare a variável fora do bloco try
	try {
		const decipher = crypto.createDecipheriv(
			"aes-256-cbc",
			Buffer.from(secretKey, "utf-8"),
			Buffer.alloc(16, 0)
		);

		decipher.setAutoPadding(false);

		decrypted = decipher.update(encryptedData, "hex", "utf8");
		decrypted += decipher.final("utf8");

		return decrypted;
	} catch (error) {
		console.error("Erro ao descriptografar os dados:", error);
		return null;
	}
}

class OrderController {
	static async getAllPartnerOrders(req: Request, res: Response) {
		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(422).json({
				message: "Partner/Usuário não encontrado!",
			});
			return;
		}

		if (partner.accountType !== "partner") {
			res.status(422).json({
				message: "Você não tem permissão para acessar essa requisição!",
			});
			return;
		}

		const partnerID = partner._id.toString();

		try {
			// Buscar as orders associadas ao parceiro
			const orders = await OrderModel.find({
				partnerID: partnerID,
			}).sort("-createdAt");

			console.log(orders); // Adicione esta linha para verificar as orders

			// Verificar se há orders
			if (orders.length === 0) {
				return res
					.status(404)
					.json({ message: "Você não possui Orders!" });
			}

			res.status(200).json({ orders: orders });
		} catch (error) {
			if (error instanceof Error) {
				res.status(500).json({ error: error.message });
			} else {
				res.status(500).json({ error: "An unknown error occurred." });
			}
		}
	}

	static async getPartnerOrderByID(req: Request, res: Response) {
		const { id } = req.params;

		// Verificar se o ID é um ObjectID válido
		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "ID inválido" });
			return;
		}

		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		if (partner.accountType !== "partner") {
			res.status(422).json({
				message: "Você não tem permissão para acessar esta página!",
			});
			return;
		}

		// Pegar o pedido da requisição
		const order = await OrderModel.findById({ _id: id });

		// Verificar se o produto existe
		if (!order) {
			res.status(404).json({ message: "Pedido não encontrado!" });
			return;
		}

		// Transformar o partnerID em string
		const partnerIDAsString = order.partnerID.toString();
		console.log(partnerIDAsString);

		// Verificar se o usuário da requisição é o proprietário do Pedido
		if (partner.id !== partnerIDAsString) {
			res.status(422).json({
				message: "Você não o proprietário desse pedido, acesso negado!",
			});
			return;
		}

		res.status(200).json({ order: order });
	}

	// static async partnerCancelOrderByID(req: Request, res: Response) {
	// 	const { id } = req.params;
	// 	const { statusOrder } = req.body;

	// 	if (!isValidObjectId(id)) {
	// 		res.status(422).json({ message: "ID inválido" });
	// 		return;
	// 	}

	// 	const token: any = getToken(req);
	// 	const partner = await getUserByToken(token);

	// 	if (!partner || partner.accountType !== "partner") {
	// 		res.status(401).json({ message: "Acesso não autorizado!" });
	// 		return;
	// 	}

	// 	// Pegar o pedido da requisição
	// 	const order = await OrderModel.findById({ _id: id });

	// 	// Verificar se o produto existe
	// 	if (!order) {
	// 		res.status(404).json({ message: "Produto não encontrado!" });
	// 		return;
	// 	}

	// 	// Transformar o partnerID em string
	// 	const partnerIDAsString = order.partnerID.toString();
	// 	console.log(partnerIDAsString);

	// 	// Verificar se o usuário da requisição é o proprietário do Pedido
	// 	if (partner.id !== partnerIDAsString) {
	// 		res.status(422).json({
	// 			message: "Você não o proprietário desse pedido, acesso negado!",
	// 		});
	// 		return;
	// 	}

	// 	if (!statusOrder) {
	// 		res.status(422).json({
	// 			message: "Status do Pedido é obrigatório!",
	// 		});
	// 		return;
	// 	}

	// 	if (statusOrder !== "Cancelado" && statusOrder !== "cancelado") {
	// 		res.status(422).json({
	// 			messsage: "Não é possível cancelar, status inexistente!",
	// 		});
	// 		return;
	// 	}

	// 	try {
	// 		if (order.statusOrder === "Cancelado") {
	// 			res.status(422).json({ messsage: "Pedido já cancelado!" });
	// 			return;
	// 		}

	// 		// Encontrar o Otakupay do Customer
	// 		const customerID = order.customerID;
	// 		const customer = await CustomerModel.findById(customerID);

	// 		if (!customer || !customer.otakupayID) {
	// 			res.status(404).json({
	// 				message: "Cliente ou otakupayID não encontrado!",
	// 			});
	// 			return;
	// 		}

	// 		// Encontrar o Balance Available do Customer
	// 		const customerOtakupayID = customer.otakupayID;
	// 		const customerOtakupay = await OtakupayModel.findById(
	// 			customerOtakupayID
	// 		);

	// 		if (!customerOtakupay || !customerOtakupay.balanceAvailable) {
	// 			res.status(404).json({
	// 				message: "Otakupay ou balanceAvailable não encontrado!",
	// 			});
	// 			return;
	// 		}

	// 		// Pegar o Balance Available atual e criptografado do Customer
	// 		const encryptedCustomerBalanceAvailable =
	// 			customerOtakupay.balanceAvailable;

	// 		// Descriptogradar o Balance Available atual do Customer
	// 		const decryptedCustomerBalanceAvailable = decrypt(
	// 			encryptedCustomerBalanceAvailable
	// 		);

	// 		// Verificar se o Balance Available atual do Customer não é nulo
	// 		if (decryptedCustomerBalanceAvailable === null) {
	// 			res.status(500).json({
	// 				message: "Erro ao descriptografar o balanceAvailable.",
	// 			});
	// 			return;
	// 		}

	// 		// Pegar o valor total do pedido com o frete
	// 		const orderCostTotal = Number(order.orderCostTotal);

	// 		// REEMBOLSO: Somar o Balance Available atual do Customer com o total do pedido
	// 		const newCustomerBalanceAvailable =
	// 			decryptedCustomerBalanceAvailable + orderCostTotal;

	// 		console.log(
	// 			"Reembolso => Novo Customer Balance Available em números:",
	// 			newCustomerBalanceAvailable.toFixed(2)
	// 		);

	// 		// Criptografar o valor somado que será o novo Balance Available do Customer
	// 		const newEncryptedCustomerBalanceAvailable = encrypt(
	// 			newCustomerBalanceAvailable.toString()
	// 		);

	// 		console.log(
	// 			"Reembolso => Novo Customer Balance Available Criptografado:",
	// 			newEncryptedCustomerBalanceAvailable
	// 		);

	// 		// Salvar o novo Otaku Points Pending do Customer
	// 		customerOtakupay.balanceAvailable =
	// 			newEncryptedCustomerBalanceAvailable;

	// 		// *********************************************************************************************** //

	// 		// Pegar o Otaku Points Pending atual e criptografado do Customer no OtakuPay
	// 		const encryptedCustomerOtakuPointsPending =
	// 			customerOtakupay.otakuPointsPending;

	// 		// Descriptogradar o Otaku Points Pending atual do Customer no OtakuPay
	// 		const decryptedCustomerOtakuPointsPending = decrypt(
	// 			encryptedCustomerOtakuPointsPending
	// 		);

	// 		// Verificar se o Otaku Points Pending atual não é nulo
	// 		if (decryptedCustomerOtakuPointsPending === null) {
	// 			res.status(500).json({
	// 				message:
	// 					"Erro ao descriptografar o Otaku Points Pending do Customer.",
	// 			});
	// 			return;
	// 		}

	// 		// Pegar o Otaku Points Earned atual e criptografado do Customer na Order
	// 		const encryptedCustomerOtakuPointsEarned = order.otakuPointsEarned;

	// 		// Descriptogradar o Otaku Points Earned atual
	// 		const decryptedCustomerOtakuPointsEarned = decrypt(
	// 			encryptedCustomerOtakuPointsEarned
	// 		);

	// 		console.log(decryptedCustomerOtakuPointsEarned);

	// 		// Verificar se o Otaku Points Earned atual não é nulo
	// 		if (decryptedCustomerOtakuPointsEarned === null) {
	// 			res.status(500).json({
	// 				message:
	// 					"Erro ao descriptografar o Otaku Points Earned do Customer na Order.",
	// 			});
	// 			return;
	// 		}

	// 		// Subtrair o Otaku Points Earned atual da Order do Otaku Points Pending do Customer no OtakuPay
	// 		const newOtakuPointsPending =
	// 			decryptedCustomerOtakuPointsPending -
	// 			decryptedCustomerOtakuPointsEarned;

	// 		console.log(
	// 			"Novo Customer Otaku Points Pending em números:",
	// 			newOtakuPointsPending.toFixed(2)
	// 		);

	// 		// Criptografar o valor somado que será o novo Balance Available do Customer
	// 		const newEncryptedOtakuPointsPending = encrypt(
	// 			newOtakuPointsPending.toString()
	// 		);

	// 		console.log(
	// 			"Novo Customer Otaku Points Pendending Criptografado:",
	// 			newEncryptedOtakuPointsPending
	// 		);

	// 		// Salvar o novo Otaku Points Pending do Customer
	// 		customerOtakupay.otakuPointsPending =
	// 			newEncryptedOtakuPointsPending;

	// 		// *********************************************************************************************** //

	// 		// Encontrar o Otakupay do Partner
	// 		const partnerID = order.partnerID;
	// 		const partner = await PartnerModel.findById(partnerID);

	// 		if (!partner || !partner.otakupayID) {
	// 			res.status(404).json({
	// 				message: "Partner ou otakupayID não encontrado!",
	// 			});
	// 			return;
	// 		}

	// 		// Encontrar o Balance Pending do Partner
	// 		const partnerOtakupayID = partner.otakupayID;
	// 		const partnerOtakupay = await OtakupayModel.findById(
	// 			partnerOtakupayID
	// 		);

	// 		if (!partnerOtakupay || !partnerOtakupay.balancePending) {
	// 			res.status(404).json({
	// 				message: "Otakupay ou balancePending não encontrado!",
	// 			});
	// 			return;
	// 		}

	// 		// Pegar o Balance Pending atual do Partner criptografado
	// 		const encryptedPartnerBalancePending =
	// 			partnerOtakupay.balancePending;

	// 		// Descriptografar o Balance Pending atual do Partner
	// 		const decryptedPartnerBalancePending = decrypt(
	// 			encryptedPartnerBalancePending
	// 		);

	// 		// Verificar se o Balance Pending atual do Partner não é nulo
	// 		if (decryptedPartnerBalancePending === null) {
	// 			res.status(500).json({
	// 				message: "Erro ao descriptografar o balancePending.",
	// 			});
	// 			return;
	// 		}

	// 		// Subtrair o valor total do pedido do Balance Pending atual do Partner
	// 		const newPartnerBalancePending =
	// 			decryptedPartnerBalancePending - orderCostTotal;

	// 		console.log(
	// 			"Novo Partner Balance Pending em números:",
	// 			newPartnerBalancePending.toFixed(2)
	// 		);

	// 		// Criptografar o valor somado que será o novo Balance Pending do Partner
	// 		const newEncryptedPartnerBalancePending = encrypt(
	// 			newPartnerBalancePending.toString()
	// 		);

	// 		console.log(
	// 			"Novo Partner Balance Pending Criptografado:",
	// 			newEncryptedPartnerBalancePending
	// 		);

	// 		// Salvar o novo Balance Pending do Partner
	// 		partnerOtakupay.balancePending = newEncryptedPartnerBalancePending;

	// 		// Atribuir status de Cancelado a Order
	// 		order.statusOrder = statusOrder;

	// 		// Salvar o novo Status da Order no banco de dados
	// 		await order.save();

	// 		// Aumentar uma unidade do estoque do Produto
	// 		const productID = order.productID;
	// 		const product = await ProductModel.findById(productID);

	// 		if (product) {
	// 			// Incrementar o estoque
	// 			product.stock += 1;

	// 			// Salvar as alterações no banco de dados
	// 			await product.save();
	// 		} else {
	// 			console.log("Produto não encontrado");
	// 		}

	// 		// Salvar informações no OtakuPay do Customer
	// 		await customerOtakupay.save();

	// 		// Salvar informações no OtakuPay do Partner
	// 		await partnerOtakupay.save();

	// 		res.status(200).json({ message: "Pedido cancelado com sucesso!" });
	// 		return;
	// 	} catch (err) {
	// 		console.error(err); // Adicionando um log para identificar o erro
	// 		res.status(500).json({ message: "Erro ao cancelar o pedido." });
	// 		return;
	// 	}
	// }

	static async getAllCustomerOrders(req: Request, res: Response) {
		try {
			const token: any = getToken(req);
			const customer = await getUserByToken(token);

			if (!customer) {
				res.status(422).json({
					message: "Customer/Usuário não encontrado!",
				});
				return;
			}

			if (customer.accountType !== "customer") {
				res.status(422).json({
					message:
						"Você não tem permissão para acessar essa requisição!",
				});
				return;
			}

			const orders = await OrderModel.find({
				customerID: customer._id,
			}).sort("-createdAt");

			res.status(200).json({ orders: orders });
		} catch (error) {
			if (error instanceof Error) {
				res.status(500).json({ error: error.message });
			} else {
				res.status(500).json({ error: "An unknown error occurred." });
			}
		}
	}

	static async getCustomerOrderByID(req: Request, res: Response) {
		const { id } = req.params;

		// Verificar se o ID é um ObjectID válido
		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "ID inválido" });
			return;
		}

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!customer) {
			res.status(422).json({
				message: "Customer/Usuário não encontrado!",
			});
			return;
		}

		console.log(customer.id);

		if (!customer) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		if (customer.accountType !== "customer") {
			res.status(422).json({
				message: "Você não tem permissão para acessar esta página!",
			});
			return;
		}

		// Pegar o pedido da requisição
		const order = await OrderModel.findById({ _id: id });

		// Verificar se o produto existe
		if (!order) {
			res.status(404).json({ message: "Produto não encontrado!" });
			return;
		}

		// Transformar o customerID em string
		const customerIDAsString = order.customerID.toString();
		console.log(customerIDAsString);

		// Verificar se o usuário da requisição é o proprietário do Pedido
		if (customer.id !== customerIDAsString) {
			res.status(422).json({
				message: "Você não o proprietário desse pedido, acesso negado!",
			});
			return;
		}

		res.status(200).json({ order: order });
	}

	static async confirmReceiptCustomerOrder(req: Request, res: Response) {
		const { id } = req.params;
		// const { newStatusOrder } = req.body;

		const newStatusOrder = "Concluído";

		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "ID inválido" });
			return;
		}

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!customer || customer.accountType !== "customer") {
			res.status(401).json({
				message: "Você não tem autorização para confirmar o pedido!",
			});
			return;
		}

		// Pegar o pedido da requisição
		const order = await OrderModel.findById({ _id: id });

		// Verificar se o produto existe
		if (!order) {
			res.status(404).json({ message: "Pedido não encontrado!" });
			return;
		}

		// Transformar o customerID em string
		const customerIDAsString = order.customerID.toString();

		// Verificar se o usuário da requisição é o proprietário do Pedido
		if (customer.id !== customerIDAsString) {
			res.status(422).json({
				message: "Você não o proprietário desse pedido, acesso negado!",
			});
			return;
		}

		// if (!newStatusOrder) {
		// 	res.status(422).json({
		// 		message: "Status do Pedido é obrigatório!",
		// 	});
		// 	return;
		// }

		const currentStatusOrder = order.statusOrder;

		if (!currentStatusOrder) {
			res.status(422).json({
				messsage:
					"Status inexistente. O status do pedido é obrigatório!",
			});
			return;
		}

		if (currentStatusOrder === "Concluído" && "concluído") {
			res.status(422).json({
				messsage:
					"Pedido já confirmado, não é possível confirmar novamente!",
			});
			return;
		}

		try {
			// Encontrar o Otakupay do Partner
			const partnerID = order.partnerID;
			const partner = await PartnerModel.findById(partnerID);

			if (!partner || !partner.otakupayID) {
				res.status(404).json({
					message: "Partner ou otakupayID não encontrado!",
				});
				return;
			}

			// Encontrar o Balance Available do Partner
			const partnerOtakupayID = partner.otakupayID;
			const partnerOtakupay = await OtakupayModel.findById(
				partnerOtakupayID
			);

			if (!partnerOtakupay || !partnerOtakupay.balancePending) {
				res.status(404).json({
					message:
						"Partner OtakuPay ou Balance Pending não encontrado!",
				});
				return;
			}

			const currentDecryptPartnerBalanceAvailable = decrypt(
				partnerOtakupay.balanceAvailable
			);

			// Verificar se o Partner Balance Available atual não é nulo
			if (currentDecryptPartnerBalanceAvailable === null) {
				res.status(500).json({
					message: "Erro ao descriptografar o balancePending.",
				});
				return;
			}

			console.log(
				"Partner Balance Available Atual:",
				currentDecryptPartnerBalanceAvailable.toFixed(2)
			);

			const currentDecryptPartnerBalancePending = decrypt(
				partnerOtakupay.balancePending
			);

			// Verificar se o Partner Balance Pending atual não é nulo
			if (currentDecryptPartnerBalancePending === null) {
				res.status(500).json({
					message: "Erro ao descriptografar o balancePending.",
				});
				return;
			}

			// SERÁ NECESSÁRIO ALTERAR O MODEL DE ORDER, POIS É NECESSÁRIO DESMEBRAR OS VALORES PARA QUE NÃO TENHA ERROS
			const orderCostTotal = order.customerOrderCostTotal;

			if (currentDecryptPartnerBalancePending < Number(orderCostTotal)) {
				res.status(500).json({
					message:
						"Não há Partner Balance Pending suficiente para realizar a operação!",
				});
				return;
			}

			// Atenção: Foi usado o any para parar o erro, verificar a tipagem adequada
			const commissionOtamart: any = order.partnerCommissionOtamart;
			const decryptedCommissionOtamart = decrypt(commissionOtamart);

			// // PRECISO ALTERAR E INCLUIR ESSA INFORMAÇÃO NA CRIAÇÃO DO PEDDIDO
			// const otakuPointsPaid = decrypt(order.partnerOtakuPointsPaid);

			// if (otakuPointsPaid === null) {
			// 	res.status(500).json({
			// 		message:
			// 			"Erro ao descriptografar o Customer Otaku Points Pending.",
			// 	});
			// 	return;
			// }

			console.log(
				"COMISSÃO + CASHBACK PAGO:",
				decryptedCommissionOtamart
			);

			const newPartnerBalanceAvailable =
				currentDecryptPartnerBalanceAvailable +
				(orderCostTotal - Number(decryptedCommissionOtamart));

			const newEncryptedPartnerBalanceAvailable = encrypt(
				newPartnerBalanceAvailable.toString()
			);

			console.log(
				"Novo Partner Balance Available:",
				newPartnerBalanceAvailable.toFixed(2)
			);

			const newPartnerBalancePending =
				currentDecryptPartnerBalancePending - Number(orderCostTotal);

			const newEncryptedPartnerBalancePending = encrypt(
				newPartnerBalancePending.toString()
			);

			console.log(
				"Novo Partner Balance Pending:",
				newPartnerBalancePending.toFixed(2)
			);

			// *********************************************************************************************** //

			// Verificar se o Customer e o OtakuPayID existem
			if (!customer || !customer.otakupayID) {
				res.status(404).json({
					message: "Customer ou otakupayID não encontrado!",
				});
				return;
			}

			// Encontrar o OtakuPay do Customer
			const customerOtakupayID = customer.otakupayID;
			const customerOtakupay = await OtakupayModel.findById(
				customerOtakupayID
			);

			// Verificar se o CustomerOtakuPay e o Otaku Points Pending existem
			if (!customerOtakupay || !customerOtakupay.otakuPointsPending) {
				res.status(404).json({
					message:
						"Customer OtakuPay ou Otaku Points Pending não encontrado!",
				});
				return;
			}

			// Descriptografar o Customer Otaku Points Pending Atual
			const currentDecryptCustomerOtakuPointsPending = decrypt(
				customerOtakupay.otakuPointsPending
			);

			// Verificar se o Customer Otaku Points Pending Atual não é nulo
			if (currentDecryptCustomerOtakuPointsPending === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar o Customer Otaku Points Pending.",
				});
				return;
			}

			console.log(
				"Customer Otaku Points Pending Atual:",
				currentDecryptCustomerOtakuPointsPending.toFixed(2)
			);

			// Descriptografar o Customer Otaku Points Available Atual
			const currentDecryptCustomerOtakuPointsAvailable = decrypt(
				customerOtakupay.otakuPointsAvailable
			);

			// Verificar se o Customer Otaku Points Available atual não é nulo
			if (currentDecryptCustomerOtakuPointsAvailable === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar o Customer Otaku Points Available.",
				});
				return;
			}

			console.log(
				"Customer Otaku Points Available Atual:",
				currentDecryptCustomerOtakuPointsAvailable.toFixed(2)
			);

			// INCLUIR NOVAMENTE NA ORDER CRIADA
			const customerOtakuPointsEarned = decrypt(
				order.customerOtakuPointsEarned
			);

			// Verificar se o Customer Otaku Points Earned não é nulo
			if (customerOtakuPointsEarned === null) {
				res.status(500).json({
					message:
						"Erro ao descriptografar o Customer Otaku Points Available.",
				});
				return;
			}

			console.log(
				"Pontos Ganhos com o Pedido",
				customerOtakuPointsEarned.toFixed(2)
			);

			if (
				currentDecryptCustomerOtakuPointsPending <
				customerOtakuPointsEarned
			) {
				res.status(500).json({
					message:
						"Não há Customer Otaku Points Pending suficiente para realizar a operação!",
				});
				return;
			}

			const newCustomerOtakuPointsPending =
				currentDecryptCustomerOtakuPointsPending -
				customerOtakuPointsEarned;

			const newEncryptedCustomerOtakuPointsPending = encrypt(
				newCustomerOtakuPointsPending.toString()
			);

			console.log(
				"Novo Customer Otaku Points Pending",
				newCustomerOtakuPointsPending.toFixed(2)
			);

			const newCustomerOtakuPointsAvailable =
				currentDecryptCustomerOtakuPointsAvailable +
				customerOtakuPointsEarned;

			const newEncryptedCustomerOtakuPointsAvailable = encrypt(
				newCustomerOtakuPointsAvailable.toString()
			);

			console.log(
				"Novo Customer Otaku Points Available",
				newCustomerOtakuPointsAvailable.toFixed(2)
			);

			// *********************************************************************************************** //

			// Setar o novo Status da Order
			order.statusOrder = newStatusOrder;

			// Setar o novo Status de Envio
			order.statusShipping = newStatusOrder;

			// Setar o novo Customer Otaku Points Pending
			customerOtakupay.otakuPointsPending =
				newEncryptedCustomerOtakuPointsPending;

			// Setar o novo Customer Otaku Points Available
			customerOtakupay.otakuPointsAvailable =
				newEncryptedCustomerOtakuPointsAvailable;

			// Setar o novo Partner Balance Pending
			partnerOtakupay.balancePending = newEncryptedPartnerBalancePending;

			// Setar o novo Partner Balance Available
			partnerOtakupay.balanceAvailable =
				newEncryptedPartnerBalanceAvailable;

			// Salvar as atualizações da Order
			await order.save();

			// Salvar as atualizações do Customer OtakuPay
			await customerOtakupay.save();

			// Salvar as atualizações do Partner OtakuPay
			await partnerOtakupay.save();

			res.status(200).json({
				message: "Recebimento do pedido confirmado com sucesso!",
			});
		} catch (err) {
			console.log(err);
		}
	}

	static async markPacked(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(422).json({
				message: "O ID do pedido é obrigatório!",
			});
			return;
		}

		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(422).json({
				message: "Usuário não encontrado!",
			});
			return;
		}

		if (partner.accountType !== "partner") {
			res.status(422).json({
				message:
					"Você não possuo autorização para realizar essa requsição!",
			});
			return;
		}

		try {
			const order = await OrderModel.findById(id);

			if (!order) {
				res.status(422).json({
					message: "Pedido não encontrado!",
				});
				return;
			}

			if (order.statusShipping === "Embalado") {
				res.status(422).json({
					message: "Pedido já marcado como embalado!",
				});
				return;
			}

			if (order.statusShipping !== "Pendente") {
				res.status(422).json({
					message: "O Pedido não pode ser marcado como embalado!",
				});
				return;
			}

			order.statusShipping = "Embalado";
			order.dateMarkedPacked = new Date(); // Aqui você insere a data atual

			await order.save(); // Salva as alterações no banco de dados

			res.status(200).json({
				message: "Pedido marcado como embalado com sucesso!",
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({ message: "Erro ao marcado como embalado!" });
		}
	}

	static async updateTrackingCode(req: Request, res: Response) {
		const { id } = req.params;
		const { logisticOperator, trackingCode } = req.body;

		if (!id) {
			res.status(422).json({ message: "O ID do pedido é obrigatório!" });
			return;
		}

		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(422).json({
				message: "Usuário não encontrado!",
			});
			return;
		}

		if (partner.accountType !== "partner") {
			res.status(422).json({
				message:
					"Você não possuo autorização para realizar essa requsição!",
			});
			return;
		}

		if (!logisticOperator) {
			res.status(422).json({
				message: "O Operador Logístico é obrigatório!",
			});
			return;
		}

		if (!trackingCode) {
			res.status(422).json({
				message: "O código de rastreio é obrigatório!",
			});
			return;
		}

		try {
			const order = await OrderModel.findById(id);

			if (!order) {
				res.status(422).json({
					message: "Pedido não encontrado!",
				});
				return;
			}

			if (order.statusShipping === "Enviado") {
				res.status(422).json({
					message: "Pedido já enviado!",
				});
				return;
			}

			if (order.statusShipping !== "Embalado") {
				res.status(422).json({
					message: "O Pedido não pode ser marcado como enviado!",
				});
				return;
			}

			order.statusOrder = "Enviado";
			order.statusShipping = "Enviado";
			order.logisticOperator = logisticOperator;
			order.trackingCode = trackingCode;

			await order.save(); // Salva as alterações no banco de dados

			res.status(200).json({ message: "Rastreio enviado com sucesso!" });
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: "Erro ao atualizar o código de rastreamento!",
			});
		}
	}

	// static async reviewOrder(req: Request, res: Response) {
	// 	res.status(200).json({ message: "Teste realizado com sucesso!" });
	// }
}

export default OrderController;
