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
	const [myorders, setMyorders] = useState([]);

	useEffect(() => {
		const fethData = async () => {
			try {
				const response = await api.get("/orders/partner-orders", {
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
				console.error("Erro ao obter dados do Pedido:", error);
			}
		};

		fethData();
	}, [token]);

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-purple-400 w-[1200px] p-6 rounded-md mt-4 mr-4">
						{/* Adicionar Porduto */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold">
								Pedidos com avaliação pendente
							</h1>

							{/* Produtos em Catálogo */}
							<div className="overflow-x-auto">
								<table className="table">
									{/* head */}
									<thead>
										<tr>
											<th>
												<label>
													<input
														type="checkbox"
														className="checkbox"
													/>
												</label>
											</th>

											<th className="text-sm">
												Nome do Produto
											</th>
											<th className="text-sm">Status</th>
											<th className="text-sm">
												Comprador
											</th>
											<th className="text-sm">
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
													<th>
														<label>
															<input
																type="checkbox"
																className="checkbox"
															/>
														</label>
													</th>
													<td>
														<div className="flex items-center gap-3">
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
																	{myorder.itemsList.map(
																		(
																			item
																		) => (
																			<h2 className="w-[250px] overflow-x-auto mb-2">
																				{
																					item
																				}
																			</h2>
																		)
																	)}
																</div>
																<div className="text-sm opacity-50">
																	{
																		myorder.category
																	}
																</div>
															</div>
														</div>
													</td>

													<td>
														{myorder.statusOrder}
													</td>

													<td>
														{myorder.customerName}
													</td>
													<td>
														{myorder.orderNumber}
													</td>
													<th>
														<button className="flex items-center btn btn-warning btn-xs">
															Avaliar
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
