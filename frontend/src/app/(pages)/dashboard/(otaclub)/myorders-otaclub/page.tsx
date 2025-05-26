"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Icons

// Axios
import api from "@/utils/api";

function MyOrdersOtaclubPage() {
	const [myorders, setMyorders] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");
	const [isLoading, setIsLoading] = useState(true);
	const [loadingButtonId, setLoadingButtonId] = useState(null);

	const router = useRouter();

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await api.get(
					`/orders/customer-otaclub-orders`,
					{
						headers: {
							Authorization: `Bearer ${JSON.parse(token)}`,
						},
					}
				);

				if (response.data && response.data.orders) {
					setMyorders(response.data.orders);
				} else {
					console.error("Dados de pedidos inválidos:", response.data);
				}

				setIsLoading(false);
			} catch (error) {
				console.error("Erro ao obter dados do usuário:", error);
			}
		};
		fetchData();
	}, [token]);

	const handleClick = (orderId) => {
		setLoadingButtonId(orderId); // Define o ID do pedido que está carregando
		setTimeout(() => {
			router.push(`/dashboard/myorders-otaclub/${orderId}`);
		}, 2000); // O tempo pode ser ajustado conforme necessário
	};

	const translateOrderStatus = (status) => {
		switch (status) {
			case "Confirmed":
				return "Confirmado";
			case "Delivered":
				return "Entregue";
			case "Completed":
				return "Concluído";
			case "Canceled":
				return "Cancelado";
			default:
				return status; // Retorna o original se não encontrar tradução
		}
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
					<div className="bg-white w-[1200px] h-full p-6 rounded-md shadow-md mt-4 mr-4">
						{/* Adicionar Order */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl text-black font-semibold">
								Minhas Compras
							</h1>

							{/* Lista de Pedidos */}
							<div className="overflow-x-auto">
								<table className="table">
									{/* head */}
									<thead>
										<tr>
											<th className="text-sm text-black">
												{/* Produtos */}
											</th>
											<th className="text-sm text-black">
												Total do Pedido
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
										{/* row 1 */}
										{myorders.length > 0 &&
											myorders.map((myorder) => (
												<tr key={myorder._id}>
													<td>
														{myorder
															.itemsList[0] && ( // Verifica se há pelo menos um item
															<div className="flex items-center gap-3 mb-2">
																<div className="avatar">
																	<div className="mask mask-squircle w-12 h-12">
																		<Image
																			src={`http://localhost:5000/images/products/${myorder.itemsList[0].productImage}`}
																			alt={
																				myorder
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
																					myorder
																						.itemsList[0]
																						.productTitle
																				}
																			</span>
																		</h2>
																		<span className="badge badge-info badge-sm text-white py-2">
																			{`Total de ${
																				myorder
																					.itemsList
																					.length ===
																				1
																					? `${myorder.itemsList.length} produto`
																					: `${myorder.itemsList.length} produtos`
																			} `}
																		</span>
																	</div>
																</div>
															</div>
														)}
													</td>
													<td>
														<div className="text-black">
															{`${myorder.customerOrderCostTotal?.toLocaleString(
																"pt-BR",
																{
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																}
															)} OP`}
														</div>
														<span className="badge badge-info badge-sm text-white py-2">
															{
																myorder.paymentMethod
															}
														</span>
													</td>
													<td>
														<div className="text-black">
															{translateOrderStatus(
																myorder.statusOrder
															)}
														</div>
														{/* <div className="text-xs opacity-50">
                                                            {
                                                                myorder.daysShipping
                                                            }{" "}
                                                            dias
                                                        </div> */}
													</td>
													<td className="text-xs">
														<div className="text-black">
															{
																myorder.orderOtaclubID
															}
														</div>
													</td>
													<th>
														{loadingButtonId ===
														myorder._id ? (
															<button className="flex items-center btn btn-primary btn-xs shadow-md w-[100px]">
																<span className="loading loading-dots loading-sm"></span>
															</button>
														) : (
															<button
																onClick={() =>
																	handleClick(
																		myorder._id
																	)
																} // Passa o ID do pedido
																className="flex items-center btn btn-primary btn-xs shadow-md w-[100px]">
																+ Detalhes
															</button>
														)}
													</th>
												</tr>
											))}
									</tbody>

									{/* foot */}
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

export default MyOrdersOtaclubPage;
