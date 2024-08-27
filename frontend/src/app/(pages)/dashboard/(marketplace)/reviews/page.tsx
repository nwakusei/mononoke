"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos

// Icons

function ReviewsPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [orders, setOrders] = useState([]);

	useEffect(() => {
		const fethData = async () => {
			try {
				const response = await api.get("/orders/customer-orders", {
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				});

				if (response.data && response.data.orders) {
					setOrders(response.data.orders);
				} else {
					console.error("Dados de pedidos inválidos:", response.data);
				}
			} catch (error) {
				console.error("Erro ao obter dados do Pedido:", error);
			}
		};

		fethData();
	}, [token]);

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="h-screen col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mt-4">
						{/* Adicionar Porduto */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold text-black">
								Pedidos com avaliação pendente
							</h1>

							{/* Produtos em Catálogo */}
							<div className="overflow-x-auto">
								<table className="table">
									{/* head */}
									<thead>
										<tr>
											<th className="text-sm text-black">
												Nome do Produto
											</th>
											<th className="text-sm text-black">
												Status
											</th>
											<th className="text-sm text-black">
												ID do Pedido
											</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{orders
											.filter(
												(order) =>
													order.statusOrder ===
													"Entregue"
											)
											.map((order) => (
												<tr key={order._id}>
													<td>
														{order.itemsList.map(
															(item, index) => (
																<div
																	key={index}
																	className="flex items-center gap-3 mb-2">
																	<div className="avatar">
																		<div className="mask mask-squircle w-12 h-12">
																			<Image
																				src={`http://localhost:5000/images/products/${item.productImage}`} // Troque example.com pelo seu domínio real ou caminho para as imagens
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
																			<h2 className="w-[250px] overflow-x-auto mb-2 text-black">
																				{
																					item.productName
																				}
																			</h2>
																		</div>
																		<div className="text-sm text-black opacity-50">
																			{
																				item.category
																			}
																		</div>
																	</div>
																</div>
															)
														)}
													</td>

													<td>
														<div className="text-black">
															{
																order.statusShipping
															}
														</div>
													</td>

													<td>
														<div className="text-black">
															{order.orderID}
														</div>
													</td>
													<th>
														<button className="flex items-center btn btn-primary btn-xs shadow-md">
															<Link
																href={`/dashboard/reviews/${order._id}`}>
																Avaliar
															</Link>
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

export default ReviewsPage;
