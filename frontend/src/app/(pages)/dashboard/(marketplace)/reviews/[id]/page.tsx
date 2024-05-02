"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos

// Icons

function ReviewByIdPage() {
	const { id } = useParams();
	const [token] = useState(localStorage.getItem("token") || "");
	const [myorder, setMyorder] = useState([]);
	const [inputValue, setInputValue] = useState(0);

	console.log(myorder);

	useEffect(() => {
		const fetchOrder = async () => {
			try {
				const response = await api.get(
					`/orders/customer-orders/${id}`,
					{
						headers: {
							Authorization: `Bearer ${JSON.parse(token)}`,
						},
					}
				);
				if (response.data && response.data.order) {
					setMyorder(response.data.order);
				} else {
					console.error("Dados de pedidos inválidos:", response.data);
				}
			} catch (error) {
				console.error("Erro ao obter dados do usuário:", error);
			}
		};
		fetchOrder();
	}, [token, id]);

	const handleChange = (event) => {
		const newValue = event.target.value;
		setInputValue(newValue);
	};

	const handleBlur = () => {
		let newValue = parseFloat(inputValue);
		if (isNaN(newValue) || newValue < 0) {
			newValue = 0;
		} else if (newValue > 10) {
			newValue = 10;
		}
		setInputValue(newValue.toFixed(1));
	};

	const increment = () => {
		let newValue = parseFloat(inputValue) + 0.1;
		if (newValue > 10) {
			newValue = 10;
		}
		setInputValue(newValue.toFixed(1));
	};

	const decrement = () => {
		let newValue = parseFloat(inputValue) - 0.1;
		if (newValue < 0) {
			newValue = 0;
		}
		setInputValue(newValue.toFixed(1));
	};

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-purple-400 w-[1200px] p-6 rounded-md mt-4">
						{/* Adicionar Porduto */}
						<div className="flex flex-col gap-2 mb-6">
							<h1 className="text-2xl font-semibold">
								Avalie o Pedido
							</h1>
						</div>
						<div className="mb-4">
							<div>ID do Pedido: {myorder.orderID}</div>
							<div>Loja: {myorder.partnerName}</div>
						</div>
						<div className="mb-8">
							{myorder.itemsList &&
								myorder.itemsList.map((item, index) => (
									<div
										key={index}
										className="overflow-x-auto">
										<table className="table">
											{/* head */}
											<thead>
												<tr>
													<th className="text-base">
														Produto(s)
													</th>
													<th className="text-base">
														Status
													</th>
													<th className="text-base">
														Favorite Color
													</th>
												</tr>
											</thead>
											<tbody>
												{/* row 1 */}
												<tr>
													<td>
														<div className="flex items-center gap-3">
															<div className="avatar">
																<div className="mask mask-squircle w-12 h-12">
																	<Image
																		src={`http://localhost:5000/images/products/${item.productImage}`}
																		alt={
																			item.productName
																		}
																		width={
																			10
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
																	{
																		item.productName
																	}
																</div>
															</div>
														</div>
													</td>
													<td>
														{myorder.statusShipping}
													</td>
													<td>Purple</td>
												</tr>
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
								))}
						</div>
						<div className="flex flex-row gap-16">
							<div>
								<div className="text-base mb-4">
									Dê a sua nota para esse pedido:
								</div>

								<div>
									<div className="flex flex-row gap-2 mb-4">
										<div
											onClick={decrement}
											className="flex items-center text-center bg-blue-500 px-3 py-1 rounded shadow-md cursor-pointer active:scale-[.97]">
											-
										</div>
										<input
											onChange={handleChange}
											onBlur={handleBlur}
											className="text-center w-[50px] rounded"
											type="text"
											value={inputValue}
										/>
										<div
											onClick={increment}
											className="bg-blue-500 px-3 py-1 rounded shadow-md cursor-pointer active:scale-[.97]">
											+
										</div>
									</div>
									<div className="-mt-3">Ex.: 10 ou 9.8</div>
								</div>
							</div>
							<div>
								<label>
									<div className="mb-4">
										Descreva a avaliação:
									</div>
								</label>
								<textarea
									className="textarea textarea-bordered w-[600px]"
									placeholder="Conte como foi a sua experiência..."></textarea>
							</div>
						</div>
					</div>
					{/* Gadget 2 */}
					<div className="flex flex-row justify-between items-center gap-4 bg-purple-400 w-[1200px] p-6 rounded-md">
						<div className="flex flex-row gap-4">
							<button className="btn btn-success">
								Enviar Avaliação
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default ReviewByIdPage;
