import { Request, Response } from "express";

import { CustomerModel } from "../models/CustomerModel.js";
import { PartnerModel } from "../models/PartnerModel.js";

import bcrypt from "bcryptjs";
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

			// // 5. Configura Nodemailer (substitua com seus dados)
			// const transporter = nodemailer.createTransport({
			// 	host: "smtp.gmail.com",
			// 	port: 587,
			// 	secure: false,
			// 	auth: {
			// 		user: "rguedes.dev@gmail.com",
			// 		pass: "egvzjvdpjwjzmbdx",
			// 	},
			// 	tls: {
			// 		rejectUnauthorized: false,
			// 	},
			// });

			const transporter = nodemailer.createTransport({
				host: "sandbox.smtp.mailtrap.io",
				port: 2525,
				auth: {
					user: "b230b277563324",
					pass: "4df173c48efbcf",
				},
			});

			console.log(typeof user.email);

			const mailOptions = {
				from: '"Mononoke" <rguedes.dev@gmail.com>',
				to: user.email,
				replyTo: "rguedes.dev@gmail.com",
				subject: "Recuperação de senha",
				html: `
					<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Recuperação de Senha</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
      <tr>
        <td>
          <h2 style="color: #4c1d95;">Olá, Reinaldo!</h2>
          <p style="color: #333333; font-size: 15px;">
            Você solicitou a redefinição da sua senha. Clique no botão abaixo para continuar:
          </p>

         <div style="margin: 20px 0; display: flex; justify-content: center;">
            <a href="https://example.com/reset"
               style="background-color: #4c1d95;
                     width: 150px;
                     background-color: #4c1d95;
                     color: white;
                     padding: 10px 20px;
                     border-radius: 4px;
                     text-decoration: none;
                      text-align: center;
                     font-weight: bold;">
              Resetar Senha
            </a>
          </div>
          
          
          <p style="color: #666666; font-size: 13px;>
            Esse link é válido por 1 hora. Se você não solicitou essa alteração, pode ignorar este e-mail.
          </p>

          <p style="color: #aaaaaa; font-size: 12px;">
            — Equipe Mononoke
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>

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
