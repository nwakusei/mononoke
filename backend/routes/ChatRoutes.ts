import ChatController from "../controllers/ChatController";
import { Router } from "express";

const router = Router();

// Middlewares
import verifyToken from "../helpers/verify-token";
import { imageUpload } from "../helpers/image-upload";

router.post("/send-message", verifyToken, ChatController.sendMessageByChat);
router.get(
	"/get-chat-by-user/:id",
	verifyToken,
	ChatController.getChatMessagesByUser
);

export default router;
