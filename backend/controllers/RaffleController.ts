import { Request, Response } from "express";

// Middlewares
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

class RaffleController {
	static async createRaffle(req: Request, res: Response) {
		const { raffleTittle, rafflePrice, raffleProduct } = req.body;

		if (!raffleTittle) {
			res.status(422).json({
				message: "O título do sorteio é obrigatório!",
			});
			return;
		}

		if (!rafflePrice) {
			res.status(422).json({
				message: "O custo do sorteio é obrigatório!",
			});
			return;
		}

		if (!raffleProduct) {
			res.status(422).json({
				message: "O produto a ser sorteado é obrigatório!",
			});
			return;
		}

		res.status(201).json({ message: "Sorteio criado com sucesso!" });
	}
}

export default RaffleController;
