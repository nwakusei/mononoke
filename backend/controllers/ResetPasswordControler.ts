import { Request, Response } from "express";

import { CustomerModel } from "../models/CustomerModel.js";
import { PartnerModel } from "../models/PartnerModel.js";

import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";

class ResetPasswordController {
	static async SendEmail(req: Request, res: Response) {
		const { email } = req.body;

		if (!email) {
			res.status(422).json({ message: "Email não enviado!" });
			return;
		}

		try {
			// 1. Verifica se existe um usuário com esse email
			const user = await CustomerModel.findOne({ email });

			if (!user) {
				res.status(422).json({ message: "Email inexistente!" });
				return;
			}

			const token = crypto.randomBytes(32).toString("hex");
			const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

			// 3. Salva token e expiração
			user.resetPasswordToken = token;
			user.resetPasswordExpires = expires;
			await user.save();

			// 4. Monta link de reset (ajuste conforme seu domínio)
			const resetLink = `http://localhost:3000/reset-password?token=${token}`;

			// 5. Configura Nodemailer (substitua com seus dados)
			const transporter = nodemailer.createTransport({
				host: "smtp.gmail.com",
				port: 587,
				secure: false,
				auth: {
					user: "rguedes.dev@gmail.com",
					pass: "egvzjvdpjwjzmbdx",
				},
				tls: {
					rejectUnauthorized: false,
				},
			});

			console.log(typeof user.email);

			const mailOptions = {
				from: '"Mononoke" <rguedes.dev@gmail.com>',
				to: user.email,
				replyTo: "rguedes.dev@gmail.com",
				subject: "Recuperação de senha",
				html: `
					<p>Olá, ${user.name}!</p>
					<p>Você solicitou a redefinição da sua senha. Clique no link abaixo para continuar:</p>
					<a href="${resetLink}">${resetLink}</a>
					<p>Esse link é válido por 1 hora.</p>
				`,
			};

			transporter.sendMail(mailOptions, (err, info) => {
				if (err) {
					console.log("Erro ao enviar e-mail:", err);
				} else {
					console.log("E-mail enviado:", info.response);
				}
			});

			res.status(200).json({ message: "Email enviado com sucesso!" });
		} catch (error) {
			console.error("Erro ao enviar email:", error);
			res.status(500).json({ message: "Erro ao enviar email!" });
		}
	}

	static async ResetPassword(req: Request, res: Response) {
		const { token, newPassword } = req.body;

		if (!token || !newPassword) {
			res.status(400).json({
				message: "Token e nova senha são obrigatórios.",
			});
			return;
		}

		try {
			// 1. Encontra o usuário com o token válido e ainda não expirado
			const user = await CustomerModel.findOne({
				resetPasswordToken: token,
				resetPasswordExpires: { $gt: new Date() },
			});

			if (!user) {
				res.status(400).json({
					message: "Token inválido ou expirado.",
				});
				return;
			}

			// 2. Atualiza a senha (não esqueça de hashear se necessário)
			user.password = await bcrypt.hash(newPassword, 12); // use bcrypt se a senha for criptografada
			user.resetPasswordToken = undefined;
			user.resetPasswordExpires = undefined;

			await user.save();

			res.status(200).json({ message: "Senha redefinida com sucesso!" });
		} catch (error) {
			console.error("Erro ao redefinir a senha:", error);
			res.status(500).json({
				message: "Erro interno ao redefinir a senha.",
			});
		}
	}
}

export default ResetPasswordController;
