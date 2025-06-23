"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-toastify";

// Components
import { Sidebar } from "@/components/Sidebar";

// Axios
import api from "@/utils/api";

// icons
import { GrMapLocation } from "react-icons/gr";
import { ShoppingCartOne } from "@icon-park/react";
import { LiaShippingFastSolid } from "react-icons/lia";
import { PiCreditCardBold } from "react-icons/pi";
import { LoadingPage } from "@/components/LoadingPageComponent";
import { LuPackageCheck, LuPackageX } from "react-icons/lu";
import { FiInfo } from "react-icons/fi";

function MyOrderByIDPage() {
	const { id } = useParams();
	const [token] = useState(localStorage.getItem("token") || "");
	const [myorder, setMyorder] = useState([]);
	const [tracking, setTracking] = useState({});
	const [tracking2, setTracking2] = useState({});
	const [isLoading, setIsLoading] = useState(true);
	const [packedLoading, setPackedLoading] = useState(false);

	const dateCreatedOrder = myorder.createdAt
		? `${format(new Date(myorder.createdAt), "dd/MM/yyyy - HH:mm")} hs`
		: "";

	const convertDate = (dateString) => {
		const parts = dateString.split("/");
		return `${parts[2]}/${parts[1]}/${parts[0]}`;
	};

	useEffect(() => {
		const fetchOrder = async () => {
			try {
				const response = await api.get(
					`/orders/customer-orders/${id}`,
					{
						headers: {
							Authorization: `Bearer ${JSON.parse(token)}`,
						},
					}
				);
				if (response.data && response.data.order) {
					setMyorder(response.data.order);
					setIsLoading(false);
				} else {
					console.error("Dados de pedidos inválidos:", response.data);
				}
			} catch (error) {
				console.error("Erro ao obter dados do usuário:", error);
			}
		};
		fetchOrder();
	}, [token, id]);

	useEffect(() => {
		const fetchShipping = async () => {
			try {
				const response = await api.get(
					`/tracking/kangu-tracking/${id}`,
					{
						headers: {
							Authorization: `Bearer ${JSON.parse(token)}`,
						},
					}
				);
				setTracking(response.data);
			} catch (error) {
				console.log(error);
			}
		};

		const fetchShipping2 = async () => {
			try {
				const response = await api.get(
					`/tracking/correios-tracking/${id}`,
					{
						headers: {
							Authorization: `Bearer ${JSON.parse(token)}`,
						},
					}
				);
				setTracking2(response.data);
			} catch (error) {
				console.log(error);
			}
		};

		fetchShipping();
		fetchShipping2();
	}, [token, id]);

	async function handleReceived() {
		setPackedLoading(true);
		try {
			const response = await api.patch(`/orders/mark-delivered/${id}`);

			// Atualizar o estado localmente para refletir a mudança no status
			setMyorder((prevMysale) => ({
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

	async function handleNotReceived() {
		setPackedLoading(true);
		try {
			const response = await api.patch(
				`/orders/mark-not-delivered/${id}`
			);

			// Atualizar o estado localmente para refletir a mudança no status
			setMyorder((prevMysale) => ({
				...prevMysale,
				statusShipping: "Não entregue", // Alteração do status local
			}));

			toast.success(response.data.message);
		} catch (error: any) {
			console.log(error);
			toast.error(error.response.data.message);
		}
		setPackedLoading(false);
	}

	const translateOrderShipping = () => {
		if (myorder?.statusShipping === "Pending") {
			return "Pendente";
		} else if (myorder?.statusShipping === "Packed") {
			return "Embalado";
		} else if (myorder?.statusShipping === "Shipped") {
			return "Enviado";
		} else if (myorder?.statusShipping === "Delivered") {
			return "Entregue";
		} else if (myorder?.statusShipping === "Not Delivered") {
			return "Não entregue";
		} else if (myorder?.statusShipping === "Canceled") {
			return "Cancelado";
		}
	};

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-100 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="flex flex-col col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				{/* Gadget 1 */}
				<div className="flex flex-row justify-between items-center gap-4 bg-white w-[1200px] p-6 rounded-md shadow-md mt-4 mr-4">
					<div className="flex flex-col text-black">
						<h1 className="text-lg">
							ID do Pedido: {myorder?.orderID}
						</h1>
						<h2>Data do Pagamento: {dateCreatedOrder}</h2>
					</div>
					<div className="flex flex-row gap-4">
						{myorder?.statusShipping === "Enviado" ? (
							<></>
						) : (
							<>
								{/* <button className="btn btn-error">
									Cancelar Pedido
								</button>
								<button className="btn btn-error">
									Solcitar Cancelamento
								</button> */}
							</>
						)}
					</div>
				</div>

				<div className="flex flex-row w-[1200px]">
					{/* Gadget 2 */}
					<div className="bg-white w-[900px] p-6 rounded-md shadow-md mt-4 mr-4">
						{/* Adicionar Order */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold text-black">
								Detalhes do Pedido
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
										{Array.isArray(myorder?.itemsList) &&
											myorder?.itemsList.length > 0 &&
											myorder?.itemsList.map(
												(item, index) => (
													<tr
														key={index}
														className="text-black">
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
												Subtotal
											</th>
											<th className="text-sm text-black">
												Subtotal Frete
											</th>
											<th className="text-sm text-black">
												Desconto
											</th>
											<th className="text-sm text-black">
												Total do Pedido
											</th>
											<th className="text-sm text-black">
												Otaku Point a receber
											</th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}

										<tr>
											<td>
												{Array.isArray(
													myorder?.itemsList
												) &&
													myorder?.itemsList.length >
														0 && (
														<div className="text-black">
															{myorder.itemsList
																.reduce(
																	(
																		total,
																		item
																	) =>
																		total +
																		item?.productPrice *
																			item?.productQuantity,
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
												<div className="text-black">
													{`${myorder?.shippingCostTotal?.toLocaleString(
														"pt-BR",
														{
															style: "currency",
															currency: "BRL",
														}
													)}`}
												</div>
											</td>

											<td>
												<div className="text-black">
													{Array.isArray(
														myorder?.itemsList
													) &&
														myorder?.itemsList
															.length > 0 && (
															<div>
																{(() => {
																	const productTotal =
																		myorder?.itemsList.reduce(
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
																	const shippingCost =
																		myorder?.shippingCostTotal;

																	const customerOrderCostTotal =
																		myorder?.customerOrderCostTotal;

																	// Se qualquer um dos valores for null, o desconto será NaN para alertar inconsistência
																	if (
																		shippingCost ===
																			null ||
																		customerOrderCostTotal ===
																			null
																	) {
																		return "Erro ao calcular desconto";
																	}

																	// Calcula o total com frete
																	const totalWithShipping =
																		productTotal +
																		shippingCost;
																	let discount =
																		totalWithShipping -
																		customerOrderCostTotal;

																	// 🔥 CORREÇÃO: Arredondar para evitar erros de ponto flutuante
																	discount =
																		Math.round(
																			discount *
																				100
																		) / 100;

																	// Apenas formata se o desconto for maior que 0
																	let formattedDiscount =
																		discount >
																		0
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
												</div>
											</td>

											<td>
												<div className="text-black">
													{`${myorder?.customerOrderCostTotal?.toLocaleString(
														"pt-BR",
														{
															style: "currency",
															currency: "BRL",
														}
													)}`}
												</div>
											</td>

											<td>
												<div className="text-black">
													{`${myorder?.customerOtakuPointsEarned?.toLocaleString()} OP`}
												</div>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
							<div>
								<h1 className="text-xl text-black">
									Método de Pagamento
								</h1>
								<div className="text-black">
									{myorder?.paymentMethod}
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-col">
						{/* Gadget 3 */}
						<div className="bg-white text-black w-[325px] p-6 rounded-md shadow-md mt-4">
							<h1 className="text-lg">{`Loja: ${myorder?.partnerName}`}</h1>
							<h2>{`CNPJ/CPF: ${myorder?.partnerCNPJ}`}</h2>

							<div className="divider before:bg-black after:bg-black before:border-t-[1px] after:border-t-[1px]"></div>

							{myorder &&
								myorder.customerAddress &&
								myorder.customerAddress.length > 0 &&
								myorder.customerAddress.map((myAddress) => (
									<div key={myAddress?._id || myAddress?.id}>
										<h1 className="text-lg font-semibold mb-3">
											Endereço de entrega e cobrança
										</h1>
										<h2>
											{`Endereço: ${myAddress?.street}`}
										</h2>
										<h2>
											{`Complemento: ${myAddress?.complement}`}
										</h2>
										<h2>
											{`Bairro: ${myAddress?.neighborhood}`}
										</h2>
										<h2>
											{`Cidade/Estado: ${myAddress?.city}/${myAddress?.state}`}
										</h2>
										<h2>{`CEP: ${myAddress?.postalCode}`}</h2>
									</div>
								))}
						</div>

						{/* Gadget 4 */}
						<div className="bg-white  w-[325px] p-6 rounded-md shadow-md mt-4">
							<div className="mb-4 text-black">
								<h1>
									{`Tranportadora: ${
										myorder?.logisticOperator
											? myorder?.logisticOperator
											: "A definir"
									}`}
								</h1>
								{/* {myorder?.shippingCostTotal ? (
									<h2>
										{`Custo do Frete: ${`${
											myorder?.shippingCostTotal?.toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
										})}`}`}
									</h2>
								) : (
									`Custo do Frete: R$ 0,00`
								)} */}

								<div>{`Status: ${translateOrderShipping()}`}</div>

								<div className="flex flex-row gap-2">
									Cód. de Rastreio:
									{myorder && myorder?.trackingCode ? (
										<div className="bg-primary text-white cursor-pointer transition-all ease-in duration-150 active:scale-[.95] rounded shadow-md px-2">
											{myorder?.trackingCode}
										</div>
									) : (
										<> — </>
									)}
								</div>

								{myorder?.statusShipping === "Shipped" && (
									<div className="mt-4 mb-2">
										{packedLoading ? (
											<button className="btn btn-primary w-full">
												<span className="loading loading-spinner loading-sm"></span>
											</button>
										) : (
											<button
												onClick={handleReceived}
												className="btn btn-primary w-full mb-4">
												<span>
													Marcar como recebido
												</span>
												<LuPackageCheck size={20} />
											</button>
										)}
									</div>
								)}

								{myorder?.statusShipping === "Delivered" &&
									myorder?.markedDeliveredBy ===
										"partner" && (
										<div className="mt-4 mb-2">
											{packedLoading ? (
												<button className="btn btn-primary w-full">
													<span className="loading loading-spinner loading-sm"></span>
												</button>
											) : (
												<button
													onClick={handleNotReceived}
													className="btn btn-primary w-full">
													<span>
														Não recebi o pedido
													</span>
													<LuPackageX size={20} />
												</button>
											)}
										</div>
									)}
							</div>
						</div>

						{/* Gadget 5 */}
						{myorder?.statusShipping === "Not Delivered" && (
							<div className="bg-white w-[325px] p-6 border-2 border-dashed border-violet-900 rounded-md shadow-md mt-4 flex flex-col gap-2 mb-4">
								<p className="text-base font-semibold text-black mb-2">
									O vendedor está verificando junto a
									transportadora o que houve com o seu pedido.
									Ele tem até 3 dias para dar uma resposta.
								</p>

								{packedLoading ? (
									<button className="flex items-center justify-center bg-primary py-1 h-[35px] rounded shadow-md mb-2">
										<span className="loading loading-spinner loading-xs"></span>
									</button>
								) : (
									<button
										onClick={handleReceived}
										className="flex items-center justify-center bg-primary py-1 h-[35px] rounded shadow-md cursor-pointer transition-all ease-in duration-200 active:scale-[.97] mb-2">
										Pedido encontrado e entregue
									</button>
								)}

								{(() => {
									const updatedAt = new Date(
										myorder.updatedAt
									);
									const now = new Date();
									const diffInMs =
										now.getTime() - updatedAt.getTime();
									const diffInDays =
										diffInMs / (1000 * 60 * 60 * 24);

									if (diffInDays >= 3) {
										return (
											<button className="bg-primary py-1 rounded shadow-md cursor-pointer transition-all ease-in duration-200 active:scale-[.97]">
												Pedir ajuda do Mononoke
											</button>
										);
									}

									return null;
								})()}
							</div>
						)}
					</div>
				</div>

				{/* Rastreio do Pedido */}
				<div className="flex flex-col justify-center items-center gap-4 bg-white w-[1200px] p-6 rounded-md shadow-md mt-4 mr-4">
					<h1 className="bg-primary text-xl font-semibold text-white text-center w-full py-2 rounded-md shadow-md">
						Acompanhe seu pedido
					</h1>
					{/* <h2>
						Previsão de entrega:{" "}
						{format(new Date(tracking.dtPrevEnt), "dd/MM")}
					</h2> */}

					{
						// Se tracking ou tracking2 forem undefined ou contiverem um erro
						(!tracking ||
							tracking.error ||
							Object.keys(tracking).length === 0) &&
							tracking2?.length === undefined && (
								<ul className="steps steps-vertical mb-8">
									{/* Exibe "Pedido Realizado" se o statusOrder for "Realizado" */}
									{myorder?.statusOrder === "Realizado" ? (
										<li
											data-content="✓"
											className="step step-primary h-[180px]">
											<div className="flex flex-col gap-1">
												<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
													Pedido Realizado
												</span>
												<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
													{format(
														new Date(
															myorder?.createdAt
														),
														"dd/MM - HH:mm"
													)}{" "}
													hs
												</span>
												<span className="bg-primary py-1 px-2 rounded shadow-md">
													Pagamento Pendente
												</span>
											</div>
										</li>
									) : null}

									{/* Exibe "Pagamento Confirmado" se statusOrder for "Confirmado" */}
									{myorder?.statusOrder === "Confirmado" && (
										<li
											data-content="✓"
											className="step step-primary h-[180px]">
											<div className="flex flex-col gap-1">
												<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
													Pagamento Confirmado
												</span>
												<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
													{format(
														new Date(
															myorder?.createdAt
														),
														"dd/MM - HH:mm"
													)}{" "}
													hs
												</span>
												<span className="bg-primary py-1 px-2 rounded shadow-md">
													A loja começará a preparar
													seu pedido
												</span>
											</div>
										</li>
									)}

									{/* Exibe "Embalado" se statusShipping for "Embalado" */}
									{myorder?.statusShipping === "Embalado" && (
										<li
											data-content="✓"
											className="step step-primary h-[180px]">
											<div className="flex flex-col gap-1">
												<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
													Embalado
												</span>
												<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
													Seu pedido será enviado em
													breve
												</span>
												<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
													{format(
														new Date(
															myorder?.dateMarkedPacked
														),
														"dd/MM - HH:mm"
													)}{" "}
													hs
												</span>
											</div>
										</li>
									)}
									{/* Se o trackingCode for vazio, exibe um "X" */}
									{myorder?.trackingCode === "" && (
										<li data-content="✕" className="step">
											<div className="flex flex-col gap-1 bg-black py-1 px-2 rounded shadow-md">
												—
											</div>
										</li>
									)}
								</ul>
							)
					}

					{tracking && Object.keys(tracking).length > 0 && (
						<ul className="steps steps-vertical mb-8">
							{/* Renderizar uma li vazia antes do histórico */}
							{myorder?.statusOrder === "Realizado" ? (
								<li
									data-content="✓"
									className="step step-primary h-[180px]">
									<div className="flex flex-col gap-1">
										<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
											Pedido Realizado
										</span>
										<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
											{format(
												new Date(myorder?.createdAt),
												"dd/MM - HH:mm"
											)}{" "}
											hs myorder?.dateMarkedPacked
										</span>

										<span className="bg-primary py-1 px-2 rounded shadow-md">
											Pagamento Pendente
										</span>
									</div>
								</li>
							) : (
								<></>
							)}

							{/* Renderizar o X se não houver Código de Rastreio */}
							{/* {myorder?.trackingCode === "" && (
								<li data-content="✕" className="step">
									<div className="flex flex-col gap-1 bg-black py-1 px-2 rounded shadow-md">
										—
									</div>
								</li>
							)} */}

							{/* Renderizar o histórico Kangu */}
							{tracking?.historico && (
								<>
									{[
										// Adiciona os itens do histórico de tracking ao array
										...(tracking?.historico
											? Object.values(
													tracking?.historico
											  ).map((item) => ({
													...item, // Mantém os valores originais
													type: "tracking", // Adiciona um indicador para diferenciar
													dateTime: new Date(
														item?.dataHora
													),
											  }))
											: []),
										// Adiciona as etapas de status ao array, se as condições forem atendidas
										...(myorder?.statusOrder ===
											"Confirmado" ||
										myorder?.statusShipping ===
											"Embalado" ||
										myorder?.statusShipping === "Enviado" ||
										myorder?.statusOrder === "Entregue" ||
										myorder?.statusOrder === "Concluído"
											? [
													{
														ocorrencia:
															"Pagamento Confirmado",
														observacao:
															"A loja começará a preparar seu pedido",
														dateTime: new Date(
															myorder?.createdAt
														),
														type: "status",
													},
											  ]
											: []),
										...(myorder?.statusShipping ===
											"Embalado" ||
										myorder?.statusShipping === "Enviado" ||
										myorder?.statusOrder === "Entregue" ||
										myorder?.statusOrder === "Concluído"
											? [
													{
														ocorrencia: "Embalado",
														observacao:
															"Seu pedido será enviado em breve",
														dateTime: new Date(
															myorder?.dateMarkedPacked
														), // Exemplo de data
														type: "status",
													},
											  ]
											: []),
									]

										// Ordena por data/hora
										.sort((a, b) => a.dateTime - b.dateTime)
										// Mapeia os itens para exibir
										.map((item, index) => (
											<li
												key={index}
												data-content="✓"
												className="step step-primary h-[180px]">
												<div className="flex flex-col gap-1">
													<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
														{item?.ocorrencia}
													</span>
													<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
														{format(
															item.dateTime,
															"dd/MM - HH:mm"
														)}{" "}
														hs
													</span>
													<span className="bg-primary py-1 px-2 rounded shadow-md">
														{item?.observacao}
													</span>
												</div>
											</li>
										))}
								</>
							)}
							{tracking?.situacao && (
								<>
									{/* Renderizar somente se for entregue */}
									{myorder?.statusShipping === "Concluído" &&
										myorder?.statusOrder ===
											"Concluído" && (
											<li
												data-content="✓"
												className="step step-primary">
												<div className="flex flex-col gap-1">
													<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
														Concluído
													</span>
													<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
														{format(
															new Date(
																myorder?.updatedAt
															),
															"dd/MM - HH:mm"
														)}{" "}
														hs
													</span>
													<span className="bg-primary py-1 px-2 rounded shadow-md">
														Pedido finalizado
													</span>
												</div>
											</li>
										)}
									{/* Renderizar o X se o pedido não estiver Concluído */}
									{myorder?.trackingCode !== "" &&
										myorder?.statusShipping !==
											"Concluído" &&
										myorder?.statusOrder !==
											"Concluído" && (
											<li
												data-content="✕"
												className="step">
												<div className="flex flex-col gap-1 bg-black py-1 px-2 rounded shadow-md">
													—
												</div>
											</li>
										)}
								</>
							)}
						</ul>
					)}

					{/* //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}
					{tracking2 && Object.keys(tracking2).length > 0 && (
						<ul className="steps steps-vertical mb-8">
							{/* Renderizar uma li vazia antes do histórico */}
							{myorder?.statusOrder === "Realizado" ? (
								<li
									data-content="✓"
									className="step step-primary h-[180px]">
									<div className="flex flex-col gap-1">
										<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
											Pedido Realizado
										</span>
										<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
											{format(
												new Date(myorder?.createdAt),
												"dd/MM - HH:mm"
											)}{" "}
											hs
										</span>

										<span className="bg-primary py-1 px-2 rounded shadow-md">
											Pagamento Pendente
										</span>
									</div>
								</li>
							) : (
								<></>
							)}

							{(myorder?.statusOrder === "Confirmado" ||
								myorder?.statusShipping === "Embalado" ||
								myorder?.statusShipping === "Enviado" ||
								myorder?.statusOrder === "Entregue" ||
								myorder?.statusOrder === "Concluído") && (
								<li
									data-content="✓"
									className="step step-primary h-[180px]">
									<div className="flex flex-col gap-1">
										<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
											Pagamento Confirmado
										</span>
										<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
											{format(
												new Date(myorder?.createdAt),
												"dd/MM - HH:mm"
											)}{" "}
											hs
										</span>

										<span className="bg-primary py-1 px-2 rounded shadow-md">
											A loja começará a preparar seu
											pedido
										</span>
									</div>
								</li>
							)}

							{myorder?.statusShipping === "Embalado" ||
							myorder?.statusShipping === "Enviado" ||
							myorder?.statusOrder === "Entregue" ||
							myorder?.statusOrder === "Concluído" ? (
								<li
									data-content="✓"
									className="step step-primary h-[180px]">
									<div className="flex flex-col gap-1">
										<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
											Embalado
										</span>
										<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
											{format(
												new Date(
													myorder?.dateMarkedPacked
												),
												"dd/MM - HH:mm"
											)}{" "}
											hs
										</span>

										<span className="bg-primary py-1 px-2 rounded shadow-md">
											Seu pedido será enviado em breve
										</span>
									</div>
								</li>
							) : (
								<></>
							)}

							{/* Renderizar o histórico Correios */}
							{tracking2 &&
								tracking2?.tracks &&
								tracking2.tracks.map((item, index) => (
									<li
										key={index}
										data-content="✓"
										className="step step-primary h-[180px]">
										<div className="flex flex-col gap-1">
											<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
												{item?.status}
											</span>
											<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
												{`${format(
													new Date(
														convertDate(item?.date)
													),
													"dd/MM"
												)} - ${item?.hour}`}{" "}
												hs
											</span>
											<span className="bg-primary py-1 px-2 rounded shadow-md">
												{item?.local}
											</span>
										</div>
									</li>
								))}

							{/* Renderizar somente se for entregue */}
							{myorder?.statusShipping === "Concluído" && (
								<li
									data-content="✓"
									className="step step-primary">
									<div className="flex flex-col gap-1">
										<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
											Concluído
										</span>
										<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
											{format(
												new Date(myorder.updatedAt),
												"dd/MM - HH:mm"
											)}{" "}
											hs
										</span>
										<span className="bg-primary py-1 px-2 rounded shadow-md">
											Pedido finalizado
										</span>
									</div>
								</li>
							)}

							{/* Renderizar o histórico Kangu */}
							{myorder?.trackingCode !== "" &&
								myorder?.statusShipping !== "Concluído" && (
									<li data-content="✕" className="step">
										<div className="flex flex-col gap-1 bg-black py-1 px-2 rounded shadow-md">
											—
										</div>
									</li>
								)}
						</ul>
					)}
				</div>
			</div>
		</section>
	);
}

export default MyOrderByIDPage;
