"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Imagens e Logos

// Icons

function MyProductsPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [myproducts, setMyproducts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		api.get("/products/partner-products", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setMyproducts(response.data.products); // Ajuste para acessar a chave 'products'
			setIsLoading(false);
		});
	}, [token]);

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="h-screen flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-white w-[1200px] p-6 rounded-md mt-4 mr-4">
						{/* Adicionar Porduto */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold text-black">
								Produtos em Catálogo
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
												Preço
											</th>
											<th className="text-sm text-black">
												Estoque
											</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}
										{myproducts.length > 0 &&
											myproducts.map((product) => (
												<tr key={product._id}>
													<td>
														<div className="flex items-center gap-3">
															<div className="avatar">
																<div className="mask mask-squircle w-12 h-12">
																	<Image
																		src={`http://localhost:5000/images/products/${product.imagesProduct[0]}`}
																		alt="Avatar Tailwind CSS Component"
																		width={
																			12
																		}
																		height={
																			12
																		}
																		unoptimized
																	/>
																</div>
															</div>
															<div>
																<div className="font-bold text-black">
																	{
																		product.productTitle
																	}
																</div>
																<div className="text-sm text-black opacity-50">
																	{
																		product.category
																	}
																</div>
															</div>
														</div>
													</td>
													<td className="text-black">
														{product.promocionalPrice >
														0 ? (
															<div className="flex flex-col">
																<div className="flex flex-row items-center gap-2 mb-2">
																	<span className="line-through">
																		{Number(
																			product.originalPrice
																		).toLocaleString(
																			"pt-BR",
																			{
																				style: "currency",
																				currency:
																					"BRL",
																			}
																		)}
																	</span>
																	<span>
																		{Number(
																			product.promocionalPrice
																		).toLocaleString(
																			"pt-BR",
																			{
																				style: "currency",
																				currency:
																					"BRL",
																			}
																		)}
																	</span>
																</div>
																<span className="badge badge-accent badge-sm shadow-md">
																	Em Promoção
																</span>
															</div>
														) : (
															Number(
																product.originalPrice
															).toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)
														)}
														<br />
													</td>
													<td className="text-black">
														{product.stock} un
													</td>
													<th>
														<button className="flex items-center btn btn-primary btn-xs shadow-md">
															<Link
																href={`/dashboard/myproducts/${product._id}`}>
																+ Detalhes
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

export default MyProductsPage;
