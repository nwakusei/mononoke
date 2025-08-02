import mainDB from "../db/mainconn.js";
import mongoose, { Schema, model } from "mongoose";

// Interface tipando os dados que irão no Banco de Dados.
interface IOrderItem {
  productID: mongoose.Schema.Types.ObjectId;
  productTitle: string;
  productImage: string;
  productPrice: number;
  productVariation: string;
  productQuantity: number;
  daysShipping: number;
}

interface ICustomerAddress {
  street?: string; // logradouro
  complement?: string; // complemento
  neighborhood?: string; // bairro
  city?: string; // cidade
  state?: string; // uf
  postalCode?: string; // cep
}

// Interface tipando os dados que irão no Banco de Dados.
interface IOrder {
  orderID: string;
  statusOrder: string;
  paymentMethod: string;
  shippingCostTotal: string;
  customerOrderCostTotal: string;
  partnerCommissionOtamart: String;
  customerOtakuPointsEarned: string;
  partnerOtakuPointsPaid: string;
  itemsList: IOrderItem[];
  productsVariations: object;
  orderNote: string;
  partnerID: object;
  partnerName: string;
  partnerCNPJ: string;
  customerID: object;
  customerName: string;
  customerCPF: string;
  customerAddress: ICustomerAddress[];
  shippingMethod: string;
  statusShipping: string;
  markedDeliveredBy: string;
  markedDeliveredAt: Date;
  dateMarkedPacked: Date;
  trackingCode: string;
  logisticOperator: string;
  discountsApplied: number;
}

// Schema que corresponda a Interface
const orderSchema = new Schema<IOrder>(
  {
    orderID: {
      type: String,
    },
    statusOrder: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    shippingCostTotal: {
      type: String,
    },
    customerOrderCostTotal: {
      type: String,
    },
    partnerCommissionOtamart: {
      type: String,
    },
    customerOtakuPointsEarned: {
      type: String,
    },
    partnerOtakuPointsPaid: {
      type: String,
    },
    itemsList: [
      {
        productID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductModel",
        },
        productTitle: {
          type: String,
        },
        productImage: {
          type: String,
        },
        productPrice: {
          type: Number,
        },
        productVariation: {
          type: String,
        },
        productQuantity: {
          type: Number,
        },
        daysShipping: {
          type: Number,
        },
        // productsCostTotal: {
        // 	type: Number,
        // },
      },
    ],
    productsVariations: {
      type: Object,
    },
    orderNote: {
      type: String,
    },
    partnerID: Object,
    partnerName: {
      type: String,
    },
    partnerCNPJ: {
      type: String,
    },
    customerID: Object,
    customerName: {
      type: String,
    },
    customerCPF: {
      type: String,
    },
    customerAddress: [
      {
        street: {
          type: String,
        },
        complement: {
          type: String,
        },
        neighborhood: {
          type: String,
        },
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        postalCode: {
          type: String,
        },
      },
    ],
    shippingMethod: {
      type: String,
    },
    statusShipping: {
      type: String,
    },
    markedDeliveredBy: {
      type: String,
    },
    markedDeliveredAt: {
      type: Date,
    },
    dateMarkedPacked: {
      type: Date,
    },
    trackingCode: {
      type: String,
    },
    logisticOperator: {
      type: String,
    },
    discountsApplied: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Criação de um Model com conexão ao banco de dados
const OrderModel = mainDB.model<IOrder>("Order", orderSchema);

export { OrderModel, IOrderItem };
