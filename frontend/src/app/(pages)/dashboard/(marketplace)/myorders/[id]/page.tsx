"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-toastify";
import crypto from "crypto";

const secretKey = "chaveSuperSecretaDe32charsdgklot";

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
	const [tracking2, setTracking2] = useState({});

	console.log(tracking);
	console.log(tracking2.tracks);

	console.log(myorder);

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

	// Função para Descriptografar dados sensíveis no Banco de Dados
	function decrypt(encryptedBalance: string): number | null {
		let decrypted = ""; // Declarando a variável fora do bloco try

		try {
			const decipher = crypto.createDecipheriv(
				"aes-256-cbc",
				Buffer.from(secretKey, "utf-8"),
				Buffer.alloc(16, 0)
			);

			decipher.setAutoPadding(false);

			decrypted = decipher.update(encryptedBalance, "hex", "utf8");
			decrypted += decipher.final("utf8");

			const balanceNumber = parseFloat(decrypted);
			if (isNaN(balanceNumber)) {
				return null;
			}
			return parseFloat(balanceNumber.toFixed(2));
		} catch (error) {
			console.error("Erro ao descriptografar o saldo:", error);
			return null;
		}
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
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
													<tr key={index}>
														<td>
															<div className="flex items-center gap-3 mb-2">
																<div className="avatar">
																	<div className="mask mask-squircle w-12 h-12">
																		<Image
																			src={`http://localhost:5000/images/products/${item?.productImage}`}
																			alt={
																				item?.productName
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
																	<div className="font-bold text-black">
																		<h2 className="w-[230px] overflow-x-hidden mb-2">
																			{
																				item?.productName
																			}
																		</h2>
																	</div>
																</div>
															</div>
														</td>

														<td>
															<div className="text-black">
																{item?.productPrice.toLocaleString(
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
															<div className="text-black">
																{`${item?.productQuantity} un`}
															</div>
														</td>
														<td className="w-[200px] overflow-x-auto">
															<div className="text-black">
																{(
																	item?.productQuantity *
																	item?.productPrice
																).toLocaleString(
																	"pt-BR",
																	{
																		style: "currency",
																		currency:
																			"BRL",
																	}
																)}
															</div>
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
													{myorder?.shippingCostTotal >
													0
														? myorder?.shippingCostTotal.toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
														  )
														: `R$ 0,00`}
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
																	const totalWithShipping =
																		productTotal +
																		myorder?.shippingCostTotal;
																	const discount =
																		totalWithShipping -
																		myorder?.customerOrderCostTotal;

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
												</div>
											</td>

											<td>
												<div className="text-black">
													{myorder?.customerOrderCostTotal >
														0 &&
														myorder?.customerOrderCostTotal.toLocaleString(
															"pt-BR",
															{
																style: "currency",
																currency: "BRL",
															}
														)}
												</div>
											</td>

											<td>
												<div className="text-black">
													{`${decrypt(
														myorder?.customerOtakuPointsEarned
													)?.toLocaleString()} OP`}
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
							<h1 className="text-lg">
								Loja: {myorder?.partnerName}
							</h1>
							<h2>CPF: 000.000.000-00</h2>

							<div className="divider before:bg-black after:bg-black before:border-t-[1px] after:border-t-[1px]"></div>

							<h1 className="text-lg mb-3">
								Endereço de entrega e cobrança
							</h1>
							<h2>Endereço: 000.000.000-00</h2>
							<h2>Bairro: 000.000.000-00</h2>
							<h2>Cidade/Estado: 000.000.000-00</h2>
							<h2>CEP: 00000-000</h2>
						</div>

						{/* Gadget 4 */}
						<div className="bg-white w-[325px] p-6 rounded-md shadow-md mt-4">
							<div className="mb-4 text-black">
								<h1>
									{`Transportadora: ${myorder?.shippingMethod}`}
								</h1>
								{myorder?.shippingCostTotal ? (
									<h2>
										{`Custo do Frete: ${myorder?.shippingCostTotal.toLocaleString(
											"pt-BR",
											{
												style: "currency",
												currency: "BRL",
											}
										)}`}
									</h2>
								) : (
									`Custo do Frete: R$ 0,00`
								)}
								<div>
									{`Status: ${myorder?.statusShipping}`}
								</div>
								<div className="flex flex-row gap-2">
									{`Cód. de Rastreio: ${
										myorder?.trackingCode ? (
											<span className="bg-primary text-white px-2 rounded-md shadow-md">
												{myorder?.trackingCode}
											</span>
										) : (
											`—`
										)
									}`}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Rastreio do Pedido */}
				<div className="flex flex-col justify-center items-center gap-4 bg-white w-[1200px] p-6 rounded-md shadow-md mt-4 mr-4">
					<h1 className="text-xl font-semibold text-black">
						Acompanhe seu pedido
					</h1>
					{/* <h2>
						Previsão de entrega:{" "}
						{format(new Date(tracking.dtPrevEnt), "dd/MM")}
					</h2> */}

					{tracking &&
						Object.keys(tracking).length <= 0 &&
						tracking2 &&
						Object.keys(tracking2).length <= 0 && (
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
													new Date(
														myorder?.createdAt
													),
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
												10/04 - 16:00 hs
											</span>

											<span className="bg-primary py-1 px-2 rounded shadow-md">
												Seu pedido será enviado em breve
											</span>
										</div>
									</li>
								) : (
									<></>
								)}

								{/* Renderizar o X se não houver Código de Rastreio */}
								{myorder?.trackingCode === "" && (
									<li data-content="✕" className="step">
										<div className="flex flex-col gap-1 bg-black py-1 px-2 rounded shadow-md">
											—
										</div>
									</li>
								)}
							</ul>
						)}

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
											10/04 - 16:00 hs
										</span>

										<span className="bg-primary py-1 px-2 rounded shadow-md">
											Seu pedido será enviado em breve
										</span>
									</div>
								</li>
							) : (
								<></>
							)}

							{/* Renderizar o X se não houver Código de Rastreio */}
							{myorder?.trackingCode === "" && (
								<li data-content="✕" className="step">
									<div className="flex flex-col gap-1 bg-black py-1 px-2 rounded shadow-md">
										—
									</div>
								</li>
							)}

							{/* Renderizar o histórico Kangu */}
							{tracking?.historico &&
								Object.values(tracking?.historico)
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
											className="step step-primary h-[180px]">
											<div className="flex flex-col gap-1">
												<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
													{item?.ocorrencia}
												</span>
												<span className="bg-primary py-1 px-2 rounded shadow-md mb-2">
													{format(
														new Date(
															item?.dataHora
														),
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
							{tracking?.situacao && (
								<>
									{/* Renderizar somente se for entregue */}
									{myorder?.statusShipping ===
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
											10/04 - 16:00 hs
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
											{myorder?.updatedAt}
											{/* {format(
													new Date(myorder.updatedAt),
													"dd/MM - HH:mm"
												)}{" "}
												hs */}
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
