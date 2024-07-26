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

function MyOrdersPage() {
	const [myorders, setMyorders] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await api.get("/orders/customer-orders", {
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				});
				if (response.data && response.data.orders) {
					setMyorders(response.data.orders);
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
			<div className="h-screen col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-purple-400 w-[1200px] h-full p-6 rounded-md mt-4 mr-4">
						{/* Adicionar Order */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold">
								Meus Pedidos
							</h1>

							{/* Lista de Pedidos */}
							<div className="overflow-x-auto">
								<table className="table">
									{/* head */}
									<thead>
										<tr>
											<th className="text-base">
												Produtos
											</th>
											<th className="text-base">
												Total do Pedido
											</th>
											<th className="text-base">
												Status
											</th>
											<th className="text-base">
												ID do Pedido
											</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}
										{myorders.length > 0 &&
											myorders.map((myorder) => (
												<tr key={myorder._id}>
													<td>
														{myorder.itemsList.map(
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
																				<span>
																					{
																						item.productName
																					}
																					{index !==
																						myorder
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
													<td>
														{myorder.customerOrderCostTotal.toLocaleString(
															"pt-BR",
															{
																style: "currency",
																currency: "BRL",
															}
														)}
														<br />
														<span className="badge badge-success badge-sm">
															{
																myorder.paymentMethod
															}
														</span>
													</td>
													<td>
														<div>
															{
																myorder.statusOrder
															}
														</div>
														{/* <div className="text-xs opacity-50">
															{
																myorder.daysShipping
															}{" "}
															dias
														</div> */}
													</td>
													<td className="text-xs">
														{myorder.orderID}
													</td>
													<th>
														<button className="flex flex-row items-center btn btn-info btn-xs w-[80px]">
															<Link
																href={`/dashboard/myorders/${myorder._id}`}>
																+ Detalhes
															</Link>
															{/* <div className="btn btn-error btn-xs w-[80px]">
																<span className="loading loading-dots loading-sm"></span>
															</div> */}
														</button>
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

export default MyOrdersPage;
