"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos

// Icons

// Axios
import api from "@/utils/api";

function MySalesPage() {
	const [mysales, setMysales] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await api.get("/orders/partner-orders", {
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				});
				if (response.data && response.data.orders) {
					setMysales(response.data.orders);
				} else {
					console.error("Dados de pedidos inválidos:", response.data);
				}
			} catch (error) {
				console.error("Erro ao obter dados do usuário:", error);
			}
		};
		fetchData();
	}, [token]);

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-white w-[1200px] p-6 rounded-md mt-4 mr-4">
						{/* Adicionar Order */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold text-black">
								Minhas Vendas
							</h1>

							{/* Lista de Pedidos */}
							<div className="overflow-x-auto">
								<table className="table">
									{/* head */}
									<thead>
										<tr>
											<th className="text-sm text-black">
												Produtos
											</th>
											<th className="text-sm text-black">
												Total do Pedido
											</th>
											<th className="text-sm text-black">
												Status
											</th>
											<th className="text-sm text-black">
												Comprador
											</th>
											<th className="text-sm text-black">
												ID do Pedido
											</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}
										{mysales.length > 0 &&
											mysales.map((mysale) => (
												<tr key={mysale._id}>
													<td>
														{mysale.itemsList.map(
															(item, index) => (
																<div
																	key={index}
																	className="flex items-center gap-3 mb-2">
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
																				<span className="text-black">
																					{
																						item.productName
																					}
																					{index !==
																						mysale
																							.itemsList
																							.length -
																							1}
																				</span>
																			</h2>
																		</div>
																	</div>
																</div>
															)
														)}
													</td>
													<td className="text-black">
														{mysale.customerOrderCostTotal.toLocaleString(
															"pt-BR",
															{
																style: "currency",
																currency: "BRL",
															}
														)}
														<br />
														<span className="badge badge-success badge-sm shadow-md">
															{
																mysale.paymentMethod
															}
														</span>
													</td>
													<td className="text-black">
														<div>
															{mysale.statusOrder}
														</div>
														{/* <div className="text-xs opacity-50">
															{
																myorder.daysShipping
															}{" "}
															dias
														</div> */}
													</td>
													<td className="text-black w-[200px] overflow-x-auto">
														{mysale.customerName}
													</td>
													<td className="text-xs text-black">
														{mysale.orderID}
													</td>
													<th className="text-black">
														<button className="flex items-center btn btn-ghost btn-xs">
															<Link
																href={`/dashboard/mysales/${mysale._id}`}>
																+ Detalhes
															</Link>
														</button>{" "}
													</th>
												</tr>
											))}
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
				</div>
			</div>
		</section>
	);
}

export default MySalesPage;
