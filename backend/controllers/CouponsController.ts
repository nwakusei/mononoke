import { Request, Response } from "express";
import { CustomerModel } from "../models/CustomerModel.js";
import { CouponModel } from "../models/CouponModel.js";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Multer } from "multer";
import { ObjectId, isValidObjectId } from "mongoose";
import fetch from "node-fetch";

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

class CouponController {
	static async create(req: Request, res: Response) {
		const { discountPercentage, couponCode } = req.body;

		if (!discountPercentage) {
			res.status(422).json({
				message: "A porcentagem de disconto é obrigatória!",
			});
			return;
		}

		if (!couponCode) {
			res.status(422).json({
				message: "O código do cupom é obrigatório!",
			});
			return;
		}

		// Pegar o Administrador que será o responsável por criar o Cupom de Desconto
		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(401).json({ message: "Usuário não encontrado" });
			return;
		}

		if (partner.accountType !== "partner") {
			res.status(422).json({
				message:
					"Você não tem permissão para criar cupons de desconto!",
			});
			return;
		}

		const expirationDateFormatted = (dateString: string) => {
			const date = new Date(dateString);
			// Adicionando um dia à data
			date.setDate(date.getDate() + 7);
			const day = String(date.getDate()).padStart(2, "0");
			const month = String(date.getMonth() + 1).padStart(2, "0"); // January is 0!
			const year = String(date.getFullYear()).slice(-4);

			return `${day}/${month}/${year}`;
		};

		// Obtendo a data atual
		const currentDate = new Date();

		// Formatando a data atual e armazenando como uma string
		const formattedCurrentDate = expirationDateFormatted(
			currentDate.toISOString()
		);

		// Criar um novo cupom de desconto
		const coupon = new CouponModel({
			discountPercentage: discountPercentage,
			couponCode: couponCode,
			expirationDate: formattedCurrentDate,
			partnerID: partner._id,
		});

		try {
			const newCoupon = await coupon.save();

			res.status(200).json({
				message: "Cupom criado com sucesso!",
				newCoupon,
			});
		} catch (error) {
			console.log(error);
			res.status(500).json({
				message: "Erro ao criar o cupom!",
			});
			return;
		}
	}

	static async getAllCoupons(req: Request, res: Response) {
		try {
			// Buscar todos os cupons
			const coupons = await CouponModel.find().sort("-createdAt");

			const filteredCoupons = coupons.filter((coupon) => {
				// Divide a string da data de expiração em dia, mês e ano
				const [day, month, year] = coupon.expirationDate.split("/");

				// Obtém a data atual ajustada para a meia-noite no fuso horário de Brasília (UTC-3)
				const currentDate = new Date(
					new Date().getTime() - 3 * 60 * 60 * 1000
				);

				// Cria um novo objeto de data com a data de expiração do cupom, ajustado para o fuso horário de Brasília (UTC-3)
				const expirationDate = new Date(
					Date.UTC(
						Number(year),
						Number(month) - 1,
						Number(day),
						23,
						59,
						59,
						999
					)
				);

				// Log das datas para depuração
				console.log("Current Date:", currentDate);
				console.log("Expiration Date:", expirationDate);

				// Verifica se a expirationDate é posterior ou igual à data atual
				const isActive = expirationDate >= currentDate;
				console.log("Está ativo?:", isActive);

				return isActive;
			});

			res.status(200).json({ coupons: filteredCoupons });
		} catch (error) {
			res.status(500).json({ error: "Erro ao carregar os Cupons" });
		}
	}

	static async getAllCouponsByPartner(req: Request, res: Response) {
		// Verificar o Administrador que cadastrou os Cupons
		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(401).json({ message: "Usuário não encontrado" });
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
			const coupons = await CouponModel.find({
				partnerID: partner._id,
			}).sort("-createdAt");

			res.status(200).json({ coupons: coupons });
		} catch (error) {
			res.status(500).json({ error: "Erro ao carregar os Cupons" });
			return;
		}
	}

	static async removeCouponById(req: Request, res: Response) {
		const { id } = req.body;

		// Verificar se o ID é válido
		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "ID inválido!" });
			return;
		}

		// Verificar se o Cupom Existe
		const coupon = await CouponModel.findById({ _id: id });

		if (!coupon) {
			res.status(404).json({ message: "Cupom não encontrado!" });
			return;
		}

		// Verificar o Administrador que cadastrou o Cupom
		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		if (!partner) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		if (
			(coupon.partnerID as { _id: ObjectId })._id.toString() !==
			partner._id.toString()
		) {
			res.status(401).json({
				message: "Acesso não autorizado para esta solicitação!",
			});
			return;
		}

		await CouponModel.findByIdAndRemove(id);

		res.status(200).json({ message: "Cupom removido com sucesso!" });
	}
}

export default CouponController;
