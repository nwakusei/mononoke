"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-toastify";
import crypto from "crypto";
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
import { BsBoxSeam } from "react-icons/bs";
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

function MySaleByIDPage() {
	const { id } = useParams();
	const [token] = useState(localStorage.getItem("token") || "");
	// const [token] = useState(() => {
	// 	if (typeof window !== "undefined") {
	// 		return localStorage.getItem("token") || "";
	// 	} else {
	// 		return "";
	// 	}
	// });
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
				const response = await api.get(`/orders/partner-orders/${id}`, {
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
				`/orders/update-trackingcode/${id}`,
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
			const response = await api.patch(`/orders/mark-packed/${id}`);

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
			const response = await api.patch(
				`/orders/mark-delivered-partner/${id}`
			);

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

	// Função para Descriptografar dados sensíveis no Banco de Dados
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

			decipher.setAutoPadding(false);

			decrypted = decipher.update(encryptedData, "hex", "utf8");
			decrypted += decipher.final("utf8");

			const balanceNumber = parseFloat(decrypted.trim()); // Remove espaços em branco extras
			if (isNaN(balanceNumber)) {
				return null;
			}
			return parseFloat(balanceNumber.toFixed(2));
		} catch (error) {
			console.error("Erro ao descriptografar o saldo:", error);
			return null;
		}
	}

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
							{`ID do Pedido: ${mysale?.orderID}`}
						</h1>
						<h2 className="text-black">
							Data do Pagamento: {dateCreatedOrder}
						</h2>
					</div>
					<div>
						{mysale?.statusShipping === "Shipped" ||
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
								className="btn btn-error w-[180px] text-white shadow-md">
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
							<h1 className="text-2xl font-semibold">
								Lista de Produtos
							</h1>

							{/* Lista de Produtos */}
							<div className="overflow-x-auto">
								<table className="table mb-8">
									{/* head */}
									<thead>
										<tr>
											<th className="text-sm text-black">
												Produto
											</th>
											<th className="text-sm text-black">
												Valor
											</th>
											<th className="text-sm text-black">
												Quantidade
											</th>

											<th className="text-sm text-black">
												Total
											</th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}
										{Array.isArray(mysale?.itemsList) &&
											mysale?.itemsList.length > 0 &&
											mysale?.itemsList.map(
												(item, index) => (
													<tr key={index}>
														<td>
															<div className="flex items-center gap-3 mb-2">
																<div>
																	<div className="w-[60px] pointer-events-none">
																		<Image
																			src={`http://localhost:5000/images/products/${item.productImage}`}
																			alt={
																				item.productTitle
																			}
																			width={
																				280
																			}
																			height={
																				10
																			}
																			unoptimized
																		/>
																	</div>
																</div>
																<div>
																	<div className="font-bold">
																		<h2 className="w-[230px] overflow-x-hidden mb-2">
																			{
																				item.productTitle
																			}
																		</h2>
																	</div>
																	<div>
																		<h2>
																			{
																				item.productVariation
																			}
																		</h2>
																	</div>
																</div>
															</div>
														</td>

														<td>
															<div>
																{item.productPrice.toLocaleString(
																	"pt-BR",
																	{
																		style: "currency",
																		currency:
																			"BRL",
																	}
																)}
															</div>
														</td>
														<td>
															<div>
																{
																	item.productQuantity
																}{" "}
																un
															</div>
														</td>
														<td className="w-[200px] overflow-x-auto">
															{(
																item.productQuantity *
																item.productPrice
															).toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)}
														</td>
													</tr>
												)
											)}
									</tbody>
								</table>

								{/* Valores totais */}
								<table className="table mb-8">
									{/* head */}
									<thead>
										<tr>
											<th className="text-sm text-black">
												Subtotal do Pedido
											</th>
											<th className="text-sm text-black">
												Total do Frete
											</th>
											<th className="text-sm text-black">
												Desconto
											</th>
											<th className="text-sm text-black">
												Total do Pedido
											</th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}

										<tr>
											<td>
												{Array.isArray(
													mysale?.itemsList
												) &&
													mysale?.itemsList.length >
														0 && (
														<div>
															{mysale?.itemsList
																.reduce(
																	(
																		total,
																		item
																	) =>
																		total +
																		item.productPrice *
																			item.productQuantity, // Multiplica pelo quantity
																	0
																)
																.toLocaleString(
																	"pt-BR",
																	{
																		style: "currency",
																		currency:
																			"BRL",
																	}
																)}
														</div>
													)}
											</td>
											<td>
												<div>
													{`${decrypt(
														mysale?.shippingCostTotal
													)?.toLocaleString("pt-BR", {
														style: "currency",
														currency: "BRL",
													})}`}
												</div>
											</td>

											<td>
												{Array.isArray(
													mysale?.itemsList
												) &&
													mysale?.itemsList.length >
														0 && (
														<div>
															{(() => {
																const productTotal =
																	mysale?.itemsList.reduce(
																		(
																			total,
																			item
																		) =>
																			total +
																			item.productPrice *
																				item.productQuantity,
																		0
																	);

																// Descriptografa os valores necessários
																const decryptedShippingCost =
																	decrypt(
																		mysale?.shippingCostTotal
																	);
																const decryptedCustomerOrderCostTotal =
																	decrypt(
																		mysale?.customerOrderCostTotal
																	);

																// Se qualquer um dos valores for null, o desconto será NaN para alertar inconsistência
																if (
																	decryptedShippingCost ===
																		null ||
																	decryptedCustomerOrderCostTotal ===
																		null
																) {
																	return "Erro ao calcular desconto";
																}

																// Calcula o total com frete
																const totalWithShipping =
																	productTotal +
																	decryptedShippingCost;
																let discount =
																	totalWithShipping -
																	decryptedCustomerOrderCostTotal;

																// 🔥 CORREÇÃO: Arredondar para evitar erros de ponto flutuante
																discount =
																	Math.round(
																		discount *
																			100
																	) / 100;

																// Apenas formata se o desconto for maior que 0
																let formattedDiscount =
																	discount > 0
																		? discount.toLocaleString(
																				"pt-BR",
																				{
																					style: "currency",
																					currency:
																						"BRL",
																				}
																		  )
																		: null;

																console.log(
																	"Desconto:",
																	discount,
																	"Formatado:",
																	formattedDiscount
																);

																// Retorna o valor formatado com o sinal de negativo se houver desconto
																return formattedDiscount
																	? `- ${formattedDiscount}`
																	: "R$ 0,00";
															})()}
														</div>
													)}
											</td>

											<td>
												<div>
													{`${decrypt(
														mysale?.customerOrderCostTotal
													)?.toLocaleString("pt-BR", {
														style: "currency",
														currency: "BRL",
													})}`}
												</div>
											</td>
										</tr>
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
													{decrypt(
														mysale?.partnerCommissionOtamart
													)?.toLocaleString("pt-BR", {
														style: "currency",
														currency: "BRL",
													})}
												</div>
											</td>

											<td>
												{(() => {
													// Descriptografa os valores
													const decryptedCustomerOrderCostTotal =
														decrypt(
															mysale?.customerOrderCostTotal
														);
													const decryptedPartnerCommissionOtamart =
														decrypt(
															mysale?.partnerCommissionOtamart
														);

													// Se algum valor for null, interrompe e exibe erro
													if (
														decryptedCustomerOrderCostTotal ===
															null ||
														decryptedPartnerCommissionOtamart ===
															null
													) {
														return "Erro no cálculo";
													}

													// Calcula e arredonda para evitar erro de ponto flutuante
													const finalValue =
														Math.round(
															(decryptedCustomerOrderCostTotal -
																decryptedPartnerCommissionOtamart) *
																100
														) / 100;

													// Retorna o valor formatado corretamente
													return finalValue.toLocaleString(
														"pt-BR",
														{
															style: "currency",
															currency: "BRL",
														}
													);
												})()}
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
							<h2>CPF: {decrypt(mysale?.customerCPF)}</h2>

							<div className="divider before:border-t-[1px] after:border-t-[1px] before:bg-black after:bg-black"></div>

							{mysale?.customerAddress &&
								mysale?.customerAddress.length > 0 &&
								mysale?.customerAddress.map((end) => (
									<div key={end._id}>
										<div className="text-lg mb-3">
											Endereço de entrega
										</div>
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
								<h1>Tranportadora: {mysale?.shippingMethod}</h1>
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
								<h2>Status: {mysale?.statusShipping}</h2>
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
											className="btn btn-primary w-full">
											<span>Marcar como embalado</span>
											<LuPackage size={20} />
										</button>
									)}
								</div>
							) : (
								<></>
							)}

							{mysale?.trackingCode !== "" && (
								<div className="flex flex-row gap-2">
									<div className="text-black">
										Cod. de Rastreio:
									</div>
									<div className="bg-primary cursor-pointer transition-all ease-in duration-150 active:scale-[.95] rounded shadow-md px-2">
										{mysale?.trackingCode}
									</div>
								</div>
							)}

							{mysale?.statusShipping === "Packed" &&
								mysale?.trackingCode === "" && (
									<form
										onSubmit={handleSubmit(handleTracking)}>
										<label className="form-control w-full max-w-xs mb-1">
											<select
												className={`select ${
													errors.logisticOperator
														? `select-error`
														: `select-success`
												} w-full max-w-xs`}
												defaultValue=""
												{...register(
													"logisticOperator"
												)} // Registrar o select
											>
												<option value="" disabled>
													Qual é a transportadora?
												</option>
												<option value="Correios">
													Correios
												</option>
												<option value="Loggi">
													Loggi
												</option>
												<option value="Jadlog">
													Jadlog
												</option>
												<option value="J&T">
													J&T Express
												</option>
												<option value="Buslog">
													Buslog
												</option>
												<option value="Latam">
													Latam Cargo
												</option>
												<option value="Azul">
													Azul Cargo Express
												</option>
												<option value="Japan Post">
													Japan Post
												</option>
												<option value="DHL">DHL</option>
												<option value="FedEx">
													FedEx
												</option>
											</select>
											<div className="label">
												{errors.trackingCode && (
													<span className="label-text-alt text-error">
														{
															errors.trackingCode
																.message
														}
													</span>
												)}
											</div>
										</label>

										<label className="form-control w-full max-w-xs mb-2">
											{/* Input para código de rastreamento */}
											<input
												className={`input input-bordered ${
													errors.trackingCode
														? `input-error`
														: `input-success`
												} w-full`}
												type="text"
												placeholder="Insira o código de Rastreio"
												{...register("trackingCode")} // Registrar o input
											/>

											{/* Exibir erro de validação do código de rastreamento */}
											<div className="label">
												{errors.trackingCode && (
													<span className="label-text-alt text-error">
														{
															errors.trackingCode
																.message
														}
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
													className="btn btn-primary w-full shadow-md">
													Enviar Código de Rastreio
													<GrMapLocation size={20} />
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
											className="btn btn-primary w-full">
											<span>Marcar como entregue</span>
											<LuPackageCheck size={20} />
										</button>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
				{/* Gadget 4 */}
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

export default MySaleByIDPage;
