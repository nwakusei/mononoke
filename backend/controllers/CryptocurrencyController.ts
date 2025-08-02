import { Request, Response } from "express";
import crypto from "crypto";
import axios from "axios"; // Certifique-se de ter instalado: npm install axios

// Models
import { OtakupayModel } from "../models/OtakupayModel";
import { CryptcurrencyModel } from "../models/CryptocurrencyModel";
import { HolderModel } from "../models/HolderCryptocurrencyModel";

// Middlewares
import getToken from "../helpers/get-token";
import getUserByToken from "../helpers/get-user-by-token";
import { get } from "http";

// Chave para criptografar e descriptografar dados sensíveis no Banco de Dados
const secretKey = process.env.AES_SECRET_KEY as string;

if (secretKey.length !== 32) {
  throw new Error("A chave precisa ter 32 caracteres para o AES-256");
}

// Função para Criptografar dados sensíveis no Banco de Dados
function encrypt(balance: string): string {
  const iv = crypto.randomBytes(16); // Gera um IV aleatório
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey, "utf-8"),
    iv
  );
  let encrypted = cipher.update(balance, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Combina o IV com o texto criptografado
  return iv.toString("hex") + ":" + encrypted;
}

// Esta função processa o texto criptografado com o IV concatenado:
function decrypt(encryptedBalance: string): number | null {
  let decrypted = "";

  try {
    // Divide o IV do texto criptografado
    const [ivHex, encryptedData] = encryptedBalance.split(":");
    if (!ivHex || !encryptedData) {
      throw new Error("Formato inválido do texto criptografado.");
    }

    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(secretKey, "utf-8"),
      iv
    );

    decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const balanceNumber = parseFloat(decrypted);
    if (isNaN(balanceNumber)) {
      return null;
    }
    return parseFloat(balanceNumber.toFixed(2));
  } catch (error) {
    console.log("Erro ao descriptografar o saldo:", error);
    return null;
  }
}

// Função para obter a cotação do Dolar com relação ao Real
const getDollarRate = async () => {
  try {
    console.log("🔄 Buscando cotação do dólar na API da CoinGecko...");

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=brl"
    );

    const rate = response.data.usd.brl;

    if (!rate) throw new Error("❌ Cotação não encontrada na API.");

    console.log(
      `✅ Cotação do dólar obtida com sucesso: R$ ${rate.toFixed(2)}`
    );
    return rate;
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      console.log(String(error));
    }
  }
};

class CryptocurrencyController {
  static async createCryptocurrency(req: Request, res: Response) {
    const {
      devBalance,
      cryptocurrencyImage,
      cryptocurrencyName,
      cryptocurrencySymbol,
      maxSupply,
    } = req.body;

    if (!devBalance) {
      res.status(402).json({
        message:
          "A quantidade de Criptomoeda na carteira do Dev é obrigatória!",
      });
      return;
    } else if (devBalance >= maxSupply) {
      res.status(402).json({
        message:
          "A quantidade de Criptomoeda do Dev não pode ser maior ou igual a Max. Supply!",
      });
      return;
    }

    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    // Verifique se o usuário é uma instância de CustomerModel
    if (!customer) {
      res.status(422).json({
        message: "Usuário não encontrado ou não é um cliente válido!",
      });
      return;
    }

    // // Verifique o tipo de conta
    // if (customer.accountType !== "superUser") {
    // 	res.status(422).json({
    // 		message: "Usuário sem permissão para criar criptomoedas!",
    // 	});
    // 	return;
    // }

    const customerOtakupay = await OtakupayModel.findOne({
      _id: customer.otakupayID,
    });

    try {
      // Verifique se a criptomoeda já existe pelo nome
      const existingCryptocurrency = await CryptcurrencyModel.findOne({
        cryptocurrencyName: cryptocurrencyName,
      });

      if (existingCryptocurrency) {
        res.status(409).json({
          message: "Já existe uma criptomoeda com este nome!",
        });
        return;
      }

      const cryptocurrency = new CryptcurrencyModel({
        devID: customerOtakupay?._id.toString(),
        devBalance: devBalance,
        cryptocurrencyImage: cryptocurrencyImage,
        cryptocurrencyName: cryptocurrencyName,
        cryptocurrencySymbol: cryptocurrencySymbol,
        cryptocurrencyValueInUSD: 0,
        maxSupply: maxSupply,
        mintedCryptocurrency: 0,
        burnedCryptocurrency: 0,
        totalSupply: 0,
        circulatingSupply: 0,
        marketCap: 0,
        volume: 0,
        volMktCap: 0,
        liquidityPool: {
          USD: 0,
          CRYPTOCURRENCY: 0,
        },
      });

      const newCryptocurrency = await cryptocurrency.save();

      res.status(200).json({
        message: "Criptomoeda criada com sucesso!",
        newCryptocurrency,
      });
    } catch (error) {
      console.log("Erro ao criar Criptomoeda!", error);
    }
  }

  static async addLiquidity(req: Request, res: Response) {
    const { id } = req.params;
    const { usd, cryptocurrency } = req.body;

    const token: any = getToken(req);
    const dev = await getUserByToken(token);

    // Verifique se o usuário é uma instância de CustomerModel
    if (!dev) {
      res.status(422).json({
        message: "Dev Responsável não encontrado!",
      });
      return;
    }

    const DBCryptoCurrency = await CryptcurrencyModel.findById({
      _id: id,
    });

    if (!DBCryptoCurrency) {
      res.status(404).json({ message: "Criptomoeda não encontrada!" });
      return;
    }

    if (dev.otakupayID !== DBCryptoCurrency.devID) {
      res.status(422).json({
        message:
          "Você não pode adicionar liquidez a criptomoeda, pois não é o dev responsável!",
      });
      return;
    }

    const devOtakuPay = await OtakupayModel.findOne(
      { _id: dev.otakupayID },
      { balanceAvailable: 1, _id: 0 }
    ).lean();

    const devOtakuPayBalanceAvailableEncrypted = devOtakuPay?.balanceAvailable;
    if (!devOtakuPayBalanceAvailableEncrypted) {
      res.status(400).json({ message: "Saldo não encontrado!" });
      return;
    }

    console.log("Balance criptografado", devOtakuPayBalanceAvailableEncrypted);

    const devOtakuPayBalanceAvailableDecrypted = decrypt(
      devOtakuPayBalanceAvailableEncrypted
    );

    console.log(
      "Balance Descriptografado",
      devOtakuPayBalanceAvailableDecrypted
    );

    // Verificar se os valores são positivos e válidos
    if (!usd || !cryptocurrency || usd <= 0 || cryptocurrency <= 0) {
      res.status(400).json({
        message: "Valores de USD e criptomoeda devem ser maiores que zero!",
      });
      return;
    }

    // Verificar se a mintagem não ultrapassa o maxSupply
    const totalMinted = DBCryptoCurrency.mintedCryptocurrency + cryptocurrency;
    if (totalMinted > DBCryptoCurrency.maxSupply) {
      res.status(400).json({
        message:
          "Não é possível mintar essa quantidade, pois ultrapassa o maxSupply!",
      });
      return;
    }

    try {
      const currentDollar = await getDollarRate();

      if (!currentDollar) {
        res.status(500).json({
          message: "Erro ao obter a cotação do dólar.",
        });
        return;
      }

      // 🔹 1. Converter USD para BRL
      const amountInBRL = usd * currentDollar;
      console.log(
        `Valor em BRL a ser descontado: R$ ${amountInBRL.toFixed(2)}`
      );

      // 🔹 2. Verificar se o saldo do OtakuPay é suficiente
      if (
        devOtakuPayBalanceAvailableDecrypted === null ||
        devOtakuPayBalanceAvailableDecrypted < amountInBRL
      ) {
        res.status(400).json({
          message: "Saldo insuficiente para adicionar liquidez!",
        });
        return;
      }

      // 🔹 3. Atualizar saldo do OtakuPay
      const newOtakuPayBalance = parseFloat(
        (devOtakuPayBalanceAvailableDecrypted - amountInBRL).toFixed(2)
      );

      // 🔹 4. Criptografar novo saldo antes de salvar
      const encryptedNewBalance = encrypt(newOtakuPayBalance.toString());

      // 🔹 5. Salvar no banco
      await OtakupayModel.updateOne(
        { _id: dev.otakupayID },
        { $set: { balanceAvailable: encryptedNewBalance } }
      );

      // 🔹 6. Atualizar os valores da liquidez no DBCryptoCurrency
      DBCryptoCurrency.liquidityPool.USD = parseFloat(
        (DBCryptoCurrency.liquidityPool.USD + usd).toFixed(2)
      );
      DBCryptoCurrency.liquidityPool.CRYPTOCURRENCY = parseFloat(
        (
          DBCryptoCurrency.liquidityPool.CRYPTOCURRENCY + cryptocurrency
        ).toFixed(6)
      );

      // 🔹 7. Atualizar mintedCryptocurrency e totalSupply
      DBCryptoCurrency.mintedCryptocurrency = totalMinted;
      DBCryptoCurrency.totalSupply =
        DBCryptoCurrency.mintedCryptocurrency -
        DBCryptoCurrency.burnedCryptocurrency;

      // 🔹 8. Calcular novo valor da criptomoeda em USD
      if (DBCryptoCurrency.liquidityPool.CRYPTOCURRENCY > 0) {
        DBCryptoCurrency.cryptocurrencyValueInUSD = parseFloat(
          (
            DBCryptoCurrency.liquidityPool.USD /
            DBCryptoCurrency.liquidityPool.CRYPTOCURRENCY
          ).toFixed(2)
        );
      }

      // 🔹 9. Salvar atualização no banco
      await DBCryptoCurrency.save();

      // 🔹 10. Responder com sucesso
      res.status(200).json({
        message: "Liquidez adicionada com sucesso!",
        liquidityPool: DBCryptoCurrency.liquidityPool,
        newOtakuPayBalance,
      });
    } catch (error) {
      console.log(error);
    }
  }

  static async buyCryptocurrency(req: Request, res: Response) {
    const { id } = req.params;
    const { amountOfCryptocurrencyToBePurchased } = req.body;

    if (!amountOfCryptocurrencyToBePurchased) {
      res.status(404).json({
        message: "A quantidade de Cryptomoeda é obrigatória!",
      });
      return;
    }

    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!customer) {
      res.status(422).json({
        message: "Usuário não encontrado ou não é um cliente válido!",
      });
      return;
    }

    if (customer.accountType !== "customer") {
      res.status(422).json({
        message: "Somente Clientes podem comprar Criptomoedas!",
      });
      return;
    }

    const otakupayID = customer.otakupayID;

    const DBCryptoCurrency = await CryptcurrencyModel.findById({ _id: id });

    if (!DBCryptoCurrency) {
      res.status(404).json({ message: "Criptomoeda não encontrada!" });
      return;
    }

    try {
      const customerOtakuPointAvailable = 500;
      const currentDollar = await getDollarRate();

      console.log(
        "Customer Otaku Point Disponível",
        customerOtakuPointAvailable
      );

      const customerDollarAvailable =
        customerOtakuPointAvailable / currentDollar;
      console.log("Customer Dollar Disponível", customerDollarAvailable);

      const transactionCostInDollar =
        DBCryptoCurrency.cryptocurrencyValueInUSD *
        amountOfCryptocurrencyToBePurchased;

      console.log(
        "Quantidade de Otakoin a ser comprada",
        amountOfCryptocurrencyToBePurchased
      );

      if (
        amountOfCryptocurrencyToBePurchased >
        DBCryptoCurrency.liquidityPool.CRYPTOCURRENCY
      ) {
        res.status(400).json({
          message:
            "Erro: Não há OTAKOIN suficiente disponível na pool de liquidez para essa compra.",
        });
        return;
      }

      if (customerDollarAvailable >= transactionCostInDollar) {
        console.log("PODE COMPRAR OTAKOIN");

        let newLiquidityPool = {
          USD: parseFloat(
            (
              DBCryptoCurrency.liquidityPool.USD + transactionCostInDollar
            ).toFixed(2)
          ),
          CRYPTOCURRENCY: parseFloat(
            (
              DBCryptoCurrency.liquidityPool.CRYPTOCURRENCY -
              amountOfCryptocurrencyToBePurchased
            ).toFixed(6)
          ),
        };

        console.log("Nova Pool de Liquidez", newLiquidityPool);

        if (newLiquidityPool.CRYPTOCURRENCY < 0) {
          res.status(400).json({
            message:
              "Erro: Não há OTAKOIN suficiente disponível na pool de liquidez para essa compra.",
          });
          return;
        }

        let newCurrencyValueInUSD =
          newLiquidityPool.CRYPTOCURRENCY > 0
            ? newLiquidityPool.USD / newLiquidityPool.CRYPTOCURRENCY
            : DBCryptoCurrency.cryptocurrencyValueInUSD;

        console.log("Novo valor de Otakoin em Dollar", newCurrencyValueInUSD);

        const newTotalSupply =
          DBCryptoCurrency.mintedCryptocurrency -
          DBCryptoCurrency.burnedCryptocurrency;
        console.log("Novo Total Supply", newTotalSupply);

        const newCirculatingSupply =
          newTotalSupply - newLiquidityPool.CRYPTOCURRENCY;
        console.log(
          "Nova quantidade de Otakoin em posse dos investidores",
          newCirculatingSupply
        );

        const newMarketCap = newCurrencyValueInUSD * newCirculatingSupply;

        const updatedCryptoCurrency =
          await CryptcurrencyModel.findByIdAndUpdate(
            id,
            {
              cryptocurrencyValueInUSD: newCurrencyValueInUSD.toFixed(2),
              totalSupply: newTotalSupply,
              circulatingSupply: newCirculatingSupply,
              marketCap: newMarketCap.toFixed(2),
              liquidityPool: newLiquidityPool,
            },
            { new: true }
          );

        if (!updatedCryptoCurrency) {
          res.status(404).json({
            message: "Erro ao atualizar a criptomoeda!",
          });
          return;
        }

        // Atualizar ou criar um Holder
        const existingHolder = await HolderModel.findOne({
          cryptoCurrencyID: id,
          customerOtakupayID: otakupayID,
        });

        const formattedAmount = parseFloat(
          amountOfCryptocurrencyToBePurchased.toFixed(6)
        );

        if (existingHolder) {
          existingHolder.amountOfCryptocurrency = parseFloat(
            (existingHolder.amountOfCryptocurrency + formattedAmount).toFixed(6)
          );
          await existingHolder.save();
        } else {
          await HolderModel.create({
            cryptoCurrencyID: id,
            cryptocurrencyName: DBCryptoCurrency.cryptocurrencyName,
            cryptocurrencySymbol: DBCryptoCurrency.cryptocurrencySymbol,
            customerOtakupayID: otakupayID,
            amountOfCryptocurrency: formattedAmount,
          });
        }

        res.status(200).json({
          message: "TRANSAÇÃO EFETUADA COM SUCESSO",
          updatedCryptoCurrency,
        });
        return;
      } else {
        console.log(
          "Quantidade de Otaku Point insuficiente para realizar esta transação!"
        );
        res.status(400).json({
          message:
            "Erro: Quantidade de Otaku Point insuficiente para realizar a compra.",
        });
        return;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
        res.status(500).json({
          message: "Erro interno no servidor.",
          error: error.message,
        });
      } else {
        console.log(error);
        res.status(500).json({
          message: "Erro interno no servidor.",
          error: String(error),
        });
      }
      return;
    }
  }

  static async getCryptocurrencyBalanceByCustomer(req: Request, res: Response) {
    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!customer) {
      res.status(404).json({ message: "Customer não encontrado!" });
      return;
    }

    const customerOtakupayID = customer.otakupayID;

    try {
      const cryptocurrenciesBalance = await HolderModel.find({
        customerOtakupayID: customerOtakupayID,
      });

      res.status(200).json({ cryptocurrenciesBalance });
    } catch (error) {
      console.log(error);
    }
  }

  static async getAllCryptocurrencies(req: Request, res: Response) {
    try {
      const cryptocurrencies = await CryptcurrencyModel.find();

      res.status(200).json({
        message: "Retornando todas as Criptomoedas",
        cryptocurrencies,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Erro ao buscar criptomoedas" });
    }
  }

  static async getCryptocurrencyByID(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const cryptocurrency = await CryptcurrencyModel.findById(id); // ✅ Use await e findById

      if (!cryptocurrency) {
        res.status(404).json({ message: "Criptomoeda não encontrada" });
        return;
      }

      res.status(200).json({ cryptocurrency }); // Agora é seguro fazer isso
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Erro ao buscar criptomoeda" });
    }
  }
}

export default CryptocurrencyController;
