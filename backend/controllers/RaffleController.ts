import { Request, Response } from "express";
import { RaffleModel } from "../models/RaffleModel.js";

// Middlewares
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

class RaffleController {
	static async createRaffle(req: Request, res: Response) {
		const { rafflePrize, raffleDate, raffleCost, raffleOrganizer } =
			req.body;

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

		if (!raffleOrganizer) {
			res.status(422).json({
				message: "O organizador do sorteio é obrigatório!",
			});
			return;
		}

		try {
			const raffle = new RaffleModel({
				rafflePrize,
				raffleDate,
				raffleCost,
				raffleOrganizer,
				partnerID: partner.id,
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
}

export default RaffleController;
