"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Icons

// Axios
import api from "@/utils/api";

function MyRafflesPage() {
	const [myraffles, setMyraffles] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");
	const [isLoading, setIsLoading] = useState(true);
	const [loadingButtonId, setLoadingButtonId] = useState(null);

	const router = useRouter();

	useEffect(() => {
		api.get("/raffles/partner-raffles", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setMyraffles(response.data.raffles);
			setIsLoading(false);
		});
	}, [token]);

	const handleClick = (orderId) => {
		setLoadingButtonId(orderId); // Define o ID do pedido que está carregando
		setTimeout(() => {
			router.push(`/dashboard/myraffles/${orderId}`);
		}, 2000); // O tempo pode ser ajustado conforme necessário
	};

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="h-screen col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-white w-[1200px] h-full p-6 rounded-md shadow-md mt-4 mr-4">
						{/* Adicionar Order */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold text-black">
								Meus Sorteios
							</h1>

							{/* Lista de Pedidos */}
							<div className="overflow-x-auto">
								<table className="table">
									{/* head */}
									<thead>
										<tr>
											<th className="text-sm text-black">
												Prêmio
											</th>
											<th className="text-sm text-black">
												Custo da inscrição
											</th>
											<th className="text-sm text-black">
												Data de realização
											</th>
											<th className="text-sm text-black">
												ID do Sorteio
											</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}
										{myraffles &&
											myraffles.map((myraffle) => (
												<tr key={myraffle?._id}>
													<td>
														<div className="flex items-center gap-3 mb-2">
															<div className="avatar">
																<div className="mask mask-squircle w-12 h-12">
																	<Image
																		src={`http://localhost:5000/images/raffles/${myraffle?.imagesRaffle[0]}`}
																		alt={`Image`}
																		width={
																			280
																		}
																		height={
																			280
																		} // Altere a altura conforme necessário
																		unoptimized
																	/>
																</div>
															</div>
															<div>
																<div className="font-bold text-black">
																	<h2 className="w-[230px] overflow-x-hidden mb-2">
																		<span>
																			{
																				myraffle?.rafflePrize
																			}
																		</span>
																	</h2>
																</div>
															</div>
														</div>
													</td>
													<td className="text-black">
														<div>
															{`${myraffle?.raffleCost.toLocaleString(
																"pt-BR",
																{
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																}
															)} OP`}
														</div>
														<span className="badge badge-info badge-sm text-white py-2">
															Otaku Point
														</span>
													</td>
													<td>
														<div className="text-black">
															{myraffle?.raffleDate &&
																format(
																	new Date(
																		myraffle?.raffleDate
																	),
																	"dd/MM/yyyy"
																)}
														</div>
													</td>
													<td className="text-xs">
														<div className="text-black">
															{myraffle?._id.toUpperCase()}
														</div>
													</td>
													<th>
														{/* <button className="flex flex-row items-center btn btn-primary btn-xs text-white w-[90px] shadow-md">
															<Link
																href={`/dashboard/myraffles/${myraffle?._id}`}>
																+ Detalhes
															</Link>
														</button> */}

														{loadingButtonId ===
														myraffle?._id ? (
															<button className="flex items-center btn btn-primary btn-xs shadow-md w-[100px]">
																<span className="loading loading-dots loading-sm"></span>
															</button>
														) : (
															<button
																onClick={() =>
																	handleClick(
																		myraffle?._id
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

export default MyRafflesPage;
