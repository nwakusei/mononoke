"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

// Components
import { Sidebar } from "@/components/Sidebar";

// Axios
import api from "@/utils/api";

// icons
import { GrMapLocation } from "react-icons/gr";

function MyOrderByIDPage() {
	const { id } = useParams();
	const [token] = useState(localStorage.getItem("token") || "");
	const [myorder, setMyorder] = useState([]);

	console.log(myorder);

	useEffect(() => {
		const fetchOrder = async () => {
			try {
				const response = await api.get(`/orders/partner-orders/${id}`, {
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				});
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

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="flex flex-col bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				{/* Gadget 1 */}
				<div className="flex flex-row items-center gap-4 bg-purple-400 w-[1200px] p-6 rounded-md mt-4 mr-4">
					<h1 className="text-lg">
						ID do Pedido: {myorder.orderNumber}
					</h1>
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
								<table className="table">
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
																		<img
																			src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
																			alt="Avatar Tailwind CSS Component"
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

									{/* foot */}
									<tfoot>
										<tr>
											<th></th>
											<th>Name</th>
											<th>Job</th>
											<th>Favorite Color</th>
											<th></th>
										</tr>
									</tfoot>
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

							<h1 className="text-lg">
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
							</div>
							<label className="flex flex-col w-[300px] pr-6">
								<div className="flex flex-col w-full">
									<input
										type="text"
										placeholder="Insira o código de Rastreio"
										className="input input-bordered w-full mb-2"
									/>
								</div>
								<button className="btn btn-primary  w-full">
									<GrMapLocation size={20} /> Enviar
								</button>
							</label>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default MyOrderByIDPage;
