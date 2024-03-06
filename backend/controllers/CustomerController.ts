import { Request, Response } from "express";
import { CustomerModel } from "../models/CustomerModel.js";
import { OtakupayModel } from "../models/OtakupayModel.js";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { validationResult } from "express-validator";
import { Multer } from "multer";
import crypto from "crypto";

// Middlewares/Helpers
import createUserToken from "../helpers/create-user-token.js";
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

class CustomerController {
	static async register(req: Request, res: Response) {
		const { accountType, name, email, password, confirmPassword } =
			req.body;

		if (!name) {
			res.status(422).json({ message: "O nome é obrigatório!" });
			return;
		}

		if (!email) {
			res.status(422).json({ message: "O email é obrigatório!" });
			return;
		}

		if (!password) {
			res.status(422).json({ message: "A senha é obrigatória!" });
			return;
		}

		if (!confirmPassword) {
			res.status(422).json({
				message: "A confirmação da senha é obrigatória!",
			});
			return;
		}

		if (password !== confirmPassword) {
			res.status(422).json({
				message:
					"A senha e a confirmação de senha precisam ser iguais!",
			});
			return;
		}

		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			const errorMessages = errors.array().map((error) => error.msg);
			return res.status(422).json({ errors: errorMessages });
		}

		// Verificar se o customer existe
		const customerExist = await CustomerModel.findOne({ email: email });

		if (customerExist) {
			res.status(422).json({
				message: "Email já cadastrado, Por favor utilize outro email!",
			});

			return;
		}

		// Criar senha Hash (Codificada)
		const salt = await bcrypt.genSalt(12);
		const passwordHash = await bcrypt.hash(password, salt);

		const balanceToEncrypt = "0.00"; // Exemplo de valor a ser criptografado
		const encryptedBalance = encrypt(balanceToEncrypt);

		console.log(
			"SALDO INICIAL DO CUSTOMER (CRIPTOGRAFADO):",
			encryptedBalance
		);
		console.log("SALDO INICIAL DO CUSTOMER EM NÚMERO:", balanceToEncrypt);

		try {
			const otakupay = new OtakupayModel({
				accountType: accountType,
				name: name,
				email: email,
				password: passwordHash,
				balanceAvailable: encryptedBalance,
				balancePending: encryptedBalance,
				otakuPointsAvailable: encryptedBalance,
				otakuPointsPending: encryptedBalance,
			});

			const newOtakupay = await otakupay.save();

			// Criar um usuário Cliente
			const customer = new CustomerModel({
				accountType: accountType,
				name: name,
				email: email,
				password: passwordHash,
				otakupayID: newOtakupay._id,
			});

			const newCustomer = await customer.save();

			await createUserToken(newCustomer, req, res);
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: "Erro interno no servidor." });
		}
	}

	// static async checkCustomer(req: Request, res: Response) {
	// 	// Usuário atual (A variável começa indefinida)
	// 	let currentCustomer;

	// 	if (req.headers.authorization) {
	// 		const token: any = getToken(req);

	// 		if (token) {
	// 			interface IDecodedToken {
	// 				id: string;
	// 			}

	// 			// Verifique se o token não é undefined
	// 			try {
	// 				// Decodificando o Token
	// 				const decoded: JwtPayload = jwt.verify(
	// 					token,
	// 					process.env.JWT_SECRET as string
	// 				) as IDecodedToken;

	// 				currentCustomer = await CustomerModel.findById(decoded.id);

	// 				if (currentCustomer) {
	// 					currentCustomer.password = "";
	// 				}
	// 			} catch (error) {
	// 				console.error("Erro na verificação do token:", error);
	// 			}
	// 		}
	// 	} else {
	// 		currentCustomer = null;
	// 	}

	// 	res.status(200).send(currentCustomer);
	// }

	static async getCustomerById(req: Request, res: Response) {
		const id = req.params.id;

		const user = await CustomerModel.findById(id).select("-password");

		if (!user) {
			res.status(422).json({ message: "Usuário não encontrado!" });
			return;
		}

		res.status(200).json({ user });
	}

	static async editCustomer(req: Request, res: Response) {
		const token = getToken(req);

		try {
			// Verificar se o usuário existe
			if (!token) {
				res.status(422).json({
					message: "Token ausente. Faça login novamente.",
				});
				return;
			}

			const user = await getUserByToken(token);
			console.log(user);

			if (!user) {
				res.status(422).json({ message: "Usuário não encontrado!" });
				return;
			}

			const { name, email, password, confirmPassword } = req.body;

			let image = "";

			if (req.file) {
				user.profileImage = req.file.filename;
			}

			// Validações
			if (!name) {
				res.status(422).json({ message: "O nome é obrigatório" });
				return;
			}

			user.name = name;

			if (!email) {
				res.status(422).json({ message: "O email é obrigatório" });
				return;
			}

			if (email !== user.email) {
				const userExist = await CustomerModel.findOne({ email: email });

				if (userExist) {
					res.status(422).json({
						message:
							"Já existe um usuário cadastrado com esse email!",
					});
					return;
				}

				user.email = email;
			}

			if (password !== confirmPassword) {
				res.status(422).json({
					message:
						"A senha e a confirmação de senha precisam ser iguais!",
				});
				return;
			}

			if (password) {
				// Alteração da senha
				const salt = await bcrypt.genSalt(12);
				const passwordHash = await bcrypt.hash(password, salt);
				user.password = passwordHash;
			}

			await user.save();

			const updatedUser = await CustomerModel.findById(user._id).select(
				"-password"
			);

			res.status(200).json({
				message: "Usuário atualizado com sucesso!",
				user: updatedUser,
			});
		} catch (err) {
			res.status(500).json({ message: err });
		}
	}
}

export default CustomerController;
