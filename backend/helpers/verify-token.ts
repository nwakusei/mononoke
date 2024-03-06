import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";
import getToken from "./get-token.js";

const checkToken = (req: Request, res: Response, next: NextFunction) => {
	if (!req.headers.authorization) {
		return res.status(401).json({ message: "Acesso negado!" });
	}

	const token = getToken(req);

	if (!token) {
		return res.status(401).json({ message: "Acesso negado!" });
	}

	try {
		const verified = jwt.verify(token, process.env.JWT_SECRET as string);
		(req as any).user = verified;
		next(); // Chame o next() para permitir que a solicitação continue.
	} catch (err) {
		return res.status(401).json({ message: "Token Inválido!" });
	}
};

export default checkToken; // Exporte a função checkToken, não a função getToken
