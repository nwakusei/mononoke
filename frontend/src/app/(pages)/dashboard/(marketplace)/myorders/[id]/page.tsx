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
import { BiIdCard } from "react-icons/Bi";
import { PiCreditCardBold } from "react-icons/pi";

function MyOrderByIDPage() {
	const { id } = useParams();
	const [token] = useState(localStorage.getItem("token") || "");
	// const [token] = useState(() => {
	// 	if (typeof window !== "undefined") {
	// 		return localStorage.getItem("token") || "";
	// 	} else {
	// 		return "";
	// 	}
	// });
	const [myorder, setMyorder] = useState([]);
	const [tracking, setTracking] = useState({});

	console.log(tracking);

	const formattedDate = myorder.createdAt
		? `${format(new Date(myorder.createdAt), "dd/MM/yyyy HH:mm")} hs`
		: "";

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
				const response = await api.post(
					`/orders/order-tracking/${id}`,
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

		fetchShipping();
	}, [token, id]);

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="flex flex-col bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				{/* Gadget 1 */}
				<div className="flex flex-row items-center gap-4 bg-purple-400 w-[1200px] p-6 rounded-md mt-4 mr-4">
					<div className="flex flex-col">
						<h1 className="text-lg">
							ID do Pedido: {myorder.orderNumber}
						</h1>
						<h2>Data do Pagamento: {formattedDate}</h2>
					</div>
					<button className="btn btn-error">Cancelar Pedido</button>{" "}
					<button className="btn btn-error">
						Solcitar Cancelamento
					</button>
				</div>

				<div className="flex flex-row w-[1200px]">
					{/* Gadget 2 */}
					<div className="bg-purple-400 w-[900px] p-6 rounded-md mt-4 mr-4">
						{/* Adicionar Order */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold">
								Lista de Produtos
							</h1>

							{/* Lista de Produtos */}
							<div className="overflow-x-auto">
								<table className="table mb-8">
									{/* head */}
									<thead>
										<tr>
											<th className="text-sm">Produto</th>
											<th className="text-sm">
												Quantidade
											</th>
											<th className="text-sm">Valor</th>
											<th className="text-sm">Total</th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}
										{Array.isArray(myorder.itemsList) &&
											myorder.itemsList.length > 0 &&
											myorder.itemsList.map(
												(item, index) => (
													<tr key={index}>
														<td>
															<div className="flex items-center gap-3 mb-2">
																<div className="avatar">
																	<div className="mask mask-squircle w-12 h-12">
																		<Image
																			src={`http://localhost:5000/images/products/${item.productImage}`}
																			alt={
																				item.productName
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
																				item.productName
																			}
																		</h2>
																	</div>
																</div>
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
											<th className="text-sm">
												Subtotal
											</th>
											<th className="text-sm">
												Subtotal Frete
											</th>
											<th className="text-sm">
												Desconto
											</th>
											<th className="text-sm">
												Total do Pedido
											</th>
											<th className="text-sm">
												Otaku Points a receber
											</th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}

										<tr>
											<td>
												{Array.isArray(
													myorder.itemsList
												) &&
													myorder.itemsList.length >
														0 && (
														<div>
															{myorder.itemsList
																.reduce(
																	(
																		total,
																		item
																	) =>
																		total +
																		item.productPrice,
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
													{myorder.shippingCostTotal >
														0 &&
														myorder.shippingCostTotal.toLocaleString(
															"pt-BR",
															{
																style: "currency",
																currency: "BRL",
															}
														)}
												</div>
											</td>

											<td>
												{Array.isArray(
													myorder.itemsList
												) &&
													myorder.itemsList.length >
														0 && (
														<div>
															{(() => {
																const productTotal =
																	myorder.itemsList.reduce(
																		(
																			total,
																			item
																		) =>
																			total +
																			item.productPrice,
																		0
																	);
																const totalWithShipping =
																	productTotal +
																	myorder.shippingCostTotal;
																const discount =
																	totalWithShipping -
																	myorder.customerOrderCostTotal;

																// Formata o desconto para o formato de moeda brasileira (BRL)
																const formattedDiscount =
																	discount.toLocaleString(
																		"pt-BR",
																		{
																			style: "currency",
																			currency:
																				"BRL",
																		}
																	);

																// Adiciona o sinal de menos diretamente ao valor do desconto se necessário
																return discount >
																	0
																	? `- ${formattedDiscount}`
																	: formattedDiscount;
															})()}
														</div>
													)}
											</td>

											<td>
												<div>
													{myorder.customerOrderCostTotal >
														0 &&
														myorder.customerOrderCostTotal.toLocaleString(
															"pt-BR",
															{
																style: "currency",
																currency: "BRL",
															}
														)}
												</div>
											</td>

											<td>
												<div>250 OP</div>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>

					<div className="flex flex-col">
						{/* Gadget 3 */}
						<div className="bg-purple-400 w-[325px] p-6 rounded-md mt-4">
							<h1 className="text-lg">
								Nome: {myorder.customerName}
							</h1>
							<h2>CPF: 000.000.000-00</h2>

							<div className="divider"></div>

							<h1 className="text-lg mb-3">
								Endereço de entrega e cobrança
							</h1>
							<h2>Endereço: 000.000.000-00</h2>
							<h2>Bairro: 000.000.000-00</h2>
							<h2>Cidade/Estado: 000.000.000-00</h2>
							<h2>CEP: 00000-000</h2>
						</div>

						{/* Gadget 4 */}
						<div className="bg-purple-400 w-[325px] p-6 rounded-md mt-4">
							<div className="mb-4">
								<h1>Tranportadora: {myorder.shippingMethod}</h1>
								{myorder.shippingCostTotal && (
									<h2>
										Valor:{" "}
										{myorder.shippingCostTotal.toLocaleString(
											"pt-BR",
											{
												style: "currency",
												currency: "BRL",
											}
										)}
									</h2>
								)}
								<h2>Status: {myorder.statusShipping}</h2>
								<h2>
									Cód. de Rastreio:{" "}
									<span className="bg-blue-500 px-2 rounded-md">
										{myorder.trackingCode}
									</span>
								</h2>
							</div>
						</div>
					</div>
				</div>

				{/* Rastreio do Pedido */}
				<div className="flex flex-col justify-center items-center gap-4 bg-purple-400 w-[1200px] p-6 rounded-md mt-4 mr-4">
					<h1 className="text-xl font-semibold">
						Acompanhe seu pedido
					</h1>
					<ul className="steps steps-vertical  mt-8 mb-8">
						{/* Renderizar uma li vazia antes do histórico */}
						<li
							data-content="✓"
							className="step step-primary h-[180px]">
							<div className="flex flex-col gap-1">
								<span className="bg-purple-500 py-1 px-2 rounded shadow-md mb-2">
									Embalado
								</span>
								<span className="bg-purple-500 py-1 px-2 rounded shadow-md mb-2">
									10/04 - 16:00 hs
								</span>
								<span className="bg-purple-500 py-1 px-2 rounded shadow-md">
									Em processamento de manuseio
								</span>
							</div>
						</li>
						{/* Renderizar o histórico */}
						{tracking.historico &&
							Object.values(tracking.historico)
								// Ordenar o histórico pela data e horário
								.sort((a, b) => {
									const dateA = new Date(a.dataHora);
									const dateB = new Date(b.dataHora);

									return dateA - dateB;
								})
								// Mapear cada item do histórico
								.map((item, index) => (
									<li
										key={index}
										data-content="✓"
										className="step step-primary">
										<div className="flex flex-col gap-1">
											<span className="bg-purple-500 py-1 px-2 rounded shadow-md mb-2">
												{item.ocorrencia}
											</span>
											<span className="bg-purple-500 py-1 px-2 rounded shadow-md mb-2">
												{format(
													new Date(item.dataHora),
													"dd/MM - HH:mm"
												)}{" "}
												hs
											</span>
											<span className="bg-purple-500 py-1 px-2 rounded shadow-md">
												{item.observacao}
											</span>
										</div>
									</li>
								))}
						{tracking.situacao && (
							<>
								{tracking.situacao.ocorrencia !==
									"Entregue" && (
									<li
										data-content="✓"
										className="step step-primary">
										<div className="flex flex-col gap-1">
											<span className="bg-purple-500 py-1 px-2 rounded shadow-md mb-2">
												{tracking.situacao.ocorrencia}
											</span>
											<span className="bg-purple-500 py-1 px-2 rounded shadow-md mb-2">
												{format(
													new Date(
														tracking.situacao.dataHora
													),
													"dd/MM - HH:mm"
												)}{" "}
												hs
											</span>
											<span className="bg-purple-500 py-1 px-2 rounded shadow-md">
												{tracking.situacao.observacao}
											</span>
										</div>
									</li>
								)}
								{/* Renderizar uma li vazia se não for entregue */}
								{tracking.situacao.ocorrencia !==
									"Concluído" && (
									<li data-content="✕" className="step">
										<div className="flex flex-col gap-1 bg-black py-1 px-2 rounded shadow-md">
											—
										</div>
									</li>
								)}
								{/* Renderizar somente se for entregue */}
								{tracking.situacao.ocorrencia ===
									"Concluído" && (
									<li
										data-content="✓"
										className="step step-primary">
										<div className="flex flex-col gap-1">
											<span className="bg-purple-500 py-1 px-2 rounded shadow-md mb-2">
												{tracking.situacao.ocorrencia}
											</span>
											<span className="bg-purple-500 py-1 px-2 rounded shadow-md mb-2">
												{format(
													new Date(
														tracking.situacao.dataHora
													),
													"dd/MM - HH:mm"
												)}{" "}
												hs
											</span>
											<span className="bg-purple-500 py-1 px-2 rounded shadow-md">
												{tracking.situacao.observacao}
											</span>
										</div>
									</li>
								)}
							</>
						)}
					</ul>
				</div>
			</div>
		</section>
	);
}

export default MyOrderByIDPage;
