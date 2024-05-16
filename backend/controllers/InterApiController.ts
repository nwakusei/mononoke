import { Request, Response } from "express";
import { OtakupayModel } from "../models/OtakupayModel.js";

// import { CustomerModel } from "../models/CustomerModel.js";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Multer } from "multer";
import { isValidObjectId } from "mongoose";

import https from "https";
import * as fs from "fs";
import axios, { AxiosRequestConfig } from "axios";
import qs from "qs";

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import { InterPixModel } from "../models/InterPixModel.js";

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

class InterApiController {
	static async createPixInter(req: Request, res: Response) {
		const interCertPath = process.env.INTER_CERT_PATH;
		const interKeyPath = process.env.INTER_KEY_PATH;
		const interClientId = process.env.INTER_CLIENT_ID;
		const interClientSecret = process.env.INTER_CLIENT_SECRET;
		const grant_type = "client_credentials";
		const scope = "cob.write cob.read";

		if (
			!interCertPath ||
			!interKeyPath ||
			!interClientId ||
			!interClientSecret
		) {
			throw new Error(
				"CertPath, KeyPath, Client ID, and Client Secret must be defined in environment variables"
			);
		}

		// Configuração do certificado e chave privada
		const cert = fs.readFileSync(interCertPath);
		const key = fs.readFileSync(interKeyPath);

		const requestBody = {
			grant_type: grant_type,
			client_id: interClientId,
			client_secret: interClientSecret,
			scope: scope,
		};

		const tokenCustomer: any = getToken(req);
		const customer = await getUserByToken(tokenCustomer);

		if (!customer) {
			res.status(422).json({ message: "Customer não encontrado!" });
			return;
		}

		const customerOtakupay: any = await OtakupayModel.findOne({
			_id: customer.otakupayID,
		});

		// Configuração da requisição para obter o token
		const tokenRequestConfig: AxiosRequestConfig = {
			method: "post",
			url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			auth: {
				username: interClientId,
				password: interClientSecret,
			},
			data: qs.stringify(requestBody), // Use a biblioteca 'qs' para formatar o corpo corretamente
			httpsAgent: new https.Agent({ cert, key }),
		};

		const responseToken = await axios(tokenRequestConfig);

		const { access_token } = responseToken.data;

		const customerCPF = customer.cpf.toString().replace(/\D/g, "");

		try {
			const { originalValue } = req.body;

			const pixData = {
				calendario: {
					expiracao: 86400,
				},
				devedor: {
					cpf: customerCPF,
					nome: customerOtakupay.name,
				},
				valor: {
					original: originalValue,
					modalidadeAlteracao: 0,
				},
				chave: process.env.INTER_PIX_KEY,
				solicitacaoPagador: "OtakuPay: Adicionar saldo por PIX.",
			};
			const url = "https://cdpj.partners.bancointer.com.br/pix/v2/cob";

			const tokenOAuth = access_token; // Substitua pelo seu token válido com escopo "cob.write"

			const responsePix = await axios.post(url, pixData, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${tokenOAuth}`,
				},
				httpsAgent: new https.Agent({
					// Adicionado o new https.Agent
					cert: cert,
					key: key,
				}),
			});

			const responsePixData = responsePix.data;

			// Criar uma nova atividade PIX
			const InterPix = new InterPixModel({
				txid: responsePixData.txid,
				devedor: {
					cpf: responsePixData.devedor.cpf,
					nome: responsePixData.devedor.nome,
				},
				pixCopiaECola: responsePixData.pixCopiaECola,
				valor: {
					original: responsePixData.valor.original,
					modalidadeAlteracao:
						responsePixData.valor.modalidadeAlteracao,
				},
				status: responsePixData.status,
				calendario: {
					expiracao: responsePixData.calendario.expiracao,
					criacao: responsePixData.calendario.criacao, // Adicione essa linha
				},
				userID: customerOtakupay._id,
				// infoAdicionais: [
				//    {
				//        nome: string;
				//        valor: string;
				//    }
				// ],
			});

			const newInterPix = await InterPix.save();

			res.status(201).json({
				message: "Pix criado com sucesso!",
				newInterPix,
			});
		} catch (error) {
			console.error("Erro ao criar cobrança PIX:", error);

			if (axios.isAxiosError(error)) {
				// Se o erro for do tipo AxiosError, significa que a solicitação HTTP falhou
				if (error.response) {
					// Se houver uma resposta do servidor
					console.error("Status do erro:", error.response.status);
					console.error("Detalhes do erro:", error.response.data);

					if (error.response.data.violacoes) {
						// Se houver violações na resposta
						console.error("Violacoes:");
						error.response.data.violacoes.forEach(
							(violacao: any) => {
								console.error("- Razão:", violacao.razao);
								console.error(
									"- Propriedade:",
									violacao.propriedade
								);
							}
						);
					}
				} else {
					// Se não houver uma resposta do servidor
					console.error("Erro de servidor:", error.message);
				}
			} else {
				// Se o erro não for do tipo AxiosError
				console.error("Erro desconhecido:", error);
			}

			// Retorne uma resposta de erro para o cliente
			res.status(500).json({
				message: "Erro ao gerar QR Code!",
			});
		}
	}

	static async createWebhookPixInter(req: Request, res: Response) {
		const interCertPath = process.env.INTER_CERT_PATH;
		const interKeyPath = process.env.INTER_KEY_PATH;
		const interCaCertPath = process.env.INTER_CACERT_PATH; // Certificado da autoridade certificadora
		const interClientId = process.env.INTER_CLIENT_ID;
		const interClientSecret = process.env.INTER_CLIENT_SECRET;
		const grant_type = "client_credentials";
		const scope = "webhook.write";

		if (
			!interCertPath ||
			!interKeyPath ||
			!interCaCertPath ||
			!interClientId ||
			!interClientSecret
		) {
			throw new Error(
				"CertPath, KeyPath, Client ID, and Client Secret must be defined in environment variables"
			);
		}

		// Configuração do certificado e chave privada
		const cert = fs.readFileSync(interCertPath);
		const key = fs.readFileSync(interKeyPath);
		const caCert = fs.readFileSync(interCaCertPath);

		const requestBody = {
			grant_type: grant_type,
			client_id: interClientId,
			client_secret: interClientSecret,
			scope: scope,
		};

		// Configuração da requisição para obter o token
		const tokenRequestConfig: AxiosRequestConfig = {
			method: "post",
			url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			auth: {
				username: interClientId,
				password: interClientSecret,
			},
			data: qs.stringify(requestBody), // Use a biblioteca 'qs' para formatar o corpo corretamente
			httpsAgent: new https.Agent({ cert, key }),
		};

		try {
			const responseToken = await axios(tokenRequestConfig);
			const { access_token } = responseToken.data;

			// Construa o corpo da solicitação para criar o webhook
			const webhookData = {
				webhookUrl:
					"https://MEUDOMINIOAPI.com/interapi/addBalanceByPixInter",
			};

			const createWebhookConfig: AxiosRequestConfig = {
				method: "put",
				url: `https://cdpj.partners.bancointer.com.br/pix/v2/webhook/${process.env.INTER_PIX_KEY}`,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${access_token}`,
				},
				data: webhookData,
				httpsAgent: new https.Agent({
					cert,
					key,
					ca: caCert,
					requestCert: true,
					rejectUnauthorized: false,
				}),
			};

			const responseWebhook = await axios(createWebhookConfig);

			// Verifique se a resposta foi bem-sucedida (status 2xx)
			if (responseWebhook.status >= 200 && responseWebhook.status < 300) {
				// Exemplo de resposta para o Banco Inter
				res.status(204).end(); // 204 indica sucesso sem conteúdo
			} else {
				console.error(
					"Erro ao criar o webhook:",
					responseWebhook.status,
					responseWebhook.statusText
				);
				res.status(500).json({ error: "Erro ao criar o webhook" });
			}

			// Realize as operações necessárias com as informações, se necessário
		} catch (error) {
			console.error("Erro no webhookPix:", error);
			res.status(500).json({ error: "Erro no webhookPix" });
		}
	}

	static async getWebhooksInter(req: Request, res: Response) {
		const interCertPath = process.env.INTER_CERT_PATH;
		const interKeyPath = process.env.INTER_KEY_PATH;
		const interClientId = process.env.INTER_CLIENT_ID;
		const interClientSecret = process.env.INTER_CLIENT_SECRET;
		const grant_type = "client_credentials";
		const scope = "webhook.read"; // Alteração do escopo para webhook.read

		if (
			!interCertPath ||
			!interKeyPath ||
			!interClientId ||
			!interClientSecret
		) {
			throw new Error(
				"CertPath, KeyPath, Client ID, and Client Secret must be defined in environment variables"
			);
		}

		// Configuração do certificado e chave privada
		const cert = fs.readFileSync(interCertPath);
		const key = fs.readFileSync(interKeyPath);

		const requestBody = {
			grant_type: grant_type,
			client_id: interClientId,
			client_secret: interClientSecret,
			scope: scope,
		};

		// Configuração da requisição para obter o token
		const tokenRequestConfig: AxiosRequestConfig = {
			method: "post",
			url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			auth: {
				username: interClientId,
				password: interClientSecret,
			},
			data: qs.stringify(requestBody),
			httpsAgent: new https.Agent({ cert, key }),
		};

		try {
			const responseToken = await axios(tokenRequestConfig);
			const { access_token } = responseToken.data;

			const webhookRequestConfig: AxiosRequestConfig = {
				method: "get",
				url: `https://cdpj.partners.bancointer.com.br/pix/v2/webhook/${process.env.INTER_PIX_KEY}`,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${access_token}`,
				},
				httpsAgent: new https.Agent({ cert, key }),
			};

			const responseWebhook = await axios(webhookRequestConfig);

			// Verifique se a resposta foi bem-sucedida (status 2xx)
			if (responseWebhook.status >= 200 && responseWebhook.status < 300) {
				const webhooks = responseWebhook.data;
				res.status(200).json({ webhooks });
			} else {
				console.error(
					"Erro ao obter os webhooks:",
					responseWebhook.status,
					responseWebhook.statusText
				);
				res.status(500).json({ error: "Erro ao obter os webhooks" });
			}
		} catch (error) {
			console.error("Erro na obtenção do token ou dos webhooks:", error);
			res.status(500).json({
				error: "Erro na obtenção do token ou dos webhooks",
			});
		}
	}

	static async deleteWebhooksInter(req: Request, res: Response) {
		const interCertPath = process.env.INTER_CERT_PATH;
		const interKeyPath = process.env.INTER_KEY_PATH;
		const interClientId = process.env.INTER_CLIENT_ID;
		const interClientSecret = process.env.INTER_CLIENT_SECRET;
		const grant_type = "client_credentials";
		const scope = "webhook.write";

		if (
			!interCertPath ||
			!interKeyPath ||
			!interClientId ||
			!interClientSecret
		) {
			throw new Error(
				"CertPath, KeyPath, Client ID, and Client Secret must be defined in environment variables"
			);
		}

		// Configuração do certificado e chave privada
		const cert = fs.readFileSync(interCertPath);
		const key = fs.readFileSync(interKeyPath);

		const requestBody = {
			grant_type: grant_type,
			client_id: interClientId,
			client_secret: interClientSecret,
			scope: scope,
		};

		// Configuração da requisição para obter o token
		const tokenRequestConfig: AxiosRequestConfig = {
			method: "post",
			url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			auth: {
				username: interClientId,
				password: interClientSecret,
			},
			data: qs.stringify(requestBody),
			httpsAgent: new https.Agent({ cert, key }),
		};

		try {
			const responseToken = await axios(tokenRequestConfig);
			const { access_token } = responseToken.data;

			// Configuração da requisição para excluir o webhook
			const deleteWebhookConfig: AxiosRequestConfig = {
				method: "delete",
				url: `https://cdpj.partners.bancointer.com.br/pix/v2/webhook/${process.env.INTER_PIX_KEY}`,
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
				httpsAgent: new https.Agent({ cert, key }),
			};

			const responseDeleteWebhook = await axios(deleteWebhookConfig);

			// Verifique se a exclusão foi bem-sucedida (status 2xx)
			if (
				responseDeleteWebhook.status >= 200 &&
				responseDeleteWebhook.status < 300
			) {
				res.status(200).json({
					message: "Webhooks Deletados com sucesso!",
				}); // 204 indica sucesso sem conteúdo
			} else {
				console.error(
					"Erro ao excluir o webhook:",
					responseDeleteWebhook.status,
					responseDeleteWebhook.statusText
				);
				res.status(500).json({ error: "Erro ao excluir o webhook" });
			}
		} catch (error) {
			console.error("Erro ao excluir o webhook:", error);
			res.status(500).json({ error: "Erro ao excluir o webhook" });
		}
	}

	static async getCallbacksInter(req: Request, res: Response) {
		try {
			// Obter informações do ambiente
			const certPath = process.env.INTER_CERT_PATH;
			const keyPath = process.env.INTER_KEY_PATH;
			const clientId = process.env.INTER_CLIENT_ID;
			const clientSecret = process.env.INTER_CLIENT_SECRET;

			if (!certPath || !keyPath || !clientId || !clientSecret) {
				throw new Error(
					"CertPath, KeyPath, Client ID, and Client Secret must be defined in environment variables"
				);
			}

			// Configuração do certificado e chave privada
			const cert = fs.readFileSync(certPath);
			const key = fs.readFileSync(keyPath);

			// Configurar a solicitação para obter o token
			const tokenRequestBody = {
				grant_type: "client_credentials",
				client_id: clientId,
				client_secret: clientSecret,
				scope: "webhook.read",
			};

			const tokenRequestConfig: AxiosRequestConfig = {
				method: "post",
				url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				auth: {
					username: clientId,
					password: clientSecret,
				},
				data: qs.stringify(tokenRequestBody),
				httpsAgent: new https.Agent({ cert, key }),
			};

			// Obter token de acesso
			const responseToken = await axios(tokenRequestConfig);
			const { access_token } = responseToken.data;

			// Configurar a solicitação para consultar callbacks
			const consultaCallbacksConfig: AxiosRequestConfig = {
				method: "get",
				url: "https://cdpj.partners.bancointer.com.br/pix/v2/webhook/callbacks",
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
				params: {
					dataHoraInicio: "2023-06-01T00:00:00.000Z",
					dataHoraFim: "2023-06-01T23:59:59.999Z",
					// Adicione outros parâmetros conforme necessário
				},
				httpsAgent: new https.Agent({ cert, key }),
			};

			// Consultar callbacks
			const responseConsultaCallbacks = await axios(
				consultaCallbacksConfig
			);

			// Verificar o sucesso da consulta (status 200)
			if (responseConsultaCallbacks.status === 200) {
				const callbacks = responseConsultaCallbacks.data;
				res.status(200).json(callbacks);
			} else {
				console.error(
					"Erro ao consultar callbacks:",
					responseConsultaCallbacks.status,
					responseConsultaCallbacks.statusText
				);
				res.status(500).json({ error: "Erro ao consultar callbacks" });
			}
		} catch (error) {
			console.error("Erro ao consultar callbacks:", error);
			res.status(500).json({ error: "Erro ao consultar callbacks" });
		}
	}

	static async getCallbacksErrorInter(req: Request, res: Response) {
		const certPath = process.env.INTER_CERT_PATH;
		const keyPath = process.env.INTER_KEY_PATH;
		const clientId = process.env.INTER_CLIENT_ID;
		const clientSecret = process.env.INTER_CLIENT_SECRET;
		const grant_type = "client_credentials";
		const scope = "webhook.read"; // Alterado para o escopo correto

		if (!certPath || !keyPath || !clientId || !clientSecret) {
			throw new Error(
				"CertPath, KeyPath, Client ID, and Client Secret must be defined in environment variables"
			);
		}

		// Configuração do certificado e chave privada
		const cert = fs.readFileSync(certPath);
		const key = fs.readFileSync(keyPath);

		const requestBody = {
			grant_type: grant_type,
			client_id: clientId,
			client_secret: clientSecret,
			scope: scope,
		};

		// Configuração da requisição para obter o token
		const tokenRequestConfig: AxiosRequestConfig = {
			method: "post",
			url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			auth: {
				username: clientId,
				password: clientSecret,
			},
			data: qs.stringify(requestBody),
			httpsAgent: new https.Agent({ cert, key }),
		};

		try {
			const responseToken = await axios(tokenRequestConfig);
			const { access_token } = responseToken.data;

			// Configuração da requisição para consultar os erros de callbacks
			const callbacksErrorConfig: AxiosRequestConfig = {
				method: "get",
				url: "https://cdpj.partners.bancointer.com.br/pix/v2/webhook/callbacks",
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
				httpsAgent: new https.Agent({ cert, key }),
				params: req.query, // Adicionado para passar os parâmetros da consulta
			};

			const responseCallbacksError = await axios(callbacksErrorConfig);

			// Verifique se a consulta foi bem-sucedida (status 2xx)
			if (responseCallbacksError.status === 200) {
				res.status(200).json(responseCallbacksError.data);
			} else {
				console.error(
					"Erro ao consultar os callbacks:",
					responseCallbacksError.status,
					responseCallbacksError.statusText
				);
				res.status(responseCallbacksError.status).json({
					error: "Erro ao consultar os callbacks",
				});
			}
		} catch (error) {
			console.error("Erro ao consultar os callbacks:", error);
			res.status(500).json({ error: "Erro ao consultar os callbacks" });
		}
	}

	static async getCobPixInter(req: Request, res: Response) {
		try {
			// Obter informações do ambiente
			const certPath = process.env.INTER_CERT_PATH;
			const keyPath = process.env.INTER_KEY_PATH;
			const caCertPath = process.env.INTER_CACERT_PATH;
			const clientId = process.env.INTER_CLIENT_ID;
			const clientSecret = process.env.INTER_CLIENT_SECRET;

			if (
				!certPath ||
				!keyPath ||
				!caCertPath ||
				!clientId ||
				!clientSecret
			) {
				throw new Error(
					"CertPath, KeyPath, CA_CERT_PATH, Client ID, and Client Secret must be defined in environment variables"
				);
			}

			// Configuração do certificado, chave privada e certificado da autoridade certificadora
			const cert = fs.readFileSync(certPath);
			const key = fs.readFileSync(keyPath);
			const caCert = fs.readFileSync(caCertPath);

			// Configurar a solicitação para obter o token
			const tokenRequestBody = {
				grant_type: "client_credentials",
				client_id: clientId,
				client_secret: clientSecret,
				scope: "cob.read", // Escopo necessário para consultar cobranças
			};

			const tokenRequestConfig: AxiosRequestConfig = {
				method: "post",
				url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				auth: {
					username: clientId,
					password: clientSecret,
				},
				data: qs.stringify(tokenRequestBody),
				httpsAgent: new https.Agent({ cert, key }),
			};

			// Obter token de acesso
			const responseToken = await axios(tokenRequestConfig);
			const accessToken = responseToken.data.access_token;

			// Configurar a solicitação para consultar a cobrança imediata
			const txid = "oo3gl7jc8f4qnf8zxykmxzsftg8enosdvh3"; // Certifique-se de que você está recebendo o txid como parâmetro

			const getCobRequestConfig: AxiosRequestConfig = {
				method: "get",
				url: `https://cdpj.partners.bancointer.com.br/pix/v2/cob/${txid}`,
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				httpsAgent: new https.Agent({
					cert,
					key,
					ca: caCert,
					requestCert: true,
					rejectUnauthorized: false,
				}),
			};

			// Realizar a requisição de consulta
			const responseCob = await axios(getCobRequestConfig);
			const cobData = responseCob.data;

			// Console para imprimir informações úteis
			console.log("Token de Acesso:", accessToken);
			console.log("Resposta da Requisição de Consulta:", responseCob);

			// Faça o que for necessário com os dados da cobrança (cobData)

			// Responder com os dados da cobrança
			res.status(200).json(cobData);
		} catch (error) {
			// Console para imprimir informações de erro
			console.error("Erro ao consultar cobrança:", error);
			console.error((error as Error).stack);

			res.status(500).json({ error: "Erro ao consultar cobrança" });
		}
	}

	static async addBalanceByPixInter(req: Request, res: Response) {
		try {
			// Obter informações do ambiente
			const interCertPath = process.env.INTER_CERT_PATH;
			const interKeyPath = process.env.INTER_KEY_PATH;
			const interCaCertPath = process.env.INTER_CACERT_PATH;
			const interClientId = process.env.INTER_CLIENT_ID;
			const interClientSecret = process.env.INTER_CLIENT_SECRET;

			if (
				!interCertPath ||
				!interKeyPath ||
				!interCaCertPath ||
				!interClientId ||
				!interClientSecret
			) {
				throw new Error(
					"CertPath, KeyPath, CA_CERT_PATH, Client ID, and Client Secret must be defined in environment variables"
				);
			}

			// Configuração do certificado, chave privada e certificado da autoridade certificadora
			const cert = fs.readFileSync(interCertPath);
			const key = fs.readFileSync(interKeyPath);
			const caCert = fs.readFileSync(interCaCertPath);

			// Configurar a solicitação para obter o token
			const tokenRequestBody = {
				grant_type: "client_credentials",
				client_id: interClientId,
				client_secret: interClientSecret,
				scope: "webhook.read cob.read",
			};

			const tokenRequestConfig: AxiosRequestConfig = {
				method: "post",
				url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				auth: {
					username: interClientId,
					password: interClientSecret,
				},
				data: qs.stringify(tokenRequestBody),
				httpsAgent: new https.Agent({ cert, key }),
			};

			// Obter token de acesso
			const responseToken = await axios(tokenRequestConfig);
			const { access_token } = responseToken.data;

			// Obter o payload do callback enviado pelo Banco Inter
			const callbackPayload = req.body;

			// Verificar se o payload é um array e contém a propriedade 'pix'
			if (
				Array.isArray(callbackPayload) ||
				(typeof callbackPayload === "object" &&
					"pix" in callbackPayload)
			) {
				// Converter para um array, se for um objeto
				const transactions = Array.isArray(callbackPayload)
					? callbackPayload
					: [callbackPayload];

				// Iterar sobre as transações (agora, sempre será um array)
				for (const transaction of transactions) {
					// Se a propriedade 'pix' existir e for um array
					if (Array.isArray(transaction.pix)) {
						const pixTransactions = transaction.pix;

						// Iterar sobre as transações PIX
						for (const pixTransaction of pixTransactions) {
							// Aqui você pode acessar os dados da transação individual
							const txid = pixTransaction.txid;

							// Faça o que for necessário com esses dados
							console.log(
								`Transação PIX recebida: ${JSON.stringify(
									pixTransaction
								)}`
							);

							if (txid) {
								// SE TXID EXISTIR, FAZER A CONSULTA DE COBRANÇA IMEDIATA
								const getCobRequestConfig: AxiosRequestConfig =
									{
										method: "get",
										url: `https://cdpj.partners.bancointer.com.br/pix/v2/cob/${txid}`,
										headers: {
											Authorization: `Bearer ${access_token}`,
										},
										httpsAgent: new https.Agent({
											cert,
											key,
											ca: caCert,
											requestCert: true,
											rejectUnauthorized: false,
										}),
									};

								// Realizar a requisição de consulta
								const responseCob = await axios(
									getCobRequestConfig
								);

								const cobData = responseCob.data;

								// Encontrar a transação PIX pelo txid na coleção interpixhistory
								const interPixTransaction =
									await InterPixModel.findOne({ txid: txid });

								// Verificar se a transação existe e está no estado "ATIVA"
								if (
									!interPixTransaction ||
									interPixTransaction.status !== "ATIVA"
								) {
									// Se não estiver no estado "ATIVA", enviar resposta com status 422
									res.status(422).json({
										error: "Transação PIX já finalizada, não é possível fazer qualquer alteração!",
									});
									return;
								}

								try {
									const status = cobData.status;

									// Encontrar a transação PIX pelo txid na coleção interpixhistory
									const interPixTransaction =
										await InterPixModel.findOne({
											txid: txid,
										});

									if (status === "CONCLUIDA") {
										try {
											if (interPixTransaction) {
												// Atualizar o status da transação PIX com o valor do callback
												interPixTransaction.status =
													status;
												await interPixTransaction.save();

												// Obter o userID da transação PIX
												const userID =
													interPixTransaction.userID;

												// Encontrar o usuário na coleção users
												const customerOtakupay =
													await OtakupayModel.findOne(
														{
															_id: userID,
														}
													);

												if (customerOtakupay) {
													// Pegar o Balance Available Cripptografado atual do Customer no OtakuPay
													const encryptedCustomerBalanceAvalable =
														customerOtakupay.balanceAvailable;

													// Descriptografar o Balance Available atual do Customer no OtakuPay
													const decryptedCurrentCustomerBalanceAvailable =
														decrypt(
															encryptedCustomerBalanceAvalable
														);

													if (
														decryptedCurrentCustomerBalanceAvailable ===
														null
													) {
														res.status(500).json({
															message:
																"Erro ao descriptografar os Customer OtakuPay Balance Avalable!",
														});
														return;
													}

													const currentCustomerBalanceAvailable =
														decryptedCurrentCustomerBalanceAvailable;

													// Realizando a operação de soma e convertendo de volta para string com duas casas decimais
													const newCustomerBalanceAvailable =
														(
															currentCustomerBalanceAvailable +
															Number(
																interPixTransaction
																	.valor
																	.original
															)
														).toFixed(2);

													// Criptografar o novo Customer Balance Available para armazenar no Otakupay
													const newCustomerEncryptedBalanceAvalable =
														encrypt(
															newCustomerBalanceAvailable.toString()
														);

													// Atualizar o saldo do usuário com o valor da transação PIX
													customerOtakupay.balanceAvailable =
														newCustomerEncryptedBalanceAvalable.toString();

													const logDecryptedCustomerBalanceAvailable =
														decrypt(
															customerOtakupay.balanceAvailable
														);

													console.log(
														"NOVO SALDO DO CUSTOMER COM ADIÇÃO DO VALOR DO PIX:",
														logDecryptedCustomerBalanceAvailable?.toFixed(
															2
														)
													);

													// Salvar as alterações no banco de dados
													await customerOtakupay.save();
												} else {
													console.error(
														"Usuário não encontrado com o ID:",
														userID
													);
												}
											} else {
												console.error(
													"Transação PIX não encontrada com o txid:",
													txid
												);
											}
										} catch (error) {
											console.error(
												"Erro ao processar transação PIX:",
												error
											);
											res.status(500).json({
												error: "Erro ao processar transação PIX",
											});
										}
									} else {
										res.status(422).json({
											error: "Transação PIX já finalizada, não é possível fazer qualquer alteração!",
										});
									}
								} catch (err) {
									console.log(err);
								}
							} else {
								console.log(
									"ERRO AO REALIZAR REQUISIÇÃO: txid não está presente"
								);
							}
						}
					} else {
						console.error(
							"ERRO AO REALIZAR REQUISIÇÃO: propriedade 'pix' não está presente ou não é um array"
						);
					}
				}
			} else {
				console.error(
					`Tipo de payload não suportado: ${typeof callbackPayload}`
				);
			}

			// Responder ao Banco Inter com status 200
			res.status(200).send("Callback recebido com sucesso");
		} catch (error) {
			console.error("Erro ao processar o callback:", error);
			res.status(500).json({ error: "Erro ao processar o callback" });
		}
	}
}

export default InterApiController;
