"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

// ToastFy
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// Components
import { Sidebar } from "@/components/Sidebar";
import { AddPicture } from "@icon-park/react";

// Icons

// React Hook Form, Zod e ZodResolver
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createReviewFormSchema = z.object({
	imagesReview: z
		.instanceof(FileList)
		.transform((list) => {
			const files = [];

			for (let i = 0; i < list.length; i++) {
				files.push(list.item(i));
			}

			return files;
		})
		.refine(
			(files) => {
				return files !== null && files.length > 0;
			},
			{
				message: "※ Insira pelo menos 1 foto!",
			}
		)
		.refine(
			(files) => files.length <= 5, // ✅ Limita a 5 arquivos
			{
				message: "※ Você pode enviar no máximo 5 fotos!",
			}
		)
		.refine(
			(files) => {
				return files.every(
					(file) => file === null || file.size <= 2 * 1024 * 1024
				);
			},
			{
				message: "※ Cada arquivo precisa ter no máximo 2Mb!",
			}
		)
		.refine(
			(files) => {
				return files.every(
					(file) =>
						file === null || /\.(jpg|jpeg|png)$/i.test(file.name)
				);
			},
			{
				message:
					"※ Insira apenas fotos com extensão .JPG, .JPEG ou .PNG!",
			}
		),
	reviewRating: z
		.string()
		.min(1, "※ A nota é obrigatória!")
		.refine(
			(note) => {
				const numberValue = Number(note);

				return numberValue > 0.0;
			},
			{
				message: "※ Insira um valor maior do que 0.0!",
			}
		),
	reviewDescription: z
		.string()
		.min(1, "※ A descrição é obrigatória!")
		.max(1000, "※ A descrição precisa conter no máximo 1000 caracteres!")
		.trim()
		.refine(
			(desc) => {
				// Lista de tags HTML permitidas para formatação básica
				const allowedTags = [
					"b",
					"i",
					"u",
					"strong",
					"em",
					"p",
					"ul",
					"ol",
					"li",
					"br",
					"a",
					"span",
				];

				// Sanitizar a descrição, permitindo apenas as tags especificadas
				const sanitized = DOMPurify.sanitize(desc, {
					ALLOWED_TAGS: allowedTags,
				});

				// Checar se a descrição contém algum conteúdo não permitido (tags ilegais já são removidas pelo DOMPurify)
				const isValid = sanitized.length > 0;

				return isValid;
			},
			{
				message: "※ A descrição possui caracteres inválidos!",
			}
		)
		.refine(
			(value) => {
				if (value === undefined || value === "") {
					return true;
				}
				return value.length >= 100;
			},
			{
				message: "※ A descrição precisa ter no mínimo 100 caracteres!",
			}
		),
});

type TCreateReviewFormSchema = z.infer<typeof createReviewFormSchema>;

function ReviewByIdPage() {
	const { id } = useParams();
	const [token] = useState(localStorage.getItem("token") || "");
	const [myorder, setMyorder] = useState([]);
	const [inputValue, setInputValue] = useState(0);
	const [description, setDescription] = useState("");
	const [images, setImages] = useState([]);
	const [sendReviewLoading, setSendReviewLoading] = useState(false);

	const [imagensSelecionadas, setImagensSelecionadas] = useState<
		string[] | ArrayBuffer[]
	>([]);
	const MAX_IMAGENS = 5;

	const {
		register,
		handleSubmit,
		formState: { errors },
		getValues,
		trigger,
	} = useForm<TCreateReviewFormSchema>({
		resolver: zodResolver(createReviewFormSchema),
		// mode: "onBlur",
	});

	const [focusStates, setFocusStates] = useState({});

	// Função que altera o foco de cada campo individualmente
	const handleFocus = (fieldName: string) => {
		setFocusStates((prevState) => ({
			...prevState,
			[fieldName]: true,
		}));
	};

	// Função que remove o foco de cada campo individualmente
	const handleBlur = (fieldName: string) => {
		setFocusStates((prevState) => ({
			...prevState,
			[fieldName]: false,
		}));
	};

	const getFieldClass = (fieldName: string, fieldType: string) => {
		// Obtém o valor do campo com o fieldName dinâmico
		const value = getValues(fieldName);
		const isFocused = focusStates[fieldName];

		// Acessando o erro de acordo com o padrão do fieldName
		let error;

		// Verifica se o fieldName pertence a um campo de variação
		if (fieldName.startsWith("productVariations")) {
			const fieldPath = fieldName.split(".");

			if (fieldPath.length === 3) {
				// Acesso ao título da variação: productVariations.${variationIndex}.title
				const variationIndex = fieldPath[1];
				const key = fieldPath[2];
				error = errors?.productVariations?.[variationIndex]?.[key];
			} else if (fieldPath.length === 5) {
				// Acesso à opção de variação: productVariations.${variationIndex}.options.${optionIndex}.name
				const variationIndex = fieldPath[1];
				const optionIndex = fieldPath[3];
				const key = fieldPath[4];
				error =
					errors?.productVariations?.[variationIndex]?.options?.[
						optionIndex
					]?.[key];
			}
		} else {
			// Para campos simples (não relacionados a variações)
			error = errors?.[fieldName];
		}

		// Lógica para determinar a classe do campo com base no foco e erro
		if (isFocused) {
			if (!value && !error) {
				return `${fieldType}-success`; // Foco verde se vazio e sem erro
			}
			return error ? `${fieldType}-error` : `${fieldType}-success`; // Foco vermelho se erro, verde se válido
		}

		// Quando o campo perde o foco:
		if (!value && error) {
			return `${fieldType}-error`; // Foco vermelho se vazio e erro
		}

		if (value && error) {
			return `${fieldType}-error`; // Foco vermelho se preenchido e erro
		}

		if (value && !error) {
			return `${fieldType}-success`; // Foco verde se estiver preenchido corretamente e sem erro
		}

		return ""; // Sem cor se não há erro e o campo estiver vazio
	};

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

	const handleImagemSelecionada = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (files) {
			const readers: Promise<string | ArrayBuffer>[] = [];

			for (const file of Array.from(files)) {
				const reader = new FileReader();
				readers.push(
					new Promise((resolve) => {
						reader.onload = () =>
							resolve(reader.result as string | ArrayBuffer);
						reader.readAsDataURL(file);
					})
				);
			}

			Promise.all(readers).then((images) => {
				setImagensSelecionadas((prev) => [...prev, ...images]); // Adiciona ao estado existente
			});
		}
	};

	const increment = (event) => {
		event.preventDefault(); // Previne a submissão do formulário
		let newValue = parseFloat(inputValue) + 0.1;
		if (newValue > 5) {
			newValue = 5;
		}
		setInputValue(newValue.toFixed(1));
	};

	const decrement = (event) => {
		event.preventDefault(); // Previne a submissão do formulário
		let newValue = parseFloat(inputValue) - 0.1;
		if (newValue < 0) {
			newValue = 0;
		}
		setInputValue(newValue.toFixed(1));
	};

	const handleInputChange = (e) => {
		let value = e.target.value.replace(",", "."); // Substitui vírgula por ponto

		// Permitir que o usuário digite livremente números decimais, mas sem múltiplos pontos
		if (!/^\d*\.?\d*$/.test(value)) return;

		setInputValue(value);
	};

	// const handleBlur = () => {
	// 	let numericValue = parseFloat(inputValue);

	// 	if (isNaN(numericValue)) {
	// 		setInputValue("0.0"); // Se estiver vazio ou inválido, volta para 0.0
	// 	} else {
	// 		setInputValue(Math.min(5, Math.max(0, numericValue)).toFixed(1)); // Ajusta limite e mantém 1 casa decimal
	// 	}
	// };

	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Função para enviar a avaliação
	async function handleSubmitReview(data: { [key: string]: any }) {
		console.log("Data: ", data);

		const formData = new FormData();

		Object.entries(data).forEach(([key, value]) => {
			if (key !== "imagesReview") {
				formData.append(key, value);
			}
		});

		if (data.imagesReview) {
			data.imagesReview.forEach((image: File) => {
				formData.append(`imagesReview`, image);
			});
		}

		try {
			const response = await api.patch(
				`/reviews/create-review/${id}`,
				formData,
				{
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				}
			);

			toast.success(response.data.message);
		} catch (error: any) {
			toast.error(error.response.data.message);
		}
	}

	return (
		<section className="bg-gray-100 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10">
				<form
					onSubmit={handleSubmit(handleSubmitReview)}
					className="flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-white text-black w-[1200px] p-6 rounded-md shadow-md mt-4">
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
											<th></th>
											<th></th>
											<th></th>
											<th></th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}
										{/* {myorder.itemsList &&
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
																				item.productName ||
																				"Nome do Produto"
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
																			item.productTitle
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
											)} */}

										{Array.isArray(myorder?.itemsList) &&
											myorder?.itemsList.length > 0 &&
											myorder?.itemsList.map(
												(item, index) => (
													<tr key={index}>
														<td>
															<div className="flex items-center gap-3 mb-2">
																<div>
																	<div className="w-[60px] pointer-events-none">
																		<Image
																			src={`http://localhost:5000/images/products/${item.productImage}`}
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
																		<h2 className="w-[230px] overflow-x-hidden mb-2">
																			{
																				item.productTitle
																			}
																		</h2>
																	</div>
																	<div>
																		<h2>
																			{
																				item.productVariation
																			}
																		</h2>
																	</div>
																</div>
															</div>
														</td>

														<td>
															<div>
																{
																	myorder.statusOrder
																}
															</div>
														</td>
														{/* <td>
															<div>
																{
																	item.productQuantity
																}{" "}
																un
															</div>
														</td> */}
														{/* <td className="w-[200px] overflow-x-auto">
															{(
																item.productQuantity *
																item.productPrice
															).toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)}
														</td> */}
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

								<div className="flex flex-col gap-4">
									<div className="flex flex-row items-center text-black gap-2">
										<button
											onClick={decrement}
											className="flex items-center justify-center w-[32px] h-[32px] select-none font-mono">
											<h1 className="px-3 py-1 shadow-md shadow-gray-500/50 bg-primary text-white rounded cursor-pointer active:scale-[.97]">
												-
											</h1>
										</button>

										<input
											className={`input input-bordered ${
												errors.reviewRating
													? `input-error`
													: `input-success`
											} text-lg text-center bg-gray-300 w-[80px] h-[32px] rounded`}
											type="text"
											min="0"
											max="5"
											step="0.1"
											value={inputValue}
											{...register("reviewRating", {
												onBlur: handleBlur,
												onChange: handleInputChange,
											})} // Ao sair do campo, corrige valores inválidos
										/>

										<button
											onClick={increment}
											className="flex items-center justify-center w-[32px] h-[32px] select-none font-mono">
											<h1 className="px-3 py-1 shadow-md shadow-gray-500/50 bg-primary text-white rounded cursor-pointer active:scale-[.97]">
												+
											</h1>
										</button>
									</div>
									<div className="label">
										{errors.reviewRating && (
											<span className="label-text-alt text-red-500">
												{errors.reviewRating.message}
											</span>
										)}
									</div>
								</div>
							</div>
							<div>
								<label>
									<div className="mb-4">
										Descreva a avaliação:
									</div>
								</label>
								<textarea
									className={`textarea textarea-bordered ${getFieldClass(
										"reviewDescription",
										"textarea"
									)} w-[600px]`}
									placeholder="Conte como foi a sua experiência..."
									{...register("reviewDescription", {
										onChange: () =>
											trigger("reviewDescription"),
									})}
									onFocus={() =>
										handleFocus("reviewDescription")
									}
									onBlur={() =>
										handleBlur("reviewDescription")
									}></textarea>
								<div className="label">
									{errors.reviewDescription && (
										<span className="label-text-alt text-red-500">
											{errors.reviewDescription.message}
										</span>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Gadget 2 */}
					<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold text-black">
								Fotos
							</h1>
							<label className="form-control w-full max-w-3xl">
								<div className="label">
									<span className="label-text text-black">
										Foto Principal
									</span>
								</div>

								<div className="flex flex-wrap gap-2">
									{imagensSelecionadas.map((img, index) => (
										<div
											key={index}
											className={`${
												errors.imagesReview
													? `border-error`
													: `border-success`
											} text-black hover:text-white flex flex-col justify-center items-center w-24 h-24 border-[1px] border-dashed border-[#3e1d88] hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
											<Image
												src={img as string}
												alt={`Imagem selecionada ${
													index + 1
												}`}
												className="object-contain w-full h-full rounded-sm"
												width={100}
												height={100}
											/>
										</div>
									))}

									{/* Quadrado de seleção visível somente se não atingiu o limite */}
									{imagensSelecionadas.length <
										MAX_IMAGENS && (
										<div
											className="flex flex-col justify-center items-center w-24 h-24 border-[1px] border-dashed border-[#3e1d88] hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative"
											onChange={handleImagemSelecionada}>
											<h2 className="text-xs mb-2">
												Add Imagem
											</h2>
											<AddPicture size={20} />
											<input
												className="hidden"
												type="file"
												accept="image/*"
												multiple
												{...register("imagesReview")}
											/>
										</div>
									)}
								</div>

								<div className="label">
									{errors.imagesReview && (
										<span className="label-text-alt text-red-500">
											{errors.imagesReview.message}
										</span>
									)}
								</div>
							</label>
						</div>
					</div>

					{/* Gadget 3 */}
					<div className="flex flex-row justify-between items-center gap-4 bg-white w-[1200px] p-6 rounded-md shadow-md">
						<div className="flex flex-row gap-4">
							{sendReviewLoading ? (
								<button className="btn btn-primary">
									<span className="loading loading-spinner loading-sm"></span>
									<span>Processando...</span>
								</button>
							) : (
								<button
									type="submit"
									className="btn btn-primary shadow-md">
									Enviar Avaliação
								</button>
							)}
						</div>
					</div>
				</form>
			</div>
		</section>
	);
}

export default ReviewByIdPage;
