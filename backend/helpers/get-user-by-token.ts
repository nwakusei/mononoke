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
			throw new Error("Usuário não encontrado"); // Lança um erro se nenhum usuário for encontrado
		}
	}
};

export default getUserByToken;
