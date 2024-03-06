"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { AddPicture } from "@icon-park/react";
import { GoArrowUpRight, GoLinkExternal } from "react-icons/go";
import { TbCurrencyReal } from "react-icons/tb";
import { CiWarning } from "react-icons/ci";
import { FaPlus } from "react-icons/fa6";

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
	promocionalPrice: z.string().optional(),
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

function CreateProductPage() {
	const [offerFreeShipping, setOfferFreeShipping] = useState("");
	const [selectedRegion, setSelectedRegion] = useState("");
	const [variations, setVariations] = useState([]);
	const [imagemSelecionada, setImagemSelecionada] = useState(null);
	const [token] = useState(localStorage.getItem("token") || "");
	const [output, setOutput] = useState("");

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

	const handleFreeShippingChange = (event) => {
		const value = event.target.value;
		if (value === "false") {
			setSelectedRegion("Nenhuma");
		}
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
					"Content-Type": "multipart/form-data",
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
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					<form onSubmit={handleSubmit(handleCreateProduct)}>
						{/* Gadget 1 */}
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold">
									Nome e Descrição
								</h1>
								{/* Nome e Descrição */}
								<label className="form-control w-full max-w-3xl">
									<div className="label">
										<span className="label-text">
											Título do Produto
										</span>
									</div>
									<input
										type="text"
										placeholder="Ex: One Piece Vol.1"
										className={`${
											errors.productName && `input-error`
										} input input-bordered input-success w-fullmax-w-3xl`}
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

								<label className="form-control w-full max-w-3xl">
									<div className="label">
										<span className="label-text">
											Descrição do Produto
										</span>
									</div>
									<textarea
										className={`${
											errors.description &&
											`textarea-error`
										} textarea textarea-success`}
										placeholder="Descreva todos os detalhes do produto..."
										{...register("description")}></textarea>
									<div className="label">
										{errors.description && (
											<span className="label-text-alt text-red-500">
												{errors.description.message}
											</span>
										)}
									</div>
								</label>

								<label className="form-control w-full max-w-3xl">
									<div className="label">
										<span className="label-text">
											Categoria do Produto
										</span>
									</div>
									<select
										className={`select select-success w-full max-w-3xl`}
										{...register("category")}>
										<option disabled selected value="">
											Escolha a categoria do Produto
										</option>
										<option>Mangá</option>
										<option>Figure</option>
										<option>Game</option>
										<option>TGC (Card Game)</option>
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

						{/* Gadget 2 */}
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold">
									Imagens do Produto
								</h1>
								{/* Add Imagens */}
								<label className="form-control w-full max-w-3xl">
									<div className="label">
										<span className="label-text">
											Imagem Principal
										</span>
									</div>
									<div
										className={`${
											errors.imagesProduct &&
											`border-error`
										} flex flex-col justify-center items-center w-24 h-24 border-[1px] border-dashed border-sky-500 hover:bg-sky-800 transition-all ease-in duration-150 rounded-sm ml-1 cursor-pointer relative`}>
										{imagemSelecionada ? (
											<img
												src={imagemSelecionada}
												alt="Imagem selecionada"
												className="object-contain w-full h-full rounded-sm"
											/>
										) : (
											<div
												className="flex flex-col justify-center items-center"
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
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold mb-3">
									Variações
								</h1>
								{variations.map((variation) => (
									<div key={variation.id}>
										<label className="form-control w-full max-w-3xl">
											<div className="label">
												<span className="label-text">
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
												<span className="label-text-alt">
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
																<span className="label-text">
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
																<span className="label-text-alt">
																	Ex: Azul,
																	Grande, etc.
																</span>
															</div>
														</label>
													)
												)}
										</div>

										<div
											className="flex flex-row justify-center items-center w-60 h-14 border-[1px] border-dashed border-sky-500 hover:bg-sky-800 transition-all ease-in duration-150 rounded ml-1 gap-2 mb-4 cursor-pointer"
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
									className="flex flex-row justify-center items-center w-60 h-14 border-[1px] border-dashed border-sky-500 hover:bg-sky-800 transition-all ease-in duration-150 rounded ml-1 gap-2 cursor-pointer"
									onClick={handleAddVariation}>
									<FaPlus size={16} />
									<h2 className="text-base">
										Adicionar Variação
									</h2>
								</div>
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold">
									Preço e Quantidade
								</h1>
								<div className="flex flex-row items-center">
									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text">
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
												<span className="label-text-alt">
													Ex.: R$ 2,00
												</span>
											)}
										</div>
									</label>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text">
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
														{...register(
															"promocionalPrice"
														)}
													/>
												</div>
											</div>
										</div>
										<div className="label">
											<span className="label-text-alt">
												Ex.: R$ 1,00
											</span>
										</div>
									</label>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text">
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
												<span className="label-text-alt">
													Ex.: 10 un
												</span>
											)}
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Gadget 3 */}
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold">
									Informações Técnicas
								</h1>
								<div className="flex flex-row">
									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
												Qual a condição do Produto?
											</span>
										</div>

										<select
											className="select select-success w-full max-w-xs"
											{...register("condition")}>
											<option disabled selected value="">
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
											<span className="label-text">
												O item é uma encomenda?
											</span>
										</div>

										<select
											className="select select-success w-full max-w-xs"
											{...register("preOrder")}>
											<option disabled selected value="">
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
											<span className="label-text">
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
													Dias
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
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold">
									Envio, Peso e dimensões
								</h1>
								<div className="flex flex-row items-center">
									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text">
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
														{...register("weight")}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item">
													kg
												</button>
											</div>
										</div>
										<div className="label">
											{errors.weight ? (
												<span className="label-text-alt text-red-500">
													{errors.weight.message}
												</span>
											) : (
												<span className="label-text-alt">
													Ex.: 0,250 kg
												</span>
											)}
										</div>
									</label>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text">
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
														{...register("length")}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item">
													cm
												</button>
											</div>
										</div>
										<div className="label">
											{errors.length ? (
												<span className="label-text-alt text-red-500">
													{errors.length.message}
												</span>
											) : (
												<span className="label-text-alt">
													Ex.: 21 cm
												</span>
											)}
										</div>
									</label>

									<div>✖</div>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl ml-16">
										<div className="label">
											<span className="label-text">
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
														{...register("width")}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item">
													cm
												</button>
											</div>
										</div>
										<div className="label">
											{errors.width ? (
												<span className="label-text-alt text-red-500">
													{errors.width.message}
												</span>
											) : (
												<span className="label-text-alt">
													Ex.: 13 cm
												</span>
											)}
										</div>
									</label>

									<div>✖</div>

									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl ml-16">
										<div className="label">
											<span className="label-text">
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
														{...register("height")}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item">
													cm
												</button>
											</div>
										</div>
										<div className="label">
											{errors.height ? (
												<span className="label-text-alt text-red-500">
													{errors.height.message}
												</span>
											) : (
												<span className="label-text-alt">
													Ex.: 3 cm
												</span>
											)}
										</div>
									</label>
								</div>
								<div className="flex flex-row items-center mb-6">
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text">
												Oferecer frete grátis?
											</span>
										</div>
										<select
											{...register("freeShipping")}
											className="select select-success w-full max-w-xs"
											onChange={handleFreeShippingChange}>
											<option disabled selected>
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
											<span className="label-text">
												Para qual localidade?
											</span>
										</div>
										<select
											{...register("freeShippingRegion")}
											className="select select-success w-full max-w-xs"
											value={selectedRegion}
											onChange={handleRegionChange}
											disabled={!offerFreeShipping}>
											<option value="" disabled selected>
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
									<p>
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
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold mb-4">
									Deseja publicar o Produto?
								</h1>
								{/* Nome e Descrição */}

								<div className="flex flex-row gap-4">
									<button
										type="button"
										onClick={handleCancelar}
										className="btn btn-outline btn-error">
										Cancelar
									</button>
									<button
										type="submit"
										className="btn btn-success">
										Publicar Produto
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

export default CreateProductPage;
