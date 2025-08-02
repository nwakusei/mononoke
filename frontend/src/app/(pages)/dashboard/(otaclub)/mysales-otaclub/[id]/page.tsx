"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const secretKey = "chaveSuperSecretaDe32charsdgklot";

// Axios
import api from "@/utils/api";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// icons
import { GrMapLocation } from "react-icons/gr";
import { PiNoteBold } from "react-icons/pi";
import { LuPackage, LuPackageCheck } from "react-icons/lu";
import { MdOutlineCancel } from "react-icons/md";

// React Hook Form, Zod e ZodResolver
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";

const updateTrackingForm = z.object({
  logisticOperator: z
    .string()
    .min(1, "※ O operador logístico é obrigatório!")
    .trim()
    .refine((value) => value !== "", {
      message: "※ Item obrigatório!",
    }),
  trackingCode: z
    .string()
    .min(1, "※ O código de rastreio é obrigatório!")
    .trim()
    .toUpperCase()
    .refine(
      (tCode) => {
        const sanitized = DOMPurify.sanitize(tCode);

        const isValid = /^[A-Za-z0-9]+$/.test(sanitized); // Verificar se é alfanumérico

        return isValid;
      },
      {
        message: "※ O código possui caracteres inválidos!",
      }
    ),
});

type TUpdateTrackingForm = z.infer<typeof updateTrackingForm>;

function MySaleOtaclubByIDPage() {
  const { id } = useParams();
  const [token] = useState(localStorage.getItem("token") || "");
  const [mysale, setMysale] = useState([]);
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [packedLoading, setPackedLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingButton, setLoadingButton] = useState(false);

  const router = useRouter();

  const dateCreatedOrder = mysale.createdAt
    ? `${format(new Date(mysale.createdAt), "dd/MM - HH:mm")} hs`
    : "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TUpdateTrackingForm>({
    resolver: zodResolver(updateTrackingForm),
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/partner-otaclub-orders/${id}`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(token)}`,
          },
        });
        if (response.data && response.data.order) {
          setMysale(response.data.order);
        } else {
          console.error("Dados de pedidos inválidos:", response.data);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao obter dados do usuário:", error);
      }
    };
    fetchOrder();
  }, [token, id]);

  async function handleCancelOrder(SaleID: string) {
    setLoadingButton(true);

    try {
      const response = await api.delete(
        `/orders/partner-cancel-order/${SaleID}`
      );

      Swal.fire({
        title: response.data.message,
        icon: "success",
        confirmButtonText: "OK",
      });

      setLoadingButton(false);

      router.push("/dashboard/mysales");
    } catch (error: any) {
      console.error("Erro ao cancelar pedido:", error);
    }
  }

  async function handleTracking(data) {
    const logisticOperator = data.logisticOperator;
    const trackingCode = data.trackingCode;

    setTrackingLoading(true);
    try {
      const response = await api.patch(
        `/orders/otaclub-update-trackingcode/${id}`,
        { logisticOperator, trackingCode },
        { headers: { Authorization: `Bearer ${JSON.parse(token)}` } }
      );

      // Atualiza o estado local do pedido
      setMysale((prevMysale) => ({
        ...prevMysale,
        statusShipping: "Enviado",
        trackingCode: trackingCode, // Certifique-se de que está sendo atualizado corretamente
      }));

      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response.data.message);
      console.error("Erro ao atualizar o código de rastreamento:", error);
    }
    setTrackingLoading(false);
  }

  async function handlePacked() {
    setPackedLoading(true);
    try {
      const response = await api.patch(`/orders/otaclub-mark-packed/${id}`);

      // Atualizar o estado localmente para refletir a mudança no status
      setMysale((prevMysale) => ({
        ...prevMysale,
        statusShipping: "Embalado", // Alteração do status local
      }));

      toast.success(response.data.message);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response.data.message);
    }
    setPackedLoading(false);
  }

  async function handleDelivered() {
    setPackedLoading(true);
    try {
      const response = await api.patch(`/orders/otaclub-mark-delivered/${id}`);

      // Atualizar o estado localmente para refletir a mudança no status
      setMysale((prevMysale) => ({
        ...prevMysale,
        statusShipping: "Entregue", // Alteração do status local
      }));

      toast.success(response.data.message);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response.data.message);
    }
    setPackedLoading(false);
  }

  const handleInfo = () => {
    Swal.fire({
      title: "Prazo de resolução expirado",
      text: "O prazo de 3 dias para resolver o problema expirou. Cancele o pedido e reembolse o comprador, do contrário faremos isso por você!",
      icon: "warning",
      width: 700,
      confirmButtonText: "Cancelar Pedido",
      confirmButtonColor: "#b81414", // vermelho padrão
    }).then((result) => {
      if (result.isConfirmed) {
        handleCancelOrder(mysale?._id);
      }
    });
  };

  const translateOrderShipping = () => {
    if (mysale?.statusShipping === "Pending") {
      return "Pendente";
    } else if (mysale?.statusShipping === "Packed") {
      return "Embalado";
    } else if (mysale?.statusShipping === "Shipped") {
      return "Enviado";
    } else if (mysale?.statusShipping === "Delivered") {
      return "Entregue";
    } else if (mysale?.statusShipping === "Not Delivered") {
      return "Não entregue";
    } else if (mysale?.statusShipping === "Canceled") {
      return "Cancelado";
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
      <Sidebar />
      <div className="flex flex-col col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
        {/* Gadget 1 */}
        <div className="flex flex-row justify-between items-center gap-4 bg-white w-[1200px] p-6 rounded-md shadow-md mt-4 mr-4">
          <div className="flex flex-col">
            <h1 className="text-lg text-black">
              {`ID do Pedido: ${mysale?.orderOtaclubID}`}
            </h1>
            <h2 className="text-black">
              Data do Pagamento: {dateCreatedOrder}
            </h2>
          </div>
          <div>
            {mysale?.statusShipping === "Shipped" ||
            mysale?.statusShipping === "Delivered" ||
            mysale?.statusOrder === "Canceled" ||
            mysale?.statusOrder === "Completed" ? (
              <></>
            ) : loadingButton ? (
              <button className="btn btn-error w-[165px] text-white shadow-md">
                <span className="loading loading-spinner loading-md"></span>
              </button>
            ) : (
              <button
                onClick={() => handleCancelOrder(mysale?._id)}
                className="btn btn-error w-[180px] text-white shadow-md"
              >
                <MdOutlineCancel size={20} />
                <span>Cancelar Pedido</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-row w-[1200px]">
          {/* Gadget 2 */}
          <div className="bg-white w-[900px] p-6 rounded-md shadow-md mt-4 mr-4">
            {/* Adicionar Order */}
            <div className="flex flex-col gap-2 ml-6 mb-6 text-black">
              <h1 className="text-2xl font-semibold">Lista de Produtos</h1>

              {/* Lista de Produtos */}
              <div className="overflow-x-auto">
                <table className="table mb-8">
                  {/* head */}
                  <thead>
                    <tr>
                      <th className="text-sm text-black">Produto</th>
                      <th className="text-sm text-black">Custo</th>
                      <th className="text-sm text-black">Quantidade</th>

                      <th className="text-sm text-black">Custo Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* row 1 */}
                    {Array.isArray(mysale?.itemsList) &&
                      mysale?.itemsList.length > 0 &&
                      mysale?.itemsList.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="flex items-center gap-3 mb-2">
                              <div>
                                <div className="w-[60px] pointer-events-none">
                                  <Image
                                    src={`https://mononokebucket.s3.us-east-1.amazonaws.com/${item.productImage}`}
                                    alt={item.productTitle}
                                    width={280}
                                    height={10}
                                    unoptimized
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="font-bold">
                                  <h2 className="w-[230px] overflow-x-hidden mb-2">
                                    {item.productTitle}
                                  </h2>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div>
                              {`${item.productPrice.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} OP`}
                            </div>
                          </td>
                          <td>
                            <div>{`${item.productQuantity} un`}</div>
                          </td>
                          <td className="w-[200px] overflow-x-auto">
                            {`${(
                              item.productQuantity * item.productPrice
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} OP`}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* A RECEBER */}
                <table className="table">
                  {/* head */}
                  <thead>
                    <tr>
                      <th className="text-sm text-black">
                        Comissão a ser Paga
                      </th>
                      <th className="text-sm text-black">
                        A receber pelo Pedido
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* row 1 */}

                    <tr>
                      <td>
                        <div>
                          {`${mysale?.partnerCommissionOtamart?.toLocaleString(
                            "pt-BR",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )} OP`}
                        </div>
                      </td>

                      <td>
                        {`${(() => {
                          // Descriptografa os valores
                          const customerOrderCostTotal =
                            mysale?.customerOrderCostTotal;

                          const partnerCommissionOtamart =
                            mysale?.partnerCommissionOtamart;

                          // Se algum valor for null, interrompe e exibe erro
                          if (
                            customerOrderCostTotal === null ||
                            partnerCommissionOtamart === null
                          ) {
                            return "Erro no cálculo";
                          }

                          // Calcula e arredonda para evitar erro de ponto flutuante
                          const finalValue =
                            Math.round(
                              (customerOrderCostTotal -
                                partnerCommissionOtamart) *
                                100
                            ) / 100;

                          // Retorna o valor formatado corretamente
                          return finalValue.toLocaleString(
                            "pt-BR",
                            mysale?.partnerCommissionOtamart?.toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )
                          );
                        })()} OP`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Gadget 3 */}
          <div className="flex flex-col">
            <div className="bg-white w-[325px] p-6 rounded-md shadow-md mt-4 text-black">
              <h1 className="text-lg">{mysale?.customerName}</h1>
              <h2>CPF: {mysale?.customerCPF}</h2>

              <div className="divider before:border-t-[1px] after:border-t-[1px] before:bg-black after:bg-black"></div>

              {mysale?.customerAddress &&
                mysale?.customerAddress.length > 0 &&
                mysale?.customerAddress.map((end) => (
                  <div key={end._id}>
                    <div className="text-lg mb-3">Endereço de entrega</div>
                    <div>Endereço: {end.street}</div>
                    <div>
                      {end.complemento ? (
                        `Complemento: ${end.complement}`
                      ) : (
                        <>—</>
                      )}
                    </div>
                    <div>Bairro: {end.neighborhood}</div>
                    <div>
                      Cidade/UF: {end.city}/{end.state}
                    </div>
                    <div>CEP: {end.postalCode}</div>
                  </div>
                ))}
            </div>

            {/* Gadget 4 */}
            <div className="bg-white w-[325px] p-6 rounded-md shadow-md mt-4">
              <div className="mb-4 text-black">
                <div>
                  {`Tranportadora: ${
                    mysale?.logisticOperator !== undefined
                      ? mysale?.logisticOperator
                      : "A definir"
                  }`}
                </div>
                {/* <h2>
                                    Valor:{" "}
                                    {mysale?.shippingCostTotal > 0
                                        ? mysale?.shippingCostTotal.toLocaleString(
                                                "pt-BR",
                                                {
                                                    style: "currency",
                                                    currency: "BRL",
                                                }
                                          )
                                        : "R$ 0,00"}
                                </h2> */}
                <div>{`Status: ${translateOrderShipping()}`}</div>
              </div>

              {mysale?.statusShipping === "Pending" &&
              mysale?.trackingCode === "" ? (
                <div className="mb-2">
                  {packedLoading ? (
                    <button className="btn btn-primary w-full">
                      <span className="loading loading-spinner loading-sm"></span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePacked}
                      className="btn btn-primary w-full"
                    >
                      <LuPackage size={20} />
                      <span>Marcar como embalado</span>
                    </button>
                  )}
                </div>
              ) : (
                <></>
              )}

              {mysale?.trackingCode !== "" && (
                <div className="flex flex-row items-center gap-2">
                  <div className="text-black">Cod. de Rastreio:</div>
                  <div className="bg-primary text-sm cursor-pointer transition-all ease-in duration-150 active:scale-[.95] rounded shadow-md px-2">
                    {mysale?.trackingCode}
                  </div>
                </div>
              )}

              {mysale?.statusShipping === "Packed" &&
                mysale?.trackingCode === "" && (
                  <form onSubmit={handleSubmit(handleTracking)}>
                    <label className="form-control w-full max-w-xs mb-1">
                      <select
                        className={`select ${
                          errors.logisticOperator
                            ? `select-error`
                            : `select-success`
                        } bg-slate-200 text-slate-900 w-full max-w-xs`}
                        defaultValue=""
                        {...register("logisticOperator")} // Registrar o select
                      >
                        <option value="" disabled>
                          Qual é a transportadora?
                        </option>
                        <option value="Correios">Correios</option>
                        <option value="Loggi">Loggi</option>
                        <option value="Jadlog">Jadlog</option>
                        <option value="J&T">J&T Express</option>
                        <option value="Buslog">Buslog</option>
                        <option value="Latam">Latam Cargo</option>
                        <option value="Azul">Azul Cargo Express</option>
                        <option value="Japan Post">Japan Post</option>
                        <option value="DHL">DHL</option>
                        <option value="FedEx">FedEx</option>
                      </select>
                      <div className="label">
                        {errors.trackingCode && (
                          <span className="label-text-alt text-error">
                            {errors.trackingCode.message}
                          </span>
                        )}
                      </div>
                    </label>

                    <label className="form-control w-full max-w-xs mb-2">
                      {/* Input para código de rastreamento */}
                      <input
                        className={`input input-bordered ${
                          errors.trackingCode ? `input-error` : `input-success`
                        } bg-slate-200 text-slate-900 w-full`}
                        type="text"
                        placeholder="Insira o código de Rastreio"
                        {...register("trackingCode")} // Registrar o input
                      />

                      {/* Exibir erro de validação do código de rastreamento */}
                      <div className="label">
                        {errors.trackingCode && (
                          <span className="label-text-alt text-error">
                            {errors.trackingCode.message}
                          </span>
                        )}
                      </div>
                    </label>

                    <div>
                      {trackingLoading ? (
                        <button className="btn btn-primary w-full">
                          <span className="loading loading-spinner loading-sm"></span>
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="flex flex-row items-center justify-center gap-2 btn btn-primary w-full shadow-md"
                        >
                          <GrMapLocation size={20} />
                          <span>Enviar Código de Rastreio</span>
                        </button>
                      )}
                    </div>
                  </form>
                )}

              {mysale?.statusShipping === "Shipped" && (
                <div className="mt-4 mb-2">
                  {packedLoading ? (
                    <button className="btn btn-primary w-full">
                      <span className="loading loading-spinner loading-sm"></span>
                    </button>
                  ) : (
                    <button
                      onClick={handleDelivered}
                      className="btn btn-primary w-full"
                    >
                      <LuPackageCheck size={20} />
                      <span>Marcar como entregue</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* Gadget 4 */}
            {mysale?.statusShipping === "Not Delivered" && (
              <div className="bg-white w-[325px] p-6 border-2 border-dashed border-violet-900 rounded-md shadow-md mt-4 flex flex-col gap-2 mb-4">
                <p className="text-base font-semibold text-black mb-2">
                  Pedido marcado como não entregue, verifique junto a
                  transportadora o que ocorreu. Em caso de extravio, cancele o
                  pedido e reembolse o comprador. Você tem 3 dias para resolver
                  o problema.
                </p>

                {/* <button className="bg-primary py-1 rounded shadow-md cursor-pointer transition-all ease-in duration-200 active:scale-[.97] mb-2">
                  Pedido encontrado e entregue
                </button> */}

                {(() => {
                  const updatedAt = new Date(mysale.updatedAt);
                  const now = new Date();
                  const diffInMs = now.getTime() - updatedAt.getTime();
                  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

                  if (diffInDays >= 3) {
                    return (
                      <button
                        onClick={handleInfo}
                        className="bg-primary py-1 rounded shadow-md cursor-pointer transition-all ease-in duration-200 active:scale-[.97]"
                      >
                        Prazo de resolução expirado
                      </button>
                    );
                  }

                  return null;
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Gadget 5 */}
        <div className="flex flex-col gap-4 bg-white w-[1200px] p-6 rounded-md shadow-md mt-4 mr-4 text-black">
          <div className="flex flex-row items-center gap-2">
            <PiNoteBold size={25} />
            <h1 className="text-lg">Nota do Cliente</h1>
          </div>
          <div>
            <p>
              {mysale?.orderNote
                ? mysale?.orderNote
                : `Nenhuma nota adicionada...`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MySaleOtaclubByIDPage;
