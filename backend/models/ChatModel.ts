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
	userTwoAccountType: string;
	userTwoNickname: string;
	userTwoProfileImage: string;
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
		userTwoAccountType: {
			type: String,
		},
		userTwoNickname: {
			type: String,
		},
		userTwoProfileImage: {
			type: String,
		},
		messages: {
			type: [{}],
		},
	},
	{ timestamps: true }
);

const ChatModel = mainDB.model("Chat", chatSchema);

export { ChatModel };
