import { Request, Response } from "express";
import { RaffleModel } from "../models/RaffleModel.js";
import crypto from "crypto";
import { isValidObjectId } from "mongoose";
import mongoose from "mongoose"; // Adicione esta linha no início do arquivo

// Model
import { OtakupayModel } from "../models/OtakupayModel.js";

// Middlewares
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import { CustomerModel } from "../models/CustomerModel.js";
import { PartnerModel } from "../models/PartnerModel.js";
import { console } from "inspector";
import { TransactionModel } from "../models/TransactionModel.js";
import axios, { AxiosRequestConfig } from "axios";

// Chave para criptografar e descriptografar dados sensíveis no Banco de Dados
const secretKey = process.env.AES_SECRET_KEY as string;

if (secretKey.length !== 32) {
	throw new Error("A chave precisa ter 32 caracteres para o AES-256");
}

// Função para Criptografar dados sensíveis no Banco de Dados

function encrypt(balance: string): string {
	const iv = crypto.randomBytes(16); // Gera um IV aleatório
	const cipher = crypto.createCipheriv(
		"aes-256-cbc",
		Buffer.from(secretKey, "utf-8"),
		iv
	);
	let encrypted = cipher.update(balance, "utf8", "hex");
	encrypted += cipher.final("hex");

	// Combina o IV com o texto criptografado
	return iv.toString("hex") + ":" + encrypted;
}

// Esta função processa o texto criptografado com o IV concatenado:
function decrypt(encryptedBalance: string): number | null {
	let decrypted = "";

	try {
		// Divide o IV do texto criptografado
		const [ivHex, encryptedData] = encryptedBalance.split(":");
		if (!ivHex || !encryptedData) {
			throw new Error("Formato inválido do texto criptografado.");
		}

		const iv = Buffer.from(ivHex, "hex");

		const decipher = crypto.createDecipheriv(
			"aes-256-cbc",
			Buffer.from(secretKey, "utf-8"),
			iv
		);

		decrypted = decipher.update(encryptedData, "hex", "utf8");
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

class RaffleController {
	static async createRaffle(req: Request, res: Response) {
		const {
			rafflePrize,
			raffleDate,
			raffleCost,
			raffleDescription,
			raffleRules,
			minNumberParticipants,
			adultRaffle,
		} = req.body;

		const imagesRaffle = req.files as Express.Multer.File[];

		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		if (partner?.accountType !== "partner") {
			res.status(422).json({
				message: "Você não possui permissão para executar esta ação!",
			});
			return;
		}

		if (!rafflePrize) {
			res.status(422).json({
				message: "O prêmio do sorteio é obrigatório!",
			});
			return;
		}

		if (!raffleDate) {
			res.status(422).json({
				message: "A data de realização do sorteado é obrigatória!",
			});
			return;
		}

		if (!raffleCost) {
			res.status(422).json({
				message: "O custo do sorteio é obrigatório!",
			});
			return;
		}

		if (!minNumberParticipants) {
			res.status(422).json({
				message:
					"A quantidade mínima de participantes do sorteio é obrigatória!",
			});
			return;
		}

		if (!raffleDescription) {
			res.status(422).json({
				message: "A descrição do Sorteio é obrigatória!",
			});
			return;
		}

		if (!raffleRules) {
			res.status(422).json({
				message: "Defina as regras do Sorteio!",
			});
			return;
		}

		if (!imagesRaffle || imagesRaffle.length === 0) {
			res.status(422).json({ message: "A imagem é obrigatória!" });
			return;
		}

		try {
			// Função para converter a string "dd/MM/yyyy" para um objeto Date
			const parseDate = (dateString: string) => {
				const [day, month, year] = dateString.split("/");
				return new Date(`${year}-${month}-${day}`);
			};

			// Converte a data recebida para um objeto Date
			const formattedRaffleDate = parseDate(raffleDate);

			const raffle = new RaffleModel({
				rafflePrize: rafflePrize,
				raffleStatus: "Pending", // Status inicial do sorteio
				imagesRaffle: [],
				raffleDate: formattedRaffleDate,
				raffleCost: raffleCost,
				raffleAccumulatedValue: encrypt("0.00"), // Valor acumulado inicial é 0.00
				rafflePartnerCommission: encrypt("0.00"), // Comissão inicial é 0.00
				raffleDescription: raffleDescription,
				raffleRules: raffleRules,
				minNumberParticipants: minNumberParticipants,
				raffleOrganizer: partner.name,
				raffleOrganizerNickname: partner.nickname,
				adultRaffle: adultRaffle,
				partnerID: partner.id,
				// winner: {},
				statusShipping: "Pending", // Status de envio inicial
				trackingCode: "",
			});

			// Percorrer o Array de imagens e adicionar cada uma a uma ao sorteio que será criado
			imagesRaffle.forEach((imageRaffle: Express.Multer.File) => {
				console.log(imageRaffle);
				let image = "";

				if (imageRaffle) {
					if ("key" in imageRaffle) {
						// Estamos usando o armazenamento na AWS S3
						if (typeof imageRaffle.key === "string") {
							image = imageRaffle.key;
						}
					} else {
						// Estamos usando o armazenamento em ambiente local (Desenvolvimento)
						if (typeof imageRaffle.filename === "string") {
							image = imageRaffle.filename;
						}
					}
				}

				// Adicionar a imagem ao Sorteio
				raffle.imagesRaffle.push(image);
			});

			const newRaffle = await raffle.save();

			res.status(201).json({
				message: "Sorteio criado com sucesso!",
				newRaffle,
			});
		} catch (err) {
			console.log(err);
		}
	}

	static async getAllRaffles(req: Request, res: Response) {
		const raffles = await RaffleModel.find().sort("-createdAt");

		res.status(200).json({ raffles: raffles });
	}

	static async getRaffleByID(req: Request, res: Response) {
		const { id } = req.params;

		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "O ID do sorteio é inválido" });
			return;
		}

		const raffle = await RaffleModel.findById({ _id: id });

		if (!raffle) {
			res.status(404).json({ message: "Sorteio não encontrado" });
			return;
		}

		res.status(200).json({ raffle: raffle });
	}

	static async subscriptionRaffle(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(422).json({ message: "O ID do Sorteio é obrigatório!" });
			return;
		}

		const raffle = await RaffleModel.findById(id);

		if (!raffle) {
			res.status(404).json({ message: "Sorteio não encontrado!" });
			return;
		}

		// Verifica se o sorteio já tem um vencedor
		if (raffle.winner && raffle.winner.ticketNumber) {
			res.status(422).json({
				message: "Este sorteio já foi realizado!",
			});
			return;
		}

		// Verifica se a data do sorteio já passou para sorteios pagos
		const currentDate = new Date();

		if (
			raffle.raffleCost > 0 &&
			new Date(raffle.raffleDate) < currentDate
		) {
			res.status(422).json({ message: "A data do sorteio já passou!" });
			return;
		}

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!customer) {
			res.status(422).json({ message: "Customer não encontrado!" });
			return;
		}

		if (customer.accountType !== "customer") {
			res.status(422).json({
				message: "Usuário sem permissão para participar de Sorteios!",
			});
			return;
		}

		const customerOtakuPayID = customer?.otakupayID;

		const customerOtakuPay = await OtakupayModel.findById(
			customerOtakuPayID
		);

		if (!customerOtakuPay) {
			res.status(422).json({
				message: "OtakuPay do Customer não encontrado!",
			});
			return;
		}

		const customerOtakuPointsAvailableCrypted =
			customerOtakuPay.otakuPointsAvailable;

		const customerOtakuPointsAvailableDecrypted = decrypt(
			customerOtakuPointsAvailableCrypted
		)?.toFixed(2);

		if (!customerOtakuPointsAvailableDecrypted) {
			res.status(422).json({
				message: "Otaku Points Available não encontrado!",
			});
			return;
		}

		const raffleCost = raffle?.raffleCost;

		if (raffleCost === undefined || raffleCost === null) {
			res.status(422).json({
				message: "Custo do Sorteio não encontrado!",
			});
			return;
		}

		if (typeof raffleCost !== "number") {
			res.status(422).json({
				message: "Custo do Sorteio é inválido!",
			});
			return;
		}

		try {
			// Verifica se o sorteio é gratuito e se o usuário já possui um ticket
			if (raffleCost === 0) {
				const existingTicket = raffle.registeredTickets.find(
					(ticket) => ticket.customerID === customer._id.toString()
				);

				if (existingTicket) {
					res.status(422).json({
						message: "Você já está participando deste sorteio!",
					});
					return;
				}
			} else {
				// Verifica se o usuário tem Otaku Points suficientes para o sorteio pago
				if (
					Number(customerOtakuPointsAvailableDecrypted) <
					Number(raffleCost)
				) {
					res.status(422).json({
						message: "Otaku Points insuficiente!",
					});
					return;
				}

				// Atualiza os pontos disponíveis do usuário
				const newCustomerOtakuPointsAvailableDecrypted =
					Number(customerOtakuPointsAvailableDecrypted) -
					Number(raffleCost);

				const newCustomerOtakuPointsAvailableCrypted = encrypt(
					newCustomerOtakuPointsAvailableDecrypted.toString()
				);

				customerOtakuPay.otakuPointsAvailable =
					newCustomerOtakuPointsAvailableCrypted;

				await customerOtakuPay.save();
			}

			// Função para gerar um número de ticket único
			const generateSequentialTicket = async (
				raffleID: string
			): Promise<string> => {
				try {
					// Busca o maior número de ticket existente para o sorteio específico
					const lastTicket = await RaffleModel.aggregate([
						{
							$match: {
								_id: new mongoose.Types.ObjectId(raffleID),
							},
						}, // Filtra pelo ID do sorteio
						{ $unwind: "$registeredTickets" },
						{ $sort: { "registeredTickets.ticketNumber": -1 } },
						{ $limit: 1 },
					]);

					let ticketNumber = 100000; // Número inicial

					if (lastTicket.length > 0) {
						const lastTicketNumber = parseInt(
							lastTicket[0].registeredTickets.ticketNumber,
							10
						);

						if (!isNaN(lastTicketNumber)) {
							ticketNumber = lastTicketNumber + 1;
						}
					}

					return ticketNumber.toString();
				} catch (error) {
					console.error("Erro ao gerar número de ticket:", error);
					throw error;
				}
			};

			// Gera o número do ticket para o sorteio específico
			const ticketNumber = await generateSequentialTicket(id);

			// Crie um novo participante ativo
			const newTicket = {
				customerID: customer._id.toString(),
				customerNickname: customer.nickname,
				customerName: customer.name,
				customerProfileImage: customer.profileImage,
				ticketNumber: ticketNumber,
			};

			// Adicione o novo participante ao sorteio
			raffle.registeredTickets.push(newTicket);

			const PartnerID = raffle.partnerID;

			const partner = await PartnerModel.findById(PartnerID);

			if (!partner) {
				res.status(404).json({ message: "Parceiro não encontrado!" });
				return;
			}

			const partnerOtakuPayID = partner?.otakupayID;

			const partnerOtakuPay = await OtakupayModel.findById(
				partnerOtakuPayID
			);

			if (!partnerOtakuPay) {
				res.status(422).json({
					message: "OtakuPay do Parceiro não encontrado!",
				});
				return;
			}

			const partnerOtakuPointPedingEncrypted =
				partnerOtakuPay.otakuPointsPending;

			const partnerOtakuPointPedingDecrypted = decrypt(
				partnerOtakuPointPedingEncrypted
			)?.toFixed(2);

			if (!partnerOtakuPointPedingDecrypted) {
				res.status(422).json({
					message: "Otaku Points Peding não encontrado!",
				});
				return;
			}

			const newPartnerOtakuPointPedingDecrypted =
				Number(partnerOtakuPointPedingDecrypted) + Number(raffleCost);

			const newPartnerOtakuPointPedingEncrypted = encrypt(
				newPartnerOtakuPointPedingDecrypted.toString()
			);

			partnerOtakuPay.otakuPointsPending =
				newPartnerOtakuPointPedingEncrypted;

			const raffleAccumulatedValueEncrypted =
				raffle.raffleAccumulatedValue;

			console.log(
				"Valor acumulado do sorteio - Criptografado:",
				raffleAccumulatedValueEncrypted
			);

			const raffleAccumulatedValueDecrypted = decrypt(
				raffleAccumulatedValueEncrypted
			)?.toFixed(2);

			console.log(
				"Valor acumulado do sorteio - Descriptografado:",
				raffleAccumulatedValueDecrypted
			);

			const newRaffleAccumulatedValueDecrypted =
				Number(raffleAccumulatedValueDecrypted) + Number(raffleCost);

			const newRaffleAccumulatedValueEncrypted = encrypt(
				newRaffleAccumulatedValueDecrypted.toString()
			);

			// Comissão a ser paga pelo Partner
			const partnerComission = (raffleCost * 0.04).toFixed(2); // 4% de comissão

			const partnerComissionEncrypted = encrypt(partnerComission);

			raffle.raffleAccumulatedValue = newRaffleAccumulatedValueEncrypted;

			const rafflePartnerCommissionEncrypted =
				raffle.rafflePartnerCommission;

			if (!rafflePartnerCommissionEncrypted) {
				res.status(422).json({
					message: "Comissão do Parceiro não encontrada!",
				});
				return;
			}

			const rafflePartnerCommissionDecrypted = decrypt(
				rafflePartnerCommissionEncrypted
			)?.toFixed(2);

			const newRafflePartnerCommissionDecrypted =
				Number(rafflePartnerCommissionDecrypted) +
				Number(partnerComission);

			const newRafflePartnerCommissionEncrypted = encrypt(
				newRafflePartnerCommissionDecrypted.toString()
			);

			raffle.rafflePartnerCommission =
				newRafflePartnerCommissionEncrypted;

			// Registrar a transação
			const newTransaction = new TransactionModel({
				transactionType: "Pagamento",
				transactionTitle: "Aquisição de Ticket para Sorteio.",
				transactionDescription: `Troca por Ticket.`,
				transactionValue: encrypt(raffleCost.toFixed(2).toString()),
				transactionDetails: {
					detailProductServiceTitle: raffle.rafflePrize,
					detailCost: encrypt(raffleCost.toFixed(2).toString()),
					detailPaymentMethod: "Otaku Point",
					detailShippingCost: "N/A",
					detailSalesFee: partnerComissionEncrypted,
					detailCashback: "N/A",
				},
				plataformName: "Mononoke - Sorteio",
				payerID: customer.otakupayID,
				payerName: customer.name,
				payerProfileImage: customer.profileImage,
				receiverID: partner.otakupayID,
				receiverName: partner.name,
				receiverProfileImage: partner.profileImage,
			});

			// Salve as alterações no sorteio
			await raffle.save();
			await partnerOtakuPay.save();
			await newTransaction.save();

			// Responda com o novo ticket
			res.status(201).json({
				message: "Ticket registrado com sucesso!",
				newTicket,
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({ message: "Erro ao registrar o ticket!" });
		}
	}

	static async drawRaffle(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(422).json({ message: "O ID do Sorteio é obrigatório!" });
			return;
		}

		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		try {
			const raffle = await RaffleModel.findById(id);

			if (!raffle) {
				res.status(404).json({
					message: "Sorteio não encontrado!",
				});
				return;
			}

			if (raffle.partnerID.toString() !== partner._id.toString()) {
				res.status(403).json({
					message: "Acesso negado ao sorteio!",
				});
				return;
			}

			// Verifica se já existe um vencedor
			if (raffle.winner && raffle.winner.customerID) {
				res.status(422).json({
					message: "Este sorteio já foi realizado!",
				});
				return;
			}

			const participants = raffle.registeredTickets;

			if (!participants || participants.length === 0) {
				res.status(422).json({
					message: "Nenhum ticket localizado!",
				});
				return;
			}

			// Função para realizar o sorteio de forma segura
			const drawWinner = (participants: any[]) => {
				const winnerIndex = Math.floor(
					Math.random() * participants.length
				);
				return participants[winnerIndex];
			};

			const winner = drawWinner(participants);

			const customerID = winner.customerID;

			const customer = await CustomerModel.findById(customerID);

			if (!customer) {
				res.status(404).json({
					message: "Cliente não encontrado!",
				});
				return;
			}

			// Atualizar o documento do sorteio com o vencedor
			raffle.winner = {
				customerID: winner.customerID,
				customerNickname: winner.customerNickname,
				customerName: winner.customerName,
				customerProfileImage: winner.customerProfileImage,
				ticketNumber: winner.ticketNumber, // Adapte se necessário
				address: {
					street: customer.address[0].street || "",
					complement: customer.address[0].complement || "",
					neighborhood: customer.address[0].neighborhood || "",
					city: customer.address[0].city || "",
					state: customer.address[0].state || "",
					postalCode: customer.address[0].postalCode || "",
				},
			};

			raffle.raffleStatus = "Executed";

			await raffle.save();

			res.status(200).json({
				message: "Sorteio realizado com sucesso!",
				winner,
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: "Erro ao realizar o sorteio!",
			});
		}
	}

	static async getAllRafflesByPartner(req: Request, res: Response) {
		// Verificar o Administrador que cadastrou os Sorteios
		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(422).json({ message: "Usuário não encontrado!" });
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
			// Encontra todos os sorteios associados ao parceiro
			const raffles = await RaffleModel.find({
				partnerID: partner._id,
			}).sort("-createdAt");

			// Verificar se há orders
			if (raffles.length === 0) {
				res.status(200).json({ raffles: [] });
				return;
			}

			// Verifica se algum sorteio não está associado ao parceiro logado
			if (
				raffles.some(
					(raffle) =>
						raffle.partnerID.toString() !== partner._id.toString()
				)
			) {
				res.status(403).json({
					message: "Acesso negado ao sorteio!",
				});
				return;
			}

			// Descriptografar apenas o valor total do pedido
			const decryptedRaffles = raffles.map((raffle) => {
				const raffleObj = raffle.toObject();
				return {
					...raffleObj,

					raffleAccumulatedValue: decrypt(
						raffleObj.raffleAccumulatedValue
					),

					rafflePartnerCommission: decrypt(
						raffleObj.rafflePartnerCommission
					),
				};
			});

			res.status(200).json({ raffles: decryptedRaffles });
		} catch (error) {
			res.status(500).json({ error: "Erro ao carregar os Sorteios" });
		}
	}

	static async getRafflePartnerByID(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(422).json({ message: "O ID do Sorteio é obrigatório!" });
			return;
		}

		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		try {
			const raffle = await RaffleModel.findById(id);

			// Encontra todos os sorteios associados ao parceiro
			const raffles = await RaffleModel.find({
				partnerID: partner._id,
			}).sort("-createdAt");

			// Verificar se há orders
			if (raffles.length === 0) {
				res.status(200).json({ raffles: [] });
				return;
			}

			if (!raffle) {
				res.status(404).json({ message: "Sorteio não encontrado!" });
				return;
			}

			if (raffle.partnerID.toString() !== partner._id.toString()) {
				res.status(403).json({ message: "Acesso negado ao sorteio!" });
				return;
			}

			// Descriptografar apenas o valor total do pedido
			const decryptedRaffle = {
				...raffle.toObject(),
				raffleAccumulatedValue: decrypt(raffle.raffleAccumulatedValue),
				rafflePartnerCommission: decrypt(
					raffle.rafflePartnerCommission
				),
			};

			res.status(200).json({ raffle: decryptedRaffle });
		} catch (error) {
			res.status(500).json({ message: "Erro ao buscar o sorteio!" });
		}
	}

	static async getAllRafflesByCustomer(req: Request, res: Response) {
		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!customer) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		if (customer.accountType !== "customer") {
			res.status(422).json({
				message:
					"Você não possui autorização para visualizar essa página!",
			});
			return;
		}

		try {
			// Encontra todos os sorteios associados ao customer
			const raffles = await RaffleModel.find({
				registeredTickets: {
					$elemMatch: { customerID: customer._id },
				},
			}).sort("-createdAt");

			res.status(200).json({ raffles: raffles });
		} catch (error) {
			res.status(500).json({ error: "Erro ao carregar os Sorteios" });
		}
	}

	static async getRaffleCustomerByID(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(422).json({ message: "O ID do Sorteio é obrigatório!" });
			return;
		}

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!customer) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		if (customer.accountType !== "customer") {
			res.status(422).json({
				message:
					"Você não possui autorização para visualizar essa página!",
			});
			return;
		}

		try {
			const raffle = await RaffleModel.findById(id);

			if (!raffle) {
				res.status(404).json({ message: "Sorteio não encontrado!" });
				return;
			}

			// Verifica se o cliente tem pelo menos um ticket ativo no sorteio
			const activeTicket = raffle.registeredTickets.find(
				(ticket) =>
					ticket.customerID.toString() === customer._id.toString()
			);

			if (!activeTicket) {
				res.status(403).json({
					message:
						"Acesso negado. Você não possui tickets ativos neste sorteio.",
				});
				return;
			}

			// Remove campos indesejados, como 'registeredTickets'
			const {
				raffleCost,
				raffleDescription,
				raffleRules,
				registeredTickets,
				minNumberParticipants,
				partnerID,
				...raffleData
			} = raffle.toObject();

			res.status(200).json({ raffle: raffleData });
		} catch (error) {
			res.status(500).json({ error: "Erro ao carregar os Sorteios" });
		}
	}

	static async getAllTicketsByCustomer(req: Request, res: Response) {
		const { id } = req.params; // ID do sorteio

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		if (!customer) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		if (customer.accountType !== "customer") {
			res.status(422).json({
				message:
					"Você não possui autorização para visualizar essa página!",
			});
			return;
		}

		try {
			// Encontra o sorteio específico associado ao customer e extrai os tickets
			const raffle = await RaffleModel.findOne({
				_id: id, // ID do sorteio
				registeredTickets: {
					$elemMatch: { customerID: customer._id },
				},
			});

			if (!raffle) {
				res.status(404).json({
					message:
						"Sorteio não encontrado ou sem tickets para esse cliente!",
				});
				return;
			}

			// Extrai os tickets que pertencem ao customer dentro do sorteio especificado
			const tickets = raffle.registeredTickets.filter(
				(ticket) =>
					ticket.customerID.toString() === customer._id.toString()
			);

			res.status(200).json({ tickets: tickets });
		} catch (error) {
			res.status(500).json({ error: "Erro ao carregar os Sorteios" });
		}
	}

	static async markRafflePacked(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(422).json({
				message: "O ID do Sorteio é obrigatório!",
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
			const raffle = await RaffleModel.findById(id);

			if (!raffle) {
				res.status(422).json({
					message: "Sorteio não encontrado!",
				});
				return;
			}

			if (raffle.statusShipping === "Packed") {
				res.status(422).json({
					message: "Sorteio já marcado como embalado!",
				});
				return;
			}

			if (raffle.statusShipping !== "Pending") {
				res.status(422).json({
					message: "O Sorteio não pode ser marcado como embalado!",
				});
				return;
			}

			raffle.statusShipping = "Packed";

			await raffle.save(); // Salva as alterações no banco de dados

			res.status(200).json({
				message: "Sorteio marcado como embalado com sucesso!",
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({ message: "Erro ao marcar como embalado!" });
		}
	}

	static async updateTrackingCodeRaffle(req: Request, res: Response) {
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
			const raffle = await RaffleModel.findById(id);

			if (!raffle) {
				res.status(422).json({
					message: "Sorteio não encontrado!",
				});
				return;
			}

			if (raffle.statusShipping === "Shipped") {
				res.status(422).json({
					message: "Sorteio já enviado!",
				});
				return;
			}

			if (raffle.statusShipping !== "Packed") {
				res.status(422).json({
					message: "O Sorteio não pode ser marcado como enviado!",
				});
				return;
			}

			// order.statusOrder = "Shipped";
			raffle.statusShipping = "Shipped";
			raffle.logisticOperator = logisticOperator;
			raffle.trackingCode = trackingCode;

			await raffle.save(); // Salva as alterações no banco de dados

			res.status(200).json({ message: "Rastreio enviado com sucesso!" });
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: "Erro ao atualizar o código de rastreamento!",
			});
		}
	}

	// static async raffleMarkDelivered(req: Request, res: Response) {
	// 	const { id } = req.params;

	// 	if (!id) {
	// 		res.status(422).json({
	// 			message: "O ID do pedido é obrigatório!",
	// 		});
	// 		return;
	// 	}

	// 	const token: any = getToken(req);
	// 	const user = await getUserByToken(token);

	// 	if (!user) {
	// 		res.status(422).json({
	// 			message: "Usuário não encontrado!",
	// 		});
	// 		return;
	// 	}

	// 	try {
	// 		const raffle = await RaffleModel.findById(id);

	// 		if (!raffle) {
	// 			res.status(422).json({
	// 				message: "Sorteio não encontrado!",
	// 			});
	// 			return;
	// 		}

	// 		if (raffle.statusShipping === "Delivered") {
	// 			res.status(422).json({
	// 				message: "Sorteio já marcado como entregue!",
	// 			});
	// 			return;
	// 		}

	// 		if (
	// 			raffle.statusShipping !== "Shipped" &&
	// 			raffle.statusShipping !== "Not Delivered"
	// 		) {
	// 			res.status(422).json({
	// 				message: "O Pedido não pode ser marcado como entregue!",
	// 			});
	// 			return;
	// 		}

	// 		raffle.raffleStatus = "Delivered";
	// 		raffle.statusShipping = "Delivered";
	// 		raffle.markedDeliveredBy = user.accountType;
	// 		raffle.markedDeliveredAt = new Date(); // Aqui você insere a data atual

	// 		// if (user.accountType === "customer") {
	// 		// 	// Requisição teste para ativar outra requisição dentro da API
	// 		// 	const transactionRequestConfig: AxiosRequestConfig = {
	// 		// 		method: "post",
	// 		// 		url: "http://localhost:5000/otakupay/realease-values",
	// 		// 		headers: {
	// 		// 			"Content-Type": "application/json",
	// 		// 			Authorization: `Bearer ${token}`, // Se precisar de um token de autenticação
	// 		// 		},
	// 		// 		data: {
	// 		// 			// Dados que precisam ser enviados para a transação
	// 		// 			orderId: order._id,
	// 		// 		},
	// 		// 	};

	// 		// 	const transactionResponse = await axios(
	// 		// 		transactionRequestConfig
	// 		// 	);

	// 		// 	if (transactionResponse.status !== 200) {
	// 		// 		console.log(
	// 		// 			"Erro ao processar a transação, status:",
	// 		// 			transactionResponse.status
	// 		// 		);
	// 		// 		res.status(500).json({
	// 		// 			message: "Erro ao processar a transação!",
	// 		// 		});
	// 		// 		return;
	// 		// 	}
	// 		// }

	// 		await raffle.save(); // Salva as alterações no banco de dados

	// 		res.status(200).json({
	// 			message: "Pedido marcado como entregue com sucesso!",
	// 		});
	// 	} catch (error) {
	// 		console.log(error);
	// 		res.status(500).json({ message: "Erro ao marcar como entregue!" });
	// 	}
	// }

	static async raffleMarkDelivered(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(422).json({
				message: "O ID do Sorteio é obrigatório!",
			});
			return;
		}

		const token: any = getToken(req);
		const user = await getUserByToken(token);

		if (!user) {
			res.status(422).json({
				message: "Usuário não encontrado!",
			});
			return;
		}

		try {
			const raffle = await RaffleModel.findById(id);

			if (!raffle) {
				res.status(422).json({
					message: "Sorteio não encontrado!",
				});
				return;
			}

			if (raffle.statusShipping === "Delivered") {
				res.status(422).json({
					message: "Sorteio já marcado como entregue!",
				});
				return;
			}

			if (
				raffle.statusShipping !== "Shipped" &&
				raffle.statusShipping !== "Not Delivered"
			) {
				res.status(422).json({
					message: "O Sorteio não pode ser marcado como entregue!",
				});
				return;
			}

			switch (user.accountType) {
				case "partner":
					raffle.raffleStatus = "Delivered";
					break;
				case "customer":
					raffle.raffleStatus = "Completed";
					break;
				default:
					res.status(422).json({
						message: "Tipo de usuário inválido!",
					});
					return;
			}

			raffle.statusShipping = "Delivered";
			raffle.markedDeliveredBy = user.accountType;
			raffle.markedDeliveredAt = new Date(); // Aqui você insere a data atual

			if (user.accountType === "customer") {
				// Requisição teste para ativar outra requisição dentro da API
				const transactionRequestConfig: AxiosRequestConfig = {
					method: "post",
					url: "http://localhost:5000/otakupay/raffle-release-values",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`, // Se precisar de um token de autenticação
					},
					data: {
						// Dados que precisam ser enviados para a transação
						raffleID: raffle._id,
					},
				};

				const transactionResponse = await axios(
					transactionRequestConfig
				);

				if (transactionResponse.status !== 200) {
					console.log(
						"Erro ao processar a transação, status:",
						transactionResponse.status
					);
					res.status(500).json({
						message: "Erro ao processar a transação!",
					});
					return;
				}
			}

			// raffle.dateMarkedPacked = new Date(); // Aqui você insere a data atual

			await raffle.save(); // Salva as alterações no banco de dados

			res.status(200).json({
				message: "Sorteio marcado como entregue com sucesso!",
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({ message: "Erro ao marcar como entregue!" });
		}
	}
}

export default RaffleController;
