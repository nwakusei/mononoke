"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import crypto from "crypto";

const secretKey = "chaveSuperSecretaDe32charsdgklot";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Imagens e Logos

// Icons

// Axios
import api from "@/utils/api";

function MySalesOtaclubPage() {
	const [mysales, setMysales] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");
	const [isLoading, setIsLoading] = useState(true);
	const [loadingButtonId, setLoadingButtonId] = useState(null);

	const router = useRouter();

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await api.get(
					"/orders/partner-otaclub-orders",
					{
						headers: {
							Authorization: `Bearer ${JSON.parse(token)}`,
						},
					}
				);
				if (response.data && response.data.orders) {
					setMysales(response.data.orders);
					setIsLoading(false);
				} else {
					console.error("Dados de pedidos inválidos:", response.data);
				}
			} catch (error) {
				console.error("Erro ao tentar obter dados dos pedidos:", error);
			}
		};
		fetchData();
	}, [token]);

	const handleClick = (orderId) => {
		setLoadingButtonId(orderId); // Define o ID do pedido que está carregando
		setTimeout(() => {
			router.push(`/dashboard/mysales-otaclub/${orderId}`);
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
												{/* Produtos */}
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
										{mysales.length > 0 ? (
											mysales.map((mysale) => (
												<tr key={mysale._id}>
													<td>
														{mysale
															.itemsList[0] && ( // Verifica se há pelo menos um item
															<div className="flex items-center gap-3 mb-2">
																<div className="avatar">
																	<div className="mask mask-squircle w-12 h-12">
																		<Image
																			src={`https://mononokebucket.s3.us-east-1.amazonaws.com/${mysale.itemsList[0].productImage}`}
																			alt={
																				mysale
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
																					mysale
																						.itemsList[0]
																						.productTitle
																				}
																			</span>
																		</h2>
																		<span className="badge badge-info badge-sm text-white py-2">
																			{`Total de ${
																				mysale
																					.itemsList
																					.length ===
																				1
																					? `${mysale.itemsList.length} produto`
																					: `${mysale.itemsList.length} produtos`
																			} `}
																		</span>
																	</div>
																</div>
															</div>
														)}
													</td>
													<td className="text-black">
														{`${mysale.customerOrderCostTotal?.toLocaleString(
															"pt-BR",
															{
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															}
														)} OP`}
														<br />
														<span className="badge badge-info badge-sm text-white py-2">
															{
																mysale.paymentMethod
															}
														</span>
													</td>
													<td className="text-black">
														<div>
															{translateOrderStatus(
																mysale.statusOrder
															)}
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
														{mysale.orderOtaclubID}
													</td>
													<th className="text-black">
														{/* <button className="flex items-center btn btn-primary btn-xs shadow-md">
                                                            <Link
                                                                href={`/dashboard/mysales/${mysale._id}`}>
                                                                + Detalhes
                                                            </Link>
                                                        </button> */}

														{loadingButtonId ===
														mysale._id ? (
															<button className="flex items-center btn btn-primary btn-xs shadow-md w-[100px]">
																<span className="loading loading-dots loading-sm"></span>
															</button>
														) : (
															<button
																onClick={() =>
																	handleClick(
																		mysale._id
																	)
																} // Passa o ID do pedido
																className="flex items-center btn btn-primary btn-xs shadow-md w-[100px]">
																+ Detalhes
															</button>
														)}
													</th>
												</tr>
											))
										) : (
											<></>
										)}
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

export default MySalesOtaclubPage;
