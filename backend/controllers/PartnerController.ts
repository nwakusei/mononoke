import { Request, Response } from "express";
import { PartnerModel } from "../models/PartnerModel.js";
import { OtakupayModel } from "../models/OtakupayModel.js";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { validationResult } from "express-validator";
import { Multer } from "multer";
import crypto from "crypto";

import slugify from "slugify";

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

class PartnerController {
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

		// Verificar se o partner existe
		const partnerExist = await PartnerModel.findOne({ email: email });

		if (partnerExist) {
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

		const cashbackToEncrypt = "1";
		const encryptedCashback = encrypt(cashbackToEncrypt);

		try {
			const otakupay = new OtakupayModel({
				accountStatus: "Active",
				accountType: accountType,
				name: name,
				email: email,
				password: passwordHash,
				balanceAvailable: encryptedBalance,
				balancePending: encryptedBalance,
				otakuPointsAvailable: encryptedBalance,
				otakuPointsPending: encryptedBalance,
				cashback: "1",
			});

			const newOtakupay = await otakupay.save();

			// Criar um usuário Parceiro
			const partner = new PartnerModel({
				accountStatus: "Active",
				accountType: accountType,
				profileImage: "",
				logoImage: "",
				name: name,
				nickname: "",
				verifiedBadge: "",
				email: email,
				password: passwordHash,
				description: "",
				address: [],
				cashback: "1",
				followers: 0,
				rating: 0,
				totalProducts: 0,
				productsSold: 0,
				viewAdultContent: false,
				otakupayID: newOtakupay._id,
			});

			const newPartner = await partner.save();
			await createUserToken(newPartner, req, res);
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: "Erro interno no servidor." });
		}
	}

	// static async checkPartner(req: Request, res: Response) {
	// 	// Usuário atual (A variável começa indefinida)
	// 	let currentPartner;

	// 	if (req.headers.authorization) {
	// 		const token = getToken(req);

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

	// 				currentPartner = await PartnerModel.findById(decoded.id);

	// 				if (currentPartner) {
	// 					currentPartner.password = "";
	// 				}
	// 			} catch (error) {
	// 				console.error("Erro na verificação do token:", error);
	// 			}
	// 		}
	// 	} else {
	// 		currentPartner = null;
	// 	}

	// 	res.status(200).send(currentPartner);
	// }

	static async getAllPartners(req: Request, res: Response) {
		try {
			const partners = await PartnerModel.find()
				.select(
					"-accountType -password -email -createdAt -updatedAt -__v -otakupayID -shippingConfiguration"
				)
				.sort("-createdAt");

			res.status(200).json({ partners: partners });
		} catch (error) {
			res.status(500).json({ error: "Erro ao carregar os Cupons" });
			return;
		}
	}

	static async getPartnerById(req: Request, res: Response) {
		const id = req.params.id;

		const user = await PartnerModel.findById(id).select("-password");

		if (!user) {
			res.status(422).json({ message: "Usuário não encontrado!" });
		}

		res.status(200).json({ user });
	}

	// static async editPartner(req: Request, res: Response) {
	// 	const {
	// 		name,
	// 		email,
	// 		cpfCnpj,
	// 		cashback,
	// 		address,
	// 		password,
	// 		confirmPassword,
	// 	} = req.body;

	// 	const token: any = getToken(req);
	// 	const partner = await getUserByToken(token);

	// 	// Verificar se o usuário existe
	// 	if (!partner) {
	// 		res.status(422).json({
	// 			message: "Usuário não encontrado!",
	// 		});
	// 		return;
	// 	}

	// 	try {
	// 		// Verifique se o partner é de fato um parceiro e não um cliente
	// 		if (partner instanceof PartnerModel) {
	// 			partner.name = name;
	// 			partner.email = email;
	// 			partner.cpfCnpj = cpfCnpj;
	// 			partner.cashback = cashback;

	// 			if (partner.address.length > 0 && address) {
	// 				partner.address[0] = {
	// 					logradouro: address.logradouro,
	// 					complemento: address.complemento,
	// 					bairro: address.bairro,
	// 					cidade: address.cidade,
	// 					uf: address.uf,
	// 					cep: address.cep,
	// 				};
	// 			}

	// 			if (
	// 				password &&
	// 				confirmPassword &&
	// 				password === confirmPassword
	// 			) {
	// 				const salt = await bcrypt.genSalt(12);
	// 				const passwordHash = await bcrypt.hash(password, salt);

	// 				partner.password = passwordHash;
	// 			} else if (
	// 				password &&
	// 				confirmPassword &&
	// 				password !== confirmPassword
	// 			) {
	// 				res.status(422).json({
	// 					message: "As senhas precisam ser iguais!",
	// 				});
	// 				return;
	// 			}

	// 			await partner.save();

	// 			const updatedUser = await PartnerModel.findById(
	// 				partner._id
	// 			).select("-password");

	// 			res.status(200).json({
	// 				message: "Usuário atualizado com sucesso!",
	// 				updatedUser,
	// 			});
	// 		} else {
	// 			res.status(400).json({
	// 				message: "O usuário não é um parceiro válido.",
	// 			});
	// 		}
	// 	} catch (err) {
	// 		res.status(500).json({ message: err });
	// 	}
	// }

	static async editPartner(req: Request, res: Response) {
		const {
			name,
			nickname,
			email,
			cpfCnpj,
			description,
			viewAdultContent,
			cashback,
			credential,
			password,
			confirmPassword,
			street,
			complement,
			neighborhood,
			city,
			state,
			postalCode,
		} = req.body;

		console.log(req.body);

		// Upload de imagens de Perfil Logo da Loja
		const files = req.files as { [key: string]: Express.Multer.File[] };
		const profileImage = files?.profileImage?.[0];
		const logoImage = files?.logoImage?.[0];

		const token: any = getToken(req);
		const partner = await getUserByToken(token);

		// Verificar se o usuário existe
		if (!partner) {
			res.status(422).json({
				message: "Usuário não encontrado!",
			});
			return;
		}

		const partnerOtakupay = await OtakupayModel.findById(
			partner.otakupayID
		);

		try {
			// Verifique se o partner é de fato um parceiro e não um cliente
			if (partner instanceof PartnerModel) {
				partner.name = name;
				partner.nickname = nickname;
				partner.email = email;
				partner.cpfCnpj = cpfCnpj;
				partner.description = description;
				partner.viewAdultContent = viewAdultContent;
				partner.shippingConfiguration;
				partner.cashback = cashback;

				partner.address[0] = {
					street: street,
					complement: complement,
					neighborhood: neighborhood,
					city: city,
					state: state,
					postalCode: postalCode,
				};

				// Verifica se a imagem foi enviada
				if (profileImage) {
					let image = ""; // Declara a variável aqui

					// Verifica se é um upload na AWS S3
					if ("key" in profileImage) {
						// Estamos usando o armazenamento na AWS S3
						if (typeof profileImage.key === "string") {
							image = profileImage.key;
						}
					} else if (typeof profileImage.filename === "string") {
						image = profileImage.filename; // Para armazenamento local
					}

					partner.profileImage = image; // Atualiza o campo da imagem
				}

				if (logoImage) {
					let image = "";

					if ("key" in logoImage) {
						if (typeof logoImage.key === "string") {
							image = logoImage.key;
						}
					} else if (typeof logoImage.filename === "string") {
						image = logoImage.filename;
					}

					partner.logoImage = image;
				}

				if (
					password &&
					confirmPassword &&
					password === confirmPassword
				) {
					const salt = await bcrypt.genSalt(12);
					const passwordHash = await bcrypt.hash(password, salt);

					partner.password = passwordHash;
				} else if (
					password &&
					confirmPassword &&
					password !== confirmPassword
				) {
					res.status(422).json({
						message: "As senhas precisam ser iguais!",
					});
					return;
				}

				// Atualizar ou adicionar configuração de envio
				const shippingOperator = "Kangu"; // Provide a default value or get it from req.body
				const existingShippingConfig =
					partner.shippingConfiguration.find(
						(config) => config.shippingOperator === shippingOperator
					);

				if (existingShippingConfig) {
					// Atualizar credencial existente
					existingShippingConfig.credential = credential;
				} else {
					// Adicionar nova configuração de envio
					partner.shippingConfiguration.push({
						shippingOperator,
						credential,
					});
				}

				await partner.save();

				// Atualizar cashback no OtakupayModel
				if (partnerOtakupay) {
					partnerOtakupay.cashback = cashback;
					await partnerOtakupay.save();
				}

				const updatedUser = await PartnerModel.findById(
					partner._id
				).select("-password");

				res.status(200).json({
					message: "Usuário atualizado com sucesso!",
					updatedUser,
				});
			} else {
				res.status(400).json({
					message: "O usuário não é um parceiro válido.",
				});
			}
		} catch (err) {
			res.status(500).json({ message: err });
		}
	}

	static async convertSlugPartnerToID(req: Request, res: Response) {
		const { slug } = req.params;

		// Verificar se o Produto existe
		const partner = await PartnerModel.findOne({ nickname: slug });

		if (!partner) {
			res.status(404).json({ message: "Partner não encontrado!" });
			return;
		}

		res.status(200).json({ id: partner._id });
	}

	// static async getStoreInfo(req: Request, res: Response) {
	// 	const { id } = req.params;

	// 	if (!id) {
	// 		res.status(422).json({
	// 			message: "Informações da loja não encontrada!",
	// 		});
	// 		return;
	// 	}
	// }
}
export default PartnerController;
