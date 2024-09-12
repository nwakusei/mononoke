"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";

// Icons
import { AddPicture, Weight } from "@icon-park/react";
import { GoArrowUpRight, GoLinkExternal } from "react-icons/go";
import { TbCurrencyReal, TbRulerMeasure } from "react-icons/tb";
import { CiWarning } from "react-icons/ci";
import { FaPlus } from "react-icons/fa6";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { GiWeight } from "react-icons/gi";

const createProductFormSchema = z.object({
	imagesProduct: z.instanceof(FileList).transform((list) => {
		const files = [];
		for (let i = 0; i < list.length; i++) {
			files.push(list.item(i));
		}
		return files;
	}),
	// imagesProduct: z
	// 	.instanceof(FileList)
	// 	.refine((value) => value.length > 0, {
	// 		message: "※ Pelo menos uma imagem é obrigatória",
	// 	})
	// 	.transform((value) => Array.from(value)),
	productName: z.string().min(1, "※ O nome do Produto é obrigatório!"),
	description: z.string().min(1, "※ A descrição é obrigatoria!"),
	category: z.string().min(1, "※ A categoria do produto é obrigatória"),
	originalPrice: z
		.string()
		.refine((value) => /^\d+(\.\d+)?$/.test(value.replace(",", ".")), {
			message: "※ O valor do produto deve ser um número válido",
		})
		.transform((value) => parseFloat(value.replace(",", "."))),
	promocionalPrice: z
		.string()
		.optional()
		.refine((value) => /^\d+(\.\d+)?$/.test(value.replace(",", ".")), {
			message: "※ O valor do produto deve ser um número válido",
		})
		.transform((value) => parseFloat(value.replace(",", "."))),
	stock: z
		.string()
		.min(1, "※ A quantidade de produtos em estoque é obrigatória"),
	condition: z.string().min(1, "※ A condição do produto é obrigatória"),
	preOrder: z
		.string()
		.min(1, "※ É obrigatório informar se é uma encomenda ou não!"),
	daysShipping: z
		.string()
		.min(1, "※ A quantidade de dias para envio é obrigatória"),
	weight: z
		.string()
		.refine((value) => /^\d+(\.\d+)?$/.test(value.replace(",", ".")), {
			message: "※ O peso do produto é obrigatório",
		})
		.transform((value) => parseFloat(value.replace(",", "."))),
	length: z.string().min(1, "※ O comprimento é obrigatório!"),
	width: z.string().min(1, "※ A largura é obrigatório!"),
	height: z.string().min(1, "※ A altura é obrigatório!"),
	freeShipping: z.string(),
	freeShippingRegion: z.string(),
});

function MyProductPage() {
	const [offerFreeShipping, setOfferFreeShipping] = useState("");
	const [selectedRegion, setSelectedRegion] = useState("");
	const [variations, setVariations] = useState([]);
	const [imagemSelecionada, setImagemSelecionada] = useState(null);
	const [token] = useState(localStorage.getItem("token") || "");
	const [output, setOutput] = useState("");
	const [selectedValue, setSelectedValue] = useState("");

	const [product, setProduct] = useState({});

	console.log(product);

	const { id } = useParams();

	useEffect(() => {
		api.get(`/products/partner-product/${id}`).then((response) => {
			setProduct(response.data.product);
			setSelectedValue(response.data.product.freeShipping);
			setSelectedRegion(response.data.product.freeShippingRegion);
		});
	}, [token, id]);

	const handleImagemSelecionada = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				setImagemSelecionada(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	// const handleImagemSelecionada = (event) => {
	// 	const files = event.target.files;
	// 	const fileList = [];
	// 	for (let i = 0; i < files.length; i++) {
	// 		const file = files[i];
	// 		const reader = new FileReader();
	// 		reader.onload = () => {
	// 			fileList.push(reader.result);
	// 			// Se você deseja processar os arquivos aqui, você pode chamar uma função
	// 			// para fazer isso dentro do evento onload.
	// 			// Por exemplo: processarArquivo(reader.result);
	// 		};
	// 		reader.readAsDataURL(file);
	// 	}
	// 	// Aqui você pode fazer algo com a lista de arquivos processados, como armazená-la em um estado.
	// 	// Por exemplo: setListaDeArquivos(fileList);
	// };

	const handleFreeShippingChange = (event) => {
		const value = event.target.value;

		// Atualiza o estado com o valor selecionado
		setSelectedValue(value);

		// Se você precisa realizar alguma ação adicional com base na seleção
		if (value === "false") {
			setSelectedRegion("Nenhuma");
		} else if (value === "true") {
			setSelectedRegion("Alguma região"); // Ajuste conforme necessário
		}

		// Atualiza o estado para oferta de frete grátis
		setOfferFreeShipping(value === "true");
	};

	const handleRegionChange = (event) => {
		const value = event.target.value;
		setSelectedRegion(value);
	};

	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({ resolver: zodResolver(createProductFormSchema) });

	const handleAddVariation = () => {
		setVariations([...variations, { id: variations.length, types: [""] }]);
	};

	const handleAddType = (variationId) => {
		const updatedVariations = variations.map((variation) =>
			variation.id === variationId
				? { ...variation, types: [...variation.types, ""] }
				: variation
		);
		setVariations(updatedVariations);
	};

	const handleTypeChange = (variationId, typeId, event) => {
		const { value } = event.target;
		const updatedVariations = variations.map((variation) =>
			variation.id === variationId
				? {
						...variation,
						types: variation.types.map((type, index) =>
							index === typeId ? value : type
						),
				  }
				: variation
		);
		setVariations(updatedVariations);
	};

	const handleCancelar = () => {
		// Redirecionar para outra página ao clicar em Cancelar
		router.push("/dashboard/myproducts");
	};

	async function handleCreateProduct(productData: { [key: string]: any }) {
		const formData = new FormData();

		// Itera sobre os campos de texto e adiciona ao FormData
		Object.entries(productData).forEach(([key, value]) => {
			if (key !== "imagesProduct") {
				formData.append(key, value);
			}
		});

		// Itera sobre as imagens e adiciona ao FormData
		if (productData.imagesProduct) {
			productData.imagesProduct.forEach((image: File) => {
				formData.append(`imagesProduct`, image);
			});
		}

		try {
			const response = await api.post("/products/create", formData, {
				headers: {
					Authorization: `Bearer ${JSON.parse(token)}`,
					"Content-Type": "Multipart/form-data",
				},
			});
			// Exibe toast de sucesso
			toast.success(response.data.message);

			router.push("/dashboard/myproducts");
			return response.data;
		} catch (error) {
			toast.error(error.response.data.message);
			return error.response.data;
		}
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					<form onSubmit={handleSubmit(handleCreateProduct)}>
						{/* Gadget 1 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mt-4 mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Nome e Descrição
								</h1>
								{/* Nome e Descrição */}
								<div>
									<label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Título do Produto
											</span>
										</div>
										<input
											type="text"
											placeholder="Ex: One Piece Vol.1"
											defaultValue={product?.productName}
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-full`}
											{...register("productName")}
										/>
										<div className="label">
											{errors.productName && (
												<span className="label-text-alt text-red-500">
													{errors.productName.message}
												</span>
											)}
										</div>
									</label>
								</div>

								<div className="flex flex-row gap-4">
									<label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Descrição do Produto
											</span>
										</div>
										<textarea
											className={`${
												errors.description &&
												`textarea-error`
											} textarea textarea-success w-[885px] h-[200px]`}
											placeholder="Descreva todos os detalhes do produto..."
											defaultValue={product?.description}
											{...register(
												"description"
											)}></textarea>
										<div className="label">
											{errors.description && (
												<span className="label-text-alt text-red-500">
													{errors.description.message}
												</span>
											)}
										</div>
									</label>

									<label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Categoria do Produto
											</span>
										</div>
										<select
											className={`select select-success w-full ${
												errors.category
													? "select-error"
													: ""
											}`}
											defaultValue={product?.category} // Define o valor inicial
											{...register("category", {
												required:
													"A categoria é obrigatória",
											})} // Registro para validação
										>
											{/* Opção de placeholder sem "selected" */}
											<option disabled value="">
												Escolha a categoria do Produto
											</option>
											{/* Outras opções */}
											<option value="Impresso">
												Impresso
											</option>
											<option value="Figure">
												Figure
											</option>
											<option value="Game">Game</option>
											<option value="CD/DVD">
												CD/DVD
											</option>
											<option value="Vestuário">
												Vestuário
											</option>
											<option value="Acessório">
												Acessório
											</option>
											<option value="TGC (Card Game)">
												TGC (Card Game)
											</option>
											<option value="Papelaria">
												Papelaria
											</option>
											<option value="Óculos">
												Óculos
											</option>
										</select>
										<div className="label -mt-1">
											{errors.category && (
												<span className="label-text-alt text-red-500">
													{errors.category.message}
												</span>
											)}
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Imagens do Produto
								</h1>
								{/* Add Imagens */}
								<label className="form-control w-full max-w-3xl">
									<div className="label">
										<span className="label-text text-black">
											Imagem Principal
										</span>
									</div>
									<div
										className={`${
											errors.imagesProduct &&
											`border-error`
										} text-black hover:text-white flex flex-col justify-center items-center w-24 h-24 border-[1px] border-dashed border-[#3e1d88] hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
										{imagemSelecionada ? (
											<img
												src={imagemSelecionada}
												alt="Imagem selecionada"
												className="object-contain w-full h-full rounded-sm"
											/>
										) : (
											<div
												className="flex flex-col justify-center items-center "
												onChange={
													handleImagemSelecionada
												}>
												<h2 className="text-xs mb-2">
													Add Imagem
												</h2>
												<AddPicture size={20} />
												<input
													className="hidden"
													type="file"
													accept="image/*"
													multiple
													{...register(
														"imagesProduct"
													)}
												/>
											</div>
										)}
									</div>
									<div className="label">
										{errors.imagesProduct && (
											<span className="label-text-alt text-red-500">
												{errors.imagesProduct.message}
											</span>
										)}
									</div>
								</label>
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black mb-3">
									Variações
								</h1>
								{variations.map((variation) => (
									<div key={variation.id}>
										<label className="form-control w-full max-w-3xl">
											<div className="label">
												<span className="label-text text-black">
													Título da Variação
												</span>
											</div>
											<input
												type="text"
												className="input input-bordered input-success w-80"
												value={variation.name}
												onChange={(event) =>
													handleNameChange(
														variation.id,
														event
													)
												}
											/>
											<div className="label">
												<span className="label-text-alt text-black">
													Ex: Cor, Tamanho, etc.
												</span>
											</div>
										</label>
										<div className="flex flex-row gap-2">
											{variation.types &&
												variation.types.map(
													(type, index) => (
														<label
															key={index}
															className="form-control w-full max-w-3xl mb-4">
															<div className="label">
																<span className="label-text text-black">
																	Opção
																</span>
															</div>
															<input
																type="text"
																className="input input-bordered input-success w-80"
																value={type}
																onChange={(
																	event
																) =>
																	handleTypeChange(
																		variation.id,
																		index,
																		event
																	)
																}
															/>
															<div className="label">
																<span className="label-text-alt text-black">
																	Ex: Azul,
																	Grande, etc.
																</span>
															</div>
														</label>
													)
												)}
										</div>

										<div
											className="text-black hover:text-white flex flex-row justify-center items-center w-60 h-14 border-[1px] border-dashed border-[#3e1d88] hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 gap-2 mb-4 cursor-pointer"
											onClick={() =>
												handleAddType(variation.id)
											}>
											<FaPlus size={16} />
											<h2 className="text-base">
												Adicionar Opção
											</h2>
										</div>
									</div>
								))}
								<div
									className="text-black hover:text-white flex flex-row justify-center items-center w-60 h-14 border-[1px] border-dashed border-[#3e1d88] hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 gap-2 cursor-pointer"
									onClick={handleAddVariation}>
									<FaPlus size={16} />
									<h2 className="text-base">
										Adicionar Variação
									</h2>
								</div>
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Preço e Quantidade
								</h1>
								<div className="flex flex-row items-center">
									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text text-black">
												Preço original
											</span>
										</div>
										<div className="join">
											<div className="indicator">
												<button
													type="button"
													className="btn join-item flex flex-row items-center">
													<TbCurrencyReal size={20} />
												</button>
											</div>
											<div>
												<div>
													<input
														className={`${
															errors.originalPrice &&
															`input-error`
														} input input-bordered input-success join-item`}
														placeholder="0,00"
														defaultValue={
															product?.originalPrice
																? product.originalPrice.toLocaleString(
																		"pt-BR",
																		{
																			minimumFractionDigits: 2,
																			maximumFractionDigits: 2,
																		}
																  )
																: ""
														}
														{...register(
															"originalPrice"
														)}
													/>
												</div>
											</div>
										</div>
										<div className="label">
											{errors.originalPrice ? (
												<span className="label-text-alt text-red-500">
													{
														errors.originalPrice
															.message
													}
												</span>
											) : (
												<span className="label-text-alt text-black">
													Ex.: R$ 2,00
												</span>
											)}
										</div>
									</label>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text text-black">
												Preço promocional
											</span>
										</div>
										<div className="join">
											<div className="indicator">
												<button
													type="button"
													className="btn join-item flex flex-row items-center">
													<TbCurrencyReal size={20} />
												</button>
											</div>
											<div>
												<div>
													<input
														className="input input-bordered input-success join-item"
														placeholder="0,00"
														defaultValue={
															product?.promocionalPrice
																? product.promocionalPrice.toLocaleString(
																		"pt-BR",
																		{
																			minimumFractionDigits: 2,
																			maximumFractionDigits: 2,
																		}
																  )
																: ""
														}
														{...register(
															"promocionalPrice"
														)}
													/>
												</div>
											</div>
										</div>
										<div className="label">
											<span className="label-text-alt text-black">
												Ex.: R$ 1,00
											</span>
										</div>
									</label>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text text-black">
												Estoque
											</span>
										</div>
										<div className="join">
											<div>
												<div>
													<input
														className={`${
															errors.stock &&
															`input-error`
														} input input-bordered input-success join-item`}
														placeholder="0"
														defaultValue={
															product?.stock
														}
														{...register("stock")}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item flex flex-row items-center">
													Un
												</button>
											</div>
										</div>
										<div className="label">
											{errors.stock ? (
												<span className="label-text-alt text-red-500">
													{errors.stock.message}
												</span>
											) : (
												<span className="label-text-alt text-black">
													Ex.: 10 un
												</span>
											)}
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Gadget 3 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Informações Técnicas
								</h1>
								<div className="flex flex-row">
									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Qual a condição do Produto?
											</span>
										</div>

										<select
											className="select select-success w-full max-w-xs"
											defaultValue={product.condition}
											{...register("condition")}>
											<option disabled value="">
												Selecione a condição do Produto
											</option>
											<option>Novo</option>
											<option>Usado</option>
										</select>
										{errors.condition && (
											<div className="label">
												<span className="label-text-alt text-red-500">
													{errors.condition.message}
												</span>
											</div>
										)}
									</label>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												O item é uma encomenda?
											</span>
										</div>

										<select
											className="select select-success w-full max-w-xs"
											defaultValue={product.preOrder}
											{...register("preOrder")}>
											<option disabled value="">
												Selecione uma opção
											</option>
											<option value="false">Não</option>
											<option value="true">Sim</option>
										</select>
										{errors.preOrder && (
											<div className="label">
												<span className="label-text-alt text-red-500">
													{errors.preOrder.message}
												</span>
											</div>
										)}
									</label>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text text-black">
												Você precisa de quantos dias
												para postar o produto?
											</span>
										</div>
										<div className="join">
											<div>
												<div>
													<input
														className={`${
															errors.daysShipping &&
															`input-error`
														} input input-bordered input-success join-item`}
														placeholder="0"
														defaultValue={
															product.daysShipping
														}
														{...register(
															"daysShipping"
														)}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item flex flex-row items-center">
													<IoCalendarNumberOutline
														size={25}
													/>
												</button>
											</div>
										</div>
										{errors.daysShipping && (
											<div className="label">
												<span className="label-text-alt text-red-500">
													{
														errors.daysShipping
															.message
													}
												</span>
											</div>
										)}
									</label>
								</div>
							</div>
						</div>
						{/* Gadget 2 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Envio, Peso e dimensões
								</h1>
								<div className="flex flex-row items-center">
									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text text-black">
												Peso
											</span>
										</div>
										<div className="join">
											<div>
												<div>
													<input
														className={`${
															errors.weight &&
															`input-error`
														} input input-bordered input-success join-item max-w-[120px]`}
														placeholder="0,000"
														defaultValue={
															product?.weight &&
															product?.weight
																.toFixed(3)
																.replace(
																	".",
																	","
																)
														}
														{...register("weight")}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item">
													<GiWeight size={30} />
												</button>
											</div>
										</div>
										<div className="label">
											{errors.weight ? (
												<span className="label-text-alt text-red-500">
													{errors.weight.message}
												</span>
											) : (
												<span className="label-text-alt text-black">
													Ex.: 0,250 kg
												</span>
											)}
										</div>
									</label>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text text-black">
												Comprimento
											</span>
										</div>
										<div className="join">
											<div>
												<div>
													<input
														className={`${
															errors.length &&
															`input-error`
														} input input-bordered input-success join-item max-w-[120px]`}
														placeholder="0"
														defaultValue={
															product?.length
														}
														{...register("length")}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item">
													<TbRulerMeasure size={25} />
												</button>
											</div>
										</div>
										<div className="label">
											{errors.length ? (
												<span className="label-text-alt text-red-500">
													{errors.length.message}
												</span>
											) : (
												<span className="label-text-alt text-black">
													Ex.: 21 cm
												</span>
											)}
										</div>
									</label>

									<div>
										<span
											style={{
												color: "black",
												fontSize: 25,
												fontFamily:
													"Roboto, sans-serif",
											}}>
											✖
										</span>
									</div>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl ml-16">
										<div className="label">
											<span className="label-text text-black">
												Largura
											</span>
										</div>
										<div className="join">
											<div>
												<div>
													<input
														className={`${
															errors.width &&
															`input-error`
														} input input-bordered input-success join-item max-w-[120px]`}
														placeholder="0"
														defaultValue={
															product?.width
														}
														{...register("width")}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item">
													<TbRulerMeasure size={25} />
												</button>
											</div>
										</div>
										<div className="label">
											{errors.width ? (
												<span className="label-text-alt text-red-500">
													{errors.width.message}
												</span>
											) : (
												<span className="label-text-alt text-black">
													Ex.: 13 cm
												</span>
											)}
										</div>
									</label>

									<div>
										<span
											style={{
												color: "black",
												fontSize: 25,
												fontFamily:
													"Roboto, sans-serif",
											}}>
											✖
										</span>
									</div>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl ml-16">
										<div className="label">
											<span className="label-text text-black">
												Altura
											</span>
										</div>
										<div className="join">
											<div>
												<div>
													<input
														className={`${
															errors.height &&
															`input-error`
														} input input-bordered input-success join-item max-w-[120px]`}
														placeholder="0"
														defaultValue={
															product?.height
														}
														{...register("height")}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item">
													<TbRulerMeasure size={25} />
												</button>
											</div>
										</div>
										<div className="label">
											{errors.height ? (
												<span className="label-text-alt text-red-500">
													{errors.height.message}
												</span>
											) : (
												<span className="label-text-alt text-black">
													Ex.: 3 cm
												</span>
											)}
										</div>
									</label>
								</div>
								<div className="flex flex-row items-center mb-6">
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text text-black">
												Oferecer frete grátis?
											</span>
										</div>
										<select
											{...register("freeShipping")}
											className="select select-success w-full max-w-xs"
											value={selectedValue} // Usa o estado para controlar o valor
											onChange={handleFreeShippingChange}>
											<option disabled>
												Escolha uma opção
											</option>
											<option value="true">Sim</option>
											<option value="false">Não</option>
										</select>
										<div className="label">
											{errors.freeShipping ? (
												<span className="label-text-alt text-red-500">
													{
														errors.freeShipping
															.message
													}
												</span>
											) : (
												<span className="hidden label-text-alt ">
													Ex.: Sim/Não
												</span>
											)}
										</div>
									</label>
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text text-black">
												Para qual localidade?
											</span>
										</div>
										<select
											{...register("freeShippingRegion")}
											className="select select-success w-full max-w-xs"
											value={selectedRegion}
											onChange={handleRegionChange}
											disabled={
												offerFreeShipping === false
											}>
											<option value="" disabled>
												Escolha a região
											</option>
											<option
												value="Nenhuma"
												disabled
												selected>
												Nenhuma
											</option>
											<option>Brasil</option>
											<option>São Paulo</option>
											<option>Rio de Janeiro</option>
											<option>Paraná</option>
											<option>Minas Gerais</option>
											<option>Santa Catarina</option>
											<option>Rio Grande do Sul</option>
											<option>Espírito Santo</option>
											<option>Goiás</option>
											<option>Destrito Federal</option>
											<option>Mato Grosso do Sul</option>
											<option>Mato Grosso</option>
											<option>Bahia</option>
											<option>Pernambuco</option>
											<option>Ceará</option>
											<option>Maranhão</option>
											<option>Rio Grande do Norte</option>
											<option>Paraíba</option>
											<option>Piauí</option>
											<option>Sergipe</option>
											<option>Alagoas</option>
											<option>Pará</option>
											<option>Amazonas</option>
											<option>Tocantins</option>
											<option>Amapá</option>
											<option>Roraima</option>
											<option>Rondônia</option>
											<option>Acre</option>
										</select>
										<div className="label">
											{errors.freeShippingRegion ? (
												<span className="label-text-alt text-red-500">
													{
														errors
															.freeShippingRegion
															.message
													}
												</span>
											) : (
												<span className="hidden label-text-alt">
													Ex.: São Paulo
												</span>
											)}
										</div>
									</label>
								</div>
								<div className="flex flex-row border-[1px] border-dashed border-sky-700 rounded p-4 gap-2">
									<span className="flex items-center w-[130px] h-auto justify-center bg-yellow-500 rounded mr-4">
										<CiWarning
											className="text-black"
											size={50}
										/>
									</span>
									<p className="text-black">
										Atenção: O pacote deverá ser postado em
										um ponto de coleta da Kangu mesmo quando
										a etiqueta for dos Correios. Verifique
										os pontos mais próximos do seu endereço
										no site da Kangu! Acesse o site para
										maiores informações ≫{" "}
										<Link
											className="flex flex-row items-center gap-2 text-purple-300 transition-all ease-in duration-200 hover:text-purple-500"
											href="https://www.kangu.com.br/ponto-kangu/"
											target="_blank">
											<span>
												Pontos Kangu - Site Oficial
											</span>
											<GoLinkExternal size={18} />
										</Link>
									</p>
								</div>
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black mb-4">
									Deseja atualizar o Produto?
								</h1>
								{/* Nome e Descrição */}

								<div className="flex flex-row gap-4">
									<button
										type="button"
										onClick={handleCancelar}
										className="btn btn-outline btn-error hover:shadow-md">
										Descartar
									</button>
									<button
										type="submit"
										className="btn btn-primary shadow-md">
										Atualizar Produto
									</button>
								</div>
							</div>
						</div>
					</form>
					<br />
					<pre className="flex justify-center">{output}</pre>
				</div>
			</div>
		</section>
	);
}

export default MyProductPage;
