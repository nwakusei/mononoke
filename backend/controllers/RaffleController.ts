import { Request, Response } from "express";
import { RaffleModel } from "../models/RaffleModel.js";
import crypto from "crypto";

// Model
import { OtakupayModel } from "../models/OtakupayModel.js";

// Middlewares
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import { imageUpload } from "../helpers/image-upload.js";
import { isValidObjectId } from "mongoose";

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
			const raffle = new RaffleModel({
				rafflePrize: rafflePrize,
				imagesRaffle: [],
				raffleDate: raffleDate,
				raffleCost: raffleCost,
				raffleDescription: raffleDescription,
				raffleRules: raffleRules,
				minNumberParticipants: minNumberParticipants,
				raffleOrganizer: partner.name,
				partnerID: partner.id,
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

	static async getAllRaffle(req: Request, res: Response) {
		const raffles = await RaffleModel.find();

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

		const raffleID = await RaffleModel.findById({ _id: id });

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

		const customerOtakuPay = await OtakupayModel.findById({
			_id: otakuPayID,
		});

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

		if (!raffleCost) {
			res.status(422).json({
				message: "Custo do Sorteio não encontrado!",
			});
			return;
		}

		try {
			if (Number(otakuPointsAvailableDecrypted) < Number(raffleCost)) {
				res.status(422).json({
					message: "Otaku Points insuficiente!",
				});
				return;
			}

			//////////////////////////////////////////////////////////////////////////////

			// Função para gerar um número de ticket único
			const generateSequentialTicket = async (): Promise<string> => {
				// Busca o maior número de ticket existente
				const lastParticipant = await RaffleModel.aggregate([
					{ $unwind: "$activeParticipants" },
					{ $sort: { "activeParticipants.ticket": -1 } },
					{ $limit: 1 },
				]);

				let ticketNumber = 100000; // Número inicial

				if (lastParticipant.length > 0) {
					ticketNumber =
						parseInt(lastParticipant[0].activeParticipants.ticket) +
						1;
				}

				return ticketNumber.toString();
			};

			// const generateUniqueTicket = async (): Promise<string> => {
			// 	let ticketNumber = Math.floor(
			// 		100000 + Math.random() * 900000
			// 	).toString(); // Gera um número de 6 dígitos
			// 	let ticketExists = true;

			// 	while (ticketExists) {
			// 		// Verifique se o ticket já existe no banco de dados
			// 		ticketExists = !!(await RaffleModel.exists({
			// 			"activeParticipants.ticket": ticketNumber,
			// 		}));
			// 		if (ticketExists) {
			// 			ticketNumber = Math.floor(
			// 				100000 + Math.random() * 900000
			// 			).toString(); // Gera outro número se o atual já estiver em uso
			// 		}
			// 	}

			// 	return ticketNumber;
			// };

			// Crie um novo participante ativo
			const newParticipant = {
				customerID: customer._id.toString(),
				customerName: customer.name,
				ticket: await generateSequentialTicket(), // Você pode gerar ou definir o número do ticket conforme necessário
			};

			// Adicione o novo participante ao sorteio
			raffleID.activeParticipants.push(newParticipant);

			// Salve as alterações no sorteio
			await raffleID.save();

			/////////////////////////////////////////////////////////////////////////////

			const newOtakuPointsAvailableDecrypted =
				Number(otakuPointsAvailableDecrypted) - Number(raffleCost);

			console.log(
				"NOVO OTAKU POINTS AVAILABLE DESCRIPTOGRAFADO:",
				newOtakuPointsAvailableDecrypted
			);

			const newOtakuPointsAvailableCrypted = encrypt(
				newOtakuPointsAvailableDecrypted.toString()
			);

			console.log(
				"NOVO OTAKU POINTS AVAILABLE CRIPTOGRAFADO:",
				newOtakuPointsAvailableCrypted
			);

			customerOtakuPay.otakuPointsAvailable =
				newOtakuPointsAvailableCrypted;

			await customerOtakuPay.save();

			res.status(201).json({
				message: "Participação registrada com sucesso!",
				newParticipant,
			});
		} catch (error) {
			console.log(error);
		}
	}

	static async drawRaffle(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(422).json({ message: "O ID do Sorteio é obrigatório!" });
			return;
		}

		try {
			const raffle = await RaffleModel.findById(id);

			if (!raffle) {
				res.status(404).json({ message: "Sorteio não encontrado!" });
				return;
			}

			const participants = raffle.activeParticipants;

			if (!participants || participants.length === 0) {
				res.status(422).json({
					message: "Nenhum participante encontrado!",
				});
				return;
			}

			// Função para realizar o sorteio de forma segura
			const drawWinner = (participants: string | any[]) => {
				const winnerIndex = Math.floor(
					Math.random() * participants.length
				);
				return participants[winnerIndex];
			};

			const winner = drawWinner(participants);

			res.status(200).json({
				message: "Sorteio realizado com sucesso!",
				winner,
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({ message: "Erro ao realizar o sorteio!" });
		}
	}
}

export default RaffleController;
