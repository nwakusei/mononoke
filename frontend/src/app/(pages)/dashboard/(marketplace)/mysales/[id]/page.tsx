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
import { PiNoteBold } from "react-icons/pi";
import { BsBoxSeam } from "react-icons/bs";
import { LuPackageCheck } from "react-icons/lu";

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

	const dateCreatedOrder = mysale.createdAt
		? `${format(new Date(mysale.createdAt), "dd/MM - HH:mm")} hs`
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
			setTrackingLoading(true);
			const response = await api.patch(
				`/orders/update-trackingcode/${id}`,
				{ trackingCode },
				{ headers: { Authorization: `Bearer ${JSON.parse(token)}` } }
			);
			console.log("Response:", response); // Verifique se esta linha é executada

			setTrackingLoading(false);
			toast.success(response.data.message);
		} catch (error) {
			setTrackingLoading(false);
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
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="flex flex-col col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				{/* Gadget 1 */}
				<div className="flex flex-row justify-between items-center gap-4 bg-white w-[1200px] p-6 rounded-md shadow-md mt-4 mr-4">
					<div className="flex flex-col">
						<h1 className="text-lg text-black">
							ID do Pedido: {mysale.orderID}
						</h1>
						<h2 className="text-black">
							Data do Pagamento: {dateCreatedOrder}
						</h2>
					</div>
					<div>
						{mysale.statusShipping === "Enviado" ? (
							<></>
						) : (
							<button className="btn btn-error text-white shadow-md">
								Cancelar Pedido
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
										{Array.isArray(mysale.itemsList) &&
											mysale.itemsList.length > 0 &&
											mysale.itemsList.map(
												(item, index) => (
													<tr key={index}>
														<td>
															<div className="flex items-center gap-3 mb-2">
																<div className="avatar">
																	<div className="mask mask-squircle w-12 h-12 pointer-events-none">
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
												Total
											</th>
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
													0
														? mysale.shippingCostTotal.toLocaleString(
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

					{/* Gadget 3 */}
					<div className="flex flex-col">
						<div className="bg-white w-[325px] p-6 rounded-md shadow-md mt-4 text-black">
							<h1 className="text-lg">
								Nome: {mysale.customerName}
							</h1>
							<h2>CPF: {mysale.customerCPF}</h2>

							<div className="divider before:border-t-[1px] after:border-t-[1px] before:bg-black after:bg-black"></div>

							{mysale.customerAddress &&
								mysale.customerAddress.length > 0 &&
								mysale.customerAddress.map((end) => (
									<div key={end._id}>
										<div className="text-lg mb-3">
											Endereço de entrega e cobrança
										</div>
										<div>Endereço: {end.logradouro}</div>
										<div>
											{end.complemento ? (
												`Complemento: ${end.complemento}`
											) : (
												<>—</>
											)}
										</div>
										<div>Bairro: {end.bairro}</div>
										<div>
											Cidade/UF: {end.cidade}/{end.uf}
										</div>
										<div>CEP: {end.cep}</div>
									</div>
								))}
						</div>

						{/* Gadget 4 */}
						<div className="bg-white w-[325px] p-6 rounded-md shadow-md mt-4">
							<div className="mb-4 text-black">
								<h1>Tranportadora: {mysale.shippingMethod}</h1>
								<h2>
									Valor:{" "}
									{mysale.shippingCostTotal > 0
										? mysale.shippingCostTotal.toLocaleString(
												"pt-BR",
												{
													style: "currency",
													currency: "BRL",
												}
										  )
										: "R$ 0,00"}
								</h2>
								<h2>Status: {mysale.statusShipping}</h2>
							</div>

							{mysale.trackingCode === "" ? (
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
											<span className="label-text-alt text-error">
												Msg de erro a ser exibida
											</span>
										</div>
									</label>
									<div className="mb-2">
										<button className="btn btn-primary w-full">
											<span>Marcar como embalado</span>
											{/* <LuPackageCheck size={20} /> */}
											<BsBoxSeam size={20} />
										</button>
									</div>
									<div>
										{trackingLoading ? (
											<button className="btn btn-primary w-full">
												<span className="loading loading-spinner loading-sm"></span>
												<span>Processando...</span>
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
							) : (
								<div className="flex flex-row gap-2">
									<div className="text-black">
										Cod. de Rastreio:
									</div>
									<div className="bg-primary rounded shadow-md px-2">
										{mysale.trackingCode}
									</div>
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
							{mysale.orderNote
								? mysale.orderNote
								: `Nenhuma nota adicionada...`}
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}

export default MySaleByIDPage;
