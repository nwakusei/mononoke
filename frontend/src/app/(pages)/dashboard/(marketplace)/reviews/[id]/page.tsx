"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";

import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";
import { toast } from "react-toastify";
import { AddPicture } from "@icon-park/react";

// Imagens e Logos

// Icons

function ReviewByIdPage() {
	const { id } = useParams();
	const [token] = useState(localStorage.getItem("token") || "");
	const [myorder, setMyorder] = useState([]);
	const [inputValue, setInputValue] = useState(0);
	const [description, setDescription] = useState("");
	const [images, setImages] = useState([]);
	const [sendReviewLoading, setSendReviewLoading] = useState(false);

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

	// const handleChange = (event) => {
	// 	const newValue = event.target.value;
	// 	setInputValue(newValue);
	// };

	const handleBlur = () => {
		let newValue = parseFloat(inputValue);
		if (isNaN(newValue) || newValue < 0) {
			newValue = 0;
		} else if (newValue > 5) {
			newValue = 5;
		}
		setInputValue(newValue.toFixed(1));
	};

	const increment = () => {
		let newValue = parseFloat(inputValue) + 0.1;
		if (newValue > 5) {
			newValue = 5;
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

	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Função para enviar a avaliação
	const handleSubmitReview = async () => {
		try {
			setSendReviewLoading(true);

			const formData = new FormData();
			formData.append("reviewRating", inputValue);
			formData.append("reviewDescription", description);
			images.forEach((image) => {
				formData.append("imagesReview", image);
			});

			const response = await api.patch(
				`/reviews/create-review/${id}`,
				formData,
				{
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
						"Content-Type": "multipart/form-data",
					},
				}
			);

			setSendReviewLoading(false);
			toast.success(response.data.message);
		} catch (error) {
			setSendReviewLoading(false);
			toast.error(error.response.data.message);
		}
	};

	// Funções para manipular o estado dos inputs
	const handleChange = (event) => {
		setInputValue(event.target.value);
	};

	const handleDescriptionChange = (event) => {
		setDescription(event.target.value);
	};

	const handleImageChange = (event) => {
		const files = event.target.files;
		setImages([...images, ...files]);
	};

	// const handleImageChange = (event) => {
	// 	const file = event.target.files[0];
	// 	if (file) {
	// 		const reader = new FileReader();
	// 		reader.onload = () => {
	// 			setImages(reader.result);
	// 		};
	// 		reader.readAsDataURL(file);
	// 	}
	// };

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
							<div className="overflow-x-auto">
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
										{myorder.itemsList &&
											myorder.itemsList.map(
												(item, index) => (
													<tr key={index}>
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
															{
																myorder.statusShipping
															}
														</td>
														<td>Purple</td>
													</tr>
												)
											)}
									</tbody>
								</table>
							</div>
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
											min="0"
											max="5"
											step="0.1"
											value={inputValue}
										/>
										<div
											onClick={increment}
											className="bg-blue-500 px-3 py-1 rounded shadow-md cursor-pointer active:scale-[.97]">
											+
										</div>
									</div>
									<div className="-mt-3">Ex.: 4.3 ou 5</div>
								</div>
							</div>
							<div>
								<label>
									<div className="mb-4">
										Descreva a avaliação:
									</div>
								</label>
								<textarea
									onChange={handleDescriptionChange}
									className="textarea textarea-bordered w-[600px]"
									placeholder="Conte como foi a sua experiência..."></textarea>
							</div>
						</div>

						<input
							type="file"
							accept="image/*"
							multiple
							onChange={handleImageChange}
						/>
					</div>
					{/* Gadget 2 */}
					<div className="flex flex-row justify-between items-center gap-4 bg-purple-400 w-[1200px] p-6 rounded-md">
						<div className="flex flex-row gap-4">
							{sendReviewLoading ? (
								<button className="btn btn-primary">
									<span className="loading loading-spinner loading-sm"></span>
									<span>Processando...</span>
								</button>
							) : (
								<button
									onClick={handleSubmitReview}
									className="btn btn-success">
									Enviar Avaliação
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default ReviewByIdPage;
