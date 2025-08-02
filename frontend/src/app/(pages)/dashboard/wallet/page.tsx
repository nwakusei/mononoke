"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Axios
import api from "@/utils/api";

// Imagens e Logos
import blockchainIcon from "../../../../../public/distributed-ledger.png";

// Icons
import { Consume, Currency } from "@icon-park/react";
import { Deposit, Wallet } from "@icon-park/react";
import { AiOutlineMoneyCollect } from "react-icons/ai";
import {
  RiExchangeFundsFill,
  RiExchangeFundsLine,
  RiMoneyCnyCircleLine,
  RiRotateLockLine,
} from "react-icons/ri";
import { LiaHandshake, LiaShippingFastSolid } from "react-icons/lia";
import { CiCreditCard2 } from "react-icons/ci";
import { FiInfo } from "react-icons/fi";
import { RiRefund2Fill } from "react-icons/ri";
import { PiCreditCardBold } from "react-icons/pi";
import { BsBagCheck } from "react-icons/bs";

function WalletPage() {
  const [token] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState({});
  const [userOtakupay, setUserOtakupay] = useState({});
  const [cryptocurrencyBalance, setCryptocurrencyBalance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingButtonId, setLoadingButtonId] = useState(false);

  const [transactions, setTransactions] = useState([]);

  const router = useRouter();

  useEffect(() => {
    if (!token) return;

    api
      .get("/mononoke/check-user", {
        headers: {
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
      })
      .then((response) => {
        setUser(response.data);
        setIsLoading(false);
      });

    api
      .get("/otakupay/get-user-otakupay", {
        headers: {
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
      })
      .then((response) => {
        const newUserOtakupay = response.data; // Ajuste aqui para pegar diretamente a resposta
        setUserOtakupay(newUserOtakupay);
      })
      .catch((error) => {
        console.error("Erro ao obter saldo do OtakuPay:", error);
      });
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const fetchCryptocurrenciesBalance = async () => {
      const response = await api.get("/cryptocurrencies/get-balance-by-user", {
        headers: {
          Authorization: `Bearear ${JSON.parse(token)}`,
        },
      });

      setCryptocurrencyBalance(response.data.cryptocurrenciesBalance);
    };

    fetchCryptocurrenciesBalance();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const featchTransactions = async () => {
      try {
        const response = await api.get(`/otakupay/transactions`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(token)}`,
          },
        });
        console.log("Dados recebidos:", response.data.transactions);
        setTransactions(response.data.transactions);
      } catch (error: any) {
        console.error(
          "Erro ao obter transações:",
          error.response?.data || error.message
        );
      }
    };

    featchTransactions();
  }, [token]);

  const handleClickAddBalance = () => {
    setLoadingButtonId(true);
    setTimeout(() => {
      router.push(`/dashboard/wallet/add-balance`);
    }, 2000); // O tempo pode ser ajustado conforme necessário
  };

  const handleClickWithdrawMoney = () => {
    setLoadingButtonId(true);
    setTimeout(() => {
      router.push(`/dashboard/wallet/withdraw-money`);
    }, 2000);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <section className="min-h-screen bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
      <Sidebar />
      <div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4">
        {/* Gadget 1 */}
        <div className="flex flex-row mb-4 w-[1200px]">
          <div className="bg-white w-full p-6 rounded-md shadow-md">
            {/* Avatar e Boas vindas */}
            <div className="flex flex-row items-center text-lg text-black font-semibold ml-6 mb-6 gap-4">
              <Wallet size={24} />
              <h1 className="text-2xl">OtakuPay Wallet</h1>
            </div>
          </div>
        </div>

        {/* Gadget 2 */}
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex flex-row items-center justify-between w-[1200px]">
            <div className="bg-white w-[520px] h-[120px] p-6 rounded-md shadow-md">
              {/* Saldo Disponivel */}
              <div className="flex flex-col">
                <div className="flex flex-row items-center ml-6 gap-5">
                  <div>
                    <h2 className="text-sm text-black">Saldo Disponível</h2>
                    <h1 className="flex flex-row items-center text-3xl font-semibold text-black">
                      {parseFloat(
                        userOtakupay?.balanceAvailable || ""
                      ).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </h1>
                  </div>
                  <div className="flex flex-col gap-4">
                    {loadingButtonId ? (
                      <button className="flex flex-row items-center btn btn-primary shadow-md w-[200px]">
                        <span className="loading loading-dots loading-md"></span>
                      </button>
                    ) : user?.accountType === "customer" ? (
                      <button
                        onClick={handleClickAddBalance}
                        className="flex flex-row items-center btn btn-outline btn-primary text-black w-[200px] hover:shadow-md"
                      >
                        <AiOutlineMoneyCollect size={22} />
                        Adicionar Crédito
                      </button>
                    ) : (
                      <button
                        onClick={handleClickWithdrawMoney}
                        className="flex flex-row items-center btn btn-outline btn-primary text-black w-[200px] hover:shadow-md"
                      >
                        <Consume size={22} />
                        Sacar Dinheiro
                      </button>
                    )}
                  </div>
                </div>
                {/* <div className="flex flex-row mx-6 gap-4">
								<button className="btn btn-outline btn-success">
									<Deposit size={18} />
									Adicionar Dinheiro
								</button>
								<button className="btn btn-success">
									<Expenses size={18} />
									Sacar
								</button>
							</div> */}
              </div>
            </div>

            {/* Outro Saldos */}
            <div className="bg-white w-[210px] h-[120px] p-6 rounded-md shadow-md">
              {/* Saldo Pendente */}
              <div className="flex flex-col">
                <div className="flex flex-row pb-2 mb-2">
                  <div>
                    <h2 className="text-sm text-black">Saldo Pendente</h2>
                    <h1 className="flex flex-row items-center text-xl font-semibold text-black gap-2">
                      {parseFloat(
                        userOtakupay?.balancePending || ""
                      ).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white w-[210px] h-[120px] p-6 rounded-md shadow-md">
              {/* Saldo Otaku Point Available */}
              <div className="flex flex-col">
                <div className="flex flex-row pb-2 mb-2">
                  <div>
                    <h2 className="text-sm text-black">
                      Otaku Point Disponível
                    </h2>
                    <h1 className="flex flex-row items-center text-xl font-semibold text-black gap-2">
                      {parseFloat(userOtakupay?.otakuPointsAvailable || 0) === 0
                        ? `0,00 OP`
                        : `${parseFloat(userOtakupay?.otakuPointsAvailable || 0)
                            .toFixed(2)
                            .replace(".", ",")} OP`}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white w-[212px] h-[120px] p-6 rounded-md shadow-md">
              {/* Saldo Otaku Point Pending */}
              <div className="flex flex-col">
                <div className="flex flex-row">
                  <div>
                    <h2 className="text-sm text-black">Otaku Point Pendente</h2>
                    <h1 className="flex flex-row items-center text-xl font-semibold text-black gap-2">
                      {userOtakupay?.otakuPointsPending !== undefined
                        ? parseFloat(userOtakupay?.otakuPointsPending)
                            .toFixed(2)
                            .replace(".", ",") + " OP"
                        : "0,00 OP"}
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 mb-2 mt-2">
          {cryptocurrencyBalance && cryptocurrencyBalance.length > 0 && (
            <div className="flex flex-row w-[1200px]">
              <div className="bg-white w-full p-6 rounded-md shadow-md">
                {/* Avatar e Boas vindas */}
                <div className="flex flex-row items-center text-lg text-black font-semibold ml-6 mb-6 gap-4">
                  {/* <Wallet size={24} /> */}
                  <Image
                    src={blockchainIcon}
                    alt="Blockchain"
                    width={35}
                    height={35}
                  />
                  <h1 className="text-2xl">Criptomoedas</h1>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-row items-center">
            {cryptocurrencyBalance &&
              cryptocurrencyBalance.length > 0 &&
              cryptocurrencyBalance.map((cryptoBalance) => (
                <div
                  key={cryptoBalance?._id}
                  className="bg-white w-[350px] h-[120px] p-6 rounded-md shadow-md mr-4"
                >
                  {/* Saldos de Cryptos */}

                  <div className="flex flex-row gap-8">
                    <div>
                      <h2 className="text-sm text-black">
                        {`${cryptoBalance?.cryptocurrencyName} Disponível`}
                      </h2>
                      <h1 className="flex flex-row items-center text-xl font-semibold text-black gap-2">
                        {cryptoBalance?.amountOfCryptocurrency !== undefined &&
                          `${cryptoBalance?.cryptocurrencySymbol} ${parseFloat(
                            cryptoBalance?.amountOfCryptocurrency
                          )
                            .toFixed(6)
                            .replace(".", ",")}`}
                      </h1>
                    </div>

                    <button className="btn btn-primary btn-outline">
                      <RiExchangeFundsFill size={18} />
                      <span>Trade</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Gadget 2 */}
        <div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-8">
          {/* Tabela de Transações */}
          <div className="divider mb-2 text-lg text-black before:bg-black after:bg-black before:border-t-[1px] after:border-t-[1px]">
            Últimas atividades
          </div>
          <table className="table">
            {/* head */}
            <thead>
              <tr>
                <th className="text-sm text-black">
                  {/* {user?.accountType === "partner"
										? `Cliente`
										: `Loja`} */}
                </th>
                <th className="text-sm text-black">Transação</th>
                <th className="text-sm text-black">Valor Total</th>
                <th className="text-sm text-black">Data</th>
                <th></th>
              </tr>
            </thead>

            <tbody className="p-10">
              {/* rows */}
              {transactions.slice(0, 10).map((transaction) => {
                const modalId = `modal_${transaction._id}`; // ID único para cada modal

                return (
                  <tr key={transaction._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            {user?.otakupayID !== transaction.payerID ? (
                              <Image
                                src={`https://mononokebucket.s3.us-east-1.amazonaws.com/${transaction.payerProfileImage}`}
                                alt="Imagem miniatura do usuário"
                                width={50}
                                height={50}
                              />
                            ) : (
                              <Image
                                src={`https://mononokebucket.s3.us-east-1.amazonaws.com/${transaction.receiverProfileImage}`}
                                alt="Imagem miniatura do usuário"
                                width={50}
                                height={50}
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-black">
                            {String(user?.otakupayID) !==
                            String(transaction.payerID)
                              ? transaction.payerName
                              : transaction.receiverName}
                          </div>
                          <div className="text-xs text-black opacity-50">
                            {transaction.plataformName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-black">
                        {user?.otakupayID === transaction.receiverID
                          ? transaction.transactionTitle.replace(
                              "Compra",
                              "Venda"
                            )
                          : transaction.transactionTitle}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {transaction.transactionDescription}
                      </div>
                      <span
                        className={`badge ${
                          transaction.transactionType === "Cancelamento" ||
                          transaction.transactionType === "Reembolso"
                            ? "badge-error"
                            : "badge-success"
                        } badge-sm text-white py-2`}
                      >
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td>
                      <div
                        className={`font-normal ${
                          (String(user?.otakupayID) ===
                            String(transaction.payerID) &&
                            transaction.transactionType === "Cancelamento") ||
                          (String(user?.otakupayID) ===
                            String(transaction.receiverID) &&
                            (transaction.transactionType === "Pagamento" ||
                              transaction.transactionType === "Reembolso"))
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {(String(user?.otakupayID) ===
                          String(transaction.payerID) &&
                          transaction.transactionType === "Cancelamento") ||
                        (String(user?.otakupayID) ===
                          String(transaction.receiverID) &&
                          (transaction.transactionType === "Pagamento" ||
                            transaction.transactionType === "Reembolso"))
                          ? "+ "
                          : "- "}
                        {transaction.transactionValue?.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="text-black">
                        {transaction.createdAt &&
                          format(new Date(transaction.createdAt), "dd/MM/yyyy")}
                      </div>
                    </td>
                    <th>
                      {/* Botão para abrir o modal específico dessa transação */}
                      <button
                        className="btn btn-primary hover:btn-secondary btn-xs text-white hover:text-white shadow-md"
                        onClick={() =>
                          document.getElementById(modalId)?.showModal()
                        }
                      >
                        + Detalhes
                      </button>

                      {/* Modal com ID dinâmico */}
                      <dialog id={modalId} className="modal">
                        <div className="modal-box bg-secondary">
                          <h2 className="font-bold text-lg mb-4">
                            Detalhes da Transação
                          </h2>

                          <p className="flex flex-row items-center gap-2">
                            <BsBagCheck size={16} />

                            <span>
                              {
                                transaction.transactionDetails
                                  .detailProductServiceTitle
                              }
                            </span>
                          </p>
                          <p className="flex flex-row items-center gap-2">
                            <RiMoneyCnyCircleLine size={16} />
                            <span>
                              {`Subtotal dos Produtos: ${transaction.transactionDetails.detailCost?.toLocaleString(
                                "pt-BR",
                                {
                                  style: "currency",
                                  currency: "BRL",
                                }
                              )}`}
                            </span>
                          </p>

                          <p className="flex flex-row items-center gap-2">
                            <LiaShippingFastSolid size={16} />
                            <span>
                              {`Custo de Envio: ${transaction.transactionDetails.detailShippingCost?.toLocaleString(
                                "pt-BR",
                                {
                                  style: "currency",
                                  currency: "BRL",
                                }
                              )}`}
                            </span>
                          </p>

                          {String(user?.otakupayID) ==
                            String(transaction.receiverID) && (
                            <p className="flex flex-row items-center gap-2">
                              <LiaHandshake size={16} />
                              <span>
                                {transaction.transactionType === "Pagamento"
                                  ? `Tarifa de Venda: ${transaction.transactionDetails.detailSalesFee?.toLocaleString(
                                      "pt-BR",
                                      {
                                        style: "currency",
                                        currency: "BRL",
                                      }
                                    )}`
                                  : `Tarifa de Venda (Cancelada): ${transaction.transactionDetails.detailSalesFee?.toLocaleString(
                                      "pt-BR",
                                      {
                                        style: "currency",
                                        currency: "BRL",
                                      }
                                    )}`}
                              </span>
                            </p>
                          )}

                          <p className="flex flex-row items-center gap-2">
                            <RiRefund2Fill size={16} />
                            <span>
                              {transaction.transactionType === "Cancelamento"
                                ? `Total Reembolsado: ${transaction.transactionValue?.toLocaleString(
                                    "pt-BR",
                                    {
                                      style: "currency",
                                      currency: "BRL",
                                    }
                                  )}`
                                : `Total Pago: ${transaction.transactionValue?.toLocaleString(
                                    "pt-BR",
                                    {
                                      style: "currency",
                                      currency: "BRL",
                                    }
                                  )}`}
                            </span>
                          </p>

                          <hr className="my-2" />
                          {String(user?.otakupayID) ==
                            String(transaction.payerID) && (
                            <p className="flex flex-row items-center gap-2">
                              <Currency size={16} />
                              <span className="mb-[1px]">
                                {transaction.transactionType === "Pagamento"
                                  ? `Cashback (Pendente): ${transaction.transactionDetails.detailCashback?.toLocaleString()} OP`
                                  : `Cashback (Cancelado): ${transaction.transactionDetails.detailCashback?.toLocaleString()} OP`}
                              </span>
                            </p>
                          )}

                          <p className="flex flex-row items-center gap-2 mb-2">
                            <PiCreditCardBold size={16} />
                            <span className="mb-[2px]">
                              {`Método de Pagamento: ${transaction.transactionDetails.detailPaymentMethod}`}
                            </span>
                          </p>

                          <p className="flex flex-row items-center gap-2 mb-2">
                            <FiInfo size={15} />
                            <span className="mb-[2px]">
                              {transaction.transactionType === "Cancelamento"
                                ? String(user?.otakupayID) ===
                                  String(transaction.payerID)
                                  ? "Devolvemos o seu dinheiro"
                                  : "Devolvemos o dinheiro ao comprador"
                                : "Transação realizada com sucesso"}
                            </span>
                          </p>

                          <p className="flex flex-row items-center gap-2 leading-tight">
                            <RiRotateLockLine size={23} />
                            <span className="break-all overflow-hidden text-ellipsis -mb-[16px]">
                              {`Hash da Transação: ${transaction.transactionHash}`}
                            </span>
                          </p>

                          <div className="modal-action">
                            <form method="dialog">
                              <button className="btn btn-primary">
                                Fechar
                              </button>
                            </form>
                          </div>
                        </div>
                      </dialog>
                    </th>
                  </tr>
                );
              })}
            </tbody>

            {/* foot */}
            {/* <tfoot>
							<tr>
								<th></th>
								<th>Name</th>
								<th>Job</th>
								<th>Favorite Color</th>
								<th></th>
							</tr>
						</tfoot> */}
          </table>
        </div>
      </div>
    </section>
  );
}

export default WalletPage;
