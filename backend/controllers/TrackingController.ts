import { Request, Response } from "express";
import { OrderModel } from "../models/OrderModel.js";
import { PartnerModel } from "../models/PartnerModel.js";

import axios from "axios";
import * as cheerio from "cheerio";

// APIs Correios
import { consultarCep } from "correios-brasil";
import { cotracking } from "cotracking"; // Funciona quase perfeitamente

// Middlewares/Helpers
import getToken from "../helpers/get-token.js";
import getUserByToken from "../helpers/get-user-by-token.js";

class TrackingController {
  static async checkAddressByCep(req: Request, res: Response) {
    const cep = "04812010";

    consultarCep(cep)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  static async getTrackingCorreios(req: Request, res: Response) {
    // let codRastreio = ["YD046138969BR", "YD046138955BR"];

    const { id } = req.params;

    const token: any = getToken(req);
    const customer = await getUserByToken(token);

    if (!customer) {
      res.status(422).json({ message: "Usuário não encontrado!" });
      return;
    }

    if (customer.accountType !== "customer") {
      res.status(422).json({
        message: "Você não tem permissão para acessar esta requisição!",
      });
      return;
    }

    const order = await OrderModel.findById(id);

    if (!order) {
      res.status(422).json({
        message: "Pedido não encontrado!",
      });
      return;
    }

    console.log(order);

    try {
      const trackingCode = order.trackingCode;

      const logisticOperator = order.logisticOperator;

      if (logisticOperator !== "Correios") {
        res.status(422).json({
          message: "Operador Logístico inválido!",
        });
        return;
      }

      // Tipamos data como any
      const data: any = await cotracking.track(trackingCode);

      if (!data.tracks) {
        res.status(422).json({
          message: "Informações de rastreamento não encontradas!",
        });
        return;
      }

      // Ordenar os tracks pelo método sort
      data.tracks.sort((a: any, b: any) => {
        const dateA = a.date ? new Date(a.date) : null;
        const dateB = b.date ? new Date(b.date) : null;

        if (dateA && dateB) {
          return dateA.getTime() - dateB.getTime();
        } else if (dateA === null && dateB !== null) {
          return 1;
        } else if (dateA !== null && dateB === null) {
          return -1;
        } else {
          return 0;
        }
      });

      // Inverter a ordem dos tracks
      data.tracks.reverse();

      res.status(200).json(data);
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }

  // static async getTrackingKangu(req: Request, res: Response) {
  // 	const { id } = req.params;

  // 	const token: any = getToken(req);
  // 	const customer = await getUserByToken(token);

  // 	if (!customer) {
  // 		res.status(422).json({ message: "Usuário não encontrado!" });
  // 		return;
  // 	}

  // 	if (customer.accountType !== "customer") {
  // 		res.status(422).json({
  // 			message: "Você não tem permissão para acessar esta requisição!",
  // 		});
  // 		return;
  // 	}

  // 	const order = await OrderModel.findById(id);

  // 	if (!order) {
  // 		res.status(422).json({
  // 			message: "Pedido não encontrado!",
  // 		});
  // 		return;
  // 	}

  // 	try {
  // 		const trackingCode = order.trackingCode;

  // 		const logisticOperator = order.logisticOperator;

  // 		if (logisticOperator !== "Kangu") {
  // 			res.status(422).json({
  // 				message: "Operador Logístico inválido!",
  // 			});
  // 			return;
  // 		}

  // 		const partnerID = order.partnerID;
  // 		const partner = await PartnerModel.findById(partnerID);

  // 		if (!partner) {
  // 			console.log("Parceiro não localizado!");
  // 			res.status(422).json({ message: "Erro ao rastrear o pedido!" });
  // 			return;
  // 		}

  // 		const tokenKangu = partner.shippingConfiguration[0].credential;

  // 		const kanguApiUrl = `https://portal.kangu.com.br/tms/transporte/rastrear/${trackingCode}`;

  // 		const response = await fetch(kanguApiUrl, {
  // 			method: "GET",
  // 			headers: {
  // 				"Content-Type": "application/json",
  // 				token: tokenKangu,
  // 			},
  // 		});

  // 		const data = await response.json();

  // 		console.log(data);

  // 		res.status(200).json(data);
  // 	} catch (error) {
  // 		console.log(error);
  // 		res.status(500).json(error);
  // 	}
  // }

  static async getTrackingDHL(req: Request, res: Response) {
    console.log("Futuro Rastreio DHL");
  }

  static async getTrackingLoggi(req: Request, res: Response) {
    const { code } = req.params;

    try {
      const response = await axios.get(
        `https://api.rastreae.com.br/track/LOGGI/${code}`,
        {
          headers: {
            Authorization: `Bearer SEU_TOKEN_AQUI`,
          },
        }
      );

      const data = response.data;

      const resultado = {
        codigo: code,
        status: data.eventos[0]?.status || "",
        destinatario: data.destinatario?.nome || "",
        remetente: data.remetente?.nome || "",
        previsaoEntrega: data.previsao_entrega || "",
      };

      res.json(resultado);
      return;
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Erro ao rastrear encomenda" });
      return;
    }
  }
}

export default TrackingController;
