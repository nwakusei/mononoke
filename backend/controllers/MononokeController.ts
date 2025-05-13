import { Request, Response } from "express";
import { CustomerModel } from "../models/CustomerModel.js";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";

// Middlewares/Helpers
import createUserToken from "../helpers/create-user-token.js";
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import { PartnerModel } from "../models/PartnerModel.js";

class OtakuPrimeController {
  static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(422).json({ message: "O email é obrigatório!" });
    }

    if (!password) {
      return res.status(422).json({ message: "A senha é obrigatória!" });
    }

    // Verificar se o usuário existe
    const user =
      (await CustomerModel.findOne({ email: email })) ||
      (await PartnerModel.findOne({ email: email }));

    if (!user) {
      return res.status(422).json({
        message: "Não há usuário cadastrado com esse email!",
      });
    }

    // Verificar se a senha digitada é igual a senha no banco de dados
    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      return res.status(422).json({
        message: "Senha inválida !",
      });
    }

    await createUserToken(user, req, res);
  }

  static async checkUser(req: Request, res: Response) {
    // Usuário atual (A variável começa indefinida)
    let currentUser;

    if (req.headers.authorization) {
      const token: any = getToken(req);

      if (token) {
        interface IDecodedToken {
          id: string;
        }

        // Verifique se o token não é undefined
        try {
          // Decodificando o Token
          const decoded: JwtPayload = jwt.verify(
            token,
            process.env.JWT_SECRET as string
          ) as IDecodedToken;

          currentUser =
            (await CustomerModel.findById(decoded.id)) ||
            (await PartnerModel.findById(decoded.id));

          if (currentUser) {
            currentUser.password = "";
          }
        } catch (error) {
          console.error("Erro na verificação do token:", error);
        }
      }
    } else {
      currentUser = null;
    }

    res.status(200).send(currentUser);
  }
}

export default OtakuPrimeController;
