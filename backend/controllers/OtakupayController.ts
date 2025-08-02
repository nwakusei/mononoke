import { Request, Response } from "express";
import crypto from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Multer } from "multer";
import { ObjectId } from "mongodb";

// Models
import { OtakupayModel } from "../models/OtakupayModel.js";
import { PartnerModel } from "../models/PartnerModel.js";
import { ProductModel } from "../models/ProductModel.js";
import { ProductOtaclubModel } from "../models/ProductOtaclubModel.js";
import { OrderModel } from "../models/OrderModel.js";
import { OrderOtaclubModel } from "../models/OrderOtaclubModel.js";
import { PaymentPixOtakuPayModel } from "../models/PixOtakuPayModel.js";
// import { CustomerModel } from "../models/CustomerModel.js";

// STRIPE
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-11-20.acacia", // Use a versão mais recente da API do Stripe
});

// Import Mercado Pago
import { Payment, MercadoPagoConfig } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN as string,
  options: { timeout: 5000 },
});

const payment = new Payment(client);

import https from "https";
import * as fs from "fs";
import * as path from "path";
import axios, { AxiosRequestConfig } from "axios";
import qs from "qs";

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";
import mongoose, { isValidObjectId } from "mongoose";
import { CouponModel } from "../models/CouponModel.js";
import { error } from "console";
import { CustomerModel } from "../models/CustomerModel.js";
import { TransactionModel } from "../models/TransactionModel.js";
import { resolveSoa } from "dns";
import { RaffleModel } from "../models/RaffleModel.js";

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

class OtakupayController {
  static async addBalance(req: Request, res: Response) {
    const { value } = req.body;

    if (!value) {
      res.status(422).json({
        message: "O valor a ser adicionado é obrigatório!",
      });
      return;
    }

    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!(customer instanceof CustomerModel)) {
      res.status(422).json({
        message: "Usuário não encontrado ou não é um cliente válido!",
      });
      return;
    }

    try {
      const customerOtakupay: any = await OtakupayModel.findOne({
        _id: customer.otakupayID,
      });

      const currentCustomerBalanceAvailable = customerOtakupay.balanceAvailable;

      const currentCustomerBalanceAvailableDecrypted = decrypt(
        currentCustomerBalanceAvailable
      );

      if (currentCustomerBalanceAvailableDecrypted === null) {
        res.status(500).json({
          message: "Erro ao descriptografar o Customer Balance Available!",
        });
        return;
      }

      const newCustomerBalanceAvailable =
        currentCustomerBalanceAvailableDecrypted + parseFloat(value);

      const newCustomerBalanceAvailableEncrypted = encrypt(
        newCustomerBalanceAvailable.toString()
      );

      console.log(
        "Novo Balance Available Atual do Customer Criptografado",
        newCustomerBalanceAvailableEncrypted
      );

      customerOtakupay.balanceAvailable = newCustomerBalanceAvailableEncrypted;

      await customerOtakupay.save();

      res.status(200).json({ messsage: "Saldo Adicionado com Sucesso!" });
    } catch (error) {
      console.error("Erro ao adicionar saldo:", error);
      return;
    }
  }

  static async addOtakuPoints(req: Request, res: Response) {
    const { value } = req.body;

    if (!value) {
      res.status(422).json({
        message: "O valor a ser adicionado é obrigatório!",
      });
      return;
    }

    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!(customer instanceof CustomerModel)) {
      res.status(422).json({
        message: "Usuário não encontrado ou não é um cliente válido!",
      });
      return;
    }

    try {
      const customerOtakupay: any = await OtakupayModel.findOne({
        _id: customer.otakupayID,
      });

      const currentCustomerOtakuPointsAvailable =
        customerOtakupay.otakuPointsAvailable;

      const currentCustomerOtakuPointsAvailableDecrypted = decrypt(
        currentCustomerOtakuPointsAvailable
      );

      if (currentCustomerOtakuPointsAvailableDecrypted === null) {
        res.status(500).json({
          message: "Erro ao descriptografar o Customer Balance Available!",
        });
        return;
      }

      const newCustomerOtakuPointsAvailable =
        currentCustomerOtakuPointsAvailableDecrypted + parseFloat(value);

      const newCustomerOtakuPointsAvailableEncrypted = encrypt(
        newCustomerOtakuPointsAvailable.toString()
      );

      console.log(
        "Novo Balance Available Atual do Customer Criptografado",
        newCustomerOtakuPointsAvailableEncrypted
      );

      customerOtakupay.otakuPointsAvailable =
        newCustomerOtakuPointsAvailableEncrypted;

      await customerOtakupay.save();

      res.status(200).json({ messsage: "Saldo Adicionado com Sucesso!" });
    } catch (error) {
      console.error("Erro ao adicionar saldo:", error);
      return;
    }
  }

  // accountBalanceOtamart
  static async buyOtamart(req: Request, res: Response) {
    const { products, shippingCost, coupons } = req.body;

    // Verificar se o array de produtos é válido
    if (!products || products.length === 0) {
      res.status(404).json({
        error: "Nenhum produto encontrado na requisição!",
      });
      return;
    }

    // Verificar se todos os produtos possuem quantidade especificada
    if (
      products.some(
        (product: { productQuantity: number }) => product.productQuantity <= 0
      )
    ) {
      res.status(400).json({
        error: "Quantidade inválida para um ou mais produtos!",
      });
      return;
    }

    // Pegar o Customer logado que irá realizar o pagamento
    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!(customer instanceof CustomerModel)) {
      res.status(422).json({
        message: "Usuário não encontrado ou não é um cliente válido!",
      });
      return;
    }

    if (customer.accountType !== "customer") {
      res.status(422).json({
        message: "Usuário sem permissão para realizar este tipo de transação!",
      });
      return;
    }

    if (!customer.cpf || customer.cpf == "") {
      res.status(422).json({
        message: "CPF inválido, atualize antes de prosseguir!",
      });
      return;
    }

    try {
      // Pegar os IDs dos produtos da Requisição
      const productIDs = products.map((product: any) => product.productID);

      // Verificar se todos os IDs possuem o formato correto de ObjectId
      for (const id of productIDs) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          res.status(400).json({
            error: `ID do produto '${id}' é inválido`,
          });
          return;
        }
      }

      const productsFromDB = await ProductModel.find({
        _id: productIDs,
      });

      // Validar se todos os produtos no carrinho estão no banco de dados
      const dbProductIDs = productsFromDB.map((product) => String(product._id));

      // Identificar os IDs de produtos ausentes no banco
      const missingProductIDs = productIDs.filter(
        (id: any) => !dbProductIDs.includes(String(id))
      );

      if (missingProductIDs.length > 0) {
        res.status(400).json({
          message: "Alguns produtos não estão mais disponíveis",
          missingProductIDs,
        });
        return;
      }

      // // Verificar se algum dos produtos possui estoque indisponível
      // const produtoSemEstoque = productsFromDB.find(
      // 	(product: any) => product.stock <= 0
      // );
      // if (produtoSemEstoque) {
      // 	return res.status(422).json({
      // 		message:
      // 			"Um ou mais produtos encontram-se esgotados, não é possível realizar o pagamento!",
      // 	});
      // }

      // Verificar se algum dos produtos possui estoque indisponível
      const produtoSemEstoque = productsFromDB.find((product: any) => {
        // Se o produto não tiver variações, verifica diretamente o estoque
        if (
          !product.productVariations ||
          product.productVariations.length === 0
        ) {
          return product.stock <= 0;
        }

        // Caso tenha variações, verifica se todas as opções dentro das variações estão sem estoque
        const todasVariacoesSemEstoque = product.productVariations.every(
          (variation: any) => {
            // Garante que a variação tenha opções
            if (!variation.options || variation.options.length === 0) {
              return true; // Considera a variação sem estoque se não há opções
            }

            // Verifica se todas as opções dessa variação estão sem estoque
            return variation.options.every((option: any) => option.stock <= 0);
          }
        );

        return todasVariacoesSemEstoque;
      });

      if (produtoSemEstoque) {
        res.status(422).json({
          message:
            "Um ou mais produtos encontram-se esgotados, não é possível realizar o pagamento!",
        });
        return;
      }

      // Pegar o OtakuPay do Customer
      const customerOtakupay: any = await OtakupayModel.findOne({
        _id: customer.otakupayID,
      });

      // Verificar se o saldo do Customer existe
      if (!customerOtakupay || !customerOtakupay.balanceAvailable) {
        res.status(422).json({
          message: "Customer Balance Available não encontrado!",
        });
        return;
      }

      // Pegar o Balance Available do Customer Criptografado
      const encryptedCustomerBalanceAvailable =
        customerOtakupay.balanceAvailable;

      // Descriptografar o Balance Available do Customer
      const decryptedCustomerBalanceAvailable = decrypt(
        encryptedCustomerBalanceAvailable
      );

      if (decryptedCustomerBalanceAvailable === null) {
        res.status(500).json({
          message: "Erro ao descriptografar o Customer Balance Available!",
        });
        return;
      }

      console.log(
        "BALANCE AVAILABLE DO CUSTOMER DESCRIPTOGRAFADO:",
        decryptedCustomerBalanceAvailable
      );

      // Array para armazenar os custos totais dos produtos por PartnerID
      const partnersTotalCost: {
        partnerID: string;
        totalCost: number;
      }[] = [];

      // Iterar sobre cada produto para calcular o custo total com base no parceiro
      for (const product of products) {
        // Encontrar o produto correspondente na lista de produtos do banco de dados
        const productFromDB = productsFromDB.find(
          (p: any) => p._id.toString() === product.productID.toString()
        );

        // Se o produto correspondente não for encontrado, continuar para o próximo produto
        if (!productFromDB) {
          continue;
        }

        let productCost;

        // Verificar se o produto tem variações
        if (
          product.productVariations &&
          product.productVariations.length > 0 &&
          productFromDB.productVariations &&
          productFromDB.productVariations.length > 0
        ) {
          // Encontrar a variação no banco de dados
          const variation = productFromDB.productVariations.find(
            (v: any) =>
              v._id.toString() ===
              product.productVariations[0].variationID.toString()
          );

          if (variation) {
            // Encontrar a opção correspondente dentro da variação
            const option = variation.options.find(
              (o: any) =>
                o._id.toString() ===
                product.productVariations[0].optionID.toString()
            );

            if (option) {
              // Utilizar o preço da opção
              productCost =
                option.promotionalPrice > 0
                  ? option.promotionalPrice
                  : option.originalPrice;
            }
          }
        }

        // Caso o produto não tenha variações ou nenhuma correspondência tenha sido encontrada
        if (!productCost) {
          productCost =
            productFromDB.promotionalPrice > 0
              ? productFromDB.promotionalPrice
              : productFromDB.originalPrice;
        }

        // Calcular o custo total do produto levando em consideração a quantidade
        const totalProductCost = productCost * product.productQuantity;

        // Verificar se já existe um registro para esse parceiro no array
        const partnerIndex = partnersTotalCost.findIndex(
          (item) => item.partnerID === product.partnerID
        );

        if (partnerIndex === -1) {
          // Se não existir, adicionar um novo registro ao array
          partnersTotalCost.push({
            partnerID: product.partnerID,
            totalCost: totalProductCost,
          });
        } else {
          // Se existir, adicionar o custo total do produto ao custo total existente
          partnersTotalCost[partnerIndex].totalCost += totalProductCost;
        }
      }

      // Aplicar desconto do cupom, se houver
      if (coupons && coupons.length > 0) {
        for (const coupon of coupons) {
          const couponCode = coupon.couponCode;

          // Buscar o cupom no banco de dados usando o código do cupom
          const couponData = await CouponModel.findOne({
            couponCode: couponCode,
          });

          if (couponData) {
            // Iterar sobre cada parceiro para aplicar o desconto do cupom
            for (const partner of partnersTotalCost) {
              if (String(partner.partnerID) === String(couponData.partnerID)) {
                // Calcular o valor do desconto com base na porcentagem do cupom
                const discountAmount =
                  (partner.totalCost * couponData.discountPercentage) / 100;

                // Subtrair o valor do desconto do custo total do parceiro
                partner.totalCost -= discountAmount;
              }
            }
          } else {
            // Se algum cupom não for encontrado, enviar resposta de erro
            res.status(404).json({
              message: "Cupom de desconto não encontrado.",
            });
            return;
          }
        }
      }

      // Verificar se algum parceiro possui produtos
      if (partnersTotalCost.length === 0) {
        res.status(422).json({
          message: "Nenhum produto encontrado para os parceiros especificados.",
        });
        return;
      }

      console.log("CUSTO TOTAL DOS PRODUTOS POR PARCEIRO:", partnersTotalCost);

      console.log("CUSTO TOTAL DO FRETE POR PARCEIRO:", shippingCost);

      // Função para calcular o custo total de um produto
      function getProductCost(product: any): number {
        // Encontrar o produto correspondente na lista de produtos do banco de dados
        const productFromDB = productsFromDB.find(
          (p: any) => p._id.toString() === product.productID.toString()
        );

        // Se o produto correspondente não for encontrado, retornar -1
        if (!productFromDB) {
          return -1;
        }

        // Calcular o custo total do produto levando em consideração a quantidade
        const productCost =
          productFromDB.promotionalPrice > 0
            ? productFromDB.promotionalPrice
            : productFromDB.originalPrice;
        return productCost * product.productQuantity;
      }

      // Array para armazenar os custos totais dos produtos por parceiro, incluindo o frete
      const partnersTotalCostWithShipping: {
        partnerID: string;
        totalCostWithShipping: number;
      }[] = [];

      // Verificar se há dados em partnersTotalCost e shippingCost
      if (partnersTotalCost.length === 0 || shippingCost.length === 0) {
        res.status(422).json({
          message: "Falta de dados, impossível prosseguir!",
        });
        return;
      }

      // Iterar sobre cada parceiro para calcular o custo total com base nos valores já descontados e no frete correspondente
      for (const partner of partnersTotalCost) {
        // Encontrar o frete correspondente ao parceiro
        const shipping = shippingCost.find(
          (cost: any) => cost.partnerID === partner.partnerID
        );

        // Se o frete for encontrado, calcular o custo total com frete, caso contrário, considerar apenas o valor já descontado
        const totalCostWithShipping = shipping
          ? partner.totalCost + shipping.vlrFrete
          : partner.totalCost;

        // Adicionar o custo total com frete ao array partnersTotalCostWithShipping
        partnersTotalCostWithShipping.push({
          partnerID: partner.partnerID,
          totalCostWithShipping: totalCostWithShipping,
        });
      }

      console.log(
        "CUSTO TOTAL DOS PRODUTOS + FRETE POR PARCEIRO:",
        partnersTotalCostWithShipping
      );

      // Calcular o valor total do pedido com frete (PARA O CUSTOMER PAGAR)
      let customerOrderCostTotal = partnersTotalCostWithShipping.reduce(
        (total, item) => total + item.totalCostWithShipping,
        0
      );

      console.log("VALOR TOTAL DOS PEDIDOS COM FRETE", customerOrderCostTotal);

      // Verificar se orderCostTotal é um número válido
      if (isNaN(customerOrderCostTotal)) {
        res.status(422).json({
          message: "Custo total do pedido inválido!",
        });
        return;
      }

      if (
        isNaN(Number(decryptedCustomerBalanceAvailable)) ||
        isNaN(customerOrderCostTotal)
      ) {
        res.status(422).json({
          message: "Valores em formatos inválidos!",
        });
        return;
      }

      if (Number(decryptedCustomerBalanceAvailable) < customerOrderCostTotal) {
        res.status(422).json({
          message: "Customer Balance Available insuficiente!",
        });
        return;
      }

      // Limitando o Customer Balance Available para duas casas decimais
      const newCustomerBalanceAvailable = (
        Number(decryptedCustomerBalanceAvailable) - customerOrderCostTotal
      ).toFixed(2);

      // Criptografar o novo Customer Balance Available para armazenar no banco de dados
      const newEncryptedCustomerBalanceAvailable = encrypt(
        newCustomerBalanceAvailable.toString()
      );

      // Atualizar o Customer Balance Available criptografado no banco de dados
      customerOtakupay.balanceAvailable = newEncryptedCustomerBalanceAvailable;

      // Array para armazenar os parceiros
      const partners = [];

      // Array para armazenar os OtakuPays associados aos parceiros
      const partnerOtakupays = [];

      // Map para armazenar os Partner Balance Pending Criptografados por partnerID
      const encryptedPartnerBalancePendingMap = new Map<string, string>();

      // Iterar sobre cada produto para obter os parceiros e seus Otakupays associados
      for (const product of products) {
        // Buscar o parceiro pelo ID do produto
        const partner = await PartnerModel.findById(product.partnerID);

        // Verificar se o parceiro existe
        if (!partner) {
          // Se o parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Parceiro não encontrado para este produto!",
          });
          return;
        }

        // Acessar o OtakuPay do parceiro usando o otakupayID
        const partnerOtakupay = await OtakupayModel.findOne({
          _id: partner.otakupayID,
        });

        // Verificar se o OtakuPay do parceiro existe
        if (!partnerOtakupay) {
          // Se o OtakuPay do parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Otakupay do Partner não encontrado!",
          });
          return;
        }

        // Adicionar o parceiro ao array de parceiros
        partners.push(partner);

        // Adicionar o OtakuPay associado ao array de Otakupays
        partnerOtakupays.push(partnerOtakupay);

        // Adicionar o Partner Balance Pending ao mapa, se existir
        if (
          partnerOtakupay.balancePending &&
          !encryptedPartnerBalancePendingMap.has(partner._id.toString())
        ) {
          encryptedPartnerBalancePendingMap.set(
            partner._id.toString(),
            partnerOtakupay.balancePending
          );
        }
      }

      // Converter o map para um array de Partner Balance Pending Criptografados
      const encryptedPartnerBalancePendingList = Array.from(
        encryptedPartnerBalancePendingMap.entries()
      ).map(([partnerID, balancePending]) => ({
        partnerID,
        balancePending,
      }));

      // Descriptografar os Partner Balance Pending
      const decryptedPartnerBalancePendingList =
        encryptedPartnerBalancePendingList.map(
          ({ partnerID, balancePending }) => {
            const decryptedValue = decrypt(balancePending);
            return {
              partnerID,
              balancePending: decryptedValue,
            };
          }
        );

      console.log(
        "Partner Balance Pending Descriptografados por ID de parceiro:",
        decryptedPartnerBalancePendingList
      );

      if (decryptedPartnerBalancePendingList === null) {
        res.status(500).json({
          message: "Erro ao descriptografar o Partner Balance Pending!",
        });
        return;
      }

      // Array para armazenar os novos Partner Balance Pending
      const newBalances = [];

      // Iterar sobre cada parceiro para calcular o novo balancePending
      for (const partner of decryptedPartnerBalancePendingList) {
        // Verificar se balancePending não é nulo
        if (partner.balancePending !== null) {
          // Encontrar o total da compra com frete correspondente ao parceiro
          const partnerTotalCostWithShipping =
            partnersTotalCostWithShipping.find(
              (item) => item.partnerID === partner.partnerID
            );

          // Se o parceiro não tiver um total da compra com frete, atribuir 0
          const partnerTotalCost = partnerTotalCostWithShipping
            ? partnerTotalCostWithShipping.totalCostWithShipping
            : 0;

          // Calcular o novo balancePending somando o total da compra com frete ao balancePending existente
          const newBalance = partner.balancePending + partnerTotalCost;

          // Adicionar o novo balancePending ao array de novos balanços - São esses valores que serão armazenados
          newBalances.push({
            partnerID: partner.partnerID,
            balancePending: newBalance,
          });
        }
      }

      // Console log para exibir os novos balanços pendentes dos parceiros
      console.log("NOVO PARTNER BALANCE PENDING:", newBalances);

      // Array para armazenar os novos Partner Balance Pending criptografados
      const newEncryptedBalances = [];

      // Iterar sobre cada novo balancePending para criptografá-los
      for (const balance of newBalances) {
        // Criptografar o balancePending usando a função encrypt
        const encryptedBalance = encrypt(balance.balancePending.toString());

        // Adicionar o balancePending criptografado ao array de novos Balance Pending criptografados
        newEncryptedBalances.push({
          partnerID: balance.partnerID,
          balancePending: encryptedBalance,
        });
      }

      // Console log para exibir os novos balanços pendentes criptografados dos parceiros
      console.log(
        "NOVOS PARTNER BALANCE PENDING CRIPTOGRAFADOS:",
        newEncryptedBalances
      );

      // Array para armazenar os cashbacks (Otaku Points) que serão pagos por parceiro
      const partnerCashbacks: {
        partnerID: string;
        cashbackAmount: number;
      }[] = [];

      // Iterar sobre cada parceiro para calcular o cashback
      for (const partnerCost of partnersTotalCost) {
        // Calcular o valor do cashback (2% do custo total dos produtos)
        const cashbackAmount = partnerCost.totalCost * 0.01;

        // Adicionar o cashback ao array de cashbacks
        partnerCashbacks.push({
          partnerID: partnerCost.partnerID,
          cashbackAmount: cashbackAmount,
        });
      }

      console.log(
        "CASHBACKS/OTAKU POINTS A SEREM PAGOS PELO PARTNER INDIVIDUALMENTE:",
        partnerCashbacks
      );

      // Array para armazenar os cashbacks (Otaku Points) criptografados, a serem pagos por parceiro
      const encryptedPartnerCashbacks: {
        partnerID: string;
        encryptedCashback: string;
      }[] = [];

      // Iterar sobre cada parceiro para calcular e criptografar o cashback (Otaku Points)
      for (const partnerCost of partnersTotalCost) {
        // Calcular o valor do cashback (2% do custo total dos produtos)
        const cashbackAmount = partnerCost.totalCost * 0.01;

        // Criptografar o valor do cashback usando a função encrypt
        const encryptedCashback = encrypt(cashbackAmount.toString());

        // Adicionar o cashback criptografado ao array de cashbacks criptografados
        encryptedPartnerCashbacks.push({
          partnerID: partnerCost.partnerID,
          encryptedCashback: encryptedCashback,
        });
      }

      console.log(
        "CASHBACKS/OTAKU POINTS A SEREM PAGOS PELO PARTNER INDIVIDUALMENTE, CRIPTOGRAFADOS:",
        encryptedPartnerCashbacks
      );

      // Array para armazenar os cashbacks (Otaku Points) do Customer por parceiro
      const customerCashbacks: {
        partnerID: string;
        customerCashbackAmount: number;
      }[] = [];

      // Iterar sobre cada parceiro para calcular o cashback do cliente
      for (const partnerCost of partnersTotalCost) {
        // Buscar o parceiro pelo ID
        const partner = await PartnerModel.findById(partnerCost.partnerID);

        // Verificar se o parceiro existe
        if (!partner) {
          // Se o parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Parceiro não encontrado!",
          });
          return;
        }

        // Acessar o OtakuPay do Partner usando o otakupayID
        const partnerOtakupay = await OtakupayModel.findOne({
          _id: partner.otakupayID,
        });

        // Verificar se o OtakuPay do parceiro existe
        if (!partnerOtakupay) {
          // Se o Otakupay do parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Otakupay do Partner não encontrado!",
          });
          return;
        }

        // Verificar se o parceiro oferece cashback
        if (!partnerOtakupay.cashback) {
          // Se o parceiro não oferecer cashback, continuar para o próximo parceiro
          continue;
        }

        // Calcular o cashback do cliente com base na porcentagem de cashback do parceiro
        const customerCashbackAmount =
          Math.floor(
            partnerCost.totalCost *
              (Number(partnerOtakupay.cashback) / 100) *
              100
          ) / 100;

        // Adicionar o cashback do cliente ao array de cashbacks do cliente
        customerCashbacks.push({
          partnerID: partnerCost.partnerID,
          customerCashbackAmount: customerCashbackAmount,
        });
      }

      console.log(
        "CASHBACK/OTAKU POINTS DO CUSTOMER POR PARCEIRO:",
        customerCashbacks
      );

      /// É NECESSÁRIO CRIPTOGRAFAR O CASHBACK DO CUSTOMER RECEBIDO POR PARCEIRO, ANTES DE DESMEMBRAR E ARMAZENAR NA ORDER

      // Array para armazenar os cashbacks (Otaku Points) criptografados do Customer por parceiro
      const encryptedCustomerCashbacks: {
        partnerID: string;
        encryptedCustomerCashback: string;
      }[] = [];

      // Iterar sobre cada cashback do cliente para criptografar
      for (const cashback of customerCashbacks) {
        // Criptografar o valor do cashback do cliente usando a função encrypt
        const encryptedCashback = encrypt(
          cashback.customerCashbackAmount.toString()
        );

        // Adicionar o cashback criptografado ao array de cashbacks criptografados do cliente
        encryptedCustomerCashbacks.push({
          partnerID: cashback.partnerID,
          encryptedCustomerCashback: encryptedCashback,
        });
      }

      // Exibir os cashbacks do cliente por parceiro após a criptografia
      console.log(
        "CASHBACK/OTAKU POINTS DO CUSTOMER POR PARCEIRO, CRIPTOGRAFADOS:",
        encryptedCustomerCashbacks
      );

      // Variável para armazenar o total de cashback (Otaku Points) do Customer
      let totalCustomerCashback = 0;

      // Iterar sobre cada cashback (Otaku Points) do cliente por parceiro para calcular o total de cashback
      for (const customerCashback of customerCashbacks) {
        // Adicionar o valor do cashback do cliente ao total
        totalCustomerCashback += customerCashback.customerCashbackAmount;
      }

      // Descriptografar o Otaku Points Pending do Customer
      const decryptedOtakuPointsPending = decrypt(
        customerOtakupay.otakuPointsPending
      );

      // Verificar se a descriptografia foi bem-sucedida
      if (decryptedOtakuPointsPending === null) {
        res.status(500).json({
          message:
            "Erro ao descriptografar saldo de pontos pendentes do cliente!",
        });
        return;
      }

      // Somar o total de cashback (Otaku Points) ao Otaku Points Pending do Customer
      const newOtakuPointsPending =
        Number(decryptedOtakuPointsPending) + Number(totalCustomerCashback);

      console.log(
        "NOVO OTAKU POINTS PENDING DO CUSTOMER EM NÚMEROS:",
        newOtakuPointsPending
      );

      // Criptografar o novo Otaku Points Pending do Customer
      const encryptedNewOtakuPointsPending = encrypt(
        newOtakuPointsPending.toString()
      );

      console.log(
        "NOVO OTAKU POINTS PENDING DO CUSTOMER CRIPTOGRAFADO:",
        encryptedNewOtakuPointsPending
      );

      // Atualizar os Customer Otaku Points Pending criptografados no banco de dados
      customerOtakupay.otakuPointsPending = encryptedNewOtakuPointsPending;

      // *********************************************************************************************** //

      // Array para armazenar as comissões por parceiros
      const partnerCommissions: {
        partnerID: string;
        commissionAmount: number;
      }[] = [];

      // Iterar sobre cada parceiro para calcular a comissão
      for (const partnerCost of partnersTotalCost) {
        // Calcular a comissão de 9% em cima do total dos produtos transacionados por parceiro || O VALOR PRECISARÁ SER DEFINIDO PELO DOTENV
        const commissionAmount = partnerCost.totalCost * 0.09;

        // Buscar o parceiro pelo ID
        const partner = await PartnerModel.findById(partnerCost.partnerID);

        // Verificar se o parceiro existe
        if (!partner) {
          // Se o parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Parceiro não encontrado!",
          });
          return;
        }

        // Acessar o OtakuPay do parceiro usando o otakupayID
        const partnerOtakupay = await OtakupayModel.findOne({
          _id: partner.otakupayID,
        });

        // Verificar se o OtakuPay do parceiro existe
        if (!partnerOtakupay) {
          // Se o OtakuPay do parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Otakupay do Partner não encontrado!",
          });
          return;
        }

        // Verificar se o parceiro oferece cashback
        if (!partnerOtakupay.cashback) {
          // Se o parceiro não oferecer cashback, o valor do cashback é 0
          const cashbackAmount = 0;
          // Somar o cashback ao valor da comissão
          const totalAmount = commissionAmount + cashbackAmount;

          // Adicionar a comissão a ser paga pelo Parceiro ao array de comissões
          partnerCommissions.push({
            partnerID: partnerCost.partnerID,
            commissionAmount: totalAmount,
          });
        } else {
          // Calcular o cashback que o parceiro está oferecendo
          const cashbackAmount =
            partnerCost.totalCost * (Number(partnerOtakupay.cashback) / 100);

          console.log("VALOR DO CASHBACK", cashbackAmount);

          // Somar o cashback ao valor da comissão
          const totalAmount = commissionAmount + cashbackAmount;

          console.log("VALOR DO CASHBACK + COMISSÃO", totalAmount);

          // Adicionar a comissão do parceiro ao array de comissões
          partnerCommissions.push({
            partnerID: partnerCost.partnerID,
            commissionAmount: totalAmount,
          });
        }
      }

      console.log(
        "COMISSÕES A SEREM PAGAS PELOS PARTNERS:",
        partnerCommissions
      );

      // Array para armazenar as comissões criptografadas por parceiros
      const encryptedPartnerCommissions: {
        partnerID: string;
        encryptedCommissionAmount: string;
      }[] = [];

      // Iterar sobre cada comissão dos parceiros para criptografar o valor
      for (const commission of partnerCommissions) {
        // Criptografar o valor da comissão por Parceiro
        const encryptedCommissionAmount = encrypt(
          commission.commissionAmount.toString()
        );

        // Adicionar a comissão criptografada ao array de comissões criptografadas
        encryptedPartnerCommissions.push({
          partnerID: commission.partnerID,
          encryptedCommissionAmount,
        });
      }

      // Agrupar os produtos por partnerID
      const productsByPartner: Record<string, any[]> = {};
      for (const product of products) {
        if (!productsByPartner[product.partnerID]) {
          productsByPartner[product.partnerID] = [];
        }
        productsByPartner[product.partnerID].push(product);
      }

      let orders: any[] = []; // Array para armazenar todas as Ordens

      // Iterar sobre cada grupo de produtos por partnerID para criar as ordens
      for (const partnerID in productsByPartner) {
        if (
          Object.prototype.hasOwnProperty.call(productsByPartner, partnerID)
        ) {
          const partnerProducts = productsByPartner[partnerID];
          let partnerOrderCostTotal = 0;

          const partner = await PartnerModel.findById(partnerID);

          if (!partner) {
            console.log("Parceiro não encontrado!");
            return;
          }
          // Encontrar o custo total dos produtos com frete para este parceiro
          const partnerTotalCostWithShipping =
            partnersTotalCostWithShipping.find(
              (cost) => cost.partnerID === partnerID
            );

          // Verificar se o custo total dos produtos com frete foi encontrado
          if (!partnerTotalCostWithShipping) {
            console.error(
              `Custo total dos produtos com frete não encontrado para o parceiro ${partnerID}`
            );
            continue; // Pular para a próxima iteração do loop
          }

          // Atribuir o custo total dos produtos com frete ao partnerOrderCostTotal
          partnerOrderCostTotal =
            partnerTotalCostWithShipping.totalCostWithShipping;

          // Encontrar o custo de envio para este parceiro
          const shippingCostForPartner = shippingCost.find(
            (cost: any) => cost.partnerID === partnerID
          );

          // Verificar se o custo de envio para este parceiro foi encontrado
          if (shippingCostForPartner) {
            // Extrair o valor do custo de envio
            const { transportadora, vlrFrete } = shippingCostForPartner;

            console.log(
              "VALOR TOTAL DO PEDIDO COM FRETE ANTES DE CRIPTOGRAFAR",
              partnerOrderCostTotal
            );

            // Valor total do pedido Cripitografado
            const orderTotalCostEncrypted = encrypt(
              partnerOrderCostTotal.toString()
            );

            console.log(
              "VALOR TOTAL DO PEDIDO COM FRETE CRIPTOGRAFADO",
              orderTotalCostEncrypted
            );

            console.log("VALOR DO FRETE ANTES DE CRIPTOGRAFAR", vlrFrete);

            // Valor do Frete Cripitografado
            const shippingCostEncrypted = encrypt(vlrFrete.toString());

            console.log("VALOR DO FRETE CRYPITOGRAFADO", shippingCostEncrypted);

            const customerAddress: any = customer.address[0];

            if (!customerAddress) {
              res.status(422).json({
                message: "É necessário informar o endereço de entrega!",
              });
              return;
            }

            // Criar uma nova Order para cada PartnerID
            const newOrder = new OrderModel({
              orderID: new ObjectId().toHexString().toUpperCase(),
              statusOrder: "Confirmed",
              paymentMethod: "Saldo em conta",
              shippingCostTotal: shippingCostEncrypted,
              customerOrderCostTotal: orderTotalCostEncrypted,
              partnerCommissionOtamart: encryptedPartnerCommissions.find(
                (commission) => commission.partnerID === partnerID
              )?.encryptedCommissionAmount,
              customerOtakuPointsEarned: encryptedCustomerCashbacks.find(
                (cashback) => cashback.partnerID === partnerID
              )?.encryptedCustomerCashback,
              itemsList: [],
              partnerID: partnerID,
              partnerCNPJ: partner.cpfCnpj,
              partnerName: partner.name,
              customerID: customer._id.toString(),
              customerName: customer.name,
              customerCPF: customer.cpf,
              customerAddress: [
                {
                  street: customerAddress.street,
                  complement: customerAddress.complement,
                  neighborhood: customerAddress.neighborhood,
                  city: customerAddress.city,
                  state: customerAddress.state,
                  postalCode: customerAddress.postalCode,
                },
              ],
              shippingMethod: transportadora,
              statusShipping: "Pending",
              trackingCode: "",
              discountsApplied: 0,
              orderNote: "",
            });

            // Adicionar os itens do pedido
            for (const product of partnerProducts) {
              // Encontrar o produto correspondente na lista de produtos do banco de dados
              const productFromDB = productsFromDB.find(
                (p: any) => p._id.toString() === product.productID.toString()
              );

              // Se o produto correspondente não for encontrado, continuar para o próximo produto
              if (!productFromDB) {
                continue;
              }

              let productCost;
              let productImage = product.productImage;
              let productVariationName = ""; // Variável para armazenar a variação

              // Verificar se o produto tem variações
              if (
                product.productVariations &&
                product.productVariations.length > 0 &&
                productFromDB.productVariations &&
                productFromDB.productVariations.length > 0
              ) {
                // Encontrar a variação no banco de dados
                const variation = productFromDB.productVariations.find(
                  (v: any) =>
                    v._id.toString() ===
                    product.productVariations[0].variationID.toString()
                );

                if (variation) {
                  // Encontrar a opção correspondente dentro da variação
                  const option = variation.options.find(
                    (o: any) =>
                      o._id.toString() ===
                      product.productVariations[0].optionID.toString()
                  );

                  if (option) {
                    // Utilizar o preço da opção
                    productCost =
                      option.promotionalPrice > 0
                        ? option.promotionalPrice
                        : option.originalPrice;

                    // Atualizar a imagem para a imagem da opção
                    if (option.imageUrl) {
                      productImage = option.imageUrl;
                    }

                    // Definir o nome da variação (exemplo: "Tamanho: M")
                    productVariationName = `${option.name}`;
                  }
                }
              }

              // Caso o produto não tenha variações ou nenhuma correspondência tenha sido encontrada
              if (!productCost) {
                productCost =
                  productFromDB.promotionalPrice > 0
                    ? productFromDB.promotionalPrice
                    : productFromDB.originalPrice;
              }

              // Adicionar o item ao pedido
              newOrder.itemsList.push({
                productID: product.productID,
                productTitle: product.productTitle,
                productImage: productImage,
                productPrice: productCost,
                productVariation: productVariationName || "Sem variação", // Se não houver variação, definir um padrão
                daysShipping: shippingCostForPartner.daysShipping,
                productQuantity: product.productQuantity,
              });
            }

            // Título para o Document Transaction
            const productTitles = newOrder.itemsList.map(
              (item) => item.productTitle
            );

            // Título para o Document Transaction
            const detailProductServiceTitle =
              productTitles.length === 1
                ? productTitles[0]
                : `${productTitles[0]} + ${productTitles.length - 1} ${
                    productTitles.length - 1 === 1 ? "produto" : "produtos"
                  }`;

            // Registrar a transação
            const newTransaction = new TransactionModel({
              transactionType: "Pagamento",
              transactionTitle: "Compra no OtaMart",
              transactionDescription: `Pedido feito no OtaMart.`,
              transactionValue: encrypt(customerOrderCostTotal.toString()),
              transactionDetails: {
                detailProductServiceTitle: detailProductServiceTitle,
                detailCost: encrypt(
                  String(
                    newOrder.itemsList.reduce((acc, item) => {
                      return acc + item.productPrice * item.productQuantity;
                    }, 0)
                  )
                ),
                detailPaymentMethod: "Saldo em conta",
                detailShippingCost: shippingCostEncrypted,
                detailSalesFee: encryptedPartnerCommissions.find(
                  (commission) => commission.partnerID === partnerID
                )?.encryptedCommissionAmount,
                detailCashback: encryptedCustomerCashbacks.find(
                  (cashback) => cashback.partnerID === partnerID
                )?.encryptedCustomerCashback,
              },
              plataformName: "Mononoke - OtaMart",
              payerID: customer.otakupayID,
              payerName: customer.name,
              payerProfileImage: customer.profileImage,
              receiverID: partner.otakupayID,
              receiverName: partner.name,
              receiverProfileImage: partner.profileImage,
            });

            // Adicionar a Order ao array de ordens
            orders.push(newOrder);
            await newTransaction.save();
          } else {
            console.error(
              `Custo de envio não encontrado para o parceiro ${partnerID}`
            );
          }
        }
      }

      // ************************* ATUALIZAÇÕES EM BANCO DE DADOS ********************************************//

      // Criar um novo pedido se tudo der certo
      const savedOrders = await OrderModel.insertMany(orders);

      // // Reduzir uma unidade do estoque do Produto
      for (const product of products) {
        try {
          // Encontrar o produto no banco pelo ID
          const dbProduct = await ProductModel.findById(product.productID);

          if (!dbProduct) {
            console.error(`Produto não encontrado: ID ${product.productID}`);
            continue; // Pular para o próximo produto
          }

          // Verificar se o produto tem variações
          if (
            dbProduct.productVariations &&
            dbProduct.productVariations.length > 0
          ) {
            // O produto tem variações, entra no loop de variações
            for (const variation of product.productVariations) {
              // Encontrar a variação no banco
              const dbVariation = dbProduct.productVariations.find(
                (v) => String(v._id) === String(variation.variationID)
              );

              if (!dbVariation) {
                console.error(
                  `Variação não encontrada: ID ${variation.variationID}`
                );
                continue; // Pular para a próxima variação
              }

              // Encontrar a opção dentro da variação
              const dbOption = dbVariation.options.find(
                (o) => String(o._id) === String(variation.optionID)
              );

              if (!dbOption) {
                console.error(`Opção não encontrada: ID ${variation.optionID}`);
                continue; // Pular para a próxima opção
              }

              // Reduzir o estoque da opção
              dbOption.stock -= product.productQuantity;

              if (dbOption.stock < 0) {
                console.error(
                  `Estoque insuficiente para a opção: ${dbOption.name}`
                );
                dbOption.stock = 0; // Prevenir valores negativos
              }

              console.log(
                `Estoque atualizado para a opção "${dbOption.name}" da variação "${dbVariation.title}". Novo estoque: ${dbOption.stock}`
              );
            }
          } else {
            // Produto sem variação, reduzir o estoque diretamente
            if (product.productQuantity && product.productQuantity > 0) {
              dbProduct.stock -= product.productQuantity;

              if (dbProduct.stock < 0) {
                console.error(
                  `Estoque insuficiente para o produto: ${dbProduct.productTitle}`
                );
                dbProduct.stock = 0; // Prevenir valores negativos
              }

              console.log(
                `Estoque atualizado para o produto "${dbProduct.productTitle}". Novo estoque: ${dbProduct.stock}`
              );
            } else {
              console.error(
                `Quantidade inválida do produto sem variação: ${dbProduct.productTitle}`
              );
            }
          }

          // Salvar o produto com as alterações
          await dbProduct.save();
        } catch (error) {
          console.error(
            `Erro ao atualizar o estoque do produto ID ${product.productID}:`,
            error
          );
        }
      }

      // Atualizar Customer (Balance Available e Otaku Points Pending)
      await customerOtakupay.save();

      // Iterar sobre cada par de ID de parceiro e balancePending criptografado
      for (const { partnerID, balancePending } of newEncryptedBalances) {
        try {
          // Encontrar o parceiro pelo ID
          const partner = await PartnerModel.findById(partnerID);

          if (!partner) {
            console.error(`Parceiro não encontrado para o ID ${partnerID}`);
            continue; // Pular para o próximo parceiro
          }

          // Acessar o Otakupay do parceiro usando o otakupayID
          const partnerOtakupay = await OtakupayModel.findOne({
            _id: partner.otakupayID,
          });

          if (!partnerOtakupay) {
            console.error(
              `Otakupay não encontrado para o parceiro ${partnerID}`
            );
            continue; // Pular para o próximo parceiro
          }

          // Atualizar o balancePending do Otakupay do parceiro com o novo valor criptografado
          partnerOtakupay.balancePending = balancePending;

          // Salvar as alterações no Otakupay do parceiro
          await partnerOtakupay.save();

          console.log(
            `BalancePending do parceiro ${partnerID} atualizado com sucesso.`
          );
        } catch (error) {
          console.error(
            `Erro ao atualizar o balancePending do parceiro ${partnerID}:`,
            error
          );
        }
      }

      res.status(200).json({
        message: "Pagamento processado com sucesso!",
        savedOrders,
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Requisição para enviar a Public Key Stripe para o frontend, segundo o tutorial
  static async stripeSendPublicKey(req: Request, res: Response) {
    res.send({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  }

  // Requisição para criar uma intenção de pagamento
  static async createPaymentIntent(req: Request, res: Response) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "brl",
        amount: 5999,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.send({ clientSecret: paymentIntent.client_secret });
    } catch (e: any) {
      res.status(400).send({
        error: {
          message: e.message,
        },
      });
      return;
    }
  }

  static async paymentCreditCardStripe(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"];

    const endpointSecret = "whsec_ocjQAeul3AsdiQowTFPgEmcBj91bmm94";

    try {
      if (!sig) {
        console.error("Missing Stripe signature.");
        res.status(400).json({
          success: false,
          message: "Missing Stripe signature",
        });
        return;
      }

      const payload = req.body;

      let event;

      try {
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
      } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        res.status(400).json({
          success: false,
          message: `Webhook signature verification failed: ${err.message}`,
        });
        return;
      }

      // Tratar diferentes tipos de eventos
      switch (event.type) {
        case "payment_intent.canceled":
          console.log("Pagamento cancelado:", event);
          // Aqui você pode definir e chamar uma função para lidar com o evento de pagamento cancelado
          break;
        case "payment_intent.succeeded":
          console.log("Pagamento Realizado com sucesso!", event);
          // Aqui você pode definir e chamar uma função para lidar com o evento de pagamento realizado com sucesso
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Retornar uma resposta bem-sucedida
      res.status(200).json({ received: true });
      return;
    } catch (error: any) {
      console.error(`Webhook Error: ${error.message}`);
      res.status(400).json({ success: false, message: error.message });
      return;
    }
  }

  static async paymentCreditcardMP(req: Request, res: Response) {
    const idempotencyKey = req.headers["x-idempotency-key"];

    console.log(req.body.transaction_amount);

    try {
      const paymentData = {
        transaction_amount: req.body.transaction_amount,
        token: req.body.token,
        description: "req.body.description",
        installments: req.body.installments,
        payment_method_id: req.body.payment_method_id, // Verifique o nome dos parâmetros
        issuer_id: req.body.issuer_id,
        payer: {
          email: req.body.payer.email,
          identification: {
            type: req.body.payer.identification.type,
            number: req.body.payer.identification.number,
          },
        },
      };

      const response = await payment.create({
        body: paymentData,
        requestOptions: {
          idempotencyKey: idempotencyKey as string,
        },
      });

      console.log(response);

      console.log("RESPOSTA DA API", response.status);

      if (response.status === "approved") {
        res.status(201).json({
          message: "Pagamento aprovado com Sucesso!",
        });
        return;
      } else if (response.status === "in_process") {
        res.status(202).json({
          message: "Pagamento em análise!",
        });
        return;
      } else if (response.status === "rejected") {
        res.status(422).json({
          message: "Pagamento não aprovado!",
        });
        return;
      }
    } catch (error: any) {
      console.log("Erro ao processar pagamento:", error); // Adicionando log do erro
      console.log("Stack trace:", error.stack); // Adicionando log da stack trace
      console.log("Causa do erro:", error.cause); // Adicionando log da causa do erro, se disponível
      const { errorMessage, errorStatus } = validateError(error);
      res.status(errorStatus).json({ error_message: errorMessage });
    }
  }

  static async finishPaymentCreditcard(req: Request, res: Response) {
    const { products, shippingCost, coupons } = req.body;

    // Verificar se o array de produtos é válido
    if (!products || products.length === 0) {
      res.status(404).json({
        error: "Nenhum produto encontrado na requisição!",
      });
      return;
    }

    // Verificar se todos os produtos possuem quantidade especificada
    if (
      products.some(
        (product: { productQuantity: number }) => product.productQuantity <= 0
      )
    ) {
      res.status(400).json({
        error: "Quantidade inválida para um ou mais produtos!",
      });
      return;
    }

    // Pegar o Customer logado que irá realizar o pagamento
    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!(customer instanceof CustomerModel)) {
      res.status(422).json({
        message: "Usuário não encontrado ou não é um cliente válido!",
      });
      return;
    }

    if (customer.accountType !== "customer") {
      res.status(422).json({
        message: "Usuário sem permissão para realizar este tipo de transação!",
      });
      return;
    }

    if (!customer.cpf || customer.cpf == "") {
      res.status(422).json({
        message: "CPF inválido, atualize antes de prosseguir!",
      });
      return;
    }

    try {
      // Pegar os IDs dos produtos da Requisição
      const productIDs = products.map((product: any) => product.productID);

      // Verificar se todos os IDs possuem o formato correto de ObjectId
      for (const id of productIDs) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          res.status(400).json({
            error: `ID do produto '${id}' é inválido`,
          });
          return;
        }
      }

      const productsFromDB = await ProductModel.find({
        _id: productIDs,
      });

      // Verificar se todos os produtos foram encontrados no banco de dados
      if (productsFromDB.length !== productIDs.length) {
        // Se algum dos IDs não forem encontrados, interromper a transação
        const missingProductIDs = productIDs.filter(
          (id: any) => !productsFromDB.find((product) => product._id === id)
        );
        res.status(400).json({
          message: "Alguns produtos não estão mais disponíveis",
          missingProductIDs,
        });
        return;
      }

      // // Verificar se algum dos produtos possui estoque indisponível
      // const produtoSemEstoque = productsFromDB.find(
      // 	(product: any) => product.stock <= 0
      // );
      // if (produtoSemEstoque) {
      // 	return res.status(422).json({
      // 		message:
      // 			"Um ou mais produtos encontram-se esgotados, não é possível realizar o pagamento!",
      // 	});
      // }

      // Verificar se algum dos produtos possui estoque indisponível
      const produtoSemEstoque = productsFromDB.find((product: any) => {
        // Se o produto não tiver variações, verifica diretamente o estoque
        if (
          !product.productVariations ||
          product.productVariations.length === 0
        ) {
          return product.stock <= 0;
        }

        // Caso tenha variações, verifica se todas as opções dentro das variações estão sem estoque
        const todasVariacoesSemEstoque = product.productVariations.every(
          (variation: any) => {
            // Garante que a variação tenha opções
            if (!variation.options || variation.options.length === 0) {
              return true; // Considera a variação sem estoque se não há opções
            }

            // Verifica se todas as opções dessa variação estão sem estoque
            return variation.options.every((option: any) => option.stock <= 0);
          }
        );

        return todasVariacoesSemEstoque;
      });

      if (produtoSemEstoque) {
        res.status(422).json({
          message:
            "Um ou mais produtos encontram-se esgotados, não é possível realizar o pagamento!",
        });
        return;
      }

      // Pegar o OtakuPay do Customer
      const customerOtakupay: any = await OtakupayModel.findOne({
        _id: customer.otakupayID,
      });

      // Verificar se o saldo do Customer existe
      if (!customerOtakupay || !customerOtakupay.balanceAvailable) {
        res.status(422).json({
          message: "Customer Balance Available não encontrado!",
        });
        return;
      }

      // Pegar o Balance Available do Customer Criptografado
      const encryptedCustomerBalanceAvailable =
        customerOtakupay.balanceAvailable;

      // Descriptografar o Balance Available do Customer
      const decryptedCustomerBalanceAvailable = decrypt(
        encryptedCustomerBalanceAvailable
      );

      if (decryptedCustomerBalanceAvailable === null) {
        res.status(500).json({
          message: "Erro ao descriptografar o Customer Balance Available!",
        });
        return;
      }

      console.log(
        "BALANCE AVAILABLE DO CUSTOMER DESCRIPTOGRAFADO:",
        decryptedCustomerBalanceAvailable
      );

      // Array para armazenar os custos totais dos produtos por PartnerID
      const partnersTotalCost: {
        partnerID: string;
        totalCost: number;
      }[] = [];

      // Iterar sobre cada produto para calcular o custo total com base no parceiro
      for (const product of products) {
        // Encontrar o produto correspondente na lista de produtos do banco de dados
        const productFromDB = productsFromDB.find(
          (p: any) => p._id.toString() === product.productID.toString()
        );

        // Se o produto correspondente não for encontrado, continuar para o próximo produto
        if (!productFromDB) {
          continue;
        }

        let productCost;

        // Verificar se o produto tem variações
        if (
          product.productVariations &&
          product.productVariations.length > 0 &&
          productFromDB.productVariations &&
          productFromDB.productVariations.length > 0
        ) {
          // Encontrar a variação no banco de dados
          const variation = productFromDB.productVariations.find(
            (v: any) =>
              v._id.toString() ===
              product.productVariations[0].variationID.toString()
          );

          if (variation) {
            // Encontrar a opção correspondente dentro da variação
            const option = variation.options.find(
              (o: any) =>
                o._id.toString() ===
                product.productVariations[0].optionID.toString()
            );

            if (option) {
              // Utilizar o preço da opção
              productCost =
                option.promotionalPrice > 0
                  ? option.promotionalPrice
                  : option.originalPrice;
            }
          }
        }

        // Caso o produto não tenha variações ou nenhuma correspondência tenha sido encontrada
        if (!productCost) {
          productCost =
            productFromDB.promotionalPrice > 0
              ? productFromDB.promotionalPrice
              : productFromDB.originalPrice;
        }

        // Calcular o custo total do produto levando em consideração a quantidade
        const totalProductCost = productCost * product.productQuantity;

        // Verificar se já existe um registro para esse parceiro no array
        const partnerIndex = partnersTotalCost.findIndex(
          (item) => item.partnerID === product.partnerID
        );

        if (partnerIndex === -1) {
          // Se não existir, adicionar um novo registro ao array
          partnersTotalCost.push({
            partnerID: product.partnerID,
            totalCost: totalProductCost,
          });
        } else {
          // Se existir, adicionar o custo total do produto ao custo total existente
          partnersTotalCost[partnerIndex].totalCost += totalProductCost;
        }
      }

      // Aplicar desconto do cupom, se houver
      if (coupons && coupons.length > 0) {
        for (const coupon of coupons) {
          const couponCode = coupon.couponCode;

          // Buscar o cupom no banco de dados usando o código do cupom
          const couponData = await CouponModel.findOne({
            couponCode: couponCode,
          });

          if (couponData) {
            // Iterar sobre cada parceiro para aplicar o desconto do cupom
            for (const partner of partnersTotalCost) {
              if (String(partner.partnerID) === String(couponData.partnerID)) {
                // Calcular o valor do desconto com base na porcentagem do cupom
                const discountAmount =
                  (partner.totalCost * couponData.discountPercentage) / 100;

                // Subtrair o valor do desconto do custo total do parceiro
                partner.totalCost -= discountAmount;
              }
            }
          } else {
            // Se algum cupom não for encontrado, enviar resposta de erro
            res.status(404).json({
              message: "Cupom de desconto não encontrado.",
            });
            return;
          }
        }
      }

      // Verificar se algum parceiro possui produtos
      if (partnersTotalCost.length === 0) {
        res.status(422).json({
          message: "Nenhum produto encontrado para os parceiros especificados.",
        });
        return;
      }

      console.log("CUSTO TOTAL DOS PRODUTOS POR PARCEIRO:", partnersTotalCost);

      console.log("CUSTO TOTAL DO FRETE POR PARCEIRO:", shippingCost);

      // Função para calcular o custo total de um produto
      function getProductCost(product: any): number {
        // Encontrar o produto correspondente na lista de produtos do banco de dados
        const productFromDB = productsFromDB.find(
          (p: any) => p._id.toString() === product.productID.toString()
        );

        // Se o produto correspondente não for encontrado, retornar -1
        if (!productFromDB) {
          return -1;
        }

        // Calcular o custo total do produto levando em consideração a quantidade
        const productCost =
          productFromDB.promotionalPrice > 0
            ? productFromDB.promotionalPrice
            : productFromDB.originalPrice;
        return productCost * product.productQuantity;
      }

      // Array para armazenar os custos totais dos produtos por parceiro, incluindo o frete
      const partnersTotalCostWithShipping: {
        partnerID: string;
        totalCostWithShipping: number;
      }[] = [];

      // Verificar se há dados em partnersTotalCost e shippingCost
      if (partnersTotalCost.length === 0 || shippingCost.length === 0) {
        res.status(422).json({
          message: "Falta de dados, impossível prosseguir!",
        });
        return;
      }

      // Iterar sobre cada produto para calcular o custo total com base no partnerID e no frete correspondente
      // Iterar sobre cada parceiro para calcular o custo total com base nos valores já descontados e no frete correspondente
      for (const partner of partnersTotalCost) {
        // Encontrar o frete correspondente ao parceiro
        const shipping = shippingCost.find(
          (cost: any) => cost.partnerID === partner.partnerID
        );

        // Se o frete for encontrado, calcular o custo total com frete, caso contrário, considerar apenas o valor já descontado
        const totalCostWithShipping = shipping
          ? partner.totalCost + shipping.vlrFrete
          : partner.totalCost;

        // Adicionar o custo total com frete ao array partnersTotalCostWithShipping
        partnersTotalCostWithShipping.push({
          partnerID: partner.partnerID,
          totalCostWithShipping: totalCostWithShipping,
        });
      }

      console.log(
        "CUSTO TOTAL DOS PRODUTOS + FRETE POR PARCEIRO:",
        partnersTotalCostWithShipping
      );

      // Calcular o valor total do pedido com frete (PARA O CUSTOMER PAGAR)
      let customerOrderCostTotal = partnersTotalCostWithShipping.reduce(
        (total, item) => total + item.totalCostWithShipping,
        0
      );

      console.log("VALOR TOTAL DOS PEDIDOS COM FRETE", customerOrderCostTotal);

      // Verificar se orderCostTotal é um número válido
      if (isNaN(customerOrderCostTotal)) {
        res.status(422).json({
          message: "Custo total do pedido inválido!",
        });
        return;
      }

      if (
        isNaN(Number(decryptedCustomerBalanceAvailable)) ||
        isNaN(customerOrderCostTotal)
      ) {
        res.status(422).json({
          message: "Valores em formatos inválidos!",
        });
        return;
      }

      // if (decryptedCustomerBalanceAvailable < customerOrderCostTotal) {
      // 	res.status(422).json({
      // 		message: "Customer Balance Available insuficiente!",
      // 	});
      // 	return;
      // }

      // // Limitando o Customer Balance Available para duas casas decimais
      // const newCustomerBalanceAvailable = (
      // 	decryptedCustomerBalanceAvailable - customerOrderCostTotal
      // ).toFixed(2);

      // // Criptografar o novo Customer Balance Available para armazenar no banco de dados
      // const newEncryptedCustomerBalanceAvailable = encrypt(
      // 	newCustomerBalanceAvailable.toString()
      // );

      // // Atualizar o Customer Balance Available criptografado no banco de dados
      // customerOtakupay.balanceAvailable =
      // 	newEncryptedCustomerBalanceAvailable;

      // Array para armazenar os parceiros
      const partners = [];

      // Array para armazenar os OtakuPays associados aos parceiros
      const partnerOtakupays = [];

      // Map para armazenar os Partner Balance Pending Criptografados por partnerID
      const encryptedPartnerBalancePendingMap = new Map<string, string>();

      // Iterar sobre cada produto para obter os parceiros e seus Otakupays associados
      for (const product of products) {
        // Buscar o parceiro pelo ID do produto
        const partner = await PartnerModel.findById(product.partnerID);

        // Verificar se o parceiro existe
        if (!partner) {
          // Se o parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Parceiro não encontrado para este produto!",
          });
          return;
        }

        // Acessar o OtakuPay do parceiro usando o otakupayID
        const partnerOtakupay = await OtakupayModel.findOne({
          _id: partner.otakupayID,
        });

        // Verificar se o OtakuPay do parceiro existe
        if (!partnerOtakupay) {
          // Se o OtakuPay do parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Otakupay do Partner não encontrado!",
          });
          return;
        }

        // Adicionar o parceiro ao array de parceiros
        partners.push(partner);

        // Adicionar o OtakuPay associado ao array de Otakupays
        partnerOtakupays.push(partnerOtakupay);

        // Adicionar o Partner Balance Pending ao mapa, se existir
        if (
          partnerOtakupay.balancePending &&
          !encryptedPartnerBalancePendingMap.has(partner._id.toString())
        ) {
          encryptedPartnerBalancePendingMap.set(
            partner._id.toString(),
            partnerOtakupay.balancePending
          );
        }
      }

      // Converter o map para um array de Partner Balance Pending Criptografados
      const encryptedPartnerBalancePendingList = Array.from(
        encryptedPartnerBalancePendingMap.entries()
      ).map(([partnerID, balancePending]) => ({
        partnerID,
        balancePending,
      }));

      // Descriptografar os Partner Balance Pending
      const decryptedPartnerBalancePendingList =
        encryptedPartnerBalancePendingList.map(
          ({ partnerID, balancePending }) => {
            const decryptedValue = decrypt(balancePending);
            return {
              partnerID,
              balancePending: decryptedValue,
            };
          }
        );

      console.log(
        "Partner Balance Pending Descriptografados por ID de parceiro:",
        decryptedPartnerBalancePendingList
      );

      if (decryptedPartnerBalancePendingList === null) {
        res.status(500).json({
          message: "Erro ao descriptografar o Partner Balance Pending!",
        });
        return;
      }

      // Array para armazenar os novos Partner Balance Pending
      const newBalances = [];

      // Iterar sobre cada parceiro para calcular o novo balancePending
      for (const partner of decryptedPartnerBalancePendingList) {
        // Verificar se balancePending não é nulo
        if (partner.balancePending !== null) {
          // Encontrar o total da compra com frete correspondente ao parceiro
          const partnerTotalCostWithShipping =
            partnersTotalCostWithShipping.find(
              (item) => item.partnerID === partner.partnerID
            );

          // Se o parceiro não tiver um total da compra com frete, atribuir 0
          const partnerTotalCost = partnerTotalCostWithShipping
            ? partnerTotalCostWithShipping.totalCostWithShipping
            : 0;

          // Calcular o novo balancePending somando o total da compra com frete ao balancePending existente
          const newBalance = partner.balancePending + partnerTotalCost;

          // Adicionar o novo balancePending ao array de novos balanços - São esses valores que serão armazenados
          newBalances.push({
            partnerID: partner.partnerID,
            balancePending: newBalance,
          });
        }
      }

      // Console log para exibir os novos balanços pendentes dos parceiros
      console.log("NOVO PARTNER BALANCE PENDING:", newBalances);

      // Array para armazenar os novos Partner Balance Pending criptografados
      const newEncryptedBalances = [];

      // Iterar sobre cada novo balancePending para criptografá-los
      for (const balance of newBalances) {
        // Criptografar o balancePending usando a função encrypt
        const encryptedBalance = encrypt(balance.balancePending.toString());

        // Adicionar o balancePending criptografado ao array de novos Balance Pending criptografados
        newEncryptedBalances.push({
          partnerID: balance.partnerID,
          balancePending: encryptedBalance,
        });
      }

      // Console log para exibir os novos balanços pendentes criptografados dos parceiros
      console.log(
        "NOVOS PARTNER BALANCE PENDING CRIPTOGRAFADOS:",
        newEncryptedBalances
      );

      // Array para armazenar os cashbacks (Otaku Points) que serão pagos por parceiro
      const partnerCashbacks: {
        partnerID: string;
        cashbackAmount: number;
      }[] = [];

      // Iterar sobre cada parceiro para calcular o cashback
      for (const partnerCost of partnersTotalCost) {
        // Calcular o valor do cashback (2% do custo total dos produtos)
        const cashbackAmount = partnerCost.totalCost * 0.01;

        // Adicionar o cashback ao array de cashbacks
        partnerCashbacks.push({
          partnerID: partnerCost.partnerID,
          cashbackAmount: cashbackAmount,
        });
      }

      console.log(
        "CASHBACKS/OTAKU POINTS A SEREM PAGOS PELO PARTNER INDIVIDUALMENTE:",
        partnerCashbacks
      );

      // Array para armazenar os cashbacks (Otaku Points) criptografados, a serem pagos por parceiro
      const encryptedPartnerCashbacks: {
        partnerID: string;
        encryptedCashback: string;
      }[] = [];

      // Iterar sobre cada parceiro para calcular e criptografar o cashback (Otaku Points)
      for (const partnerCost of partnersTotalCost) {
        // Calcular o valor do cashback (2% do custo total dos produtos)
        const cashbackAmount = partnerCost.totalCost * 0.01;

        // Criptografar o valor do cashback usando a função encrypt
        const encryptedCashback = encrypt(cashbackAmount.toString());

        // Adicionar o cashback criptografado ao array de cashbacks criptografados
        encryptedPartnerCashbacks.push({
          partnerID: partnerCost.partnerID,
          encryptedCashback: encryptedCashback,
        });
      }

      console.log(
        "CASHBACKS/OTAKU POINTS A SEREM PAGOS PELO PARTNER INDIVIDUALMENTE, CRIPTOGRAFADOS:",
        encryptedPartnerCashbacks
      );

      // Array para armazenar os cashbacks (Otaku Points) do Customer por parceiro
      const customerCashbacks: {
        partnerID: string;
        customerCashbackAmount: number;
      }[] = [];

      // Iterar sobre cada parceiro para calcular o cashback do cliente
      for (const partnerCost of partnersTotalCost) {
        // Buscar o parceiro pelo ID
        const partner = await PartnerModel.findById(partnerCost.partnerID);

        // Verificar se o parceiro existe
        if (!partner) {
          // Se o parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Parceiro não encontrado!",
          });
          return;
        }

        // Acessar o OtakuPay do Partner usando o otakupayID
        const partnerOtakupay = await OtakupayModel.findOne({
          _id: partner.otakupayID,
        });

        // Verificar se o OtakuPay do parceiro existe
        if (!partnerOtakupay) {
          // Se o Otakupay do parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Otakupay do Partner não encontrado!",
          });
          return;
        }

        // Verificar se o parceiro oferece cashback
        if (!partnerOtakupay.cashback) {
          // Se o parceiro não oferecer cashback, continuar para o próximo parceiro
          continue;
        }

        // Calcular o cashback do cliente com base na porcentagem de cashback do parceiro
        const customerCashbackAmount =
          Math.floor(
            partnerCost.totalCost *
              (Number(partnerOtakupay.cashback) / 100) *
              100
          ) / 100;

        // Adicionar o cashback do cliente ao array de cashbacks do cliente
        customerCashbacks.push({
          partnerID: partnerCost.partnerID,
          customerCashbackAmount: customerCashbackAmount,
        });
      }

      console.log(
        "CASHBACK/OTAKU POINTS DO CUSTOMER POR PARCEIRO:",
        customerCashbacks
      );

      /// É NECESSÁRIO CRIPTOGRAFAR O CASHBACK DO CUSTOMER RECEBIDO POR PARCEIRO, ANTES DE DESMEMBRAR E ARMAZENAR NA ORDER

      // Array para armazenar os cashbacks (Otaku Points) criptografados do Customer por parceiro
      const encryptedCustomerCashbacks: {
        partnerID: string;
        encryptedCustomerCashback: string;
      }[] = [];

      // Iterar sobre cada cashback do cliente para criptografar
      for (const cashback of customerCashbacks) {
        // Criptografar o valor do cashback do cliente usando a função encrypt
        const encryptedCashback = encrypt(
          cashback.customerCashbackAmount.toString()
        );

        // Adicionar o cashback criptografado ao array de cashbacks criptografados do cliente
        encryptedCustomerCashbacks.push({
          partnerID: cashback.partnerID,
          encryptedCustomerCashback: encryptedCashback,
        });
      }

      // Exibir os cashbacks do cliente por parceiro após a criptografia
      console.log(
        "CASHBACK/OTAKU POINTS DO CUSTOMER POR PARCEIRO, CRIPTOGRAFADOS:",
        encryptedCustomerCashbacks
      );

      // Variável para armazenar o total de cashback (Otaku Points) do Customer
      let totalCustomerCashback = 0;

      // Iterar sobre cada cashback (Otaku Points) do cliente por parceiro para calcular o total de cashback
      for (const customerCashback of customerCashbacks) {
        // Adicionar o valor do cashback do cliente ao total
        totalCustomerCashback += customerCashback.customerCashbackAmount;
      }

      // Descriptografar o Otaku Points Pending do Customer
      const decryptedOtakuPointsPending = decrypt(
        customerOtakupay.otakuPointsPending
      );

      // Verificar se a descriptografia foi bem-sucedida
      if (decryptedOtakuPointsPending === null) {
        res.status(500).json({
          message:
            "Erro ao descriptografar saldo de pontos pendentes do cliente!",
        });
        return;
      }

      // Somar o total de cashback (Otaku Points) ao Otaku Points Pending do Customer
      // const newOtakuPointsPending =
      // 	decryptedOtakuPointsPending + totalCustomerCashback;

      const newOtakuPointsPending =
        Number(decryptedOtakuPointsPending) + Number(totalCustomerCashback);

      // Criptografar o novo Otaku Points Pending do Customer
      const encryptedNewOtakuPointsPending = encrypt(
        newOtakuPointsPending.toString()
      );

      // Atualizar os Customer Otaku Points Pending criptografados no banco de dados
      customerOtakupay.otakuPointsPending = encryptedNewOtakuPointsPending;

      // *********************************************************************************************** //

      // Array para armazenar as comissões por parceiros
      const partnerCommissions: {
        partnerID: string;
        commissionAmount: number;
      }[] = [];

      // Iterar sobre cada parceiro para calcular a comissão
      for (const partnerCost of partnersTotalCost) {
        // Calcular a comissão de 9% em cima do total dos produtos transacionados por parceiro || O VALOR PRECISARÁ SER DEFINIDO PELO DOTENV
        const commissionAmount = partnerCost.totalCost * 0.09;

        // Buscar o parceiro pelo ID
        const partner = await PartnerModel.findById(partnerCost.partnerID);

        // Verificar se o parceiro existe
        if (!partner) {
          // Se o parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Parceiro não encontrado!",
          });
          return;
        }

        // Acessar o OtakuPay do parceiro usando o otakupayID
        const partnerOtakupay = await OtakupayModel.findOne({
          _id: partner.otakupayID,
        });

        // Verificar se o OtakuPay do parceiro existe
        if (!partnerOtakupay) {
          // Se o OtakuPay do parceiro não existir, retornar um erro
          res.status(422).json({
            message: "Otakupay do Partner não encontrado!",
          });
          return;
        }

        // Verificar se o parceiro oferece cashback
        if (!partnerOtakupay.cashback) {
          // Se o parceiro não oferecer cashback, o valor do cashback é 0
          const cashbackAmount = 0;
          // Somar o cashback ao valor da comissão
          const totalAmount = commissionAmount + cashbackAmount;

          // Adicionar a comissão a ser paga pelo Parceiro ao array de comissões
          partnerCommissions.push({
            partnerID: partnerCost.partnerID,
            commissionAmount: totalAmount,
          });
        } else {
          // Calcular o cashback que o parceiro está oferecendo
          const cashbackAmount =
            partnerCost.totalCost * (Number(partnerOtakupay.cashback) / 100);

          // Somar o cashback ao valor da comissão
          const totalAmount = commissionAmount + cashbackAmount;

          // Adicionar a comissão do parceiro ao array de comissões
          partnerCommissions.push({
            partnerID: partnerCost.partnerID,
            commissionAmount: totalAmount,
          });
        }
      }

      // Array para armazenar as comissões criptografadas por parceiros
      const encryptedPartnerCommissions: {
        partnerID: string;
        encryptedCommissionAmount: string;
      }[] = [];

      // Iterar sobre cada comissão dos parceiros para criptografar o valor
      for (const commission of partnerCommissions) {
        // Criptografar o valor da comissão por Parceiro
        const encryptedCommissionAmount = encrypt(
          commission.commissionAmount.toString()
        );

        // Adicionar a comissão criptografada ao array de comissões criptografadas
        encryptedPartnerCommissions.push({
          partnerID: commission.partnerID,
          encryptedCommissionAmount,
        });
      }

      // Agrupar os produtos por partnerID
      const productsByPartner: Record<string, any[]> = {};
      for (const product of products) {
        if (!productsByPartner[product.partnerID]) {
          productsByPartner[product.partnerID] = [];
        }
        productsByPartner[product.partnerID].push(product);
      }

      let orders: any[] = []; // Array para armazenar todas as Ordens

      // Iterar sobre cada grupo de produtos por partnerID para criar as ordens
      for (const partnerID in productsByPartner) {
        if (
          Object.prototype.hasOwnProperty.call(productsByPartner, partnerID)
        ) {
          const partnerProducts = productsByPartner[partnerID];
          let partnerOrderCostTotal = 0;

          const partner = await PartnerModel.findById(partnerID);

          if (!partner) {
            console.log("Parceiro não encontrado!");
            return;
          }
          // Encontrar o custo total dos produtos com frete para este parceiro
          const partnerTotalCostWithShipping =
            partnersTotalCostWithShipping.find(
              (cost) => cost.partnerID === partnerID
            );

          // Verificar se o custo total dos produtos com frete foi encontrado
          if (!partnerTotalCostWithShipping) {
            console.error(
              `Custo total dos produtos com frete não encontrado para o parceiro ${partnerID}`
            );
            continue; // Pular para a próxima iteração do loop
          }

          // Atribuir o custo total dos produtos com frete ao partnerOrderCostTotal
          partnerOrderCostTotal =
            partnerTotalCostWithShipping.totalCostWithShipping;

          // Encontrar o custo de envio para este parceiro
          const shippingCostForPartner = shippingCost.find(
            (cost: any) => cost.partnerID === partnerID
          );

          // Verificar se o custo de envio para este parceiro foi encontrado
          if (shippingCostForPartner) {
            // Extrair o valor do custo de envio
            const { transportadora, vlrFrete } = shippingCostForPartner;

            console.log(
              "VALOR TOTAL DO PEDIDO COM FRETE ANTES DE CRIPTOGRAFAR",
              partnerOrderCostTotal
            );

            // Valor total do pedido Cripitografado
            const orderTotalCostEncrypted = encrypt(
              partnerOrderCostTotal.toString()
            );

            console.log(
              "VALOR TOTAL DO PEDIDO COM FRETE CRIPTOGRAFADO",
              orderTotalCostEncrypted
            );

            console.log("VALOR DO FRETE ANTES DE CRIPTOGRAFAR", vlrFrete);

            // Valor do Frete Cripitografado
            const shippingCostEncrypted = encrypt(vlrFrete.toString());

            console.log("VALOR DO FRETE CRYPITOGRAFADO", shippingCostEncrypted);

            const customerAddress: any = customer.address[0];

            if (!customerAddress) {
              res.status(422).json({
                message: "É necessário informar o endereço de entrega!",
              });
              return;
            }

            // Criar uma nova Order para cada PartnerID
            const newOrder = new OrderModel({
              orderID: new ObjectId().toHexString().toUpperCase(),
              statusOrder: "Confirmed",
              paymentMethod: "Cartão de Crédito",
              shippingCostTotal: shippingCostEncrypted,
              customerOrderCostTotal: orderTotalCostEncrypted,
              partnerCommissionOtamart: encryptedPartnerCommissions.find(
                (commission) => commission.partnerID === partnerID
              )?.encryptedCommissionAmount,
              customerOtakuPointsEarned: encryptedCustomerCashbacks.find(
                (cashback) => cashback.partnerID === partnerID
              )?.encryptedCustomerCashback,
              itemsList: [],
              partnerID: partnerID.toString(),
              partnerName: partner.name,
              partnerCNPJ: partner.cpfCnpj,
              customerID: customer._id.toString(),
              customerName: customer.name,
              customerCPF: customer.cpf,
              customerAddress: [
                {
                  street: customerAddress.street,
                  complement: customerAddress.complement,
                  neighborhood: customerAddress.neighborhood,
                  city: customerAddress.city,
                  state: customerAddress.state,
                  postalCode: customerAddress.postalCode,
                },
              ],
              shippingMethod: transportadora,
              trackingCode: "",
              statusShipping: "Pending",
              discountsApplied: 0,
              orderNote: "",
            });

            // Adicionar os itens do pedido
            // for (const product of partnerProducts) {
            // 	// Encontrar o produto correspondente na lista de produtos do banco de dados
            // 	const productFromDB = productsFromDB.find(
            // 		(p: any) =>
            // 			p._id.toString() ===
            // 			product.productID.toString()
            // 	);

            // 	// Se o produto correspondente não for encontrado, continuar para o próximo produto
            // 	if (!productFromDB) {
            // 		continue;
            // 	}

            // 	let productCost;

            // 	// Verificar se o produto tem variações
            // 	if (
            // 		product.productVariations &&
            // 		product.productVariations.length > 0 &&
            // 		productFromDB.productVariations &&
            // 		productFromDB.productVariations.length > 0
            // 	) {
            // 		// Encontrar a variação no banco de dados
            // 		const variation =
            // 			productFromDB.productVariations.find(
            // 				(v: any) =>
            // 					v._id.toString() ===
            // 					product.productVariations[0].variationID.toString()
            // 			);

            // 		if (variation) {
            // 			// Encontrar a opção correspondente dentro da variação
            // 			const option = variation.options.find(
            // 				(o: any) =>
            // 					o._id.toString() ===
            // 					product.productVariations[0].optionID.toString()
            // 			);

            // 			if (option) {
            // 				// Utilizar o preço da opção
            // 				productCost =
            // 					option.promotionalPrice > 0
            // 						? option.promotionalPrice
            // 						: option.originalPrice;
            // 			}
            // 		}
            // 	}

            // 	// Caso o produto não tenha variações ou nenhuma correspondência tenha sido encontrada
            // 	if (!productCost) {
            // 		productCost =
            // 			productFromDB.promotionalPrice > 0
            // 				? productFromDB.promotionalPrice
            // 				: productFromDB.originalPrice;
            // 	}

            // 	// Adicionar o item ao pedido
            // 	order.itemsList.push({
            // 		productID: product.productID,
            // 		productTitle: product.productTitle,
            // 		productImage: product.productImage,
            // 		productPrice: productCost,
            // 		daysShipping:
            // 			shippingCostForPartner.daysShipping,
            // 		productQuantity: product.productQuantity,
            // 	});
            // }

            for (const product of partnerProducts) {
              // Encontrar o produto correspondente na lista de produtos do banco de dados
              const productFromDB = productsFromDB.find(
                (p: any) => p._id.toString() === product.productID.toString()
              );

              // Se o produto correspondente não for encontrado, continuar para o próximo produto
              if (!productFromDB) {
                continue;
              }

              let productCost;
              let productImage = product.productImage;
              let productVariationName = ""; // Variável para armazenar a variação

              // Verificar se o produto tem variações
              if (
                product.productVariations &&
                product.productVariations.length > 0 &&
                productFromDB.productVariations &&
                productFromDB.productVariations.length > 0
              ) {
                // Encontrar a variação no banco de dados
                const variation = productFromDB.productVariations.find(
                  (v: any) =>
                    v._id.toString() ===
                    product.productVariations[0].variationID.toString()
                );

                if (variation) {
                  // Encontrar a opção correspondente dentro da variação
                  const option = variation.options.find(
                    (o: any) =>
                      o._id.toString() ===
                      product.productVariations[0].optionID.toString()
                  );

                  if (option) {
                    // Utilizar o preço da opção
                    productCost =
                      option.promotionalPrice > 0
                        ? option.promotionalPrice
                        : option.originalPrice;

                    // Atualizar a imagem para a imagem da opção
                    if (option.imageUrl) {
                      productImage = option.imageUrl;
                    }

                    // Definir o nome da variação (exemplo: "Tamanho: M")
                    productVariationName = `${option.name}`;
                  }
                }
              }

              // Caso o produto não tenha variações ou nenhuma correspondência tenha sido encontrada
              if (!productCost) {
                productCost =
                  productFromDB.promotionalPrice > 0
                    ? productFromDB.promotionalPrice
                    : productFromDB.originalPrice;
              }

              // Adicionar o item ao pedido
              newOrder.itemsList.push({
                productID: product.productID,
                productTitle: product.productTitle,
                productImage: productImage,
                productPrice: productCost,
                productVariation: productVariationName || "Sem variação", // Se não houver variação, definir um padrão
                daysShipping: shippingCostForPartner.daysShipping,
                productQuantity: product.productQuantity,
              });
            }

            // Título para o Document Transaction
            const productTitles = newOrder.itemsList.map(
              (item) => item.productTitle
            );

            // Título para o Document Transaction
            const detailProductServiceTitle =
              productTitles.length === 1
                ? productTitles[0]
                : `${productTitles[0]} + ${productTitles.length - 1} ${
                    productTitles.length - 1 === 1 ? "produto" : "produtos"
                  }`;

            // Registrar a transação
            const newTransaction = new TransactionModel({
              transactionType: "Pagamento",
              transactionTitle: "Compra no OtaMart",
              transactionDescription: `Pedido feito no OtaMart.`,
              transactionValue: encrypt(customerOrderCostTotal.toString()),
              transactionDetails: {
                detailProductServiceTitle: detailProductServiceTitle,
                detailCost: encrypt(
                  String(
                    newOrder.itemsList.reduce((acc, item) => {
                      return acc + item.productPrice * item.productQuantity;
                    }, 0)
                  )
                ),
                detailPaymentMethod: "Cartão de Crédito",
                detailShippingCost: shippingCostEncrypted,
                detailSalesFee: encryptedPartnerCommissions.find(
                  (commission) => commission.partnerID === partnerID
                )?.encryptedCommissionAmount,
                detailCashback: encryptedCustomerCashbacks.find(
                  (cashback) => cashback.partnerID === partnerID
                )?.encryptedCustomerCashback,
              },
              plataformName: "Mononoke - OtaMart",
              payerID: customer.otakupayID,
              payerName: customer.name,
              payerProfileImage: customer.profileImage,
              receiverID: partner.otakupayID,
              receiverName: partner.name,
              receiverProfileImage: partner.profileImage,
            });

            // Adicionar a Order ao array de ordens
            orders.push(newOrder);
            await newTransaction.save();
          } else {
            console.error(
              `Custo de envio não encontrado para o parceiro ${partnerID}`
            );
          }
        }
      }

      // ************************* ATUALIZAÇÕES EM BANCO DE DADOS ********************************************//

      // Criar um novo pedido se tudo der certo
      const savedOrders = await OrderModel.insertMany(orders);

      // // Reduzir uma unidade do estoque do Produto
      for (const product of products) {
        try {
          // Encontrar o produto no banco pelo ID
          const dbProduct = await ProductModel.findById(product.productID);

          if (!dbProduct) {
            console.error(`Produto não encontrado: ID ${product.productID}`);
            continue; // Pular para o próximo produto
          }

          // Verificar se o produto tem variações
          if (
            dbProduct.productVariations &&
            dbProduct.productVariations.length > 0
          ) {
            // O produto tem variações, entra no loop de variações
            for (const variation of product.productVariations) {
              // Encontrar a variação no banco
              const dbVariation = dbProduct.productVariations.find(
                (v) => String(v._id) === String(variation.variationID)
              );

              if (!dbVariation) {
                console.error(
                  `Variação não encontrada: ID ${variation.variationID}`
                );
                continue; // Pular para a próxima variação
              }

              // Encontrar a opção dentro da variação
              const dbOption = dbVariation.options.find(
                (o) => String(o._id) === String(variation.optionID)
              );

              if (!dbOption) {
                console.error(`Opção não encontrada: ID ${variation.optionID}`);
                continue; // Pular para a próxima opção
              }

              // Reduzir o estoque da opção
              dbOption.stock -= product.productQuantity;

              if (dbOption.stock < 0) {
                console.error(
                  `Estoque insuficiente para a opção: ${dbOption.name}`
                );
                dbOption.stock = 0; // Prevenir valores negativos
              }

              console.log(
                `Estoque atualizado para a opção "${dbOption.name}" da variação "${dbVariation.title}". Novo estoque: ${dbOption.stock}`
              );
            }
          } else {
            // Produto sem variação, reduzir o estoque diretamente
            if (product.productQuantity && product.productQuantity > 0) {
              dbProduct.stock -= product.productQuantity;

              if (dbProduct.stock < 0) {
                console.error(
                  `Estoque insuficiente para o produto: ${dbProduct.productTitle}`
                );
                dbProduct.stock = 0; // Prevenir valores negativos
              }

              console.log(
                `Estoque atualizado para o produto "${dbProduct.productTitle}". Novo estoque: ${dbProduct.stock}`
              );
            } else {
              console.error(
                `Quantidade inválida do produto sem variação: ${dbProduct.productTitle}`
              );
            }
          }

          // Salvar o produto com as alterações
          await dbProduct.save();
        } catch (error) {
          console.error(
            `Erro ao atualizar o estoque do produto ID ${product.productID}:`,
            error
          );
        }
      }

      // Atualizar Customer (Balance Available e Otaku Points Pending)
      await customerOtakupay.save();

      // Iterar sobre cada par de ID de parceiro e balancePending criptografado
      for (const { partnerID, balancePending } of newEncryptedBalances) {
        try {
          // Encontrar o parceiro pelo ID
          const partner = await PartnerModel.findById(partnerID);

          if (!partner) {
            console.error(`Parceiro não encontrado para o ID ${partnerID}`);
            continue; // Pular para o próximo parceiro
          }

          // Acessar o Otakupay do parceiro usando o otakupayID
          const partnerOtakupay = await OtakupayModel.findOne({
            _id: partner.otakupayID,
          });

          if (!partnerOtakupay) {
            console.error(
              `Otakupay não encontrado para o parceiro ${partnerID}`
            );
            continue; // Pular para o próximo parceiro
          }

          // Atualizar o balancePending do Otakupay do parceiro com o novo valor criptografado
          partnerOtakupay.balancePending = balancePending;

          // Salvar as alterações no Otakupay do parceiro
          await partnerOtakupay.save();

          console.log(
            `BalancePending do parceiro ${partnerID} atualizado com sucesso.`
          );
        } catch (error) {
          console.error(
            `Erro ao atualizar o balancePending do parceiro ${partnerID}:`,
            error
          );
        }
      }

      res.status(200).json({
        message: "Pagamento processado com sucesso!",
        savedOrders,
      });
    } catch (error) {
      console.log(error);
    }
  }

  static async createPaymentPixOtakuPay(req: Request, res: Response) {
    const interCertPath = process.env.INTER_CERT_PATH;
    const interKeyPath = process.env.INTER_KEY_PATH;
    const interClientId = process.env.INTER_CLIENT_ID;
    const interClientSecret = process.env.INTER_CLIENT_SECRET;
    const grant_type = "client_credentials";
    const scope = "cob.write cob.read";

    if (
      !interCertPath ||
      !interKeyPath ||
      !interClientId ||
      !interClientSecret
    ) {
      throw new Error(
        "CertPath, KeyPath, Client ID, and Client Secret must be defined in environment variables"
      );
    }

    // Configuração do certificado e chave privada
    const cert = fs.readFileSync(interCertPath);
    const key = fs.readFileSync(interKeyPath);

    const requestBody = {
      grant_type: grant_type,
      client_id: interClientId,
      client_secret: interClientSecret,
      scope: scope,
    };

    const tokenCustomer: any = getToken(req);
    const customer = await getUserByToken(tokenCustomer);

    // Verifique se o usuário é uma instância de CustomerModel
    if (!(customer instanceof CustomerModel)) {
      res.status(422).json({
        message: "Usuário não encontrado ou não é um cliente válido!",
      });
      return;
    }

    // Verifique o tipo de conta
    if (customer.accountType !== "customer") {
      res.status(422).json({
        message: "Usuário sem permissão para realizar este tipo de transação!",
      });
      return;
    }

    const customerOtakupay: any = await OtakupayModel.findOne({
      _id: customer.otakupayID,
    });

    // Configuração da requisição para obter o token
    const tokenRequestConfig: AxiosRequestConfig = {
      method: "post",
      url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: {
        username: interClientId,
        password: interClientSecret,
      },
      data: qs.stringify(requestBody), // Use a biblioteca 'qs' para formatar o corpo corretamente
      httpsAgent: new https.Agent({ cert, key }),
    };

    const responseToken = await axios(tokenRequestConfig);

    const { access_token } = responseToken.data;

    if (customer.accountType !== "customer") {
      res.status(422).json({
        message:
          "Usuário sem autorização para realizar este tipo de transação!",
      });
      return;
    }

    const customerCPF = decrypt(customer.cpf);

    if (!customerCPF) {
      res.status(422).json({
        message: "O CPF não está no formato desejado!",
      });
      return;
    }

    try {
      const { originalValue } = req.body;

      const pixData = {
        calendario: {
          expiracao: 86400,
        },
        devedor: {
          cpf: customerCPF,
          nome: customerOtakupay.name,
        },
        valor: {
          original: originalValue.toFixed(2),
          modalidadeAlteracao: 0,
        },
        chave: process.env.INTER_PIX_KEY,
        solicitacaoPagador: "OtakuPay: Pagamento de compra por PIX.",
      };
      const url = "https://cdpj.partners.bancointer.com.br/pix/v2/cob";

      const tokenOAuth = access_token;

      const responsePix = await axios.post(url, pixData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenOAuth}`,
        },
        httpsAgent: new https.Agent({
          // Adicionado o new https.Agent
          cert: cert,
          key: key,
        }),
      });

      const responsePixData = responsePix.data;

      // Criar uma nova atividade PIX
      const PaymentPixOtakuPay = new PaymentPixOtakuPayModel({
        txid: responsePixData.txid,
        devedor: {
          cpf: responsePixData.devedor.cpf,
          nome: responsePixData.devedor.nome,
        },
        pixCopiaECola: responsePixData.pixCopiaECola,
        valor: {
          original: responsePixData.valor.original,
          modalidadeAlteracao: responsePixData.valor.modalidadeAlteracao,
        },
        status: responsePixData.status,
        calendario: {
          expiracao: responsePixData.calendario.expiracao,
          criacao: responsePixData.calendario.criacao, // Adicione essa linha
        },
        userID: customerOtakupay._id,
        // infoAdicionais: [
        //    {
        //        nome: string;
        //        valor: string;
        //    }
        // ],
      });

      const newPaymentPixOtakuPay = await PaymentPixOtakuPay.save();

      res.status(201).json({
        message: "Pix criado com sucesso!",
        newPaymentPixOtakuPay,
      });
    } catch (error) {
      console.error("Erro ao criar cobrança PIX:", error);

      if (axios.isAxiosError(error)) {
        // Se o erro for do tipo AxiosError, significa que a solicitação HTTP falhou
        if (error.response) {
          // Se houver uma resposta do servidor
          console.error("Status do erro:", error.response.status);
          console.error("Detalhes do erro:", error.response.data);

          if (error.response.data.violacoes) {
            // Se houver violações na resposta
            console.error("Violacoes:");
            error.response.data.violacoes.forEach((violacao: any) => {
              console.error("- Razão:", violacao.razao);
              console.error("- Propriedade:", violacao.propriedade);
            });
          }
        } else {
          // Se não houver uma resposta do servidor
          console.error("Erro de servidor:", error.message);
        }
      } else {
        // Se o erro não for do tipo AxiosError
        console.error("Erro desconhecido:", error);
      }

      // Retorne uma resposta de erro para o cliente
      res.status(500).json({
        message: "Erro ao gerar QR Code!",
      });
    }
  }

  static async finishPaymentPixOtakuPay(req: Request, res: Response) {
    const { txid } = req.body;

    const { products, shippingCost, coupons } = req.body;

    console.log(txid);
    console.log(products);
    console.log(shippingCost);
    console.log(coupons);

    // Obter informações do ambiente
    const interCertPath = process.env.INTER_CERT_PATH;
    const interKeyPath = process.env.INTER_KEY_PATH;
    const interCaCertPath = process.env.INTER_CACERT_PATH;
    const interClientId = process.env.INTER_CLIENT_ID;
    const interClientSecret = process.env.INTER_CLIENT_SECRET;

    if (
      !interCertPath ||
      !interKeyPath ||
      !interCaCertPath ||
      !interClientId ||
      !interClientSecret
    ) {
      throw new Error(
        "CertPath, KeyPath, CA_CERT_PATH, Client ID, and Client Secret must be defined in environment variables"
      );
    }
    try {
      // Configuração do certificado, chave privada e certificado da autoridade certificadora
      const cert = fs.readFileSync(interCertPath);
      const key = fs.readFileSync(interKeyPath);
      const caCert = fs.readFileSync(interCaCertPath);

      // Configurar a solicitação para obter o token
      const tokenRequestBody = {
        grant_type: "client_credentials",
        client_id: interClientId,
        client_secret: interClientSecret,
        scope: "webhook.read cob.read",
      };

      const tokenRequestConfig: AxiosRequestConfig = {
        method: "post",
        url: "https://cdpj.partners.bancointer.com.br/oauth/v2/token",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: interClientId,
          password: interClientSecret,
        },
        data: qs.stringify(tokenRequestBody),
        httpsAgent: new https.Agent({ cert, key }),
      };

      // Obter token de acesso
      const responseToken = await axios(tokenRequestConfig);
      const { access_token } = responseToken.data;

      // COLOCAR ALGUM COMENTARIO QUE RESUMA A LÓGICA
      if (txid) {
        // SE TXID EXISTIR, FAZER A CONSULTA DE COBRANÇA IMEDIATA
        const getCobRequestConfig: AxiosRequestConfig = {
          method: "get",
          url: `https://cdpj.partners.bancointer.com.br/pix/v2/cob/${txid}`,
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
          httpsAgent: new https.Agent({
            cert,
            key,
            ca: caCert,
            requestCert: true,
            rejectUnauthorized: false,
          }),
        };

        // Realizar a requisição de consulta
        const responseCob = await axios(getCobRequestConfig);

        const cobData = responseCob.data;

        // Pegar o status do Pix
        const statusPix = cobData.status;

        console.log(statusPix);

        // Encontrar a transação PIX pelo txid na coleção PaymentPixOtakuPay
        const PaymentPixOtakuPayTransaction =
          await PaymentPixOtakuPayModel.findOne({
            txid: txid,
          });

        if (!PaymentPixOtakuPayTransaction) {
          // Se não estiver no estado "ATIVA", enviar resposta com status 422
          res.status(422).json({
            message: "Transação de pagamento não encontrada!",
          });
          return;
        }

        // console.log(statusPix);

        // // Verificar se a transação existe e está no estado "ATIVA"
        // if (statusPix !== "CONCLUIDA") {
        // 	console.log(
        // 		"Pagamento não realizado, não é possível prosseguir!"
        // 	);
        // 	// Se não estiver no estado "ATIVA", enviar resposta com status 422
        // 	res.status(422).json({
        // 		message:
        // 			"Pagamento não realizado, não é possível prosseguir!",
        // 	});
        // 	return;
        // }

        // if (statusPix === "CONCLUIDA") {
        // 	console.log("STATUS ALTERADO COM SUCESSO!");
        // 	// Atualizar o status da transação PIX com o valor do callback
        // 	PaymentPixOtakuPayTransaction.status = statusPix;
        // 	await PaymentPixOtakuPayTransaction.save();
        // 	return;
        // }

        try {
          // Encontrar a transação PIX pelo txid na coleção PaymentPixOtakuPay
          const PaymentPixOtakuPayTransaction =
            await PaymentPixOtakuPayModel.findOne({
              txid: txid,
            });

          if (statusPix === "CONCLUIDA") {
            if (!PaymentPixOtakuPayTransaction) {
              // Se não estiver no estado "ATIVA", enviar resposta com status 422
              res.status(422).json({
                message: "Transação de pagamento não encontrada!",
              });
              return;
            }
            console.log("STATUS ALTERADO COM SUCESSO!");
            // Atualizar o status da transação PIX com o valor do callback
            PaymentPixOtakuPayTransaction.status = statusPix;
            await PaymentPixOtakuPayTransaction.save();

            try {
              if (PaymentPixOtakuPayTransaction) {
                // AQUI IRÁ ENTRAR A LÓGICA DE FINALIZAÇÃO DO PAGAMENTO DO PEDIDO
                // const { products, shippingCost, coupons } =
                // 	req.body;

                // Verificar se o array de produtos é válido
                if (!products || products.length === 0) {
                  res.status(404).json({
                    error: "Nenhum produto encontrado na requisição!",
                  });
                  return;
                }

                // Verificar se todos os produtos possuem quantidade especificada
                if (
                  products.some(
                    (product: { productQuantity: number }) =>
                      product.productQuantity <= 0
                  )
                ) {
                  res.status(400).json({
                    error: "Quantidade inválida para um ou mais produtos!",
                  });
                  return;
                }

                // Pegar o Customer logado que irá realizar o pagamento
                const token: any = getToken(req);
                const customer = await getUserByToken(token);

                if (!(customer instanceof CustomerModel)) {
                  res.status(422).json({
                    message:
                      "Usuário não encontrado ou não é um cliente válido!",
                  });
                  return;
                }

                if (customer.accountType !== "customer") {
                  res.status(422).json({
                    message:
                      "Usuário sem permissão para realizar este tipo de transação!",
                  });
                  return;
                }

                if (!customer.cpf || customer.cpf == "") {
                  res.status(422).json({
                    message: "CPF inválido, atualize antes de prosseguir!",
                  });
                  return;
                }

                try {
                  // Pegar os IDs dos produtos da Requisição
                  const productIDs = products.map(
                    (product: any) => product.productID
                  );

                  // Verificar se todos os IDs possuem o formato correto de ObjectId
                  for (const id of productIDs) {
                    if (!mongoose.Types.ObjectId.isValid(id)) {
                      res.status(400).json({
                        error: `ID do produto '${id}' é inválido`,
                      });
                      return;
                    }
                  }

                  const productsFromDB = await ProductModel.find({
                    _id: productIDs,
                  });

                  // Verificar se todos os produtos foram encontrados no banco de dados
                  if (productsFromDB.length !== productIDs.length) {
                    // Se algum dos IDs não forem encontrados, interromper a transação
                    const missingProductIDs = productIDs.filter(
                      (id: any) =>
                        !productsFromDB.find((product) => product._id === id)
                    );
                    res.status(400).json({
                      message: "Alguns produtos não estão mais disponíveis",
                      missingProductIDs,
                    });
                    return;
                  }

                  // // Verificar se algum dos produtos possui estoque indisponível
                  // const produtoSemEstoque =
                  // 	productsFromDB.find(
                  // 		(product: any) => product.stock <= 0
                  // 	);
                  // if (produtoSemEstoque) {
                  // 	return res.status(422).json({
                  // 		message:
                  // 			"Um ou mais produtos encontram-se esgotados, não é possível realizar o pagamento!",
                  // 	});
                  // }

                  // Verificar se algum dos produtos possui estoque indisponível
                  const produtoSemEstoque = productsFromDB.find(
                    (product: any) => {
                      // Se o produto não tiver variações, verifica diretamente o estoque
                      if (
                        !product.productVariations ||
                        product.productVariations.length === 0
                      ) {
                        return product.stock <= 0;
                      }

                      // Caso tenha variações, verifica se todas as opções dentro das variações estão sem estoque
                      const todasVariacoesSemEstoque =
                        product.productVariations.every((variation: any) => {
                          // Garante que a variação tenha opções
                          if (
                            !variation.options ||
                            variation.options.length === 0
                          ) {
                            return true; // Considera a variação sem estoque se não há opções
                          }

                          // Verifica se todas as opções dessa variação estão sem estoque
                          return variation.options.every(
                            (option: any) => option.stock <= 0
                          );
                        });

                      return todasVariacoesSemEstoque;
                    }
                  );

                  if (produtoSemEstoque) {
                    res.status(422).json({
                      message:
                        "Um ou mais produtos encontram-se esgotados, não é possível realizar o pagamento!",
                    });
                    return;
                  }

                  // Pegar o OtakuPay do Customer
                  const customerOtakupay: any = await OtakupayModel.findOne({
                    _id: customer.otakupayID,
                  });

                  // Verificar se o saldo do Customer existe
                  if (!customerOtakupay || !customerOtakupay.balanceAvailable) {
                    res.status(422).json({
                      message: "Customer Balance Available não encontrado!",
                    });
                    return;
                  }

                  // Pegar o Balance Available do Customer Criptografado
                  const encryptedCustomerBalanceAvailable =
                    customerOtakupay.balanceAvailable;

                  // Descriptografar o Balance Available do Customer
                  const decryptedCustomerBalanceAvailable = decrypt(
                    encryptedCustomerBalanceAvailable
                  );

                  if (decryptedCustomerBalanceAvailable === null) {
                    res.status(500).json({
                      message:
                        "Erro ao descriptografar o Customer Balance Available!",
                    });
                    return;
                  }

                  console.log(
                    "BALANCE AVAILABLE DO CUSTOMER DESCRIPTOGRAFADO:",
                    decryptedCustomerBalanceAvailable
                  );

                  // Array para armazenar os custos totais dos produtos por PartnerID
                  const partnersTotalCost: {
                    partnerID: string;
                    totalCost: number;
                  }[] = [];

                  // Iterar sobre cada produto para calcular o custo total com base no parceiro
                  for (const product of products) {
                    // Encontrar o produto correspondente na lista de produtos do banco de dados
                    const productFromDB = productsFromDB.find(
                      (p: any) =>
                        p._id.toString() === product.productID.toString()
                    );

                    // Se o produto correspondente não for encontrado, continuar para o próximo produto
                    if (!productFromDB) {
                      continue;
                    }

                    let productCost;

                    // Verificar se o produto tem variações
                    if (
                      product.productVariations &&
                      product.productVariations.length > 0 &&
                      productFromDB.productVariations &&
                      productFromDB.productVariations.length > 0
                    ) {
                      // Encontrar a variação no banco de dados
                      const variation = productFromDB.productVariations.find(
                        (v: any) =>
                          v._id.toString() ===
                          product.productVariations[0].variationID.toString()
                      );

                      if (variation) {
                        // Encontrar a opção correspondente dentro da variação
                        const option = variation.options.find(
                          (o: any) =>
                            o._id.toString() ===
                            product.productVariations[0].optionID.toString()
                        );

                        if (option) {
                          // Utilizar o preço da opção
                          productCost =
                            option.promotionalPrice > 0
                              ? option.promotionalPrice
                              : option.originalPrice;
                        }
                      }
                    }

                    // Caso o produto não tenha variações ou nenhuma correspondência tenha sido encontrada
                    if (!productCost) {
                      productCost =
                        productFromDB.promotionalPrice > 0
                          ? productFromDB.promotionalPrice
                          : productFromDB.originalPrice;
                    }

                    // Calcular o custo total do produto levando em consideração a quantidade
                    const totalProductCost =
                      productCost * product.productQuantity;

                    // Verificar se já existe um registro para esse parceiro no array
                    const partnerIndex = partnersTotalCost.findIndex(
                      (item) => item.partnerID === product.partnerID
                    );

                    if (partnerIndex === -1) {
                      // Se não existir, adicionar um novo registro ao array
                      partnersTotalCost.push({
                        partnerID: product.partnerID,
                        totalCost: totalProductCost,
                      });
                    } else {
                      // Se existir, adicionar o custo total do produto ao custo total existente
                      partnersTotalCost[partnerIndex].totalCost +=
                        totalProductCost;
                    }
                  }

                  // Aplicar desconto do cupom, se houver
                  if (coupons && coupons.length > 0) {
                    for (const coupon of coupons) {
                      const couponCode = coupon.couponCode;

                      // Buscar o cupom no banco de dados usando o código do cupom
                      const couponData = await CouponModel.findOne({
                        couponCode: couponCode,
                      });

                      if (couponData) {
                        // Iterar sobre cada parceiro para aplicar o desconto do cupom
                        for (const partner of partnersTotalCost) {
                          if (
                            String(partner.partnerID) ===
                            String(couponData.partnerID)
                          ) {
                            // Calcular o valor do desconto com base na porcentagem do cupom
                            const discountAmount =
                              (partner.totalCost *
                                couponData.discountPercentage) /
                              100;

                            // Subtrair o valor do desconto do custo total do parceiro
                            partner.totalCost -= discountAmount;
                          }
                        }
                      } else {
                        // Se algum cupom não for encontrado, enviar resposta de erro
                        res.status(404).json({
                          message: "Cupom de desconto não encontrado.",
                        });
                        return;
                      }
                    }
                  }

                  // Verificar se algum parceiro possui produtos
                  if (partnersTotalCost.length === 0) {
                    res.status(422).json({
                      message:
                        "Nenhum produto encontrado para os parceiros especificados.",
                    });
                    return;
                  }

                  console.log(
                    "CUSTO TOTAL DOS PRODUTOS POR PARCEIRO:",
                    partnersTotalCost
                  );

                  console.log(
                    "CUSTO TOTAL DO FRETE POR PARCEIRO:",
                    shippingCost
                  );

                  // Função para calcular o custo total de um produto
                  function getProductCost(product: any): number {
                    // Encontrar o produto correspondente na lista de produtos do banco de dados
                    const productFromDB = productsFromDB.find(
                      (p: any) =>
                        p._id.toString() === product.productID.toString()
                    );

                    // Se o produto correspondente não for encontrado, retornar -1
                    if (!productFromDB) {
                      return -1;
                    }

                    // Calcular o custo total do produto levando em consideração a quantidade
                    const productCost =
                      productFromDB.promotionalPrice > 0
                        ? productFromDB.promotionalPrice
                        : productFromDB.originalPrice;
                    return productCost * product.productQuantity;
                  }

                  // Array para armazenar os custos totais dos produtos por parceiro, incluindo o frete
                  const partnersTotalCostWithShipping: {
                    partnerID: string;
                    totalCostWithShipping: number;
                  }[] = [];

                  // Verificar se há dados em partnersTotalCost e shippingCost
                  if (
                    partnersTotalCost.length === 0 ||
                    shippingCost.length === 0
                  ) {
                    res.status(422).json({
                      message: "Falta de dados, impossível prosseguir!",
                    });
                    return;
                  }

                  // Iterar sobre cada produto para calcular o custo total com base no partnerID e no frete correspondente
                  // Iterar sobre cada parceiro para calcular o custo total com base nos valores já descontados e no frete correspondente
                  for (const partner of partnersTotalCost) {
                    // Encontrar o frete correspondente ao parceiro
                    const shipping = shippingCost.find(
                      (cost: any) => cost.partnerID === partner.partnerID
                    );

                    // Se o frete for encontrado, calcular o custo total com frete, caso contrário, considerar apenas o valor já descontado
                    const totalCostWithShipping = shipping
                      ? partner.totalCost + shipping.vlrFrete
                      : partner.totalCost;

                    // Adicionar o custo total com frete ao array partnersTotalCostWithShipping
                    partnersTotalCostWithShipping.push({
                      partnerID: partner.partnerID,
                      totalCostWithShipping: totalCostWithShipping,
                    });
                  }

                  console.log(
                    "CUSTO TOTAL DOS PRODUTOS + FRETE POR PARCEIRO:",
                    partnersTotalCostWithShipping
                  );

                  // Calcular o valor total do pedido com frete (PARA O CUSTOMER PAGAR)
                  let customerOrderCostTotal =
                    partnersTotalCostWithShipping.reduce(
                      (total, item) => total + item.totalCostWithShipping,
                      0
                    );

                  console.log(
                    "VALOR TOTAL DOS PEDIDOS COM FRETE",
                    customerOrderCostTotal
                  );

                  // Verificar se orderCostTotal é um número válido
                  if (isNaN(customerOrderCostTotal)) {
                    res.status(422).json({
                      message: "Custo total do pedido inválido!",
                    });
                    return;
                  }

                  if (
                    isNaN(Number(decryptedCustomerBalanceAvailable)) ||
                    isNaN(customerOrderCostTotal)
                  ) {
                    res.status(422).json({
                      message: "Valores em formatos inválidos!",
                    });
                    return;
                  }

                  // if (decryptedCustomerBalanceAvailable < customerOrderCostTotal) {
                  // 	res.status(422).json({
                  // 		message: "Customer Balance Available insuficiente!",
                  // 	});
                  // 	return;
                  // }

                  // // Limitando o Customer Balance Available para duas casas decimais
                  // const newCustomerBalanceAvailable = (
                  // 	decryptedCustomerBalanceAvailable - customerOrderCostTotal
                  // ).toFixed(2);

                  // // Criptografar o novo Customer Balance Available para armazenar no banco de dados
                  // const newEncryptedCustomerBalanceAvailable = encrypt(
                  // 	newCustomerBalanceAvailable.toString()
                  // );

                  // // Atualizar o Customer Balance Available criptografado no banco de dados
                  // customerOtakupay.balanceAvailable =
                  // 	newEncryptedCustomerBalanceAvailable;

                  // Array para armazenar os parceiros
                  const partners = [];

                  // Array para armazenar os OtakuPays associados aos parceiros
                  const partnerOtakupays = [];

                  // Map para armazenar os Partner Balance Pending Criptografados por partnerID
                  const encryptedPartnerBalancePendingMap = new Map<
                    string,
                    string
                  >();

                  // Iterar sobre cada produto para obter os parceiros e seus Otakupays associados
                  for (const product of products) {
                    // Buscar o parceiro pelo ID do produto
                    const partner = await PartnerModel.findById(
                      product.partnerID
                    );

                    // Verificar se o parceiro existe
                    if (!partner) {
                      // Se o parceiro não existir, retornar um erro
                      res.status(422).json({
                        message: "Parceiro não encontrado para este produto!",
                      });
                      return;
                    }

                    // Acessar o OtakuPay do parceiro usando o otakupayID
                    const partnerOtakupay = await OtakupayModel.findOne({
                      _id: partner.otakupayID,
                    });

                    // Verificar se o OtakuPay do parceiro existe
                    if (!partnerOtakupay) {
                      // Se o OtakuPay do parceiro não existir, retornar um erro
                      res.status(422).json({
                        message: "Otakupay do Partner não encontrado!",
                      });
                      return;
                    }

                    // Adicionar o parceiro ao array de parceiros
                    partners.push(partner);

                    // Adicionar o OtakuPay associado ao array de Otakupays
                    partnerOtakupays.push(partnerOtakupay);

                    // Adicionar o Partner Balance Pending ao mapa, se existir
                    if (
                      partnerOtakupay.balancePending &&
                      !encryptedPartnerBalancePendingMap.has(
                        partner._id.toString()
                      )
                    ) {
                      encryptedPartnerBalancePendingMap.set(
                        partner._id.toString(),
                        partnerOtakupay.balancePending
                      );
                    }
                  }

                  // Converter o map para um array de Partner Balance Pending Criptografados
                  const encryptedPartnerBalancePendingList = Array.from(
                    encryptedPartnerBalancePendingMap.entries()
                  ).map(([partnerID, balancePending]) => ({
                    partnerID,
                    balancePending,
                  }));

                  // Descriptografar os Partner Balance Pending
                  const decryptedPartnerBalancePendingList =
                    encryptedPartnerBalancePendingList.map(
                      ({ partnerID, balancePending }) => {
                        const decryptedValue = decrypt(balancePending);
                        return {
                          partnerID,
                          balancePending: decryptedValue,
                        };
                      }
                    );

                  console.log(
                    "Partner Balance Pending Descriptografados por ID de parceiro:",
                    decryptedPartnerBalancePendingList
                  );

                  if (decryptedPartnerBalancePendingList === null) {
                    res.status(500).json({
                      message:
                        "Erro ao descriptografar o Partner Balance Pending!",
                    });
                    return;
                  }

                  // Array para armazenar os novos Partner Balance Pending
                  const newBalances = [];

                  // Iterar sobre cada parceiro para calcular o novo balancePending
                  for (const partner of decryptedPartnerBalancePendingList) {
                    // Verificar se balancePending não é nulo
                    if (partner.balancePending !== null) {
                      // Encontrar o total da compra com frete correspondente ao parceiro
                      const partnerTotalCostWithShipping =
                        partnersTotalCostWithShipping.find(
                          (item) => item.partnerID === partner.partnerID
                        );

                      // Se o parceiro não tiver um total da compra com frete, atribuir 0
                      const partnerTotalCost = partnerTotalCostWithShipping
                        ? partnerTotalCostWithShipping.totalCostWithShipping
                        : 0;

                      // Calcular o novo balancePending somando o total da compra com frete ao balancePending existente
                      const newBalance =
                        partner.balancePending + partnerTotalCost;

                      // Adicionar o novo balancePending ao array de novos balanços - São esses valores que serão armazenados
                      newBalances.push({
                        partnerID: partner.partnerID,
                        balancePending: newBalance,
                      });
                    }
                  }

                  // Console log para exibir os novos balanços pendentes dos parceiros
                  console.log("NOVO PARTNER BALANCE PENDING:", newBalances);

                  // Array para armazenar os novos Partner Balance Pending criptografados
                  const newEncryptedBalances = [];

                  // Iterar sobre cada novo balancePending para criptografá-los
                  for (const balance of newBalances) {
                    // Criptografar o balancePending usando a função encrypt
                    const encryptedBalance = encrypt(
                      balance.balancePending.toString()
                    );

                    // Adicionar o balancePending criptografado ao array de novos Balance Pending criptografados
                    newEncryptedBalances.push({
                      partnerID: balance.partnerID,
                      balancePending: encryptedBalance,
                    });
                  }

                  // Console log para exibir os novos balanços pendentes criptografados dos parceiros
                  console.log(
                    "NOVOS PARTNER BALANCE PENDING CRIPTOGRAFADOS:",
                    newEncryptedBalances
                  );

                  // Array para armazenar os cashbacks (Otaku Points) que serão pagos por parceiro
                  const partnerCashbacks: {
                    partnerID: string;
                    cashbackAmount: number;
                  }[] = [];

                  // Iterar sobre cada parceiro para calcular o cashback
                  for (const partnerCost of partnersTotalCost) {
                    // Calcular o valor do cashback (2% do custo total dos produtos)
                    const cashbackAmount = partnerCost.totalCost * 0.01;

                    // Adicionar o cashback ao array de cashbacks
                    partnerCashbacks.push({
                      partnerID: partnerCost.partnerID,
                      cashbackAmount: cashbackAmount,
                    });
                  }

                  console.log(
                    "CASHBACKS/OTAKU POINTS A SEREM PAGOS PELO PARTNER INDIVIDUALMENTE:",
                    partnerCashbacks
                  );

                  // Array para armazenar os cashbacks (Otaku Points) criptografados, a serem pagos por parceiro
                  const encryptedPartnerCashbacks: {
                    partnerID: string;
                    encryptedCashback: string;
                  }[] = [];

                  // Iterar sobre cada parceiro para calcular e criptografar o cashback (Otaku Points)
                  for (const partnerCost of partnersTotalCost) {
                    // Calcular o valor do cashback (2% do custo total dos produtos)
                    const cashbackAmount = partnerCost.totalCost * 0.01;

                    // Criptografar o valor do cashback usando a função encrypt
                    const encryptedCashback = encrypt(
                      cashbackAmount.toString()
                    );

                    // Adicionar o cashback criptografado ao array de cashbacks criptografados
                    encryptedPartnerCashbacks.push({
                      partnerID: partnerCost.partnerID,
                      encryptedCashback: encryptedCashback,
                    });
                  }

                  console.log(
                    "CASHBACKS/OTAKU POINTS A SEREM PAGOS PELO PARTNER INDIVIDUALMENTE, CRIPTOGRAFADOS:",
                    encryptedPartnerCashbacks
                  );

                  // Array para armazenar os cashbacks (Otaku Points) do Customer por parceiro
                  const customerCashbacks: {
                    partnerID: string;
                    customerCashbackAmount: number;
                  }[] = [];

                  // Iterar sobre cada parceiro para calcular o cashback do cliente
                  for (const partnerCost of partnersTotalCost) {
                    // Buscar o parceiro pelo ID
                    const partner = await PartnerModel.findById(
                      partnerCost.partnerID
                    );

                    // Verificar se o parceiro existe
                    if (!partner) {
                      // Se o parceiro não existir, retornar um erro
                      res.status(422).json({
                        message: "Parceiro não encontrado!",
                      });
                      return;
                    }

                    // Acessar o OtakuPay do Partner usando o otakupayID
                    const partnerOtakupay = await OtakupayModel.findOne({
                      _id: partner.otakupayID,
                    });

                    // Verificar se o OtakuPay do parceiro existe
                    if (!partnerOtakupay) {
                      // Se o Otakupay do parceiro não existir, retornar um erro
                      res.status(422).json({
                        message: "Otakupay do Partner não encontrado!",
                      });
                      return;
                    }

                    // Verificar se o parceiro oferece cashback
                    if (!partnerOtakupay.cashback) {
                      // Se o parceiro não oferecer cashback, continuar para o próximo parceiro
                      continue;
                    }

                    // Calcular o cashback do cliente com base na porcentagem de cashback do parceiro
                    const customerCashbackAmount =
                      Math.floor(
                        partnerCost.totalCost *
                          (Number(partnerOtakupay.cashback) / 100) *
                          100
                      ) / 100;

                    // Adicionar o cashback do cliente ao array de cashbacks do cliente
                    customerCashbacks.push({
                      partnerID: partnerCost.partnerID,
                      customerCashbackAmount: customerCashbackAmount,
                    });
                  }

                  console.log(
                    "CASHBACK/OTAKU POINTS DO CUSTOMER POR PARCEIRO:",
                    customerCashbacks
                  );

                  /// É NECESSÁRIO CRIPTOGRAFAR O CASHBACK DO CUSTOMER RECEBIDO POR PARCEIRO, ANTES DE DESMEMBRAR E ARMAZENAR NA ORDER

                  // Array para armazenar os cashbacks (Otaku Points) criptografados do Customer por parceiro
                  const encryptedCustomerCashbacks: {
                    partnerID: string;
                    encryptedCustomerCashback: string;
                  }[] = [];

                  // Iterar sobre cada cashback do cliente para criptografar
                  for (const cashback of customerCashbacks) {
                    // Criptografar o valor do cashback do cliente usando a função encrypt
                    const encryptedCashback = encrypt(
                      cashback.customerCashbackAmount.toString()
                    );

                    // Adicionar o cashback criptografado ao array de cashbacks criptografados do cliente
                    encryptedCustomerCashbacks.push({
                      partnerID: cashback.partnerID,
                      encryptedCustomerCashback: encryptedCashback,
                    });
                  }

                  // Exibir os cashbacks do cliente por parceiro após a criptografia
                  console.log(
                    "CASHBACK/OTAKU POINTS DO CUSTOMER POR PARCEIRO, CRIPTOGRAFADOS:",
                    encryptedCustomerCashbacks
                  );

                  // Variável para armazenar o total de cashback (Otaku Points) do Customer
                  let totalCustomerCashback = 0;

                  // Iterar sobre cada cashback (Otaku Points) do cliente por parceiro para calcular o total de cashback
                  for (const customerCashback of customerCashbacks) {
                    // Adicionar o valor do cashback do cliente ao total
                    totalCustomerCashback +=
                      customerCashback.customerCashbackAmount;
                  }

                  // Descriptografar o Otaku Points Pending do Customer
                  const decryptedOtakuPointsPending = decrypt(
                    customerOtakupay.otakuPointsPending
                  );

                  // Verificar se a descriptografia foi bem-sucedida
                  if (decryptedOtakuPointsPending === null) {
                    res.status(500).json({
                      message:
                        "Erro ao descriptografar saldo de pontos pendentes do cliente!",
                    });
                    return;
                  }

                  // Somar o total de cashback (Otaku Points) ao Otaku Points Pending do Customer
                  // const newOtakuPointsPending =
                  // 	decryptedOtakuPointsPending + totalCustomerCashback;

                  const newOtakuPointsPending =
                    Number(decryptedOtakuPointsPending) +
                    Number(totalCustomerCashback);

                  console.log(
                    "NOVO OTAKU POINTS PENDING DO CUSTOMER EM NÚMEROS:",
                    newOtakuPointsPending
                  );

                  // Criptografar o novo Otaku Points Pending do Customer
                  const encryptedNewOtakuPointsPending = encrypt(
                    newOtakuPointsPending.toString()
                  );

                  console.log(
                    "NOVO OTAKU POINTS PENDING DO CUSTOMER CRIPTOGRAFADO:",
                    encryptedNewOtakuPointsPending
                  );

                  // Atualizar os Customer Otaku Points Pending criptografados no banco de dados
                  customerOtakupay.otakuPointsPending =
                    encryptedNewOtakuPointsPending;

                  // *********************************************************************************************** //

                  // Array para armazenar as comissões por parceiros
                  const partnerCommissions: {
                    partnerID: string;
                    commissionAmount: number;
                  }[] = [];

                  // Iterar sobre cada parceiro para calcular a comissão
                  for (const partnerCost of partnersTotalCost) {
                    // Calcular a comissão de 9% em cima do total dos produtos transacionados por parceiro || O VALOR PRECISARÁ SER DEFINIDO PELO DOTENV
                    const commissionAmount = partnerCost.totalCost * 0.09;

                    // Buscar o parceiro pelo ID
                    const partner = await PartnerModel.findById(
                      partnerCost.partnerID
                    );

                    // Verificar se o parceiro existe
                    if (!partner) {
                      // Se o parceiro não existir, retornar um erro
                      res.status(422).json({
                        message: "Parceiro não encontrado!",
                      });
                      return;
                    }

                    // Acessar o OtakuPay do parceiro usando o otakupayID
                    const partnerOtakupay = await OtakupayModel.findOne({
                      _id: partner.otakupayID,
                    });

                    // Verificar se o OtakuPay do parceiro existe
                    if (!partnerOtakupay) {
                      // Se o OtakuPay do parceiro não existir, retornar um erro
                      res.status(422).json({
                        message: "Otakupay do Partner não encontrado!",
                      });
                      return;
                    }

                    // Verificar se o parceiro oferece cashback
                    if (!partnerOtakupay.cashback) {
                      // Se o parceiro não oferecer cashback, o valor do cashback é 0
                      const cashbackAmount = 0;
                      // Somar o cashback ao valor da comissão
                      const totalAmount = commissionAmount + cashbackAmount;

                      // Adicionar a comissão a ser paga pelo Parceiro ao array de comissões
                      partnerCommissions.push({
                        partnerID: partnerCost.partnerID,
                        commissionAmount: totalAmount,
                      });
                    } else {
                      // Calcular o cashback que o parceiro está oferecendo
                      const cashbackAmount =
                        partnerCost.totalCost *
                        (Number(partnerOtakupay.cashback) / 100);

                      console.log("VALOR DO CASHBACK", cashbackAmount);

                      // Somar o cashback ao valor da comissão
                      const totalAmount = commissionAmount + cashbackAmount;

                      console.log("VALOR DO CASHBACK + COMISSÃO", totalAmount);

                      // Adicionar a comissão do parceiro ao array de comissões
                      partnerCommissions.push({
                        partnerID: partnerCost.partnerID,
                        commissionAmount: totalAmount,
                      });
                    }
                  }

                  console.log(
                    "COMISSÕES A SEREM PAGAS PELOS PARTNERS:",
                    partnerCommissions
                  );

                  // Array para armazenar as comissões criptografadas por parceiros
                  const encryptedPartnerCommissions: {
                    partnerID: string;
                    encryptedCommissionAmount: string;
                  }[] = [];

                  // Iterar sobre cada comissão dos parceiros para criptografar o valor
                  for (const commission of partnerCommissions) {
                    // Criptografar o valor da comissão por Parceiro
                    const encryptedCommissionAmount = encrypt(
                      commission.commissionAmount.toString()
                    );

                    // Adicionar a comissão criptografada ao array de comissões criptografadas
                    encryptedPartnerCommissions.push({
                      partnerID: commission.partnerID,
                      encryptedCommissionAmount,
                    });
                  }

                  // Agrupar os produtos por partnerID
                  const productsByPartner: Record<string, any[]> = {};
                  for (const product of products) {
                    if (!productsByPartner[product.partnerID]) {
                      productsByPartner[product.partnerID] = [];
                    }
                    productsByPartner[product.partnerID].push(product);
                  }

                  let orders: any[] = []; // Array para armazenar todas as Ordens

                  // Iterar sobre cada grupo de produtos por partnerID para criar as ordens
                  for (const partnerID in productsByPartner) {
                    if (
                      Object.prototype.hasOwnProperty.call(
                        productsByPartner,
                        partnerID
                      )
                    ) {
                      const partnerProducts = productsByPartner[partnerID];
                      let partnerOrderCostTotal = 0;

                      const partner = await PartnerModel.findById(partnerID);

                      if (!partner) {
                        console.log("Parceiro não encontrado!");
                        return;
                      }
                      // Encontrar o custo total dos produtos com frete para este parceiro
                      const partnerTotalCostWithShipping =
                        partnersTotalCostWithShipping.find(
                          (cost) => cost.partnerID === partnerID
                        );

                      // Verificar se o custo total dos produtos com frete foi encontrado
                      if (!partnerTotalCostWithShipping) {
                        console.error(
                          `Custo total dos produtos com frete não encontrado para o parceiro ${partnerID}`
                        );
                        continue; // Pular para a próxima iteração do loop
                      }

                      // Atribuir o custo total dos produtos com frete ao partnerOrderCostTotal
                      partnerOrderCostTotal =
                        partnerTotalCostWithShipping.totalCostWithShipping;

                      // Encontrar o custo de envio para este parceiro
                      const shippingCostForPartner = shippingCost.find(
                        (cost: any) => cost.partnerID === partnerID
                      );

                      // Verificar se o custo de envio para este parceiro foi encontrado
                      if (shippingCostForPartner) {
                        // Extrair o valor do custo de envio
                        const { transportadora, vlrFrete } =
                          shippingCostForPartner;

                        console.log(
                          "VALOR TOTAL DO PEDIDO COM FRETE ANTES DE CRIPTOGRAFAR",
                          partnerOrderCostTotal
                        );

                        // Valor total do pedido Cripitografado
                        const orderTotalCostEncrypted = encrypt(
                          partnerOrderCostTotal.toString()
                        );

                        console.log(
                          "VALOR TOTAL DO PEDIDO COM FRETE CRIPTOGRAFADO",
                          orderTotalCostEncrypted
                        );

                        console.log(
                          "VALOR DO FRETE ANTES DE CRIPTOGRAFAR",
                          vlrFrete
                        );

                        // Valor do Frete Cripitografado
                        const shippingCostEncrypted = encrypt(
                          vlrFrete.toString()
                        );

                        console.log(
                          "VALOR DO FRETE CRYPITOGRAFADO",
                          shippingCostEncrypted
                        );

                        const customerAddress: any = customer.address[0];

                        if (!customerAddress) {
                          res.status(422).json({
                            message:
                              "É necessário informar o endereço de entrega!",
                          });
                          return;
                        }

                        // Criar uma nova Order para cada PartnerID
                        const newOrder = new OrderModel({
                          orderID: new ObjectId().toHexString().toUpperCase(),
                          statusOrder: "Confirmed",
                          paymentMethod: "Pix",
                          shippingCostTotal: shippingCostEncrypted,
                          customerOrderCostTotal: orderTotalCostEncrypted,
                          partnerCommissionOtamart:
                            encryptedPartnerCommissions.find(
                              (commission) => commission.partnerID === partnerID
                            )?.encryptedCommissionAmount,
                          customerOtakuPointsEarned:
                            encryptedCustomerCashbacks.find(
                              (cashback) => cashback.partnerID === partnerID
                            )?.encryptedCustomerCashback,
                          itemsList: [],
                          partnerID: partnerID,
                          partnerName: partner.name,
                          partnerCNPJ: partner.cpfCnpj,
                          customerID: customer._id,
                          customerName: customer.name,
                          customerCPF: customer.cpf,
                          customerAddress: [
                            {
                              street: customerAddress.street,
                              complement: customerAddress.complement,
                              neighborhood: customerAddress.neighborhood,
                              city: customerAddress.city,
                              state: customerAddress.state,
                              postalCode: customerAddress.postalCode,
                            },
                          ],
                          shippingMethod: transportadora,
                          trackingCode: "",
                          statusShipping: "Pending",
                          discountsApplied: 0,
                          orderNote: "",
                        });

                        // Adicionar os itens do pedido
                        // for (const product of partnerProducts) {
                        // 	// Encontrar o produto correspondente na lista de produtos do banco de dados
                        // 	const productFromDB =
                        // 		productsFromDB.find(
                        // 			(p: any) =>
                        // 				p._id.toString() ===
                        // 				product.productID.toString()
                        // 		);

                        // 	// Se o produto correspondente não for encontrado, continuar para o próximo produto
                        // 	if (!productFromDB) {
                        // 		continue;
                        // 	}

                        // 	let productCost;

                        // 	// Verificar se o produto tem variações
                        // 	if (
                        // 		product.productVariations &&
                        // 		product
                        // 			.productVariations
                        // 			.length > 0 &&
                        // 		productFromDB.productVariations &&
                        // 		productFromDB
                        // 			.productVariations
                        // 			.length > 0
                        // 	) {
                        // 		// Encontrar a variação no banco de dados
                        // 		const variation =
                        // 			productFromDB.productVariations.find(
                        // 				(v: any) =>
                        // 					v._id.toString() ===
                        // 					product.productVariations[0].variationID.toString()
                        // 			);

                        // 		if (variation) {
                        // 			// Encontrar a opção correspondente dentro da variação
                        // 			const option =
                        // 				variation.options.find(
                        // 					(o: any) =>
                        // 						o._id.toString() ===
                        // 						product.productVariations[0].optionID.toString()
                        // 				);

                        // 			if (option) {
                        // 				// Utilizar o preço da opção
                        // 				productCost =
                        // 					option.promotionalPrice >
                        // 					0
                        // 						? option.promotionalPrice
                        // 						: option.originalPrice;
                        // 			}
                        // 		}
                        // 	}

                        // 	// Caso o produto não tenha variações ou nenhuma correspondência tenha sido encontrada
                        // 	if (!productCost) {
                        // 		productCost =
                        // 			productFromDB.promotionalPrice >
                        // 			0
                        // 				? productFromDB.promotionalPrice
                        // 				: productFromDB.originalPrice;
                        // 	}

                        // 	// Adicionar o item ao pedido
                        // 	order.itemsList.push({
                        // 		productID:
                        // 			product.productID,
                        // 		productTitle:
                        // 			product.productTitle,
                        // 		productImage:
                        // 			product.productImage,
                        // 		productPrice:
                        // 			productCost,
                        // 		daysShipping:
                        // 			shippingCostForPartner.daysShipping,
                        // 		productQuantity:
                        // 			product.productQuantity,
                        // 	});
                        // }

                        for (const product of partnerProducts) {
                          // Encontrar o produto correspondente na lista de produtos do banco de dados
                          const productFromDB = productsFromDB.find(
                            (p: any) =>
                              p._id.toString() === product.productID.toString()
                          );

                          // Se o produto correspondente não for encontrado, continuar para o próximo produto
                          if (!productFromDB) {
                            continue;
                          }

                          let productCost;
                          let productImage = product.productImage;
                          let productVariationName = ""; // Variável para armazenar a variação

                          // Verificar se o produto tem variações
                          if (
                            product.productVariations &&
                            product.productVariations.length > 0 &&
                            productFromDB.productVariations &&
                            productFromDB.productVariations.length > 0
                          ) {
                            // Encontrar a variação no banco de dados
                            const variation =
                              productFromDB.productVariations.find(
                                (v: any) =>
                                  v._id.toString() ===
                                  product.productVariations[0].variationID.toString()
                              );

                            if (variation) {
                              // Encontrar a opção correspondente dentro da variação
                              const option = variation.options.find(
                                (o: any) =>
                                  o._id.toString() ===
                                  product.productVariations[0].optionID.toString()
                              );

                              if (option) {
                                // Utilizar o preço da opção
                                productCost =
                                  option.promotionalPrice > 0
                                    ? option.promotionalPrice
                                    : option.originalPrice;

                                // Atualizar a imagem para a imagem da opção
                                if (option.imageUrl) {
                                  productImage = option.imageUrl;
                                }

                                // Título para o Document Transaction
                                const productTitles = newOrder.itemsList.map(
                                  (item) => item.productTitle
                                );

                                // Título para o Document Transaction
                                const detailProductServiceTitle =
                                  productTitles.length === 1
                                    ? productTitles[0]
                                    : `${productTitles[0]} + ${
                                        productTitles.length - 1
                                      } ${
                                        productTitles.length - 1 === 1
                                          ? "produto"
                                          : "produtos"
                                      }`;

                                // Registrar a transação
                                const newTransaction = new TransactionModel({
                                  transactionType: "Pagamento",
                                  transactionTitle: "Compra no OtaMart",
                                  transactionDescription: `Pedido feito no OtaMart.`,
                                  transactionValue: encrypt(
                                    customerOrderCostTotal.toString()
                                  ),
                                  transactionDetails: {
                                    detailProductServiceTitle:
                                      detailProductServiceTitle,
                                    detailCost: encrypt(
                                      String(
                                        newOrder.itemsList.reduce(
                                          (acc, item) => {
                                            return (
                                              acc +
                                              item.productPrice *
                                                item.productQuantity
                                            );
                                          },
                                          0
                                        )
                                      )
                                    ),
                                    detailPaymentMethod: "Pix",
                                    detailShippingCost: shippingCostEncrypted,
                                    detailSalesFee:
                                      encryptedPartnerCommissions.find(
                                        (commission) =>
                                          commission.partnerID === partnerID
                                      )?.encryptedCommissionAmount,
                                    detailCashback:
                                      encryptedCustomerCashbacks.find(
                                        (cashback) =>
                                          cashback.partnerID === partnerID
                                      )?.encryptedCustomerCashback,
                                  },
                                  plataformName: "Mononoke - OtaMart",
                                  payerID: customer.otakupayID,
                                  payerName: customer.name,
                                  payerProfileImage: customer.profileImage,
                                  receiverID: partner.otakupayID,
                                  receiverName: partner.name,
                                  receiverProfileImage: partner.profileImage,
                                });

                                // Adicionar a Order ao array de ordens
                                orders.push(newOrder);

                                await newTransaction.save();
                              } else {
                                console.error(
                                  `Custo de envio não encontrado para o parceiro ${partnerID}`
                                );
                              }
                            }
                          }

                          // Caso o produto não tenha variações ou nenhuma correspondência tenha sido encontrada
                          if (!productCost) {
                            productCost =
                              productFromDB.promotionalPrice > 0
                                ? productFromDB.promotionalPrice
                                : productFromDB.originalPrice;
                          }

                          // Adicionar o item ao pedido
                          newOrder.itemsList.push({
                            productID: product.productID,
                            productTitle: product.productTitle,
                            productImage: productImage,
                            productPrice: productCost,
                            productVariation:
                              productVariationName || "Sem variação", // Se não houver variação, definir um padrão
                            daysShipping: shippingCostForPartner.daysShipping,
                            productQuantity: product.productQuantity,
                          });
                        }

                        // Título para o Document Transaction
                        const productTitles = newOrder.itemsList.map(
                          (item) => item.productTitle
                        );

                        // Título para o Document Transaction
                        const detailProductServiceTitle =
                          productTitles.length === 1
                            ? productTitles[0]
                            : `${productTitles[0]} + ${
                                productTitles.length - 1
                              } ${
                                productTitles.length - 1 === 1
                                  ? "produto"
                                  : "produtos"
                              }`;

                        // Registrar a transação
                        const newTransaction = new TransactionModel({
                          transactionType: "Pagamento",
                          transactionTitle: "Compra no OtaMart",
                          transactionDescription: `Pedido feito no OtaMart.`,
                          transactionValue: encrypt(
                            customerOrderCostTotal.toString()
                          ),
                          transactionDetails: {
                            detailProductServiceTitle:
                              detailProductServiceTitle,
                            detailCost: encrypt(
                              String(
                                newOrder.itemsList.reduce((acc, item) => {
                                  return (
                                    acc +
                                    item.productPrice * item.productQuantity
                                  );
                                }, 0)
                              )
                            ),
                            detailPaymentMethod: "Pix",
                            detailShippingCost: shippingCostEncrypted,
                            detailSalesFee: encryptedPartnerCommissions.find(
                              (commission) => commission.partnerID === partnerID
                            )?.encryptedCommissionAmount,
                            detailCashback: encryptedCustomerCashbacks.find(
                              (cashback) => cashback.partnerID === partnerID
                            )?.encryptedCustomerCashback,
                          },
                          plataformName: "Mononoke - OtaMart",
                          payerID: customer.otakupayID,
                          payerName: customer.name,
                          payerProfileImage: customer.profileImage,
                          receiverID: partner.otakupayID,
                          receiverName: partner.name,
                          receiverProfileImage: partner.profileImage,
                        });

                        // Adicionar a Order ao array de ordens
                        orders.push(newOrder);
                        await newTransaction.save();
                      } else {
                        console.error(
                          `Custo de envio não encontrado para o parceiro ${partnerID}`
                        );
                      }
                    }
                  }

                  // ************************* ATUALIZAÇÕES EM BANCO DE DADOS ********************************************//

                  // Criar um novo pedido se tudo der certo
                  const savedOrders = await OrderModel.insertMany(orders);

                  // // Reduzir uma unidade do estoque do Produto
                  for (const product of products) {
                    try {
                      // Encontrar o produto no banco pelo ID
                      const dbProduct = await ProductModel.findById(
                        product.productID
                      );

                      if (!dbProduct) {
                        console.error(
                          `Produto não encontrado: ID ${product.productID}`
                        );
                        continue; // Pular para o próximo produto
                      }

                      // Verificar se o produto tem variações
                      if (
                        dbProduct.productVariations &&
                        dbProduct.productVariations.length > 0
                      ) {
                        // O produto tem variações, entra no loop de variações
                        for (const variation of product.productVariations) {
                          // Encontrar a variação no banco
                          const dbVariation = dbProduct.productVariations.find(
                            (v) =>
                              String(v._id) === String(variation.variationID)
                          );

                          if (!dbVariation) {
                            console.error(
                              `Variação não encontrada: ID ${variation.variationID}`
                            );
                            continue; // Pular para a próxima variação
                          }

                          // Encontrar a opção dentro da variação
                          const dbOption = dbVariation.options.find(
                            (o) => String(o._id) === String(variation.optionID)
                          );

                          if (!dbOption) {
                            console.error(
                              `Opção não encontrada: ID ${variation.optionID}`
                            );
                            continue; // Pular para a próxima opção
                          }

                          // Reduzir o estoque da opção
                          dbOption.stock -= product.productQuantity;

                          if (dbOption.stock < 0) {
                            console.error(
                              `Estoque insuficiente para a opção: ${dbOption.name}`
                            );
                            dbOption.stock = 0; // Prevenir valores negativos
                          }

                          console.log(
                            `Estoque atualizado para a opção "${dbOption.name}" da variação "${dbVariation.title}". Novo estoque: ${dbOption.stock}`
                          );
                        }
                      } else {
                        // Produto sem variação, reduzir o estoque diretamente
                        if (
                          product.productQuantity &&
                          product.productQuantity > 0
                        ) {
                          dbProduct.stock -= product.productQuantity;

                          if (dbProduct.stock < 0) {
                            console.error(
                              `Estoque insuficiente para o produto: ${dbProduct.productTitle}`
                            );
                            dbProduct.stock = 0; // Prevenir valores negativos
                          }

                          console.log(
                            `Estoque atualizado para o produto "${dbProduct.productTitle}". Novo estoque: ${dbProduct.stock}`
                          );
                        } else {
                          console.error(
                            `Quantidade inválida do produto sem variação: ${dbProduct.productTitle}`
                          );
                        }
                      }

                      // Salvar o produto com as alterações
                      await dbProduct.save();
                    } catch (error) {
                      console.error(
                        `Erro ao atualizar o estoque do produto ID ${product.productID}:`,
                        error
                      );
                    }
                  }

                  // Atualizar Customer (Balance Available e Otaku Points Pending)
                  await customerOtakupay.save();

                  // Iterar sobre cada par de ID de parceiro e balancePending criptografado
                  for (const {
                    partnerID,
                    balancePending,
                  } of newEncryptedBalances) {
                    try {
                      // Encontrar o parceiro pelo ID
                      const partner = await PartnerModel.findById(partnerID);

                      if (!partner) {
                        console.error(
                          `Parceiro não encontrado para o ID ${partnerID}`
                        );
                        continue; // Pular para o próximo parceiro
                      }

                      // Acessar o Otakupay do parceiro usando o otakupayID
                      const partnerOtakupay = await OtakupayModel.findOne({
                        _id: partner.otakupayID,
                      });

                      if (!partnerOtakupay) {
                        console.error(
                          `Otakupay não encontrado para o parceiro ${partnerID}`
                        );
                        continue; // Pular para o próximo parceiro
                      }

                      // Atualizar o balancePending do Otakupay do parceiro com o novo valor criptografado
                      partnerOtakupay.balancePending = balancePending;

                      // Salvar as alterações no Otakupay do parceiro
                      await partnerOtakupay.save();

                      console.log(
                        `BalancePending do parceiro ${partnerID} atualizado com sucesso.`
                      );
                    } catch (error) {
                      console.error(
                        `Erro ao atualizar o balancePending do parceiro ${partnerID}:`,
                        error
                      );
                    }
                  }

                  res.status(200).json({
                    message: "Pagamento processado com sucesso!",
                    savedOrders,
                  });
                } catch (error) {
                  console.log(error);
                }

                // // Atualizar o status da transação PIX com o valor do callback
                // PaymentPixOtakuPayTransaction.status = status;
                // await PaymentPixOtakuPayTransaction.save();
              } else {
                console.error("Transação PIX não encontrada com o txid:", txid);
              }
            } catch (error) {
              console.error("Erro ao processar transação PIX:", error);
              res.status(500).json({
                error: "Erro ao processar transação PIX",
              });
            }
          } else {
            console.log("Transação ATIVA");
            res.status(422).json({
              error: "Transação ATIVA!",
            });
          }
        } catch (err) {
          console.log(err);
        }
      } else {
        console.log("ERRO AO REALIZAR REQUISIÇÃO: txid não está presente");
      }
    } catch (error) {
      console.error("Erro ao processar o callback:", error);
      res.status(500).json({ error: "Erro ao processar o callback" });
    }
  }

  static async pixOtamart(req: Request, res: Response) {
    console.log("PAGAMENTO PIX REALIZADO COM SUCESSO!");
  }

  static async sendingMoney(req: Request, res: Response) {
    const { destinyEmail, amoutSent } = req.body;

    if (!destinyEmail) {
      res.status(422).json({
        message: "O email de destino é obrigatório!",
      });
      return;
    }

    if (!amoutSent) {
      res.status(422).json({
        message: "O valor a ser enviado é obrigatório!",
      });
      return;
    }

    // Pegar o Customer logado que irá realizar o pagamento
    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!(customer instanceof CustomerModel)) {
      res.status(422).json({
        message: "Usuário não encontrado ou não é um cliente válido!",
      });
      return;
    }

    if (customer.accountType !== "customer") {
      res.status(422).json({
        message: "Usuário sem permissão para realizar este tipo de transação!",
      });
      return;
    }

    try {
      const customerOtakupay: any = await OtakupayModel.findOne({
        _id: customer.otakupayID,
      });

      // Verifica se o Balance Available do Customer existe
      if (!customerOtakupay || !customerOtakupay.balanceAvailable) {
        res.status(422).json({
          message: "Customer Balance Available não encontrado!",
        });
        return;
      }

      // Pegar o Customer Balance Available no OtakuPay
      const encryptedCustomerBalanceAvalable =
        customerOtakupay.balanceAvailable;

      const decryptedCustomerBalanceAvailable = decrypt(
        encryptedCustomerBalanceAvalable
      );

      if (decryptedCustomerBalanceAvailable === null) {
        res.status(500).json({
          message:
            "Erro ao descriptografar os Customer OtakuPay Balance Avalable!",
        });
        return;
      }

      if (decryptedCustomerBalanceAvailable < amoutSent) {
        res.status(401).json({
          message: "O Saldo do Customer é insuficiente!",
        });
        return;
      }

      // Convertendo para números
      const amountSentNumber = parseFloat(amoutSent);
      const currentCustomerBalanceAvailable = decryptedCustomerBalanceAvailable;

      if (
        isNaN(amountSentNumber) ||
        isNaN(Number(currentCustomerBalanceAvailable))
      ) {
        res.status(422).json({
          message: "Valores inválidos!",
        });
        return;
      }

      // Realizando a operação de subtração e convertendo de volta para string com duas casas decimais
      const newCustomerBalanceAvailable = (
        Number(currentCustomerBalanceAvailable) - amountSentNumber
      ).toFixed(2);

      // Criptografar o novo Customer Balance Available para armazenar no Otakupay
      const newCustomerEncryptedBalanceAvalable = encrypt(
        newCustomerBalanceAvailable.toString()
      );

      customerOtakupay.balanceAvailable =
        newCustomerEncryptedBalanceAvalable.toString();

      //********************************************************************************************************//

      const partnerOtakupay = await OtakupayModel.findOne({
        email: destinyEmail,
      });

      if (!partnerOtakupay) {
        res.status(401).json({
          message: "Distinatário inexistente!",
        });
        return;
      }

      // Pegar o Partner Balance Available criptografado em OtakuPay
      const encryptedPartnerBalanceAvalable = partnerOtakupay.balanceAvailable;

      const decryptedPartnerBalanceAvailable = decrypt(
        encryptedPartnerBalanceAvalable
      );

      if (decryptedPartnerBalanceAvailable === null) {
        res.status(500).json({
          message:
            "Erro ao descriptografar os Partner OtakuPay Balance Avalable!",
        });
        return;
      }

      const currentPartnerBalanceAvailable = decryptedPartnerBalanceAvailable;

      if (
        isNaN(amountSentNumber) ||
        isNaN(Number(currentPartnerBalanceAvailable))
      ) {
        res.status(422).json({
          message: "Valores inválidos!",
        });
        return;
      }

      // Realizando a operação de adição e convertendo de volta para string com duas casas decimais
      const newPartnerBalanceAvailable = (
        Number(currentPartnerBalanceAvailable) + amountSentNumber
      ).toFixed(2);

      // Criptografar o novo Customer Balance Available para armazenar no Otakupay
      const newPartnerEncryptedBalanceAvalable = encrypt(
        newPartnerBalanceAvailable.toString()
      );

      partnerOtakupay.balanceAvailable =
        newPartnerEncryptedBalanceAvalable.toString();

      //********************************************************************************************************//

      // Atualizar Partner Balance Available
      await partnerOtakupay.save();

      // Atualizar Customer Balance Available
      await customerOtakupay.save();

      res.status(200).json({ message: "Valor enviado com sucesso!" });
    } catch (err) {
      console.log(err);
    }
  }

  static async getUserOtakupay(req: Request, res: Response) {
    const token: any = getToken(req);
    const user = await getUserByToken(token);

    if (!user) {
      res.status(422).json({ message: "Customer inválido!" });
      return;
    }

    try {
      const userOtakupay = await OtakupayModel.findOne({
        _id: user.otakupayID,
      }).select("-password");

      if (!userOtakupay) {
        res.status(422).json({
          message: "OtakuPay do customer inexistente!",
        });
      }

      const otakupayNotNull = userOtakupay!;

      const newUserBalanceAvailable =
        otakupayNotNull.balanceAvailable &&
        !isNaN(Number(decrypt(otakupayNotNull.balanceAvailable)))
          ? Number(decrypt(otakupayNotNull.balanceAvailable)).toFixed(2)
          : null;

      const newUserBalancePending =
        otakupayNotNull.balancePending &&
        !isNaN(Number(decrypt(otakupayNotNull.balancePending)))
          ? Number(decrypt(otakupayNotNull.balancePending)).toFixed(2)
          : null;

      const newUserOtakuPointsAvailable =
        otakupayNotNull.otakuPointsAvailable &&
        !isNaN(Number(decrypt(otakupayNotNull.otakuPointsAvailable)))
          ? Number(decrypt(otakupayNotNull.otakuPointsAvailable)).toFixed(2)
          : null;

      const newUserOtakuPointsPending =
        otakupayNotNull.otakuPointsPending &&
        !isNaN(Number(decrypt(otakupayNotNull.otakuPointsPending)))
          ? Number(decrypt(otakupayNotNull.otakuPointsPending)).toFixed(2)
          : null;

      const newUserOtakupay = {
        balanceAvailable: newUserBalanceAvailable,
        balancePending: newUserBalancePending,
        otakuPointsAvailable: newUserOtakuPointsAvailable,
        otakuPointsPending: newUserOtakuPointsPending,
      };

      res.status(200).json(newUserOtakupay);
    } catch (error) {
      res.status(422).json({
        message: "Erro ao retornar dados do OtakuPay do cliente!",
        error,
      });
    }
  }

  static async releaseOfValues(req: Request, res: Response) {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(404).json({ message: "A orderID é obrigatória!" });
      return;
    }

    const order = await OrderModel.findOne({ _id: orderId });

    if (!order) {
      res.status(404).json({ messagem: "Pedido não encontrado!" });
      return;
    }

    try {
      const token: any = getToken(req);
      const customer = await getUserByToken(token);

      if (!customer) {
        res.status(422).json({ message: "Usuário não encontrado!" });
        return;
      }

      if (customer._id.toString() !== order.customerID.toString()) {
        res.status(404).json({ message: "Requisição negada!" });
        return;
      }

      const customerOtakupay = await OtakupayModel.findById({
        _id: customer?.otakupayID,
      }).select("-password");

      const customerOtakuPointsPendingEncrypted =
        customerOtakupay?.otakuPointsPending;

      if (
        !customerOtakuPointsPendingEncrypted ||
        customerOtakuPointsPendingEncrypted === null
      ) {
        res.status(404).json({
          message: "Otaku Points Pendente não localizado!",
        });
        return;
      }

      const customerOtakuPointsPendingDecrypted = decrypt(
        customerOtakuPointsPendingEncrypted
      );

      if (
        !customerOtakuPointsPendingDecrypted ||
        customerOtakuPointsPendingDecrypted === null
      ) {
        res.status(404).json({
          message: "Otaku Points Pendente não localizado!",
        });
        return;
      }

      const customerOtakuPointsEarnedEncrypted =
        order.customerOtakuPointsEarned;

      if (
        !customerOtakuPointsEarnedEncrypted ||
        customerOtakuPointsEarnedEncrypted === null
      ) {
        res.status(404).json({
          message: "Pontos Ganho pelo Cliente não localizado!",
        });
        return;
      }

      const customerOtakuPointsEarnedDecrypted = decrypt(
        customerOtakuPointsEarnedEncrypted
      );

      if (
        !customerOtakuPointsEarnedDecrypted ||
        customerOtakuPointsEarnedDecrypted === null
      ) {
        res.status(404).json({
          message: "Pontos Ganho pelo Cliente não localizado!",
        });
        return;
      }

      const newCustomerOtakuPointsPendingDecrypted = (
        Number(customerOtakuPointsPendingDecrypted) -
        Number(customerOtakuPointsEarnedDecrypted)
      ).toFixed(2);

      // Novo Valor do Otaku Points Pending criptografado a ser Armazenado no Banco de dados
      const newCustomerOtakuPointsPendingEncrypted = encrypt(
        newCustomerOtakuPointsPendingDecrypted.toString()
      );

      const customerOtakuPointsAvailableEncrypted =
        customerOtakupay.otakuPointsAvailable;

      if (
        !customerOtakuPointsAvailableEncrypted ||
        customerOtakuPointsAvailableEncrypted === null
      ) {
        res.status(404).json({
          message: "Otaku Points Available do Cliente não encontrado!",
        });
        return;
      }

      const customerOtakuPointAvailableDecrypted = decrypt(
        customerOtakuPointsAvailableEncrypted
      );

      if (customerOtakuPointAvailableDecrypted === null) {
        res.status(404).json({
          message: "Otaku Points Available do Cliente não encontrado!",
        });
        return;
      }

      const newCustomerOtakuPointsAvailableDecrypted = (
        Number(customerOtakuPointAvailableDecrypted) +
        Number(customerOtakuPointsEarnedDecrypted)
      ).toFixed(2);

      const newCustomerOtakuPointsAvailableEncrypted = encrypt(
        newCustomerOtakuPointsAvailableDecrypted.toString()
      );

      //////////////////////////// Partner //////////////////////////////////////////
      const partnerID = order.partnerID;

      const partner = await PartnerModel.findById({
        _id: partnerID,
      }).select("-password");

      const partnerOtakupay = await OtakupayModel.findById({
        _id: partner?.otakupayID,
      }).select("-password");

      const partnerBalancePendingEncrypted = partnerOtakupay?.balancePending;

      if (
        !partnerBalancePendingEncrypted ||
        partnerBalancePendingEncrypted === null
      ) {
        res.status(404).json({
          message: "Balance Pending do Parceiro não encontrado!",
        });
        return;
      }

      console.log(
        "Saldo Pendente do Parceiro criptografado",
        partnerBalancePendingEncrypted
      );

      const partnerBalancePendingDecrypted = decrypt(
        partnerBalancePendingEncrypted
      );

      if (
        !partnerBalancePendingDecrypted ||
        partnerBalancePendingDecrypted === null
      ) {
        res.status(404).json({
          message: "Balance Pending do Parceiro não encontrado!",
        });
        return;
      }

      console.log(
        "Saldo Pendente do Parceiro descriptografado",
        partnerBalancePendingDecrypted
      );

      const partnerBalanceAvailableEncrypted =
        partnerOtakupay?.balanceAvailable;

      if (
        !partnerBalanceAvailableEncrypted ||
        partnerBalanceAvailableEncrypted === null
      ) {
        res.status(404).json({
          message: "Balance Available do Parceiro não encontrado!",
        });
        return;
      }

      const partnerBalanceAvailableDecrypted = decrypt(
        partnerBalanceAvailableEncrypted
      );

      if (partnerBalanceAvailableDecrypted === null) {
        // Apenas null ou undefined
        res.status(404).json({
          message: "Balance Available do Parceiro não encontrado!",
        });
        return;
      }

      console.log(
        "Saldo Disponível do Parceiro Descriptografado",
        partnerBalanceAvailableDecrypted
      );

      console.log(
        "Saldo Disponível do Parceiro descriptografado",
        partnerBalanceAvailableDecrypted
      );

      const orderCostTotalEncrypted = order.customerOrderCostTotal;

      if (!orderCostTotalEncrypted || orderCostTotalEncrypted === null) {
        res.status(404).json({
          messsage: "Valor total do Pedido não encontrado!",
        });
        return;
      }

      console.log(
        "Valor total do Pedido criptografado",
        orderCostTotalEncrypted
      );

      const orderCostTotalDecrypted = decrypt(orderCostTotalEncrypted);

      if (!orderCostTotalDecrypted || orderCostTotalDecrypted === null) {
        res.status(404).json({
          messsage: "Valor total do Pedido não encontrado!",
        });
        return;
      }

      console.log(
        "Valor total do Pedido Descriptografado",
        orderCostTotalDecrypted
      );

      const shippingCostTotalEncrypted = order.shippingCostTotal;

      if (!shippingCostTotalEncrypted || shippingCostTotalEncrypted === null) {
        res.status(404).json({
          messsage: "Valor total do Frete não encontrado!",
        });
        return;
      }

      console.log(
        "Valor total do Frete criptografado",
        shippingCostTotalEncrypted
      );

      const shippingCostTotalDecrypted = decrypt(shippingCostTotalEncrypted);

      if (!shippingCostTotalDecrypted || shippingCostTotalDecrypted === null) {
        res.status(404).json({
          messsage: "Valor total do Frete não encontrado!",
        });
        return;
      }

      console.log(
        "Valor total do Frete Descriptografado",
        shippingCostTotalDecrypted
      );

      const orderCostSubtotal =
        Number(orderCostTotalDecrypted) - Number(shippingCostTotalDecrypted);

      console.log(
        "Valor total do pedido sem o Frete Descriptografado",
        orderCostSubtotal
      );

      const partnerCommissionOtamartEncrypted = order.partnerCommissionOtamart;

      if (
        partnerCommissionOtamartEncrypted === null ||
        partnerCommissionOtamartEncrypted === undefined
      ) {
        res.status(404).json({
          message: "Valor da Comissão a ser Paga pelo Parceiro não encontrado!",
        });
        return;
      }

      console.log(
        "Valor da Comissão a ser Paga pelo Parceiro criptografada",
        partnerCommissionOtamartEncrypted
      );

      const partnerCommissionOtamartDecrypted = decrypt(
        partnerCommissionOtamartEncrypted.toString()
      );

      if (
        partnerCommissionOtamartDecrypted === null ||
        partnerCommissionOtamartDecrypted === undefined
      ) {
        res.status(404).json({
          message: "Valor da Comissão a ser Paga pelo Parceiro não encontrado!",
        });
        return;
      }

      const orderCostTotalWithoutCommission =
        orderCostSubtotal - Number(partnerCommissionOtamartDecrypted);

      const newOrderCostTotalWithShippingCostTotal = (
        orderCostTotalWithoutCommission + Number(shippingCostTotalDecrypted)
      ).toFixed(2);

      const newPartnerBalancePendindDecrypted = (
        Number(partnerBalancePendingDecrypted) - Number(orderCostTotalDecrypted)
      ).toFixed(2);

      const newPartnerBalancePendindEncrypted = encrypt(
        newPartnerBalancePendindDecrypted.toString()
      );

      const newPartnerBalanceAvailableDecrypted = (
        Number(partnerBalanceAvailableDecrypted) +
        Number(newOrderCostTotalWithShippingCostTotal)
      ).toFixed(2);

      const newPartnerBalanceAvailableEncrypted = encrypt(
        newPartnerBalanceAvailableDecrypted
      );

      // Salvamentos Após dar tudo certo
      customerOtakupay.otakuPointsPending =
        newCustomerOtakuPointsPendingEncrypted;
      customerOtakupay.otakuPointsAvailable =
        newCustomerOtakuPointsAvailableEncrypted;

      partnerOtakupay.balancePending = newPartnerBalancePendindEncrypted;
      partnerOtakupay.balanceAvailable = newPartnerBalanceAvailableEncrypted;

      order.statusOrder = "Completed";

      await customerOtakupay.save();
      await partnerOtakupay.save();

      // Adicione uma resposta ao cliente
      res.status(200).json({ message: "Valores liberados com sucesso!" });
    } catch (error) {
      console.log("Erro ao tentar liberar os valores do pedido!", error);
    }
  }

  static async webhookAWSLambdaReleaseValuesOtamart(
    req: Request,
    res: Response
  ) {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const ordersToRelease = await OrderModel.find({
        statusOrder: "Delivered",
        statusShipping: "Delivered",
        markedDeliveredBy: "partner",
        markedDeliveredAt: { $lte: sevenDaysAgo },
      });

      console.log(`Total de pedidos a liberar: ${ordersToRelease.length}`);

      for (const order of ordersToRelease) {
        // OtakuPay do Customer
        const customer = await CustomerModel.findById(order.customerID);

        if (!customer || customer === null) {
          res.status(404).json({
            message: "Cliente não encontrado!",
          });
          return;
        }

        const customerOtakupay = await OtakupayModel.findById(
          customer.otakupayID
        );

        if (!customerOtakupay || customerOtakupay === null) {
          res.status(404).json({
            message: "OtakuPay do cliente não encontrado!",
          });
          return;
        }

        const otakuPointsPendingDecrypted = decrypt(
          customerOtakupay.otakuPointsPending
        );

        if (
          !otakuPointsPendingDecrypted ||
          otakuPointsPendingDecrypted === null
        ) {
          res.status(404).json({
            message: "Otaku Points Pendentes não encontrado!",
          });
          return;
        }

        const otakuPointsAvailableDecrypted = decrypt(
          customerOtakupay.otakuPointsAvailable
        );

        if (
          !otakuPointsAvailableDecrypted ||
          otakuPointsAvailableDecrypted === null
        ) {
          res.status(404).json({
            message: "Otaku Points Disponíveis não encontrado!",
          });
          return;
        }

        const otakuPointsEarnedDecrypted = decrypt(
          order.customerOtakuPointsEarned
        );

        if (
          !otakuPointsEarnedDecrypted ||
          otakuPointsEarnedDecrypted === null
        ) {
          res.status(404).json({
            message: "Pontos Ganho pelo Cliente não encontrado!",
          });
          return;
        }

        const newPending = (
          Number(otakuPointsPendingDecrypted) -
          Number(otakuPointsEarnedDecrypted)
        ).toFixed(2);

        const newAvailable = (
          Number(otakuPointsAvailableDecrypted) +
          Number(otakuPointsEarnedDecrypted)
        ).toFixed(2);

        customerOtakupay.otakuPointsPending = encrypt(newPending);
        customerOtakupay.otakuPointsAvailable = encrypt(newAvailable);

        // OtakuPay do Parceiro
        const partner = await PartnerModel.findById(order.partnerID);

        if (!partner || partner === null) {
          res.status(404).json({
            message: "Parceiro não encontrado!",
          });
          return;
        }

        const partnerOtakupay = await OtakupayModel.findById(
          partner.otakupayID
        );

        if (!partnerOtakupay || partnerOtakupay === null) {
          res.status(404).json({
            message: "OtakuPay do parceiro não encontrado!",
          });
          return;
        }

        const balancePendingDecrypted = decrypt(partnerOtakupay.balancePending);

        if (!balancePendingDecrypted || balancePendingDecrypted === null) {
          res.status(404).json({
            message: "Balance Pending do Parceiro não encontrado!",
          });
          return;
        }

        const balanceAvailableDecrypted = decrypt(
          partnerOtakupay.balanceAvailable
        );

        const orderCostDecrypted = decrypt(order.customerOrderCostTotal);

        if (!orderCostDecrypted || orderCostDecrypted === null) {
          res.status(404).json({
            message: "Valor total do Pedido não encontrado!",
          });
          return;
        }

        const shippingCostDecrypted = decrypt(order.shippingCostTotal);

        if (!shippingCostDecrypted || shippingCostDecrypted === null) {
          res.status(404).json({
            message: "Valor total do Frete não encontrado!",
          });
          return;
        }

        const commissionDecrypted = decrypt(
          order.partnerCommissionOtamart.toString()
        );

        if (!commissionDecrypted || commissionDecrypted === null) {
          res.status(404).json({
            message: "Comissão do Parceiro não encontrada!",
          });
          return;
        }

        const subtotal =
          Number(orderCostDecrypted) - Number(shippingCostDecrypted);

        const netAmount = subtotal - Number(commissionDecrypted);

        const finalAmount = (netAmount + Number(shippingCostDecrypted)).toFixed(
          2
        );

        const newBalancePending = (
          Number(balancePendingDecrypted) - Number(orderCostDecrypted)
        ).toFixed(2);
        const newBalanceAvailable = (
          Number(balanceAvailableDecrypted) + Number(finalAmount)
        ).toFixed(2);

        partnerOtakupay.balancePending = encrypt(newBalancePending);
        partnerOtakupay.balanceAvailable = encrypt(newBalanceAvailable);
        order.statusOrder = "Completed";

        await customerOtakupay.save();
        await partnerOtakupay.save();
      } // <-- Add this closing brace to end the for loop

      res.status(200).json({
        message: "Processo de liberação concluído com sucesso.",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Erro interno ao processar os pedidos.",
      });
    }
  }

  static async releaseOfValuesOtaclub(req: Request, res: Response) {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(404).json({ message: "A orderID é obrigatória!" });
      return;
    }

    const order = await OrderOtaclubModel.findOne({ _id: orderId });

    if (!order) {
      res.status(404).json({ messagem: "Pedido não encontrado!" });
      return;
    }

    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!customer) {
      res.status(422).json({ message: "Usuário não encontrado!" });
      return;
    }

    if (customer._id.toString() !== order.customerID.toString()) {
      res.status(404).json({ message: "Requisição negada!" });
      return;
    }

    try {
      const customerOtakupay = await OtakupayModel.findById({
        _id: customer?.otakupayID,
      }).select("-password");

      //////////////////////////// Partner //////////////////////////////////////////
      const partnerID = order.partnerID;

      // Correto: findById espera apenas o ID
      const partner = await PartnerModel.findById(partnerID).select(
        "-password"
      );

      if (!partner) {
        res.status(404).json({
          message: `Parceiro não encontrado com ID: ${partnerID}`,
        });
        return;
      }

      // Correto: findById com ID direto
      const partnerOtakupay = await OtakupayModel.findById(
        partner.otakupayID
      ).select("-password");

      if (!partnerOtakupay) {
        res.status(404).json({
          message: `OtakuPay do parceiro não encontrado com ID: ${partner.otakupayID}`,
        });
        return;
      }

      const partnerOtakuPointsPendingEncrypted =
        partnerOtakupay?.otakuPointsPending;

      if (!partnerOtakuPointsPendingEncrypted) {
        res.status(404).json({
          message:
            "Otaku Points Pendentes Criptografado do Parceiro não encontrado!",
        });
        return;
      }

      const partnerOtakuPointsPendingDencrypted = decrypt(
        partnerOtakuPointsPendingEncrypted
      );

      if (!partnerOtakuPointsPendingDencrypted) {
        res.status(404).json({
          message:
            "Otaku Points Pendentes Descriptografado do Parceiro não encontrado!",
        });
        return;
      }

      const orderCostTotalEncrypted = order.customerOrderCostTotal.toString();

      if (!orderCostTotalEncrypted) {
        res.status(404).json({
          messsage: "Valor total do Pedido não encontrado!",
        });
        return;
      }

      const orderCostTotalDecrypted = decrypt(orderCostTotalEncrypted);

      if (!orderCostTotalDecrypted) {
        res.status(404).json({
          messsage: "Valor total do Pedido não encontrado!",
        });
        return;
      }

      const partnerCommissionOtaclubEncrypted = order.partnerCommissionOtaclub;

      console.log(
        "COMMISSÃO DO PARCEIRO OTACLUB CRIPTOGRAFADA",
        partnerCommissionOtaclubEncrypted
      );

      // Valida explicitamente se o valor é nulo ou indefinido (não apenas falsy)
      if (
        partnerCommissionOtaclubEncrypted === null ||
        partnerCommissionOtaclubEncrypted === undefined
      ) {
        res.status(404).json({
          message: "Comissão do Parceiro não encontrada!",
        });
        return;
      }

      const partnerCommissionOtaclubDecrypted = decrypt(
        partnerCommissionOtaclubEncrypted.toString()
      );

      console.log(
        "COMMISSÃO DO PARCEIRO OTACLUB DESCRIPTOGRAFADA",
        partnerCommissionOtaclubDecrypted
      );

      // Mesmo princípio: valida apenas null ou undefined
      if (
        partnerCommissionOtaclubDecrypted === null ||
        partnerCommissionOtaclubDecrypted === undefined
      ) {
        res.status(404).json({
          message: "Comissão do Parceiro não encontrada!",
        });
        return;
      }

      const OtaclubProfitFromSaleDecrypted =
        Number(orderCostTotalDecrypted) -
        Number(partnerCommissionOtaclubDecrypted);

      const newPartnerOtakuPointsPendingDecrypted =
        Number(partnerOtakuPointsPendingDencrypted) -
        Number(orderCostTotalDecrypted);

      const newPartnerOtakuPointsPendingEncrypted = encrypt(
        newPartnerOtakuPointsPendingDecrypted.toString()
      );

      const parterOtakuPointsAvailableEncrypted =
        partnerOtakupay?.otakuPointsAvailable;

      if (
        parterOtakuPointsAvailableEncrypted === null ||
        parterOtakuPointsAvailableEncrypted === undefined
      ) {
        res.status(404).json({
          message:
            "Otaku Points Disponíveis Criptografado do Parceiro não encontrado!",
        });
        return;
      }

      const parterOtakuPointsAvailableDencrypted = decrypt(
        parterOtakuPointsAvailableEncrypted.toString()
      );

      // Aqui verifica se o resultado é null ou undefined, não zero
      if (
        parterOtakuPointsAvailableDencrypted === null ||
        parterOtakuPointsAvailableDencrypted === undefined
      ) {
        res.status(404).json({
          message:
            "Otaku Points Disponíveis Descriptografado do Parceiro não encontrado!",
        });
        return;
      }

      const newParterOtakuPointsAvailableDecrypted =
        parterOtakuPointsAvailableDencrypted + OtaclubProfitFromSaleDecrypted;

      const newParterOtakuPointsAvailableEncrypted = encrypt(
        newParterOtakuPointsAvailableDecrypted.toString()
      );

      partnerOtakupay.otakuPointsPending =
        newPartnerOtakuPointsPendingEncrypted;
      partnerOtakupay.otakuPointsAvailable =
        newParterOtakuPointsAvailableEncrypted;

      order.statusOrder = "Completed";

      // Salvamentos Após dar tudo certo
      await partnerOtakupay.save();

      // Adicione uma resposta ao cliente
      res.status(200).json({ message: "Valores liberados com sucesso!" });
    } catch (error) {
      console.log("Erro ao tentar liberar os valores do pedido!", error);
      res.status(500).json({
        message: "Erro interno ao tentar liberar os valores do pedido!",
        error: error instanceof Error ? error.message : error,
      });
      return;
    }
  }

  static async webhookAWSLambdaReleaseValuesOtaclub(
    req: Request,
    res: Response
  ) {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const ordersToRelease = await OrderOtaclubModel.find({
        statusOrder: "Delivered",
        markedDeliveredBy: "partner",
        markedDeliveredAt: { $lte: sevenDaysAgo },
      });

      console.log(
        `Total de pedidos Otaclub a liberar: ${ordersToRelease.length}`
      );

      for (const order of ordersToRelease) {
        const partner = await PartnerModel.findById(order.partnerID).select(
          "-password"
        );

        if (!partner) {
          console.warn(`Parceiro não encontrado para o pedido ${order._id}`);
          continue;
        }

        const partnerOtakupay = await OtakupayModel.findById(
          partner.otakupayID
        ).select("-password");

        if (!partnerOtakupay) {
          console.warn(
            `OtakuPay do parceiro não encontrado para o pedido ${order._id}`
          );
          continue;
        }

        const otakuPointsPending = decrypt(partnerOtakupay.otakuPointsPending);

        if (otakuPointsPending === null) {
          console.warn(
            `Otaku Points Pendentes inválidos para o pedido ${order._id}`
          );
          continue;
        }

        const otakuPointsAvailable = decrypt(
          partnerOtakupay.otakuPointsAvailable
        );

        if (otakuPointsAvailable === null) {
          console.warn(
            `Otaku Points Disponíveis inválidos para o pedido ${order._id}`
          );
          continue;
        }

        const orderCostTotal = decrypt(order.customerOrderCostTotal.toString());

        if (orderCostTotal === null) {
          console.warn(
            `Valor total do pedido não encontrado para ${order._id}`
          );
          continue;
        }

        const partnerCommission = decrypt(
          order.partnerCommissionOtaclub?.toString()
        );

        if (partnerCommission === null) {
          console.warn(`Comissão do parceiro não encontrada para ${order._id}`);
          continue;
        }

        const netProfit = Number(orderCostTotal) - Number(partnerCommission);

        const newPending = (
          Number(otakuPointsPending) - Number(orderCostTotal)
        ).toFixed(2);

        const newAvailable = (Number(otakuPointsAvailable) + netProfit).toFixed(
          2
        );

        partnerOtakupay.otakuPointsPending = encrypt(newPending);
        partnerOtakupay.otakuPointsAvailable = encrypt(newAvailable);

        order.statusOrder = "Completed";

        await partnerOtakupay.save();
        await order.save();
      }

      res.status(200).json({
        message:
          "Processo de liberação de pedidos Otaclub concluído com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao liberar valores Otaclub:", error);
      res.status(500).json({
        message: "Erro interno ao processar os pedidos Otaclub!",
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  static async releaseOfValuesRaffle(req: Request, res: Response) {
    const { raffleID } = req.body;

    if (!raffleID) {
      res.status(404).json({ message: "A raffleID é obrigatório!" });
      return;
    }

    const raffle = await RaffleModel.findOne({ _id: raffleID });

    if (!raffle) {
      res.status(404).json({ messagem: "Sorteio não encontrado!" });
      return;
    }

    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!customer) {
      res.status(422).json({ message: "Usuário não encontrado!" });
      return;
    }

    // if (customer._id.toString() !== raffle.customerID.toString()) {
    // 	res.status(404).json({ message: "Requisição negada!" });
    // 	return;
    // }

    try {
      const customerOtakupay = await OtakupayModel.findById({
        _id: customer?.otakupayID,
      }).select("-password");

      //////////////////////////// Partner //////////////////////////////////////////
      const partnerID = raffle.partnerID;

      // Correto: findById espera apenas o ID
      const partner = await PartnerModel.findById(partnerID).select(
        "-password"
      );

      if (!partner) {
        res.status(404).json({
          message: `Parceiro não encontrado com ID: ${partnerID}`,
        });
        return;
      }

      // Correto: findById com ID direto
      const partnerOtakupay = await OtakupayModel.findById(
        partner.otakupayID
      ).select("-password");

      if (!partnerOtakupay) {
        res.status(404).json({
          message: `OtakuPay do parceiro não encontrado com ID: ${partner.otakupayID}`,
        });
        return;
      }

      const partnerOtakuPointsPendingEncrypted =
        partnerOtakupay?.otakuPointsPending;

      if (
        partnerOtakuPointsPendingEncrypted === null ||
        partnerOtakuPointsPendingEncrypted === undefined
      ) {
        res.status(404).json({
          message:
            "Otaku Points Pendentes Criptografado do Parceiro não encontrado!",
        });
        return;
      }

      const partnerOtakuPointsPendingDencrypted = decrypt(
        partnerOtakuPointsPendingEncrypted.toString()
      );

      if (
        partnerOtakuPointsPendingDencrypted === null ||
        partnerOtakuPointsPendingDencrypted === undefined
      ) {
        res.status(404).json({
          message:
            "Otaku Points Pendentes Descriptografado do Parceiro não encontrado!",
        });
        return;
      }

      const raffleAccumulatedValueEncrypted =
        raffle.raffleAccumulatedValue?.toString();

      if (
        raffleAccumulatedValueEncrypted === null ||
        raffleAccumulatedValueEncrypted === undefined
      ) {
        res.status(404).json({
          message: "Valor total do Sorteio criptografado não encontrado!",
        });
        return;
      }

      const raffleAccumulatedValueDecrypted = decrypt(
        raffleAccumulatedValueEncrypted
      );

      if (
        raffleAccumulatedValueDecrypted === null ||
        raffleAccumulatedValueDecrypted === undefined
      ) {
        res.status(404).json({
          message: "Valor total do Sorteio descriptografado não encontrado!",
        });
        return;
      }

      const rafflePartnerCommissionEncrypted = raffle.rafflePartnerCommission;

      if (
        rafflePartnerCommissionEncrypted === null ||
        rafflePartnerCommissionEncrypted === undefined
      ) {
        res.status(404).json({
          message: "Comissão do Parceiro não encontrada!",
        });
        return;
      }

      const rafflePartnerCommissionDecrypted = decrypt(
        rafflePartnerCommissionEncrypted.toString()
      );

      if (
        rafflePartnerCommissionDecrypted === null ||
        rafflePartnerCommissionDecrypted === undefined
      ) {
        res.status(404).json({
          message: "Comissão do Parceiro não encontrada!",
        });
        return;
      }

      const raffleProfitFromSaleDecrypted =
        Number(raffleAccumulatedValueDecrypted) -
        Number(rafflePartnerCommissionDecrypted);

      const newPartnerOtakuPointsPendingDecrypted =
        Number(partnerOtakuPointsPendingDencrypted) -
        raffleProfitFromSaleDecrypted;

      const newPartnerOtakuPointsPendingEncrypted = encrypt(
        newPartnerOtakuPointsPendingDecrypted.toString()
      );

      const parterOtakuPointsAvailableEncrypted =
        partnerOtakupay?.otakuPointsAvailable;

      if (
        parterOtakuPointsAvailableEncrypted === null ||
        parterOtakuPointsAvailableEncrypted === undefined
      ) {
        res.status(404).json({
          message:
            "Otaku Points Disponíveis Criptografado do Parceiro não encontrado!",
        });
        return;
      }

      const parterOtakuPointsAvailableDencrypted = decrypt(
        parterOtakuPointsAvailableEncrypted.toString()
      );

      if (
        parterOtakuPointsAvailableDencrypted === null ||
        parterOtakuPointsAvailableDencrypted === undefined
      ) {
        res.status(404).json({
          message:
            "Otaku Points Disponíveis Descriptografado do Parceiro não encontrado!",
        });
        return;
      }

      const newParterOtakuPointsAvailableDecrypted =
        parterOtakuPointsAvailableDencrypted + raffleProfitFromSaleDecrypted;

      const newParterOtakuPointsAvailableEncrypted = encrypt(
        newParterOtakuPointsAvailableDecrypted.toString()
      );

      partnerOtakupay.otakuPointsPending =
        newPartnerOtakuPointsPendingEncrypted;

      partnerOtakupay.otakuPointsAvailable =
        newParterOtakuPointsAvailableEncrypted;

      raffle.raffleStatus = "Completed";

      // Salvamentos Após dar tudo certo
      await partnerOtakupay.save();

      // Adicione uma resposta ao cliente
      res.status(200).json({ message: "Valores liberados com sucesso!" });
    } catch (error) {
      console.log("Erro ao tentar liberar os valores do pedido!", error);
      res.status(500).json({
        message: "Erro interno ao tentar liberar os valores do pedido!",
        error: error instanceof Error ? error.message : error,
      });
      return;
    }
  }

  static async getAllUserTransactions(req: Request, res: Response) {
    // Obtém o token do usuário
    const token: any = getToken(req);

    // Recupera o usuário associado ao token
    const user = await getUserByToken(token);

    // Se o usuário não for encontrado, retorna erro
    if (!user) {
      res.status(422).json({ message: "Usuário não encontrado!" });
      return;
    }

    // Extrai o ID do usuário e converte para string (garante que estamos comparando como string)
    const userID = user.otakupayID.toString(); // Conversão para string (MUDAR PARA user.otakupayID APENAS, SE PARAR DE FUNCIONAR)
    console.log("ID do usuário:", userID); // Log para verificar o ID

    // Verifica se o userID está correto
    if (!userID) {
      res.status(422).json({ message: "ID do usuário não encontrado!" });
      return;
    }

    try {
      // Executa a query para buscar as transações onde o usuário é o remetente ou destinatário
      const transactions = await TransactionModel.find({
        $or: [
          { payerID: userID }, // Comparação direta com a string
          { receiverID: userID }, // Comparação direta com a string
        ],
      }).sort("-createdAt");

      // Verifique se as transações são retornadas corretamente
      if (transactions.length === 0) {
        console.log("Nenhuma transação encontrada para o usuário:", userID);
      }

      // Descriptografa os campos antes de retornar
      const decryptedTransactions = transactions.map((tx) => {
        const txObj = tx.toObject();

        return {
          ...txObj,
          transactionValue: decrypt(txObj.transactionValue),
          transactionDetails: {
            ...txObj.transactionDetails,
            detailCost: decrypt(txObj.transactionDetails.detailCost),
            detailShippingCost: decrypt(
              txObj.transactionDetails.detailShippingCost
            ),
            detailSalesFee: decrypt(txObj.transactionDetails.detailSalesFee),
            detailCashback: decrypt(txObj.transactionDetails.detailCashback),
          },
        };
      });

      res.status(200).json({ transactions: decryptedTransactions });
    } catch (error) {
      // Caso ocorra erro, loga e retorna o erro para o cliente
      console.error("Erro ao buscar transações:", error);
      res.status(500).json({ message: "Erro ao buscar transações." });
    }
  }

  static async withdrawMoney(req: Request, res: Response) {
    res.status(200).json({ message: "Funcionalidade em desenvolvimento!" });
  }

  static async swapOtaclub(req: Request, res: Response) {
    const { product, customerAddress } = req.body;

    console.log(product.partnerID);

    // Verificar se o produto foi enviado para a requisição
    if (!product) {
      res.status(400).json({
        error: "Produto inválido!",
      });
      return;
    }

    console.log("Produto recebido:", product);

    // Verificar se o endereço foi enviado para a requisição
    if (!customerAddress || customerAddress.length === 0) {
      res.status(404).json({
        error: "Nenhum produto encontrado na requisição!",
      });
      return;
    }

    // Pegar o Customer logado que irá realizar o pagamento
    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!(customer instanceof CustomerModel)) {
      res.status(422).json({
        message: "Usuário não encontrado ou não é um cliente válido!",
      });
      return;
    }

    if (customer.accountType !== "customer") {
      res.status(422).json({
        message: "Usuário sem permissão para realizar este tipo de transação!",
      });
      return;
    }

    const customerOtakupay = await OtakupayModel.findById(customer.otakupayID);

    if (!customerOtakupay) {
      res.status(422).json({
        message: "OtakuPay do Customer não localizado!",
      });
      return;
    }

    if (!customer.cpf || customer.cpf == "") {
      res.status(422).json({
        message: "CPF inválido, atualize antes de prosseguir!",
      });
      return;
    }

    console.log("OtakuPay do Cliente", customerOtakupay);

    const partner = await PartnerModel.findOne({
      _id: product.partnerID,
    });

    if (!partner) {
      res.status(422).json({
        message: "Partner não localizado!",
      });
      return;
    }

    console.log("Partner do Parceiro", partner);

    const partnerOtakupay = await OtakupayModel.findById(partner.otakupayID);

    if (!partnerOtakupay) {
      res.status(422).json({
        message: "OtakuPay do Partner não localizado!",
      });
      return;
    }

    console.log("OtakuPay do Parceiro", partnerOtakupay);

    try {
      const customerOtakuPointsAvailableEncrypted =
        customerOtakupay.otakuPointsAvailable;

      const customerOtakuPointAvailableDecrypted = decrypt(
        customerOtakuPointsAvailableEncrypted
      )?.toFixed(2);

      console.log(
        "customerOtakuPointAvailableDecrypted",
        customerOtakuPointAvailableDecrypted
      );

      if (!customerOtakuPointAvailableDecrypted) {
        res.status(422).json({
          message: "Otaku Points Available não encontrado!",
        });
        return;
      }

      console.log("Valor do Produto:", product.productPrice);

      if (Number(customerOtakuPointAvailableDecrypted) < product.productPrice) {
        res.status(422).json({ message: "Otaku Points insuficiente!" });
        return;
      }

      const newCustomerOtakuPointsAvailableDecrypted =
        Number(customerOtakuPointAvailableDecrypted) -
        Number(product.productPrice);

      console.log(
        "newCustomerOtakuPointsAvailableDecrypted",
        newCustomerOtakuPointsAvailableDecrypted.toFixed(2)
      );

      const newCustomerOtakuPointsAvailableEncrypted = encrypt(
        newCustomerOtakuPointsAvailableDecrypted.toString()
      );

      console.log(
        "newCustomerOtakuPointsAvailableEncrypted",
        newCustomerOtakuPointsAvailableEncrypted
      );

      ////////////////////////////// Comissão a ser Paga pelo Parceiro //////////////////////////////////////////
      const partnerComission = product.productPrice * 0.04;

      console.log("partnerComission", partnerComission);

      const partnerComissionEncrypted = encrypt(partnerComission.toString());

      const partnerOtakuPointsPendingEncrypted =
        partnerOtakupay.otakuPointsPending;

      console.log(
        "Otaku Points Pendente do Parceiro",
        partnerOtakuPointsPendingEncrypted
      );

      const partnerOtakuPointsPendingDecrypted = decrypt(
        partnerOtakuPointsPendingEncrypted
      );

      console.log(
        "Otaku Points Pendente do parceiro descriptografado:",
        partnerOtakuPointsPendingDecrypted
      );

      const newPartnerOtakuPointsPendingDecrypted =
        Number(partnerOtakuPointsPendingDecrypted) + product.productPrice;

      console.log(
        "Novo Saldo Pendente do Parceiro Descriptografado",
        newPartnerOtakuPointsPendingDecrypted
      );

      const newPartnerOtakuPointsPendindEncrypted = encrypt(
        newPartnerOtakuPointsPendingDecrypted.toString()
      );

      console.log(
        "Novo Saldo Pendente do Parceiro Criptografado",
        newPartnerOtakuPointsPendindEncrypted
      );

      const customerOrderCostTotalEncrypted = encrypt(
        product.productPrice.toString()
      );

      // Criar uma nova Order otaclub
      const newOrderOtaclub = new OrderOtaclubModel({
        orderOtaclubID: new ObjectId().toHexString().toUpperCase(),
        statusOrder: "Confirmed",
        paymentMethod: "Otaku Point",
        customerOrderCostTotal: customerOrderCostTotalEncrypted,
        partnerCommissionOtaclub: partnerComissionEncrypted,
        itemsList: [],
        partnerID: partner._id.toString(),
        partnerCNPJ: partner.cpfCnpj,
        partnerName: partner.name,
        customerID: customer._id.toString(),
        customerName: customer.name,
        customerCPF: customer.cpf,
        customerAddress: [
          {
            street: customerAddress.street,
            complement: customerAddress.complement,
            neighborhood: customerAddress.neighborhood,
            city: customerAddress.city,
            state: customerAddress.state,
            postalCode: customerAddress.postalCode,
          },
        ],
        statusShipping: "Pending",
        trackingCode: "",
      });

      // Adicionar o item ao pedido
      newOrderOtaclub.itemsList.push({
        productID: product.productID,
        productTitle: product.productTitle,
        productImage: product.productImage,
        productPrice: product.productPrice,
        productQuantity: 1,
        daysShipping: 10,
      });

      // Registrar a transação
      const newTransaction = new TransactionModel({
        transactionType: "Troca",
        transactionTitle: "Troca no Otaclub",
        transactionDescription: `Troca feita no Otaclub.`,
        transactionValue: customerOrderCostTotalEncrypted,
        transactionDetails: {
          detailProductServiceTitle: product.productTitle,
          detailCost: encrypt(
            String(
              newOrderOtaclub.itemsList.reduce((acc, item) => {
                return acc + item.productPrice * item.productQuantity;
              }, 0)
            )
          ),
          detailPaymentMethod: "Otaku Point",
          detailShippingCost: "N/A",
          detailSalesFee: partnerComissionEncrypted,
          detailCashback: "N/A",
        },
        plataformName: "Mononoke - Otaclub",
        payerID: customer.otakupayID,
        payerName: customer.name,
        payerProfileImage: customer.profileImage,
        receiverID: partner.otakupayID,
        receiverName: partner.name,
        receiverProfileImage: partner.profileImage,
      });

      // Salvando o novo Otaku Points Available do Cliente no Banco de Dados
      customerOtakupay.otakuPointsAvailable =
        newCustomerOtakuPointsAvailableEncrypted;

      // Salvando o novo Otaku Points Pending do Parceiro no Banco de Dados
      partnerOtakupay.otakuPointsPending =
        newPartnerOtakuPointsPendindEncrypted;

      await newOrderOtaclub.save();
      await customerOtakupay.save();
      await partnerOtakupay.save();
      await newTransaction.save();

      res.status(200).json({
        message: "Troca processada com sucesso!",
        newOrderOtaclub,
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default OtakupayController;

function validateError(error: any) {
  // Verifique o tipo de erro e retorne uma mensagem apropriada
  if (typeof error === "string") {
    return { errorMessage: error, errorStatus: 500 };
  } else if (error instanceof Error) {
    return { errorMessage: error.message, errorStatus: 500 };
  } else {
    return { errorMessage: "Erro desconhecido", errorStatus: 500 };
  }
}
