"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ToastFy
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

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
import { LoadingPage } from "@/components/LoadingPageComponent";

// Stub para evitar ReferenceError no NodeJS
if (typeof window === "undefined") {
	// estamos no Node → cria um placeholder vazio só p/ evitar ReferenceError
	(global as any).FileList = class {};
}

// React Hook Form, Zod e ZodResolver
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createProductFormSchema = z.object({
	productImages: z
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
				return files !== null && files.length === 0;
			},
			{
				message: "※ Insira pelo menos 1 imagem!",
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
					"※ Insira apenas imagens com extensão .JPG, .JPEG ou .PNG!",
			}
		),
	productTitle: z
		.string()
		.min(1, "※ O título do Produto é obrigatório!")
		.max(
			120,
			"※ O título do Produto precisa conter no máximo 120 caracteres!"
		)
		.trim()
		.refine(
			(pName) => {
				const sanitized = DOMPurify.sanitize(pName);

				const isValid = /^[A-Za-zÀ-ÿ\s\.,—~\-0-9\[\]\(\):]+$/.test(
					sanitized
				);

				return isValid;
			},
			{
				message: "※ O título possui caracteres inválidos!",
			}
		),
	description: z
		.string()
		.min(1, "※ A descrição é obrigatoria!")
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
	category: z.string().min(1, "※ A categoria do produto é obrigatória!"),
	adultProduct: z.string().min(1, "※ item obrigatório!"),
	productPrice: z
		.string()
		.trim()
		.optional()
		.refine(
			(value) => {
				if (!value) return true; // Permitir valor vazio (opcional)
				return /^\d+,\d{2}$/.test(value); // Validar formato somente se houver um valor
			},
			{
				message: "※ Insira um valor válido no formato 0,00!",
			}
		)
		.transform((value) =>
			value ? parseFloat(value.replace(",", ".")) : undefined
		),
	stock: z
		.string()
		.trim()
		.optional()
		// .refine((value) => /^\d+(\.\d+)?$/.test(value), {
		// 	message: "※ Insira um número válido!",
		// })
		.refine(
			(value) => {
				// Verifica se o valor é um número, não é undefined e é um inteiro
				const numberValue = Number(value);
				return !isNaN(numberValue) && Number.isInteger(numberValue);
			},
			{
				message: "※ Insira somente números inteiros!",
			}
		),
	condition: z.string().min(1, "※ item obrigatório!"),
	daysShipping: z
		.string()
		.min(1, "※ item obrigatório!")
		.trim()
		.refine((value) => /^\d+(\.\d+)?$/.test(value), {
			message: "※ Insira um número válido!",
		})
		.refine(
			(value) => {
				const numberValue = Number(value);
				return !isNaN(numberValue); // Verifica se é um número
			},
			{
				message: "※ Insira um número válido!",
			}
		)
		.refine(
			(value) => {
				const numberValue = Number(value);
				return Number.isInteger(numberValue); // Verifica se é um inteiro e maior que 0
			},
			{
				message: "※ Insira somente números inteiros!",
			}
		)
		.refine(
			(value) => {
				const numberValue = Number(value);
				return Number.isInteger(numberValue) && numberValue > 0; // Verifica se é um inteiro e maior que 0
			},
			{
				message: "※ Insira um número maior do que 0!",
			}
		),
	weight: z
		.string()
		.min(1, "※ O peso do produto é obrigatório!")
		.trim()
		.transform((value) => value.replace(",", "."))
		.refine((value) => /^\d+(\.\d+)?$/.test(value), {
			message: "※ Insira um valor válido!",
		})
		.transform((value) => parseFloat(value)),
	length: z
		.string()
		.min(1, "※ O comprimento é obrigatório!")
		.trim()
		.transform((value) => value.replace(",", "."))
		.refine((value) => /^\d+(\.\d+)?$/.test(value), {
			message: "※ Insira um valor válido!",
		})
		.transform((value) => parseFloat(value)),
	width: z
		.string()
		.min(1, "※ A largura é obrigatória!")
		.trim()
		.transform((value) => value.replace(",", "."))
		.refine((value) => /^\d+(\.\d+)?$/.test(value), {
			message: "※ Insira um valor válido!",
		})
		.transform((value) => parseFloat(value)),
	height: z
		.string()
		.min(1, "※ A altura é obrigatória!")
		.trim()
		.transform((value) => value.replace(",", "."))
		.refine((value) => /^\d+(\.\d+)?$/.test(value), {
			message: "Insira um valor válido!",
		})
		.transform((value) => parseFloat(value)),
});

type TCreateProductFormData = z.infer<typeof createProductFormSchema>;

function CreateProductOtaclubPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [loadingPage, setLoadingPage] = useState(true);
	const [loadingButton, setLoadingButton] = useState(false);

	const [selectedProductImages, setSelectedProductImages] = useState<File[]>(
		[]
	);

	const [focusStates, setFocusStates] = useState({});

	const router = useRouter();

	useEffect(() => {
		// Simular um atraso no carregamento
		const timer = setTimeout(() => {
			setLoadingPage(false);
		}, 2000); // 2000 ms = 2 segundos

		// Limpar o timeout se o componente for desmontado antes do timeout ser concluído
		return () => clearTimeout(timer);
	}, []);

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

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		setError,
		clearErrors,
		control,
		getValues,
		trigger,
	} = useForm<TCreateProductFormData>({
		resolver: zodResolver(createProductFormSchema),
		// mode: "onChange",
		defaultValues: {
			category: "",
			adultProduct: "",
			condition: "",
		},
	});

	const handleSelectedProductImages = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;

		if (files) {
			const fileArray = Array.from(files); // Converte o FileList em um array

			// Filtra as imagens válidas
			const validFiles = fileArray.filter((file) => {
				const isValidSize = file.size <= 2 * 1024 * 1024; // Tamanho menor que 2MB
				const isValidFormat = /\.(jpg|jpeg|png)$/i.test(file.name); // Extensão válida

				// Define os erros conforme a validade
				if (!isValidSize) {
					setError("productImages", {
						message: "※ Cada arquivo precisa ter no máximo 2Mb!",
					});
				}

				if (!isValidFormat) {
					setError("productImages", {
						message:
							"※ Insira apenas imagens com extensão .JPG, .JPEG ou .PNG!",
					});
				}

				return isValidSize && isValidFormat; // Retorna apenas arquivos válidos
			});

			// Verifica se há imagens válidas
			if (validFiles.length > 0) {
				// Se houver imagens válidas, atualiza o estado
				setSelectedProductImages((prev) => [...prev, ...validFiles]);
				clearErrors("productImages"); // Limpa os erros anteriores
			} else {
				// Caso não haja imagens válidas, define uma mensagem de erro
				setError("productImages", {
					message: errors.productImages
						? errors.productImages.message
						: "Nenhuma imagem válida selecionada!",
				});
			}
		}
	};

	const handleRemoveImageProduct = (index: number) => {
		setSelectedProductImages((prev) => {
			// Filtra a imagem removida
			const updatedImages = prev.filter((_, i) => i !== index);

			// Atualiza o estado com as imagens restantes (sem revalidação)
			if (updatedImages.length === 0) {
				// Se não houver imagens restantes, adicione o erro
				setError("productImages", {
					message: "※ Insira pelo menos 1 imagem!",
				});
			} else {
				// Se houver imagens, remove o erro
				clearErrors("productImages");
			}

			return updatedImages; // Apenas retorna o novo array de imagens
		});
	};

	async function handleCreateProductOtaclub(productData: {
		[key: string]: any;
	}) {
		console.log(productData);

		setLoadingButton(true);

		// Sanitiza os dados antes de usá-los
		const sanitizedData = Object.fromEntries(
			Object.entries(productData).map(([key, value]) => {
				if (typeof value === "string") {
					return [key, DOMPurify.sanitize(value)];
				}
				return [key, value];
			})
		);

		const formData = new FormData();

		// Itera sobre os campos de texto e adiciona ao FormData
		Object.entries(sanitizedData).forEach(([key, value]) => {
			if (key === "productPrice" || key === "stock") {
				// Atribui 0 se o valor estiver vazio ou undefined
				const numericValue = value ? parseFloat(value) : 0;

				formData.append(
					key,
					isNaN(numericValue) ? "0" : numericValue.toString()
				);
			} else if (key !== "productImages") {
				formData.append(key, value);
			}
		});

		// Adiciona as imagens do produto principal ao FormData
		if (selectedProductImages.length === 0) {
			setError("productImages", {
				message: "※ Insira pelo menos 1 imagem!",
			});
			return;
		}

		selectedProductImages.forEach((image) => {
			formData.append("productImages", image);
		});

		try {
			const response = await api.post(
				"/products/otaclub-create",
				formData,
				{
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				}
			);

			setLoadingButton(false);

			toast.success(response.data.message);
			router.push("/dashboard/myproducts-otaclub");
			return response.data;
		} catch (error: any) {
			toast.error(error.response.data.message);
			return error.response.data;
		}
	}

	const handleCancelar = () => {
		// Redirecionar para outra página ao clicar em Cancelar
		router.push("/dashboard/myproducts-otaclub");
	};

	if (loadingPage) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					<form
						onSubmit={handleSubmit(handleCreateProductOtaclub)}
						autoComplete="off">
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
											className={`input input-bordered ${getFieldClass(
												"productTitle",
												"input"
											)} bg-slate-200 text-slate-900 w-full`}
											type="text"
											placeholder="Ex: One Piece Vol.1"
											{...register("productTitle", {
												onChange: () =>
													trigger("productTitle"),
											})}
											onFocus={() =>
												handleFocus("productTitle")
											}
											onBlur={() =>
												handleBlur("productTitle")
											}
										/>
										<div className="label">
											{errors.productTitle && (
												<span className="label-text-alt text-red-500">
													{
														errors.productTitle
															.message
													}
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
											placeholder="Descreva todos os detalhes do produto..."
											className={`textarea textarea-bordered ${getFieldClass(
												"description",
												"textarea"
											)} bg-slate-200 text-slate-900 w-[885px] h-[200px]`}
											{...register("description", {
												onChange: () =>
													trigger("description"),
											})}
											onFocus={() =>
												handleFocus("description")
											}
											onBlur={() =>
												handleBlur("description")
											}></textarea>
										<div className="label">
											{errors.description && (
												<span className="label-text-alt text-red-500">
													{errors.description.message}
												</span>
											)}
										</div>
									</label>

									<div className="flex flex-col gap-2">
										<label className="form-control">
											<div className="label">
												<span className="label-text text-black">
													Categoria do Produto
												</span>
											</div>
											<select
												className={`select select-bordered ${getFieldClass(
													"category",
													"select"
												)} bg-slate-200 text-slate-900 w-full`}
												{...register("category", {
													onChange: () =>
														trigger("category"),
												})}
												onFocus={() =>
													handleFocus("category")
												}
												onBlur={() =>
													handleBlur("category")
												}>
												<option disabled value="">
													Escolha a categoria
												</option>
												<option value="Printed">
													Impresso
												</option>
												<option value="Game">
													Figure
												</option>
												<option value="TCG">
													TCG (Card Game)
												</option>

												<option value="Clothing">
													Vestuário
												</option>
												<option value="Accessory">
													Acessório
												</option>

												<option value="CD">
													CD/DVD
												</option>
												<option value="Frame">
													Quadro
												</option>

												<option value="Stationery">
													Papelaria
												</option>

												<option value="Keychain">
													Chaveiro
												</option>
												<option value="Mug">
													Caneca
												</option>

												<option value="Plush">
													Pelúcia
												</option>

												<option value="Cosplay">
													Cosplay
												</option>

												<option value="Figure">
													Game
												</option>
												<option value="Backpack">
													Mochila
												</option>
												<option value="Cushion">
													Almofada
												</option>

												<option value="Sticker">
													Adesivo
												</option>

												<option value="Glasses">
													Óculos
												</option>
											</select>
											<div className="label -mt-1">
												{errors.category && (
													<span className="label-text-alt text-red-500">
														{
															errors.category
																.message
														}
													</span>
												)}
											</div>
										</label>

										<label className="form-control w-full max-w-3xl">
											<div className="label">
												<span className="label-text text-black">
													É um produto adulto?
												</span>
											</div>

											<select
												className={`select select-bordered ${getFieldClass(
													"adultProduct",
													"select"
												)} bg-slate-200 text-slate-900 w-full max-w-xs`}
												{...register("adultProduct", {
													onChange: () =>
														trigger("adultProduct"),
												})}
												onFocus={() =>
													handleFocus("adultProduct")
												}
												onBlur={() =>
													handleBlur("adultProduct")
												}>
												<option disabled value="">
													Selecione uma opção
												</option>
												<option value="false">
													Não
												</option>
												<option value="true">
													Sim
												</option>
											</select>
											{errors.adultProduct && (
												<div className="label">
													<span className="label-text-alt text-red-500">
														{
															errors.adultProduct
																.message
														}
													</span>
												</div>
											)}
										</label>
									</div>
								</div>
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Produto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Imagens do Produto
								</h1>

								<div className="form-control">
									<label
										htmlFor="productImagesInput"
										className="label cursor-pointer">
										<span className="label-text text-black">
											Imagem Principal
										</span>
									</label>

									<div className="flex flex-wrap items-center gap-2">
										{selectedProductImages.map(
											(imagem, index) => {
												const imageUrl =
													URL.createObjectURL(imagem);
												return (
													<div
														key={index}
														className="relative w-24 h-24 border-dashed border-slate-900 border rounded overflow-hidden">
														<Image
															src={imageUrl}
															alt={`Imagem selecionada ${
																index + 1
															}`}
															width={10}
															height={10}
															className="object-contain w-full h-full rounded-sm"
														/>
														<button
															type="button"
															className="absolute top-1 right-1 bg-red-500 text-white p-1 w-6 h-6 rounded z-50 flex items-center justify-center"
															onClick={(e) => {
																e.preventDefault();
																handleRemoveImageProduct(
																	index
																);
															}}>
															X
														</button>
													</div>
												);
											}
										)}

										<div
											className={`${
												errors.productImages
													? `border-error`
													: `border-slate-900`
											} text-black hover:text-white flex flex-col justify-center items-center w-24 h-24 border-[1px] border-dashed hover:bg-slate-900 transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer`}
											onClick={() => {
												const input =
													document.getElementById(
														"productImagesInput"
													);
												input?.click();
											}}>
											<span className="text-xs">
												Add Imagem
											</span>
											<AddPicture size={20} />
										</div>

										<input
											id="productImagesInput"
											type="file"
											accept="image/*"
											multiple
											className="hidden"
											{...register("productImages")}
											onChange={
												handleSelectedProductImages
											}
										/>
									</div>

									<div className="label">
										{errors.productImages && (
											<span className="label-text-alt text-red-500">
												{errors.productImages.message}
											</span>
										)}
									</div>
								</div>
							</div>
						</div>

						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Custo e Quantidade
								</h1>
								<div className="flex flex-row items-center">
									{/* Nome e Descrição */}
									<label className="form-control w-full max-w-2xl">
										<div className="label">
											<span className="label-text text-black">
												Custo do Produto para Troca
											</span>
										</div>
										<div className="join">
											<div>
												<div>
													<input
														className={`input input-bordered ${getFieldClass(
															"productPrice",
															"input"
														)} bg-slate-200 text-slate-900 w-full join-item`}
														type="text"
														placeholder="0,00"
														{...register(
															"productPrice",
															{
																onChange: () =>
																	trigger(
																		"productPrice"
																	),
															}
														)}
														onFocus={() =>
															handleFocus(
																"productPrice"
															)
														}
														onBlur={() =>
															handleBlur(
																"productPrice"
															)
														}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item flex flex-row items-center">
													OP
												</button>
											</div>
										</div>
										<div className="label">
											{errors.productPrice ? (
												<span className="label-text-alt text-red-500">
													{
														errors.productPrice
															.message
													}
												</span>
											) : (
												<span className="label-text-alt text-black">
													Ex.: 2,00 Otaku Points
												</span>
											)}
										</div>
									</label>

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
														className={`input input-bordered w-full ${getFieldClass(
															"stock",
															"input"
														)} bg-slate-200 text-slate-900 join-item`}
														type="text"
														placeholder="0"
														// defaultValue={1}
														// readOnly
														{...register("stock", {
															onChange: () =>
																trigger(
																	"stock"
																),
														})}
														onFocus={() =>
															handleFocus("stock")
														}
														onBlur={() =>
															handleBlur("stock")
														}
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
											className={`select select-bordered ${getFieldClass(
												"condition",
												"select"
											)} bg-slate-200 text-slate-900 w-full max-w-xs`}
											{...register("condition", {
												onChange: () =>
													trigger("condition"),
											})}
											onFocus={() =>
												handleFocus("condition")
											}
											onBlur={() =>
												handleBlur("condition")
											}>
											<option disabled value="">
												Selecione a condição do Produto
											</option>
											<option value="Novo">Novo</option>
											<option value="Usado">Usado</option>
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
														className={`input input-bordered ${getFieldClass(
															"daysShipping",
															"input"
														)} bg-slate-200 text-slate-900 join-item`}
														placeholder="0"
														{...register(
															"daysShipping",
															{
																onChange: () =>
																	trigger(
																		"daysShipping"
																	),
															}
														)}
														onFocus={() =>
															handleFocus(
																"daysShipping"
															)
														}
														onBlur={() =>
															handleBlur(
																"daysShipping"
															)
														}
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
														className={`input input-bordered ${getFieldClass(
															"weight",
															"input"
														)} bg-slate-200 text-slate-900 max-w-[120px] join-item`}
														placeholder="0,000"
														{...register("weight", {
															onChange: () =>
																trigger(
																	"weight"
																),
														})}
														onFocus={() =>
															handleFocus(
																"weight"
															)
														}
														onBlur={() =>
															handleBlur("weight")
														}
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
														className={`input input-bordered ${getFieldClass(
															"length",
															"input"
														)} bg-slate-200 text-slate-900 max-w-[120px] join-item`}
														placeholder="0"
														{...register("length", {
															onChange: () =>
																trigger(
																	"length"
																),
														})}
														onFocus={() =>
															handleFocus(
																"length"
															)
														}
														onBlur={() =>
															handleBlur("length")
														}
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
														className={`input input-bordered ${getFieldClass(
															"width",
															"input"
														)} bg-slate-200 text-slate-900 max-w-[120px] join-item`}
														placeholder="0"
														{...register("width", {
															onChange: () =>
																trigger(
																	"width"
																),
														})}
														onFocus={() =>
															handleFocus("width")
														}
														onBlur={() =>
															handleBlur("width")
														}
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
														className={`input input-bordered ${getFieldClass(
															"height",
															"input"
														)} bg-slate-200 text-slate-900 max-w-[120px] join-item`}
														placeholder="0"
														{...register("height", {
															onChange: () =>
																trigger(
																	"height"
																),
														})}
														onFocus={() =>
															handleFocus(
																"height"
															)
														}
														onBlur={() =>
															handleBlur("height")
														}
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
							</div>
						</div>

						{/* Gadget Final */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black mb-4">
									Deseja publicar o Produto?
								</h1>
								{/* Nome e Descrição */}

								<div className="flex flex-row gap-4">
									<button
										type="button"
										onClick={handleCancelar}
										className="btn btn-outline btn-error hover:shadow-md">
										Cancelar
									</button>
									{loadingButton ? (
										<button
											type="submit"
											className="btn btn-primary w-[200px] text-white shadow-md">
											<span className="loading loading-spinner loading-md"></span>
										</button>
									) : (
										<button
											type="submit"
											className="btn btn-primary w-[200px] shadow-md">
											Publicar Produto
										</button>
									)}
								</div>
							</div>
						</div>
					</form>
					{/* <pre>{output}</pre> */}
					<br />
				</div>
			</div>
		</section>
	);
}

export default CreateProductOtaclubPage;
