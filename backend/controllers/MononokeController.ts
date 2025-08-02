import { Request, Response } from "express";
import { CustomerModel } from "../models/CustomerModel.js";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";

// Middlewares/Helpers
import createUserToken from "../helpers/create-user-token.js";
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import { PartnerModel } from "../models/PartnerModel.js";

// Chave de descriptografia (certifique-se de configurar essa chave em seu .env)
const secretKey = process.env.AES_SECRET_KEY!;

// Função de descriptografar os campos sensíveis
function decrypt(encryptedValue: string): string | null {
  try {
    const [ivHex, encryptedData] = encryptedValue.split(":");
    if (!ivHex || !encryptedData) {
      throw new Error("Formato inválido do texto criptografado.");
    }

    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(secretKey, "utf-8"),
      iv
    );

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Erro ao descriptografar o valor:", error);
    return null;
  }
}

class OtakuPrimeController {
  static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email) {
      res.status(422).json({ message: "O email é obrigatório!" });
      return;
    }

    if (!password) {
      res.status(422).json({ message: "A senha é obrigatória!" });
      return;
    }

    // Verificar se o usuário existe
    const user =
      (await CustomerModel.findOne({ email: email })) ||
      (await PartnerModel.findOne({ email: email }));

    if (!user) {
      res.status(422).json({
        message: "Não há usuário cadastrado com esse email!",
      });
      return;
    }

    // Verificar se a senha digitada é igual a senha no banco de dados
    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      res.status(422).json({
        message: "Senha inválida !",
      });
      return;
    }

    await createUserToken(user, req, res);
  }

  static async checkUser(req: Request, res: Response) {
    // Usuário atual (a variável começa indefinida)
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
            // Garantindo que a senha não seja retornada
            currentUser.password = "";

            // Verifique se o cpfCnpj existe no usuário e, se sim, descriptografe
            if ("cpfCnpj" in currentUser && currentUser.cpfCnpj) {
              const decryptedCpfCnpj = decrypt(currentUser.cpfCnpj);

              currentUser.cpfCnpj = decryptedCpfCnpj ?? "";
            } else {
              console.log("cpfCnpj não encontrado para o usuário.");
            }

            // Verifique se o cpf existe no usuário e, se sim, descriptografe
            if ("cpf" in currentUser && currentUser.cpf) {
              const decryptedCpf = decrypt(currentUser.cpf);
              currentUser.cpf = decryptedCpf ?? "";
            } else {
              console.log("cpf não encontrado para o usuário.");
            }

            // Verifique se o cashback existe no usuário e, se sim, descriptografe
            if ("cashback" in currentUser && currentUser.cashback) {
              const decryptedCashback = decrypt(currentUser.cashback);
              currentUser.cashback = decryptedCashback ?? "";
            } else {
              console.log("cashback não encontrado para o usuário.");
            }
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
