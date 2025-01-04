import mainDB from "../db/mainconn";
import { Schema } from "mongoose";

interface IMessages {
	senderID: Object;
	message: string;
	timestamp: Date;
}

interface IChat {
	userOneID: Object;
	userTwoID: Object;
	messages: IMessages[];
}

const chatSchema = new Schema<IChat>(
	{
		userOneID: {
			type: Object,
			required: true,
		},
		userTwoID: {
			type: Object,
			required: true,
		},
		messages: {
			type: [{}],
		},
	},
	{ timestamps: true }
);

const ChatModel = mainDB.model("Chat", chatSchema);

export { ChatModel };
