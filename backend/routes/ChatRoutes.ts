import ChatController from "../controllers/ChatController";
import { Router } from "express";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token";
import { imageUpload } from "../helpers/image-upload";

router.post(
	"/send-message",
	verifyToken,
	imageUpload.single("imageMessage"),
	ChatController.sendMessageByChat
);
router.get(
	"/get-messages-by-user/:id",
	verifyToken,
	ChatController.getChatMessagesByUser
);

router.get("/get-chats-by-user", verifyToken, ChatController.getChatsByUser);

router.get("/get-chat/:id", verifyToken, ChatController.getChatByID);

router.post("/search-chat", verifyToken, ChatController.searchChat);

export default router;
