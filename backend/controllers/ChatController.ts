import { Request, Response } from "express";
import mongoose from "mongoose";

// Models
import { CustomerModel } from "../models/CustomerModel.js";
import { PartnerModel } from "../models/PartnerModel.js";
import { ChatModel } from "../models/ChatModel.js";

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

class ChatController {
	static async sendMessageByChat(req: Request, res: Response): Promise<void> {
		const { userTwoID, message } = req.body;

		// Upload de Imagens
		let imageMessage = "";

		if (req.file) {
			imageMessage = req.file.filename;
		}

		const token: any = getToken(req);
		const user = await getUserByToken(token);

		if (!user) {
			res.status(401).json({ message: "Não autorizado!" });
			return;
		}

		const userOneID = user._id.toString();

		if (userOneID === userTwoID) {
			res.status(401).json({
				message: "Não é possível enviar mensagens para você mesmo!",
			});
			return;
		}

		try {
			// Verificar se userTwo é um Customer
			let userTwo = await CustomerModel.findById(userTwoID);
			let userTwoAccountType = "customer";

			// Se não for um Customer, verificar se é um Partner
			if (!userTwo) {
				userTwo = await PartnerModel.findById(userTwoID);
				userTwoAccountType = "partner";
			}

			// Caso não encontre em nenhum dos dois modelos
			if (!userTwo) {
				res.status(404).json({
					message: "Usuário destinatário não encontrado.",
				});
				return;
			}

			// Determinar nickname e profileImage para userTwo
			const userTwoNickname = userTwo.nickname;
			const userTwoProfileImage = userTwo.profileImage;

			// Dados do usuário atual (remetente)
			const userOneNickname = user.nickname;
			const userOneProfileImage = user.profileImage;
			const userOneAccountType = user.accountType; // Tipo de conta do remetente

			const messageContent =
				message === undefined || message === ""
					? imageMessage
					: message;

			// Verificar se o chat do cliente para a loja já existe
			let chatFromClientToStore = await ChatModel.findOne({
				userOneID: userOneID,
				userTwoID: userTwoID,
			});

			// Verificar se o chat da loja para o cliente já existe
			let chatFromStoreToClient = await ChatModel.findOne({
				userOneID: userTwoID,
				userTwoID: userOneID,
			});

			// Atualizar ou criar chat do cliente para a loja
			if (!chatFromClientToStore) {
				chatFromClientToStore = new ChatModel({
					userOneID: userOneID,
					userTwoID: userTwoID,
					userTwoNickname,
					userTwoProfileImage,
					userTwoAccountType, // Armazena o tipo de conta do destinatário
					messages: [
						{
							senderID: userOneID,
							message: messageContent,
							timestamp: new Date(),
						},
					],
				});
			} else {
				// Atualizar nickname, profileImage e accountType
				chatFromClientToStore.userTwoNickname = userTwoNickname;
				chatFromClientToStore.userTwoProfileImage = userTwoProfileImage;
				chatFromClientToStore.userTwoAccountType = userTwoAccountType;

				// Adicionar mensagem
				chatFromClientToStore.messages.push({
					senderID: userOneID,
					message: messageContent,
					timestamp: new Date(),
				});
			}

			await chatFromClientToStore.save();

			// Atualizar ou criar chat da loja para o cliente
			if (!chatFromStoreToClient) {
				chatFromStoreToClient = new ChatModel({
					userOneID: userTwoID,
					userTwoID: userOneID,
					userTwoNickname: userOneNickname, // Dados do remetente
					userTwoProfileImage: userOneProfileImage,
					userTwoAccountType: userOneAccountType, // Tipo de conta do remetente
					messages: [
						{
							senderID: userOneID,
							message: messageContent,
							timestamp: new Date(),
						},
					],
				});
			} else {
				// Atualizar nickname, profileImage e accountType
				chatFromStoreToClient.userTwoNickname = userOneNickname;
				chatFromStoreToClient.userTwoProfileImage = userOneProfileImage;
				chatFromStoreToClient.userTwoAccountType = userOneAccountType;

				// Adicionar mensagem
				chatFromStoreToClient.messages.push({
					senderID: userOneID,
					message: messageContent,
					timestamp: new Date(),
				});
			}

			await chatFromStoreToClient.save();

			res.status(200).json({
				message: "Mensagem enviada com sucesso.",
				chatFromClientToStore,
				chatFromStoreToClient,
			});
		} catch (error) {
			console.error("Erro ao criar ou atualizar o chat:", error);
			res.status(500).json({ message: "Internal server error" });
		}
	}

	static async getChatMessagesByUser(req: Request, res: Response) {
		const { id } = req.params;

		const userTwoID = id;

		if (!userTwoID) {
			res.status(400).json({ message: "ID inválido" });
			return;
		}

		const token: any = getToken(req);
		const user = await getUserByToken(token);

		if (!user) {
			res.status(401).json({ message: "Não autorizado!" });
			return;
		}

		const userOneID = user._id.toString();

		try {
			// Verificar se o chat do cliente para a loja já existe
			const chatFromClientToStore = await ChatModel.findOne({
				userOneID: userOneID,
				userTwoID: userTwoID,
			});

			if (!chatFromClientToStore) {
				res.status(404).json({ message: "Chat não encontrado" });
				return;
			}

			res.status(200).json({
				message: "View chat messages",
				chatFromClientToStore,
			});
		} catch (error) {
			console.error("Erro ao visualizar mensagens do chat:", error);
			res.status(500).json({ message: "Internal server error" });
			return;
		}
	}

	static async getChatsByUser(req: Request, res: Response) {
		const token: any = getToken(req);
		const user = await getUserByToken(token);

		if (!user) {
			res.status(401).json({ message: "Não autorizado!" });
			return;
		}

		const userOneID = user._id.toString();

		try {
			const chats = await ChatModel.find({ userOneID: userOneID }).sort(
				"-updatedAt"
			);

			res.status(200).json({ chats: chats });
		} catch (error) {
			console.log(error);
		}
	}

	static async getChatByID(req: Request, res: Response) {
		const { id } = req.params;

		if (!id) {
			res.status(400).json({ message: "O ID do Chat é obrigatório!" });
			return;
		}

		const token: any = getToken(req);
		const user = await getUserByToken(token);

		if (!user) {
			res.status(401).json({ message: "Usuário não encontrado!" });
			return;
		}

		try {
			const chat = await ChatModel.findById(id);

			if (!chat) {
				res.status(404).json({ message: "Chat não encontrado!" });
				return;
			}

			const userOneID = user._id.toString();
			const chatUserOneID = chat.userOneID;

			// Verificar se o usuário tem permissão para acessar o chat
			if (userOneID !== chatUserOneID) {
				res.status(401).json({
					message:
						"Você não possui autorização para acessar este chat!",
				});
				return;
			}

			res.status(200).json({ chat });
		} catch (error) {
			res.status(500).json({ message: "Erro interno do servidor!" });
			return;
		}
	}

	static async searchChat(req: Request, res: Response) {
		const { searchName } = req.body;

		if (!searchName) {
			res.status(404).json({ message: "O nome do user é obrigatório!" });
			return;
		}

		const token: any = getToken(req);
		const user = await getUserByToken(token);

		if (!user) {
			res.status(404).json({ message: "Usuário não encontrado!" });
			return;
		}

		const userID = user._id.toString();

		try {
			// Criando a expressão regular para buscar uma correspondência insensível a maiúsculas e minúsculas
			const searchRegex = new RegExp(searchName, "i"); // 'i' torna a busca insensível ao caso

			// Buscando o chat que corresponda ao nome do usuário e à pesquisa
			const chat = await ChatModel.findOne({
				userOneID: userID,
				userTwoNickname: { $regex: searchRegex }, // Aqui estamos usando a regex para fazer uma busca parcial
			});

			if (chat === null) {
				res.status(404).json({ message: "Nenhum chat encontrado!" });
				return;
			}

			res.status(200).json({ chat: chat });
		} catch (error) {
			res.status(500).json({ message: "Erro interno do servidor!" });
			return;
		}
	}
}

export default ChatController;
