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

	const formattedDate = mysale.createdAt
		? `${format(new Date(mysale.createdAt), "dd/MM/yyyy HH:mm")} hs`
		: "";

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
			} catch (error) {
				console.error("Erro ao obter dados do usuário:", error);
			}
		};
		fetchOrder();
	}, [token, id]);

	async function handleTracking(e) {
		e.preventDefault();
		try {
			const response = await api.patch(
				`/orders/update-trackingcode/${id}`,
				{ trackingCode },
				{ headers: { Authorization: `Bearer ${JSON.parse(token)}` } }
			);
			console.log("Response:", response); // Verifique se esta linha é executada
			toast.success(response.data.message);
		} catch (error) {
			toast.error(error.response.data.message);
			console.error("Erro ao atualizar o código de rastreamento:", error);
		}
	}

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
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="flex flex-col bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				{/* Gadget 1 */}
				<div className="flex flex-row items-center gap-4 bg-purple-400 w-[1200px] p-6 rounded-md mt-4 mr-4">
					<div className="flex flex-col">
						<h1 className="text-lg">
							ID do Pedido: {mysale.orderNumber}
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
										{Array.isArray(mysale.itemsList) &&
											mysale.itemsList.length > 0 &&
											mysale.itemsList.map(
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
											<th className="text-sm">Total</th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}

										<tr>
											<td>
												{Array.isArray(
													mysale.itemsList
												) &&
													mysale.itemsList.length >
														0 && (
														<div>
															{mysale.itemsList
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
													{mysale.shippingCostTotal >
														0 &&
														mysale.shippingCostTotal.toLocaleString(
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
													mysale.itemsList
												) &&
													mysale.itemsList.length >
														0 && (
														<div>
															{(() => {
																const productTotal =
																	mysale.itemsList.reduce(
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
																	mysale.shippingCostTotal;
																const discount =
																	totalWithShipping -
																	mysale.customerOrderCostTotal;

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
													{mysale.customerOrderCostTotal >
														0 &&
														mysale.customerOrderCostTotal.toLocaleString(
															"pt-BR",
															{
																style: "currency",
																currency: "BRL",
															}
														)}
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
											<th className="text-sm">
												Comissão a ser Paga
											</th>
											<th className="text-sm">
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
														mysale.partnerCommissionOtamart
													)?.toLocaleString("pt-BR", {
														style: "currency",
														currency: "BRL",
													})}
												</div>
											</td>

											<td>
												{(
													mysale.customerOrderCostTotal -
													decrypt(
														mysale.partnerCommissionOtamart
													)
												)?.toLocaleString("pt-BR", {
													style: "currency",
													currency: "BRL",
												})}
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
								Nome: {mysale.customerName}
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
								<h1>Tranportadora: {mysale.shippingMethod}</h1>
								{mysale.shippingCostTotal && (
									<h2>
										Valor:{" "}
										{mysale.shippingCostTotal.toLocaleString(
											"pt-BR",
											{
												style: "currency",
												currency: "BRL",
											}
										)}
									</h2>
								)}
								<h2>Status: {mysale.statusShipping}</h2>
							</div>

							<form onSubmit={handleTracking}>
								<label className="form-control w-full max-w-xs mb-4">
									<input
										type="text"
										placeholder="Insira o código de Rastreio"
										className="input input-bordered w-full"
										value={trackingCode}
										onChange={(e) =>
											setTrackingCode(e.target.value)
										}
									/>
									<div className="label">
										<span className="label-text-alt">
											Msg de erro a ser exibida
										</span>
									</div>
								</label>
								<button
									type="submit"
									className="btn btn-primary w-full">
									Enviar <GrMapLocation size={20} />
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default MySaleByIDPage;
