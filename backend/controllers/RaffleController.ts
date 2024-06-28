import { Request, Response } from "express";
import { RaffleModel } from "../models/RaffleModel.js";

// Middlewares
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import { imageUpload } from "../helpers/image-upload.js";
import { isValidObjectId } from "mongoose";

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
}

export default RaffleController;
