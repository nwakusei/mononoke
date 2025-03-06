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

// Icons

// Axios
import api from "@/utils/api";

function MyOrdersPage() {
	const [myorders, setMyorders] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");
	const [isLoading, setIsLoading] = useState(true);
	const [loadingButtonId, setLoadingButtonId] = useState(null);

	const router = useRouter();

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
			router.push(`/dashboard/myorders/${orderId}`);
		}, 2000); // O tempo pode ser ajustado conforme necessário
	};

	// Função para Descriptografar dados sensíveis no Banco de Dados
	function decrypt(encryptedBalance: string): number | null {
		let decrypted = "";

		try {
			// Divide o IV do texto criptografado
			const [ivHex, encryptedData] = encryptedBalance.split(":");
			if (!ivHex || !encryptedData) {
				throw new Error("Formato inválido do texto criptografado.");
			}

			const iv = Buffer.from(ivHex, "hex");

			const decipher = crypto.createDecipheriv(
				"aes-256-cbc",
				Buffer.from(secretKey, "utf-8"),
				iv
			);

			decipher.setAutoPadding(false);

			decrypted = decipher.update(encryptedData, "hex", "utf8");
			decrypted += decipher.final("utf8");

			const balanceNumber = parseFloat(decrypted.trim()); // Remove espaços em branco extras
			if (isNaN(balanceNumber)) {
				return null;
			}
			return parseFloat(balanceNumber.toFixed(2));
		} catch (error) {
			console.error("Erro ao descriptografar o saldo:", error);
			return null;
		}
	}

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
																			{`Total de ${myorder.itemsList.length} produtos`}
																		</span>
																	</div>
																</div>
															</div>
														)}
													</td>
													<td>
														<div className="text-black">
															{decrypt(
																myorder.customerOrderCostTotal
															)?.toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)}
														</div>
														<span className="badge badge-info badge-sm text-white py-2">
															{
																myorder.paymentMethod
															}
														</span>
													</td>
													<td>
														<div className="text-black">
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
														<div className="text-black">
															{myorder.orderID}
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
