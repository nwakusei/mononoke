import { Request, Response } from "express";

// Models
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

		try {
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

			// Criar chat do cliente para a loja se não existir
			if (!chatFromClientToStore) {
				chatFromClientToStore = new ChatModel({
					userOneID: userOneID,
					userTwoID: userTwoID,
					messages: [
						{
							senderID: userOneID,
							message: messageContent,
							timestamp: new Date(),
						},
					],
				});

				await chatFromClientToStore.save();
			} else {
				// Adicionar mensagem ao chat existente
				chatFromClientToStore.messages.push({
					senderID: userOneID,
					message: messageContent,
					timestamp: new Date(),
				});

				await chatFromClientToStore.save();
			}

			// Criar chat da loja para o cliente se não existir
			if (!chatFromStoreToClient) {
				chatFromStoreToClient = new ChatModel({
					userOneID: userTwoID,
					userTwoID: userOneID,
					messages: [
						{
							senderID: userOneID,
							message: messageContent,
							timestamp: new Date(),
						},
					],
				});

				await chatFromStoreToClient.save();
			} else {
				// Adicionar mensagem ao chat existente
				chatFromStoreToClient.messages.push({
					senderID: userOneID,
					message: messageContent,
					timestamp: new Date(),
				});

				await chatFromStoreToClient.save();
			}

			res.status(200).json({
				message: "Mensagem enviada com sucesso.",
				chatFromClientToStore,
				chatFromStoreToClient,
			});
		} catch (error) {
			console.error("Erro ao criar ou atualizar o chat:", error);
			res.status(500).json({ message: "Internal server error" });
			return;
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
}

export default ChatController;
