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
				imagesRaffle: [],
				raffleDate: formattedRaffleDate,
				raffleCost: raffleCost,
				raffleDescription: raffleDescription,
				raffleRules: raffleRules,
				minNumberParticipants: minNumberParticipants,
				raffleOrganizer: partner.name,
				adultRaffle: adultRaffle,
				partnerID: partner.id,
				// winner: {},
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

	// static async subscriptionRaffle(req: Request, res: Response) {
	// 	const { id } = req.params;

	// 	if (!id) {
	// 		res.status(422).json({ message: "O ID do Sorteio é obrigatório!" });
	// 		return;
	// 	}

	// 	const raffleID = await RaffleModel.findById(id);

	// 	if (!raffleID) {
	// 		res.status(404).json({ message: "Sorteio não encontrado!" });
	// 		return;
	// 	}

	// 	// Verifica se o sorteio já tem um vencedor
	// 	if (raffleID.winner && raffleID.winner.ticketNumber) {
	// 		res.status(422).json({
	// 			message: "Este sorteio já tem um vencedor!",
	// 		});
	// 		return;
	// 	}

	// 	// Verifica se a data do sorteio já passou para sorteios pagos
	// 	const currentDate = new Date();
	// 	if (
	// 		raffleID.raffleCost > 0 &&
	// 		new Date(raffleID.raffleDate) < currentDate
	// 	) {
	// 		res.status(422).json({ message: "A data do sorteio já passou!" });
	// 		return;
	// 	}

	// 	const token: any = getToken(req);
	// 	const customer = await getUserByToken(token);

	// 	if (!customer) {
	// 		res.status(422).json({ message: "Customer não encontrado!" });
	// 		return;
	// 	}

	// 	if (customer.accountType !== "customer") {
	// 		res.status(422).json({
	// 			message: "Usuário sem permissão para participar de Sorteios!",
	// 		});
	// 		return;
	// 	}

	// 	const otakuPayID = customer?.otakupayID;
	// 	const customerOtakuPay = await OtakupayModel.findById(otakuPayID);

	// 	if (!customerOtakuPay) {
	// 		res.status(422).json({
	// 			message: "OtakuPay do Customer não encontrado!",
	// 		});
	// 		return;
	// 	}

	// 	const otakuPointsAvailableCrypted =
	// 		customerOtakuPay.otakuPointsAvailable;
	// 	const otakuPointsAvailableDecrypted = decrypt(
	// 		otakuPointsAvailableCrypted
	// 	)?.toFixed(2);

	// 	if (!otakuPointsAvailableDecrypted) {
	// 		res.status(422).json({
	// 			message: "Otaku Points Available não encontrado!",
	// 		});
	// 		return;
	// 	}

	// 	const raffleCost = raffleID?.raffleCost;

	// 	if (raffleCost === undefined || raffleCost === null) {
	// 		res.status(422).json({
	// 			message: "Custo do Sorteio não encontrado!",
	// 		});
	// 		return;
	// 	}

	// 	if (typeof raffleCost !== "number") {
	// 		res.status(422).json({
	// 			message: "Custo do Sorteio é inválido!",
	// 		});
	// 		return;
	// 	}

	// 	try {
	// 		// Verifica se o sorteio é gratuito e se o usuário já possui um ticket
	// 		if (raffleCost === 0) {
	// 			const existingTicket = raffleID.registeredTickets.find(
	// 				(ticket) => ticket.customerID === customer._id.toString()
	// 			);

	// 			if (existingTicket) {
	// 				res.status(422).json({
	// 					message: "Você já está participando deste sorteio!",
	// 				});
	// 				return;
	// 			}
	// 		} else {
	// 			// Verifica se o usuário tem Otaku Points suficientes para o sorteio pago
	// 			if (
	// 				Number(otakuPointsAvailableDecrypted) < Number(raffleCost)
	// 			) {
	// 				res.status(422).json({
	// 					message: "Otaku Points insuficiente!",
	// 				});
	// 				return;
	// 			}

	// 			// Atualiza os pontos disponíveis do usuário
	// 			const newOtakuPointsAvailableDecrypted =
	// 				Number(otakuPointsAvailableDecrypted) - Number(raffleCost);
	// 			const newOtakuPointsAvailableCrypted = encrypt(
	// 				newOtakuPointsAvailableDecrypted.toString()
	// 			);
	// 			customerOtakuPay.otakuPointsAvailable =
	// 				newOtakuPointsAvailableCrypted;
	// 			await customerOtakuPay.save();
	// 		}

	// 		// Função para gerar um número de ticket único
	// 		const generateSequentialTicket = async (): Promise<string> => {
	// 			try {
	// 				// Busca o maior número de ticket existente
	// 				const lastTicket = await RaffleModel.aggregate([
	// 					{ $unwind: "$registeredTickets" },
	// 					{ $sort: { "registeredTickets.ticketNumber": -1 } },
	// 					{ $limit: 1 },
	// 				]);

	// 				let ticketNumber = 100000; // Número inicial

	// 				if (lastTicket.length > 0) {
	// 					const lastTicketNumber = parseInt(
	// 						lastTicket[0].registeredTickets.ticketNumber,
	// 						10
	// 					);

	// 					if (!isNaN(lastTicketNumber)) {
	// 						ticketNumber = lastTicketNumber + 1;
	// 					}
	// 				}

	// 				return ticketNumber.toString();
	// 			} catch (error) {
	// 				console.error("Erro ao gerar número de ticket:", error);
	// 				throw error;
	// 			}
	// 		};

	// 		// Crie um novo participante ativo
	// 		const newTicket = {
	// 			customerID: customer._id.toString(),
	// 			customerName: customer.name,
	// 			ticketNumber: await generateSequentialTicket(),
	// 		};

	// 		// Adicione o novo participante ao sorteio
	// 		raffleID.registeredTickets.push(newTicket);

	// 		// Salve as alterações no sorteio
	// 		await raffleID.save();

	// 		res.status(201).json({
	// 			message: "Ticket registrado com sucesso!",
	// 			newTicket,
	// 		});
	// 	} catch (error) {
	// 		console.log(error);
	// 		res.status(500).json({ message: "Erro ao registrar o ticket!" });
	// 	}
	// }

	static async subscriptionRaffle(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(422).json({ message: "O ID do Sorteio é obrigatório!" });
			return;
		}

		const raffleID = await RaffleModel.findById(id);

		if (!raffleID) {
			res.status(404).json({ message: "Sorteio não encontrado!" });
			return;
		}

		// Verifica se o sorteio já tem um vencedor
		if (raffleID.winner && raffleID.winner.ticketNumber) {
			res.status(422).json({
				message: "Este sorteio já foi realizado!",
			});
			return;
		}

		// Verifica se a data do sorteio já passou para sorteios pagos
		const currentDate = new Date();
		if (
			raffleID.raffleCost > 0 &&
			new Date(raffleID.raffleDate) < currentDate
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

		const otakuPayID = customer?.otakupayID;
		const customerOtakuPay = await OtakupayModel.findById(otakuPayID);

		if (!customerOtakuPay) {
			res.status(422).json({
				message: "OtakuPay do Customer não encontrado!",
			});
			return;
		}

		const otakuPointsAvailableCrypted =
			customerOtakuPay.otakuPointsAvailable;
		const otakuPointsAvailableDecrypted = decrypt(
			otakuPointsAvailableCrypted
		)?.toFixed(2);

		if (!otakuPointsAvailableDecrypted) {
			res.status(422).json({
				message: "Otaku Points Available não encontrado!",
			});
			return;
		}

		const raffleCost = raffleID?.raffleCost;

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
				const existingTicket = raffleID.registeredTickets.find(
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
					Number(otakuPointsAvailableDecrypted) < Number(raffleCost)
				) {
					res.status(422).json({
						message: "Otaku Points insuficiente!",
					});
					return;
				}

				// Atualiza os pontos disponíveis do usuário
				const newOtakuPointsAvailableDecrypted =
					Number(otakuPointsAvailableDecrypted) - Number(raffleCost);
				const newOtakuPointsAvailableCrypted = encrypt(
					newOtakuPointsAvailableDecrypted.toString()
				);
				customerOtakuPay.otakuPointsAvailable =
					newOtakuPointsAvailableCrypted;
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
				customerName: customer.name,
				customerProfileImage: customer.profileImage,
				ticketNumber: ticketNumber,
			};

			// Adicione o novo participante ao sorteio
			raffleID.registeredTickets.push(newTicket);

			// Salve as alterações no sorteio
			await raffleID.save();

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
					message: "Nenhum participante localizado!",
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

			// Atualizar o documento do sorteio com o vencedor
			raffle.winner = {
				customerID: winner.customerID,
				customerName: winner.customerName,
				customerProfileImage: winner.customerProfileImage,
				ticketNumber: winner.ticketNumber, // Adapte se necessário
			};

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

			res.status(200).json({ raffles: raffles });
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

			if (!raffle) {
				res.status(404).json({ message: "Sorteio não encontrado!" });
				return;
			}

			if (raffle.partnerID.toString() !== partner._id.toString()) {
				res.status(403).json({ message: "Acesso negado ao sorteio!" });
				return;
			}

			res.status(200).json({ raffle: raffle });
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
}

export default RaffleController;
