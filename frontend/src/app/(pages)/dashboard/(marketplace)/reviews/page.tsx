"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Axios
import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Icons

function ReviewsPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [orders, setOrders] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadingButtonId, setLoadingButtonId] = useState(null);

	const router = useRouter();

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

				setIsLoading(false);
			} catch (error) {
				console.error("Erro ao obter dados do Pedido:", error);
			}
		};

		fethData();
	}, [token]);

	const handleClick = (orderId) => {
		setLoadingButtonId(orderId); // Define o ID do pedido que está carregando
		setTimeout(() => {
			router.push(`/dashboard/reviews/${orderId}`);
		}, 2000); // O tempo pode ser ajustado conforme necessário
	};

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
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
												{/* Nome do Produto */}
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
													"Delivered"
											)
											.map((order) => (
												<tr key={order._id}>
													<td>
														{/* {order.itemsList.map(
															(item, index) => (
																<div
																	key={index}
																	className="flex items-center gap-3 mb-2">
																	<div className="avatar">
																		<div className="mask mask-squircle w-12 h-12">
																			<Image
																				src={`http://localhost:5000/images/products/${item.productImage}`} // Troque example.com pelo seu domínio real ou caminho para as imagens
																				alt={
																					item.productTitle
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
																					item.productTitle
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
														)} */}

														{order.itemsList[0] && ( // Verifica se há pelo menos um item
															<div className="flex items-center gap-3 mb-2">
																<div className="avatar">
																	<div className="mask mask-squircle w-12 h-12">
																		<Image
																			src={`https://mononokebucket.s3.us-east-1.amazonaws.com/${order.itemsList[0].productImage}`}
																			alt={
																				order
																					.itemsList[0]
																					.productTitle
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
																		<h2 className="w-[230px] overflow-x-hidden">
																			<span className="text-black">
																				{
																					order
																						.itemsList[0]
																						.productTitle
																				}
																			</span>
																		</h2>
																		<span className="badge badge-info badge-sm text-white py-2">
																			{`Total de ${order.itemsList.length} produtos`}
																		</span>
																	</div>
																</div>
															</div>
														)}
													</td>

													<td>
														<div className="text-black">
															{/* {
																order.statusShipping
															} */}
															Entregue
														</div>
													</td>

													<td>
														<div className="text-black text-xs">
															{order.orderID}
														</div>
													</td>
													<th>
														{loadingButtonId ===
														order._id ? (
															<button className="flex items-center btn btn-primary btn-xs shadow-md w-[100px]">
																<span className="loading loading-dots loading-sm"></span>
															</button>
														) : (
															<button
																onClick={() =>
																	handleClick(
																		order._id
																	)
																} // Passa o ID do pedido
																className="flex items-center btn btn-primary btn-xs shadow-md w-[100px]">
																Avaliar
															</button>
														)}
													</th>
												</tr>
											))}
									</tbody>
									{/* Table footer */}
									{/* <tfoot>
										<tr>
											<th></th>
											<th>Name</th>
											<th>Job</th>
											<th>Favorite Color</th>
											<th></th>
										</tr>
									</tfoot> */}
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
