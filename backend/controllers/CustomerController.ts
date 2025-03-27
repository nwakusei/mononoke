// Imports Gerais
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import crypto from "crypto";
import { isValidObjectId } from "mongoose";

import * as CPFValidator from "cpf-cnpj-validator";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com", // Substitua pelo SMTP do provedor
	port: 587, // Ou 465 para SSL
	secure: false, // true para 465, false para 587/STARTTLS
	auth: {
		user: "rguedes.dev@gmail.com",
		pass: "egvzjvdpjwjzmbdx", // Ou senha de aplicativo se necessário
	},
	tls: {
		rejectUnauthorized: false, // Ignora erros de certificado
	},
});

// Models
import { CustomerModel } from "../models/CustomerModel.js";
import { OtakupayModel } from "../models/OtakupayModel.js";
import { PartnerModel } from "../models/PartnerModel.js";
import { ProductModel } from "../models/ProductModel.js";

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
				message: "Confirme a senha!",
			});
			return;
		}

		if (password !== confirmPassword) {
			res.status(422).json({
				message: "As senhas precisam ser iguais!",
			});
			return;
		}

		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			const errorMessages = errors.array().map((error) => error.msg);
			return res.status(422).json({ errors: errorMessages });
		}

		// Verificar se o email já está cadastrado na plataforma
		const customerEmailExist = await CustomerModel.findOne({
			email: email,
		});

		if (customerEmailExist) {
			res.status(422).json({
				message: "Já existe uma conta cadastrada com este email!",
			});
			return;
		}

		// Criar senha Hash (Codificada)
		const salt = await bcrypt.genSalt(12);
		const passwordHash = await bcrypt.hash(password, salt);

		const balanceToEncrypt = process.env.USER_INITIAL_BALANCE as string;
		const encryptedBalance = encrypt(balanceToEncrypt);

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
			});

			// let info = await transporter.sendMail({
			// 	from: '"Mononoke" <rguedes_arq@hotmail.com>',
			// 	to: email,
			// 	subject: "Cadastro efetuado com sucesso!",
			// 	text: "Este é um teste de envio de e-mail!",
			// 	html: "<b>Este é um teste de envio de e-mail!</b>",
			// });

			const mailOptions = {
				from: '"Mononoke" <rguedes.dev@gmail.com>',
				to: email,
				subject: "Cadastro efetuado com sucesso!",
				text: "Este é um teste de envio de e-mail!",
				html: `<html>
				         <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                           <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
                             <h1 style="color: #4CAF50;">Parabéns por se cadastrar!</h1>
                               <p style="font-size: 16px;">Bem-vindo à nossa plataforma! Estamos felizes em tê-lo conosco. Agora você pode aproveitar todos os recursos exclusivos que oferecemos.</p>
                               <p style="font-size: 16px;">Se tiver alguma dúvida, entre em contato conosco a qualquer momento. Estamos à disposição para ajudar!</p>

                               <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;"/>

                               <footer style="font-size: 14px; color: #555;">
                                 <p style="margin: 0;">Mononoke</p>
                                 <p style="margin: 0;">E-mail: <a href="mailto:support@mononoke.com" style="color: #4CAF50;">support@mononoke.com</a></p>
                                 <p style="margin: 0;">WhatsApp: (XX) XXXXX-XXXX</p>
								 <p style="margin: 0;">CEO | Reinaldo Guedes</p>
								 <p style="margin: 0;">Onigashima Group</p>
                               </footer>
                            </div>
                         </body>
                       </html>`,
			};

			transporter.sendMail(mailOptions, (err, info) => {
				if (err) {
					console.log("Erro ao enviar e-mail:", err);
				} else {
					console.log("E-mail enviado:", info.response);
				}
			});

			const newOtakupay = await otakupay.save();

			// Criar um usuário Cliente
			const customer = new CustomerModel({
				accountStatus: "Active",
				accountType: accountType,
				name: name,
				nickname: "",
				email: email,
				password: passwordHash,
				viewAdultContent: false,
				newsletters: true,
				otakupayID: newOtakupay._id.toString(),
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

	d; // Requisição finalizada, mas precisa de ajustes
	static async followStore(req: Request, res: Response) {
		const { id } = req.params; // ID que pode ser da loja ou do produto

		// Verifique se o ID fornecido é válido
		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "ID inválido!" });
			return;
		}

		try {
			let storeID: any = id;
			let storeName: string | null = null;

			// Tente encontrar a loja diretamente usando o ID fornecido
			const store = await PartnerModel.findById(storeID);

			// Se não encontrar a loja, então pode ser que o ID seja de um produto
			if (!store) {
				// Encontre o produto usando o ID
				const product = await ProductModel.findById(id);

				if (!product) {
					res.status(404).json({
						message: "Produto não encontrado!",
					});
					return;
				}

				// Obtenha o ID da loja associada ao produto
				storeID = product.partnerID;

				// Verifique se o ID da loja é válido
				if (!isValidObjectId(storeID)) {
					res.status(422).json({ message: "ID da loja inválido!" });
					return;
				}

				// Tente encontrar a loja usando o ID da loja obtido do produto
				const foundStore = await PartnerModel.findById(storeID);

				if (!foundStore) {
					res.status(404).json({ message: "Loja não encontrada!" });
					return;
				}

				storeName = foundStore.name; // Obtenha o nome da loja
			} else {
				storeName = store.name; // Obtenha o nome da loja diretamente
			}

			const token: any = getToken(req);
			const customer = await getUserByToken(token);
			const customerID = customer?._id;

			// Encontre o usuário ou seguidor usando o ID do usuário
			const user = await CustomerModel.findById(customerID);

			if (!user) {
				res.status(404).json({
					message:
						"Faça login em uma conta cliente para seguir esta loja!",
				});
				return;
			}

			// Verifique se o usuário já está seguindo a loja
			if (
				user.followingStores.some(
					(following) =>
						following.storeID.toString() === storeID.toString()
				)
			) {
				res.status(400).json({
					message: "Você já segue esta loja!",
				});
				return;
			}

			// Adicione a loja à lista de lojas seguidas do usuário
			const newFollowingStoreDate = {
				storeID: storeID,
				storeName: storeName,
			};

			user.followingStores.push(newFollowingStoreDate);
			await user.save();

			// Atualize o número de seguidores da loja
			await PartnerModel.findByIdAndUpdate(
				storeID,
				{ $inc: { followers: 1 } }, // Incrementa o número de seguidores
				{ new: true } // Retorna o documento atualizado
			).exec();

			res.status(200).json({ message: "Loja seguida com sucesso!" });
		} catch (error) {
			console.error("Erro ao seguir a loja:", error);
			res.status(500).json({ message: "Erro ao tentar seguir a loja!" });
		}
	}

	static async unfollowStore(req: Request, res: Response) {
		const { id } = req.params; // ID que pode ser da loja ou do produto

		// Verifique se o ID fornecido é válido
		if (!isValidObjectId(id)) {
			res.status(422).json({ message: "ID inválido!" });
			return;
		}

		try {
			let storeID: any = id;
			let storeName: string | null = null;

			// Tente encontrar a loja diretamente usando o ID fornecido
			const store = await PartnerModel.findById(storeID);

			// Se não encontrar a loja, então pode ser que o ID seja de um produto
			if (!store) {
				// Encontre o produto usando o ID
				const product = await ProductModel.findById(id);

				if (!product) {
					res.status(404).json({
						message: "Produto não encontrado!",
					});
					return;
				}

				// Obtenha o ID da loja associada ao produto
				storeID = product.partnerID;

				// Verifique se o ID da loja é válido
				if (!isValidObjectId(storeID)) {
					res.status(422).json({ message: "ID da loja inválido!" });
					return;
				}

				// Tente encontrar a loja usando o ID da loja obtido do produto
				const foundStore = await PartnerModel.findById(storeID);

				if (!foundStore) {
					res.status(404).json({ message: "Loja não encontrada!" });
					return;
				}

				storeName = foundStore.name; // Obtenha o nome da loja
			} else {
				storeName = store.name; // Obtenha o nome da loja diretamente
			}

			const token: any = getToken(req);
			const customer = await getUserByToken(token);
			const customerID = customer?._id;

			// Encontre o usuário ou seguidor usando o ID do usuário
			const user = await CustomerModel.findById(customerID);

			if (!user) {
				res.status(404).json({
					message: "Faça login para deixar de seguir esta loja!",
				});
				return;
			}

			// Verifique se o usuário realmente está seguindo a loja
			const storeIndex = user.followingStores.findIndex(
				(following) =>
					following.storeID.toString() === storeID.toString()
			);

			if (storeIndex === -1) {
				res.status(400).json({
					message: "Você não está seguindo esta loja!",
				});
				return;
			}

			// Remova a loja da lista de lojas seguidas do usuário
			user.followingStores.splice(storeIndex, 1);
			await user.save();

			// Atualize o número de seguidores da loja
			await PartnerModel.findByIdAndUpdate(
				storeID,
				{ $inc: { followers: -1 } }, // Decrementa o número de seguidores
				{ new: true } // Retorna o documento atualizado
			).exec();

			res.status(200).json({
				message: "Loja deixada de seguir com sucesso!",
			});
		} catch (error) {
			console.error("Erro ao deixar de seguir a loja:", error);
			res.status(500).json({
				message: "Erro ao tentar deixar de seguir a loja!",
			});
		}
	}

	static async editCustomer(req: Request, res: Response) {
		const {
			name,
			nickname,
			email,
			cpf,
			viewAdultContent,
			password,
			confirmPassword,
			street,
			complement,
			neighborhood,
			city,
			state,
			postalCode,
		} = req.body;

		// Upload de imagens de Perfil Logo da Loja
		const files = req.files as { [key: string]: Express.Multer.File[] };
		const profileImage = files?.profileImage?.[0];
		const logoImage = files?.logoImage?.[0];

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		// Verificar se o usuário existe
		if (!customer) {
			res.status(422).json({
				message: "Usuário não encontrado!",
			});
			return;
		}

		try {
			// // Verificar se o CPF é válido
			// if (!CPFValidator.cpf.isValid(cpf)) {
			// 	res.status(422).json({ message: "CPF inválido!" });
			// 	return;
			// }

			// Verificar se o CPF ou CNPJ é válido
			if (!CPFValidator.cpf.isValid(cpf)) {
				res.status(422).json({
					message: "CPF inválido!",
				});
				return;
			}

			// Suponha que partner._id seja o id do parceiro atual (o que está tentando atualizar)
			const customerId = customer._id;

			// Buscar todos os documentos de parceiros, exceto o parceiro atual
			const customers = await CustomerModel.find({
				_id: { $ne: customerId },
			}).select("cpf _id");

			for (const customer of customers) {
				const cpfCnpjDecrypted = decrypt(customer.cpf);

				// Verifica se o CPF/CNPJ já está cadastrado, mas não compara com o próprio parceiro
				if (cpfCnpjDecrypted?.toString() === cpf) {
					res.status(422).json({
						message: "CPF já cadastrado!",
					});
					return;
				}
			}

			const cpfEncrypted = encrypt(cpf);

			// Verifique se o customer é de fato um parceiro e não um cliente
			if (customer instanceof CustomerModel) {
				customer.name = name;
				customer.nickname = nickname;
				customer.email = email;
				customer.cpf = cpfEncrypted;
				customer.viewAdultContent = viewAdultContent;

				customer.address[0] = {
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

					customer.profileImage = image; // Atualiza o campo da imagem
				}

				if (
					password &&
					confirmPassword &&
					password === confirmPassword
				) {
					// Criar senha Hash (Codificada)
					const salt = await bcrypt.genSalt(12);
					const passwordHash = await bcrypt.hash(password, salt);

					customer.password = passwordHash;
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

				await customer.save();

				const updatedUser = await CustomerModel.findById(
					customer._id
				).select("-password");

				res.status(200).json({
					message: "Usuário atualizado com sucesso!",
					updatedUser,
				});
			} else {
				res.status(400).json({
					message: "O usuário não é um customer válido.",
				});
			}
		} catch (err) {
			res.status(500).json({ message: err });
		}
	}
}

export default CustomerController;
