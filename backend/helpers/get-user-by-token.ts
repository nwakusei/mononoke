import jwt, { JwtPayload } from "jsonwebtoken";
import { CustomerModel } from "../models/CustomerModel.js";
import { PartnerModel } from "../models/PartnerModel.js";

const getUserByToken = async (token: string) => {
	const decoded: JwtPayload = jwt.verify(
		token,
		process.env.JWT_SECRET as string
	) as JwtPayload;

	const userId = decoded.id;

	const customer = await CustomerModel.findOne({
		_id: userId,
	}).select("-password");

	if (customer) {
		return customer;
	} else {
		const partner = await PartnerModel.findOne({
			_id: userId,
		}).select("-password");
		if (partner) {
			return partner;
		} else {
			console.log("Ocorreu um erro ao tentar obter o usuário!"); // Lança um erro se nenhum usuário for encontrado
			return null;
		}
	}
};

// const getUserByToken = async (token: string) => {
// 	const decoded: JwtPayload = jwt.verify(
// 		token,
// 		process.env.JWT_SECRET as string
// 	) as JwtPayload;

// 	const userId = decoded.id;

// 	const customer = await CustomerModel.findOne({
// 		_id: userId,
// 	}).select("-password");

// 	if (customer) {
// 		return customer;
// 	} else {
// 		const partner = await PartnerModel.findOne({
// 			_id: userId,
// 		}).select("-password");
// 		if (partner) {
// 			return partner;
// 		} else {
// 			console.log("Ocorreu um erro ao obter o usuário"!); // Lança um erro se nenhum usuário for encontrado
// 			return;
// 		}
// 	}
// };

export default getUserByToken;
