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
	const [mysales, setMysales] = useState([]);

	console.log(mysales);

	useEffect(() => {
		const fethData = async () => {
			try {
				const response = await api.get("/orders/customer-orders", {
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
					<div className="bg-purple-400 w-[1215px] p-6 rounded-md mt-4">
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
												ID do Pedido
											</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{mysales
											.filter(
												(mysale) =>
													mysale.statusShipping ===
													"Entregue"
											)
											.map((mysale) => (
												<tr key={mysale._id}>
													<th>
														<label>
															<input
																type="checkbox"
																className="checkbox"
															/>
														</label>
													</th>
													<td>
														{mysale.itemsList.map(
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
																			<h2 className="w-[250px] overflow-x-auto mb-2">
																				{
																					item.productName
																				}
																			</h2>
																		</div>
																		<div className="text-sm opacity-50">
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
														{mysale.statusShipping}
													</td>

													<td>{mysale.orderID}</td>
													<th>
														<button className="flex items-center btn btn-warning btn-xs">
															<Link
																href={`/dashboard/reviews/${mysale._id}`}>
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
