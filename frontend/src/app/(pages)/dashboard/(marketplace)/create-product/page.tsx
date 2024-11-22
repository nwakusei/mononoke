"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

// React Hook Form, Zod e ZodResolver
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createProductFormSchema = z
	.object({
		imagesProduct: z
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
							file === null ||
							/\.(jpg|jpeg|png)$/i.test(file.name)
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

					const isValid = /^[A-Za-zÀ-ÿ\s\.,—~\-0-9\[\]\(\)]+$/.test(
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
					message:
						"※ A descrição precisa ter no mínimo 100 caracteres!",
				}
			),
		category: z.string().min(1, "※ A categoria do produto é obrigatória!"),
		productVariations: z
			.array(
				z.object({
					title: z.string().trim(),
					options: z.array(
						z.object({
							name: z.string().trim(),
							originalPrice: z
								.string()
								.trim()
								.refine(
									(value) => {
										if (!value) return true; // Permitir valor vazio (opcional)
										return /^\d+,\d{2}$/.test(value); // Validar formato somente se houver um valor
									},
									{
										message:
											"※ Insira um valor válido no formato 0,00!",
									}
								)
								.transform((value) =>
									value
										? parseFloat(value.replace(",", "."))
										: undefined
								),
							promocionalPrice: z.string().trim(),
							stock: z
								.string()
								.trim()
								.refine(
									(value) => {
										// Verifica se o valor é um número, não é undefined e é um inteiro
										const numberValue = Number(value);
										return (
											!isNaN(numberValue) &&
											Number.isInteger(numberValue)
										);
									},
									{
										message:
											"※ Insira somente números inteiros!",
									}
								),
							//// Essa é a solução que funcionava, mas dava o erro de Image not instance of Filelist
							// imageUrl: z
							// 	.instanceof(FileList)
							// 	.transform((list) => list.item(0))
							// 	.refine(
							// 		(file) =>
							// 			file === null ||
							// 			file!.size <= 2 * 1024 * 1024, // Verifica se é null ou se o tamanho está dentro do limite
							// 		"※ O arquivo precisa ter no máximo 2Mb!"
							// 	)
							// 	.refine(
							// 		(file) =>
							// 			file === null ||
							// 			/\.(jpg|jpeg|png)$/i.test(file!.name), // Verifica se a extensão é JPG, JPEG ou PNG
							// 		"※ O arquivo precisa ser do tipo JPG, JPEG ou PNG!"
							// 	),imageUrl: z
							imageUrl: z
								.any()
								.refine(
									(value) =>
										value === null ||
										value instanceof FileList,
									{
										message:
											"O campo de imagem deve ser um arquivo de imagem.",
									}
								)
								.transform((value) => {
									// Se for um FileList, pega o primeiro arquivo ou retorna null
									if (value instanceof FileList) {
										return value.length > 0
											? value.item(0)
											: null;
									}
									return null; // Retorna null caso não seja um FileList
								})
								.refine(
									(file) =>
										file === null ||
										file.size <= 2 * 1024 * 1024, // Verifica o tamanho
									"O arquivo precisa ter no máximo 2MB!"
								)
								.refine(
									(file) =>
										file === null ||
										/\.(jpg|jpeg|png)$/i.test(file.name), // Verifica a extensão
									"O arquivo precisa ser do tipo JPG, JPEG ou PNG!"
								),
						})
					),
				})
			)
			.optional(),
		originalPrice: z
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
		promocionalPrice: z
			.string()
			.trim()
			.optional()
			.refine((value) => !value || /^\d+,\d{2}$/.test(value), {
				message: "※ Insira um valor válido no formato 0,00!",
			})
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
		preOrder: z.string().min(1, "※ item obrigatório!"),
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
		freeShipping: z.string().refine((value) => value !== "", {
			message: "※ Item obrigatório!",
		}),
		freeShippingRegion: z.string().refine((value) => value !== "", {
			message: "※ Item obrigatório!",
		}),
	})
	.refine(
		(data) => {
			const hasOriginalPrice = !!data.originalPrice;
			const hasVariations =
				Array.isArray(data.productVariations) &&
				data.productVariations.some(
					(variation) =>
						variation.title.trim() !== "" ||
						variation.options?.some((opt) => opt.name.trim() !== "")
				);

			// Caso nenhum esteja preenchido
			if (!hasOriginalPrice && !hasVariations) {
				return false; // Nenhum preenchido, invalida
			}

			// Caso originalPrice e stock estejam preenchidos, productVariations deve estar vazio
			if (hasOriginalPrice && hasVariations) {
				return false; // Ambos originalPrice e stock preenchidos e productVariations preenchido, invalida
			}

			// Caso originalPrice ou stock estejam preenchidos, productVariations deve estar vazio
			if (hasOriginalPrice && hasVariations) {
				return false; // Caso originalPrice ou stock preenchidos, mas productVariations preenchido, invalida
			}

			return true; // Validação passou
		},
		{
			message: "※ Insira o preço do produto!",
			path: ["originalPrice"], // Associando o erro aos dois campos
		}
	)
	.refine(
		(data) => {
			const hasStock = !!data.stock; // Verifica se o stock está preenchido
			const hasVariations =
				Array.isArray(data.productVariations) &&
				data.productVariations.some(
					(variation) =>
						variation.title.trim() !== "" ||
						variation.options?.some((opt) => opt.name.trim() !== "")
				);

			// Caso nenhum esteja preenchido
			if (!hasStock && !hasVariations) {
				return false; // Nenhum preenchido, invalida
			}

			// Caso originalPrice e stock estejam preenchidos, productVariations deve estar vazio
			if (hasStock && hasVariations) {
				return false; // Ambos originalPrice e stock preenchidos e productVariations preenchido, invalida
			}

			// Caso originalPrice ou stock estejam preenchidos, productVariations deve estar vazio
			if (hasStock && hasVariations) {
				return false; // Caso originalPrice ou stock preenchidos, mas productVariations preenchido, invalida
			}

			return true; // Validação passou
		},
		{
			message: "※ A quantidade em estoque é obrigatória!",
			path: ["stock"], // Associando o erro aos dois campos
		}
	)
	.refine(
		(data) => {
			const hasOriginalPrice = !!data.originalPrice;
			const hasVariations =
				Array.isArray(data.productVariations) &&
				data.productVariations.some(
					(variation) =>
						variation.title.trim() !== "" ||
						variation.options?.some((opt) => opt.name.trim() !== "")
				);
			const hasStock = !!data.stock; // Verifica se o stock está preenchido

			// Caso nenhum esteja preenchido
			if (!hasOriginalPrice && !hasVariations && !hasStock) {
				return false; // Nenhum preenchido, invalida
			}

			// Caso originalPrice e stock estejam preenchidos, productVariations deve estar vazio
			if (hasOriginalPrice && hasStock && hasVariations) {
				return false; // Ambos originalPrice e stock preenchidos e productVariations preenchido, invalida
			}

			// Caso originalPrice ou stock estejam preenchidos, productVariations deve estar vazio
			if ((hasOriginalPrice || hasStock) && hasVariations) {
				return false; // Caso originalPrice ou stock preenchidos, mas productVariations preenchido, invalida
			}

			return true; // Validação passou
		},
		{
			message: "※ O título da Variação é obrigatório!",
		}
	)
	.superRefine((data, ctx) => {
		// Se o preço original e estoque estão preenchidos, pula validação das variações
		if (data.originalPrice && data.stock) {
			return;
		}

		// Garante que productVariations é um array antes de usar forEach
		const productVariations = Array.isArray(data.productVariations)
			? data.productVariations
			: [];

		// Validação do título das variações
		productVariations.forEach((variation, variationIndex) => {
			if (!variation.title || variation.title.trim() === "") {
				ctx.addIssue({
					code: "custom",
					message: "※ O título da Variação é obrigatório!",
					path: ["productVariations", variationIndex, "title"],
				});
			}
		});
	})
	// .superRefine((data, ctx) => {
	// 	// Se o originalPrice estiver preenchido, a validação das variações não é necessária
	// 	if (data.originalPrice && data.stock) {
	// 		return; // Não realiza a validação das variações se o originalPrice e stock estiverem preenchidos
	// 	}

	// 	// Validação para garantir que o título de cada variação não está vazio
	// 	data.productVariations.forEach((variation, variationIndex) => {
	// 		if (variation.title.trim() === "") {
	// 			// Adiciona o erro com o path dinâmico para o título da variação
	// 			ctx.addIssue({
	// 				code: "custom",
	// 				message: "※ O título da Variação é obrigatório!",
	// 				path: ["productVariations", variationIndex, "title"], // Path dinâmico
	// 			});
	// 		}
	// 	});
	// })
	.refine(
		(data) => {
			const hasOriginalPrice = !!data.originalPrice;
			const hasVariations =
				Array.isArray(data.productVariations) &&
				data.productVariations.some(
					(variation) =>
						variation.title.trim() !== "" ||
						variation.options?.some((opt) => opt.name.trim() !== "")
				);
			const hasStock = !!data.stock; // Verifica se o stock está preenchido

			// Caso nenhum esteja preenchido
			if (!hasOriginalPrice && !hasVariations && !hasStock) {
				return false; // Nenhum preenchido, invalida
			}

			// Caso originalPrice e stock estejam preenchidos, productVariations deve estar vazio
			if (hasOriginalPrice && hasStock && hasVariations) {
				return false; // Ambos originalPrice e stock preenchidos e productVariations preenchido, invalida
			}

			// Caso originalPrice ou stock estejam preenchidos, productVariations deve estar vazio
			if ((hasOriginalPrice || hasStock) && hasVariations) {
				return false; // Caso originalPrice ou stock preenchidos, mas productVariations preenchido, invalida
			}

			return true;
		},
		{
			message: "※ O nome da opção é obrigatório!",
		}
	)
	// .superRefine((data, ctx) => {
	// 	// Se o originalPrice estiver preenchido, a validação das variações não é necessária
	// 	if (data.originalPrice && data.stock) {
	// 		return; // Não realiza a validação das variações se o originalPrice estiver preenchido
	// 	}

	// 	// Validação para garantir que as opções não tenham nome vazio
	// 	data.productVariations.forEach((variation, variationIndex) => {
	// 		variation.options?.forEach((option, optionIndex) => {
	// 			if (option.name.trim() === "") {
	// 				// Adiciona o erro com o path dinâmico
	// 				ctx.addIssue({
	// 					code: "custom",
	// 					message: "※ O nome da opção é obrigatório!",
	// 					path: [
	// 						"productVariations",
	// 						variationIndex,
	// 						"options",
	// 						optionIndex,
	// 						"name",
	// 					], // Path dinâmico
	// 				});
	// 			}
	// 		});
	// 	});
	// })
	// .superRefine((data, ctx) => {
	// 	// Se o originalPrice estiver preenchido, a validação das variações não é necessária
	// 	if (data.originalPrice && data.stock) {
	// 		return; // Não realiza a validação das variações se o originalPrice estiver preenchido
	// 	}

	// 	// Validação para garantir que as opções não tenham campos inválidos
	// 	data.productVariations.forEach((variation, variationIndex) => {
	// 		variation.options?.forEach((option, optionIndex) => {
	// 			// Verifica se o nome está vazio
	// 			if (option.name.trim() === "") {
	// 				ctx.addIssue({
	// 					code: "custom",
	// 					message: "※ O nome da opção é obrigatório!",
	// 					path: [
	// 						"productVariations",
	// 						variationIndex,
	// 						"options",
	// 						optionIndex,
	// 						"name",
	// 					], // Path dinâmico
	// 				});
	// 			}

	// 			// Verifica se a imagem está vazia
	// 			if (!option.imageUrl) {
	// 				ctx.addIssue({
	// 					code: "custom",
	// 					message: "※ Insira pelo menos 1 imagem!",
	// 					path: [
	// 						"productVariations",
	// 						variationIndex,
	// 						"options",
	// 						optionIndex,
	// 						"imageUrl",
	// 					], // Path dinâmico
	// 				});
	// 			}
	// 		});
	// 	});
	// })
	.superRefine((data, ctx) => {
		// Se o preço original e estoque estão preenchidos, pula a validação das variações
		if (data.originalPrice && data.stock) {
			return;
		}

		// Garante que productVariations é um array antes de usar forEach
		const productVariations = Array.isArray(data.productVariations)
			? data.productVariations
			: [];

		// Validação das opções dentro das variações
		productVariations.forEach((variation, variationIndex) => {
			const options = Array.isArray(variation.options)
				? variation.options
				: [];

			options.forEach((option, optionIndex) => {
				// Verifica se o nome da opção está vazio
				if (!option.name || option.name.trim() === "") {
					ctx.addIssue({
						code: "custom",
						message: "※ O nome da opção é obrigatório!",
						path: [
							"productVariations",
							variationIndex,
							"options",
							optionIndex,
							"name",
						],
					});
				}

				if (
					option.originalPrice == null || // Verifica null ou undefined
					typeof option.originalPrice !== "number" || // Certifica que é um número
					isNaN(option.originalPrice) || // Valida que não seja NaN
					option.originalPrice <= 0 // Garante que seja maior que 0
				) {
					ctx.addIssue({
						code: "custom",
						message:
							"※ O preço deve ser um número válido e maior que 0!",
						path: [
							"productVariations",
							variationIndex,
							"options",
							optionIndex,
							"originalPrice",
						],
					});
				}

				if (!option.stock || option.stock.trim() === "") {
					ctx.addIssue({
						code: "custom",
						message: "※ A quantidade em estoque é obrigatória!",
						path: [
							"productVariations",
							variationIndex,
							"options",
							optionIndex,
							"stock",
						],
					});
				}

				// Verifica se a imagem da opção está vazia
				if (!option.imageUrl) {
					ctx.addIssue({
						code: "custom",
						message: "※ Insira pelo menos 1 imagem!",
						path: [
							"productVariations",
							variationIndex,
							"options",
							optionIndex,
							"imageUrl",
						],
					});
				}
			});
		});
	});

type TCreateProductFormData = z.infer<typeof createProductFormSchema>;

function CreateProductPage() {
	const [imagensSelecionadas, setImagensSelecionadas] = useState<File[]>([]);
	const [imagensSelecionadas2, setImagensSelecionadas2] = useState<File[]>(
		[]
	);
	const [token] = useState(localStorage.getItem("token") || "");
	const [isLoading, setIsLoading] = useState(true);

	const [offerFreeShipping, setOfferFreeShipping] = useState("");

	const [displayVariations, setDiisplayVariations] = useState(false);

	// const [variations, setVariations] = useState([]);

	// const handleAddVariation = () => {
	// 	// Adiciona uma nova variação com um campo vazio
	// 	setVariations([
	// 		...variations,
	// 		{ title: "", options: [{ name: "", imageUrl: "" }] },
	// 	]);
	// };

	// const handleOptionChange = (variationIndex, optionIndex, field, value) => {
	// 	const newVariations = [...variations];
	// 	newVariations[variationIndex].options[optionIndex][field] = value;
	// 	setVariations(newVariations);
	// };

	// const handleAddOption = (variationIndex) => {
	// 	const newVariations = [...variations];
	// 	newVariations[variationIndex].options.push({
	// 		name: "",
	// 		imageUrl: "",
	// 	});
	// 	setVariations(newVariations);
	// };

	// const handleVariationChange = (index, value) => {
	// 	const newVariations = [...variations];
	// 	newVariations[index].title = value;
	// 	setVariations(newVariations);
	// };

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		setError,
		clearErrors,
		control,
	} = useForm<TCreateProductFormData>({
		resolver: zodResolver(createProductFormSchema),
		mode: "onBlur",
	});

	const handleFreeShippingChange = (event) => {
		const value = event.target.value;
		setOfferFreeShipping(value);

		// Se "Não" for selecionado, reseta o segundo select para "Nenhuma"
		if (value === "false") {
			setValue("freeShippingRegion", "Nenhuma"); // Define como "Nenhuma"
		} else {
			setValue("freeShippingRegion", ""); // Limpa a seleção para "Sim"
		}
	};

	useEffect(() => {
		// Simular um atraso no carregamento
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 2000); // 2000 ms = 2 segundos

		// Limpar o timeout se o componente for desmontado antes do timeout ser concluído
		return () => clearTimeout(timer);
	}, []); // Executa apenas uma vez na montagem do componente

	// // Solução para armazenamento de apenas 1 imagem
	// const handleImagemSelecionada = (
	// 	event: React.ChangeEvent<HTMLInputElement>
	// ) => {
	// 	const file = event.target.files?.[0];
	// 	if (file) {
	// 		const reader = new FileReader();
	// 		reader.onload = () => {
	// 			setImagemSelecionada(reader.result);
	// 		};
	// 		reader.readAsDataURL(file);
	// 	}
	// };

	// // Solução para armazenamento de Array de imagens
	// const handleImagemSelecionada = (
	// 	event: React.ChangeEvent<HTMLInputElement>
	// ) => {
	// 	const files = event.target.files;
	// 	if (files) {
	// 		const fileArray = Array.from(files); // Converte o FileList em um array
	// 		setImagensSelecionadas((prev) => [...prev, ...fileArray]); // Adiciona novos arquivos ao estado
	// 	}
	// };

	// // Solução para armazenamento de Array de imagens em um Estado, para então armazenar no banco de dados.
	// const handleImagemSelecionada = (
	// 	event: React.ChangeEvent<HTMLInputElement>
	// ) => {
	// 	const files = event.target.files;
	// 	if (files) {
	// 		const fileArray = Array.from(files); // Converte o FileList em um array

	// 		// Aqui, você já fez a validação com Zod, então assumimos que se o arquivo chegou aqui, passou pelas validações.
	// 		setImagensSelecionadas((prev) => [...prev, ...fileArray]); // Adiciona novos arquivos ao estado
	// 		clearErrors("imagesProduct"); // Limpa erros anteriores, se houver
	// 	}
	// };

	const handleImagemSelecionada = (
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
					setError("imagesProduct", {
						message: "※ Cada arquivo precisa ter no máximo 2Mb!",
					});
				}

				if (!isValidFormat) {
					setError("imagesProduct", {
						message:
							"※ Insira apenas imagens com extensão .JPG, .JPEG ou .PNG!",
					});
				}

				return isValidSize && isValidFormat; // Retorna apenas arquivos válidos
			});

			// Verifica se há imagens válidas
			if (validFiles.length > 0) {
				// Se houver imagens válidas, atualiza o estado
				setImagensSelecionadas((prev) => [...prev, ...validFiles]);
				clearErrors("imagesProduct"); // Limpa os erros anteriores
			} else {
				// Caso não haja imagens válidas, define uma mensagem de erro
				setError("imagesProduct", {
					message: errors.imagesProduct
						? errors.imagesProduct.message
						: "Nenhuma imagem válida selecionada!",
				});
			}

			// // Adiciona a validação para garantir que pelo menos uma imagem foi selecionada
			// if (validFiles.length === 0) {
			// 	setError("imagesProduct", {
			// 		message: "※ Insira pelo menos 1 imagem!",
			// 	});
			// }
		}
	};

	const handleImagemSelecionada2 = (
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
					setError("imagesProduct", {
						message: "※ Cada arquivo precisa ter no máximo 2Mb!",
					});
				}

				if (!isValidFormat) {
					setError("imagesProduct", {
						message:
							"※ Insira apenas imagens com extensão .JPG, .JPEG ou .PNG!",
					});
				}

				return isValidSize && isValidFormat; // Retorna apenas arquivos válidos
			});

			// Verifica se há imagens válidas
			if (validFiles.length > 0) {
				// Se houver imagens válidas, atualiza o estado
				setImagensSelecionadas2((prev) => [...prev, ...validFiles]);
				clearErrors("imagesProduct"); // Limpa os erros anteriores
			} else {
				// Caso não haja imagens válidas, define uma mensagem de erro
				setError("imagesProduct", {
					message: errors.imagesProduct
						? errors.imagesProduct.message
						: "Nenhuma imagem válida selecionada!",
				});
			}

			// // Adiciona a validação para garantir que pelo menos uma imagem foi selecionada
			// if (validFiles.length === 0) {
			// 	setError("imagesProduct", {
			// 		message: "※ Insira pelo menos 1 imagem!",
			// 	});
			// }
		}
	};

	const router = useRouter();

	// // Função para adicionar uma nova variação
	// const handleAddVariation = () => {
	// 	setVariations([
	// 		...variations,
	// 		{ id: variations.length, name: "", types: [""] },
	// 	]);
	// };

	// // Função para adicionar um novo tipo a uma variação existente
	// const handleAddType = (variationId) => {
	// 	const updatedVariations = variations.map((variation) =>
	// 		variation.id === variationId
	// 			? { ...variation, types: [...variation.types, ""] }
	// 			: variation
	// 	);
	// 	setVariations(updatedVariations);
	// };

	// // Função para atualizar o valor do nome da variação
	// const handleNameChange = (variationId, value) => {
	// 	const updatedVariations = variations.map((variation) =>
	// 		variation.id === variationId
	// 			? { ...variation, name: value }
	// 			: variation
	// 	);
	// 	setVariations(updatedVariations);
	// };

	// // Função para atualizar o valor de um tipo
	// const handleTypeChange = (variationId, typeId, value) => {
	// 	const updatedVariations = variations.map((variation) =>
	// 		variation.id === variationId
	// 			? {
	// 					...variation,
	// 					types: variation.types.map((type, index) =>
	// 						index === typeId ? value : type
	// 					),
	// 			  }
	// 			: variation
	// 	);
	// 	setVariations(updatedVariations);
	// };

	const [output, setOutput] = useState("");

	// // REQUISIÇÃO ATUAL QUE FUNCIONA PARA CRIAÇÃO DO PRODUTO
	// async function handleCreateProduct(productData: { [key: string]: any }) {
	// 	setOutput(JSON.stringify(productData, null, 2));

	// 	console.log(productData);

	// 	// Sanitiza os dados antes de usá-los
	// 	const sanitizedData = Object.fromEntries(
	// 		Object.entries(productData).map(([key, value]) => {
	// 			// Verifica se o valor é uma string (ou outro tipo que precise de sanitização)
	// 			if (typeof value === "string") {
	// 				return [key, DOMPurify.sanitize(value)];
	// 			}
	// 			return [key, value]; // Retorna o valor original se não for uma string
	// 		})
	// 	);

	// 	console.log(sanitizedData);

	// 	const formData = new FormData();

	// 	// Itera sobre os campos de texto e adiciona ao FormData
	// 	Object.entries(sanitizedData).forEach(([key, value]) => {
	// 		if (key === "productVariations") {
	// 			// Converte productVariations para uma string JSON
	// 			formData.append(key, JSON.stringify(value));
	// 		} else if (key !== "imagesProduct") {
	// 			formData.append(key, value);
	// 		}
	// 	});

	// 	// Adiciona as imagens ao FormData
	// 	if (imagensSelecionadas.length === 0) {
	// 		setError("imagesProduct", {
	// 			message: "※ Insira pelo menos 1 imagem!",
	// 		});
	// 		return; // Se não houver imagens, retorna
	// 	}

	// 	imagensSelecionadas.forEach((image) => {
	// 		formData.append("imagesProduct", image);
	// 	});

	// 	console.log(formData);

	// 	try {
	// 		const response = await api.post("/products/create", formData, {
	// 			headers: {
	// 				Authorization: `Bearer ${JSON.parse(token)}`,
	// 			},
	// 		});
	// 		// Exibe toast de sucesso
	// 		toast.success(response.data.message);

	// 		router.push("/dashboard/myproducts");
	// 		return response.data;
	// 	} catch (error: any) {
	// 		toast.error(error.response.data.message);
	// 		return error.response.data;
	// 	}
	// }

	async function handleCreateProduct(productData: { [key: string]: any }) {
		setOutput(JSON.stringify(productData, null, 2));
		console.log("Dados do produto:", productData);

		// Sanitiza os dados antes de usá-los
		const sanitizedData = Object.fromEntries(
			Object.entries(productData).map(([key, value]) => {
				if (typeof value === "string") {
					return [key, DOMPurify.sanitize(value)];
				}
				return [key, value];
			})
		);

		console.log("Dados sanitizados:", sanitizedData);

		const formData = new FormData();

		// Itera sobre os campos de texto e adiciona ao FormData
		Object.entries(sanitizedData).forEach(([key, value]) => {
			if (key === "promocionalPrice" || key === "originalPrice") {
				// Atribui 0 se o valor estiver vazio ou undefined
				const numericValue = value ? parseFloat(value) : 0;
				formData.append(
					key,
					isNaN(numericValue) ? "0" : numericValue.toString()
				);
			} else if (key === "productVariations") {
				const variations = value as Array<any>;
				variations.forEach((variation, index) => {
					// Adiciona os dados da variação
					formData.append(
						`productVariations[${index}][title]`,
						variation.title
					);

					variation.options.forEach((option, optionIndex) => {
						formData.append(
							`productVariations[${index}][options][${optionIndex}][name]`,
							option.name
						);

						formData.append(
							`productVariations[${index}][options][${optionIndex}][originalPrice]`,
							option.originalPrice
						);

						// Adicionar imagem da variação se existir (para 1 único File)
						if (option.imageUrl) {
							formData.append(
								`productVariations[${index}][options][${optionIndex}][imageUrl]`,
								option.imageUrl
							);
						}

						// // Adicionar imagem da variação se existir (para array de File)
						// if (option.imageUrl && option.imageUrl[0]) {
						// 	formData.append(
						// 		`productVariations[${index}][options][${optionIndex}][imageUrl]`,
						// 		option.imageUrl[0]
						// 	);
						// }
					});
				});
			} else if (key !== "imagesProduct") {
				formData.append(key, value);
			}
		});

		// Adiciona as imagens do produto principal ao FormData
		if (imagensSelecionadas.length === 0) {
			setError("imagesProduct", {
				message: "※ Insira pelo menos 1 imagem!",
			});
			return;
		}

		imagensSelecionadas.forEach((image) => {
			formData.append("imagesProduct", image);
		});

		// Debugando o FormData
		console.log("Conteúdo do FormData:");
		for (let [key, value] of formData.entries()) {
			console.log(`${key}:`, value);
		}

		try {
			const response = await api.post("/products/create", formData, {
				headers: {
					Authorization: `Bearer ${JSON.parse(token)}`,
				},
			});
			toast.success(response.data.message);
			// router.push("/dashboard/myproducts");
			return response.data;
		} catch (error: any) {
			toast.error(error.response.data.message);
			return error.response.data;
		}
	}

	const handleCancelar = () => {
		// Redirecionar para outra página ao clicar em Cancelar
		router.push("/dashboard/myproducts");
	};

	if (isLoading) {
		return <LoadingPage />;
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
											className={`${
												errors.productTitle &&
												`input-error`
											} input input-bordered input-success w-full`}
											{...register("productTitle")}
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
											className={`${
												errors.description &&
												`textarea-error`
											} textarea textarea-success w-[885px] h-[200px]`}
											placeholder="Descreva todos os detalhes do produto..."
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
											className={`select ${
												errors.category
													? `select-error`
													: `select-success`
											} w-full`}
											{...register("category")}>
											<option disabled selected value="">
												Escolha a categoria do Produto
											</option>
											<option>Impresso</option>
											<option>Figure</option>
											<option>Game</option>
											<option>CD/DVD</option>
											<option>Vestuário</option>
											<option>Acessório</option>
											<option>TGC (Card Game)</option>
											<option>Papelaria</option>
											<option>Óculos</option>
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
							{/* Adicionar Produto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Imagens do Produto
								</h1>

								{/* Add Imagens */}
								<div className="label">
									<span className="label-text text-black">
										Imagem Principal
									</span>
								</div>

								<label className="form-control w-full">
									{/* Container das imagens */}
									<div className="flex flex-wrap items-center gap-2">
										{imagensSelecionadas.map(
											(imagem, index) => {
												const imageUrl =
													URL.createObjectURL(imagem); // Cria a URL para a imagem
												return (
													<div
														key={index}
														className="relative w-24 h-24 border-dashed border-[#3e1d88] border rounded overflow-hidden">
														<img
															src={imageUrl}
															alt={`Imagem selecionada ${
																index + 1
															}`}
															className="object-contain w-full h-full rounded-sm"
														/>
													</div>
												);
											}
										)}

										{/* Adiciona um input para selecionar novas imagens */}
										<div
											className={`${
												errors.imagesProduct &&
												`border-error`
											} text-black hover:text-white flex flex-col justify-center items-center w-24 h-24 border-[1px] border-dashed border-[#3e1d88] hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md cursor-pointer relative`}>
											<span className="text-xs">
												Add Imagem
											</span>
											<AddPicture size={20} />
											<input
												type="file"
												accept="image/*"
												multiple
												className="absolute inset-0 opacity-0 cursor-pointer" // Torna o input invisível, mas clicável
												{...register("imagesProduct")} // Conecta o input ao react-hook-form
												onChange={
													handleImagemSelecionada
												} // Manuseia arquivos selecionados
											/>
										</div>
									</div>
								</label>

								<div className="label">
									{errors.imagesProduct && (
										<span className="label-text-alt text-red-500">
											{errors.imagesProduct.message}
										</span>
									)}
								</div>
							</div>
						</div>

						{displayVariations ? (
							<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
								<div className="flex flex-col gap-2 ml-6 mb-6">
									<h1 className="text-2xl font-semibold text-black mb-3">
										Variações
									</h1>

									<Controller
										name="productVariations"
										control={control}
										defaultValue={[
											{
												title: "",
												options: [
													{
														name: "",
														imageUrl: null,
													},
												],
											},
										]}
										render={({
											field: { onChange, value },
										}) => (
											<>
												{Array.isArray(value) &&
													value.map(
														(
															variation,
															variationIndex
														) => (
															<div
																className="flex flex-col gap-4"
																key={
																	variationIndex
																}>
																<h3>
																	Variação{" "}
																	{variationIndex +
																		1}
																</h3>

																<div className="flex flex-col">
																	<input
																		className={`w-[360px] input input-bordered ${
																			errors
																				.productVariations?.[
																				variationIndex
																			]
																				?.title
																				? `input-error`
																				: `input-success`
																		}`}
																		type="text"
																		placeholder="Ex.: Cores"
																		{...register(
																			`productVariations.${variationIndex}.title`
																		)}
																		defaultValue={
																			variation.title
																		}
																	/>
																	<div>
																		{errors
																			.productVariations?.[
																			variationIndex
																		]
																			?.title && (
																			<span className="text-red-500 text-xs">
																				{
																					errors
																						.productVariations?.[
																						variationIndex
																					]
																						?.title
																						.message
																				}
																			</span>
																		)}
																	</div>
																</div>

																{variation
																	.options
																	.length >
																	0 && (
																	<h4>
																		Opções
																	</h4>
																)}

																{variation.options.map(
																	(
																		option,
																		optionIndex
																	) => (
																		<div
																			className=""
																			key={
																				optionIndex
																			}>
																			<div className="flex flex-row gap-2">
																				<div className="flex flex-col">
																					<div className="label">
																						<span className="label-text text-black">
																							Imagem
																						</span>
																					</div>
																					{/* <h1 className="text-black text-sm mb-2">
																						Imagem
																					</h1> */}
																					<div
																						className={`${
																							errors
																								.productVariations?.[
																								variationIndex
																							]
																								?.options?.[
																								optionIndex
																							]
																								?.imageUrl
																								? `border-error`
																								: `border-success`
																						} text-black hover:text-white flex flex-col justify-center items-center w-[48px] h-[48px] border-[1px] border-dashed border-[#3e1d88] hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
																						<AddPicture
																							size={
																								20
																							}
																						/>
																						<input
																							type="file"
																							accept="image/*"
																							multiple
																							className="absolute inset-0 opacity-0 cursor-pointer" // Torna o input invisível, mas clicável
																							{...register(
																								`productVariations.${variationIndex}.options.${optionIndex}.imageUrl`
																							)}
																						/>
																					</div>
																				</div>

																				<label className="form-control">
																					<div className="label">
																						<span className="label-text text-black">
																							Nome
																							da
																							Opção
																						</span>
																					</div>
																					<div className="join">
																						{/* <div className="indicator">
																							<button
																								type="button"
																								className="btn join-item flex flex-row items-center">
																								<TbCurrencyReal
																									size={
																										20
																									}
																								/>
																							</button>
																						</div> */}
																						<div>
																							<div>
																								<input
																									className={`input input-bordered ${
																										errors
																											.productVariations?.[
																											variationIndex
																										]
																											?.options?.[
																											optionIndex
																										]
																											?.name
																											? `input-error`
																											: `input-success`
																									} w-[400px] join-item`}
																									type="text"
																									placeholder="Ex.: Preto"
																									{...register(
																										`productVariations.${variationIndex}.options.${optionIndex}.name`
																									)}
																									defaultValue={
																										option.name
																									}
																								/>
																							</div>
																						</div>
																					</div>
																					<div className="label">
																						{errors
																							.productVariations?.[
																							variationIndex
																						]
																							?.options?.[
																							optionIndex
																						]
																							?.name && (
																							<span className="text-red-500 text-xs">
																								{
																									errors
																										.productVariations?.[
																										variationIndex
																									]
																										?.options?.[
																										optionIndex
																									]
																										?.name
																										.message
																								}
																							</span>
																						)}
																					</div>
																				</label>

																				{/* <div className="flex flex-col">
																					<div className="label">
																						<span className="label-text text-black">
																							Nome
																							da
																							Opção
																						</span>
																					</div>
																					<input
																						className={`input input-bordered ${
																							errors
																								.productVariations?.[
																								variationIndex
																							]
																								?.options?.[
																								optionIndex
																							]
																								?.name
																								? `input-error`
																								: `input-success`
																						} w-[400px]`}
																						type="text"
																						placeholder="Nome da opção"
																						{...register(
																							`productVariations.${variationIndex}.options.${optionIndex}.name`
																						)}
																						defaultValue={
																							option.name
																						}
																					/>
																				</div> */}

																				<label className="form-control">
																					<div className="label">
																						<span className="label-text text-black">
																							Preço
																							original
																						</span>
																					</div>
																					<div className="join">
																						<div className="indicator">
																							<button
																								type="button"
																								className="btn join-item flex flex-row items-center">
																								<TbCurrencyReal
																									size={
																										20
																									}
																								/>
																							</button>
																						</div>
																						<div>
																							<div>
																								<input
																									className={`input input-bordered ${
																										errors
																											.productVariations?.[
																											variationIndex
																										]
																											?.options?.[
																											optionIndex
																										]
																											?.originalPrice
																											? `input-error`
																											: `input-success`
																									} w-[150px] join-item`}
																									type="text"
																									placeholder="0,00"
																									{...register(
																										`productVariations.${variationIndex}.options.${optionIndex}.originalPrice`
																									)}
																									defaultValue={
																										option.originalPrice
																									}
																								/>
																							</div>
																						</div>
																					</div>
																					<div className="label">
																						{errors
																							.productVariations?.[
																							variationIndex
																						]
																							?.options?.[
																							optionIndex
																						]
																							?.originalPrice && (
																							<span className="text-red-500 text-xs">
																								{
																									errors
																										.productVariations?.[
																										variationIndex
																									]
																										?.options?.[
																										optionIndex
																									]
																										?.originalPrice
																										.message
																								}
																							</span>
																						)}
																					</div>
																				</label>

																				<label className="form-control">
																					<div className="label">
																						<span className="label-text text-black">
																							Preço
																							promocional
																						</span>
																					</div>
																					<div className="join">
																						<div className="indicator">
																							<button
																								type="button"
																								className="btn join-item flex flex-row items-center">
																								<TbCurrencyReal
																									size={
																										20
																									}
																								/>
																							</button>
																						</div>
																						<div>
																							<div>
																								<input
																									className={`input input-bordered ${
																										errors
																											.productVariations?.[
																											variationIndex
																										]
																											?.options?.[
																											optionIndex
																										]
																											?.promocionalPrice
																											? `input-error`
																											: `input-success`
																									} w-[150px] join-item`}
																									type="text"
																									placeholder="0,00"
																									{...register(
																										`productVariations.${variationIndex}.options.${optionIndex}.promocionalPrice`
																									)}
																									defaultValue={
																										option.promocionalPrice
																									}
																								/>
																							</div>
																						</div>
																					</div>
																					{/* <div className="label">
																						{errors.originalPrice ? (
																							<span className="label-text-alt text-red-500">
																								{
																									errors
																										.originalPrice
																										.message
																								}
																							</span>
																						) : (
																							<span className="label-text-alt text-black">
																								Ex.:
																								R$
																								1,00
																							</span>
																						)}
																					</div> */}
																				</label>

																				<label className="form-control">
																					<div className="label">
																						<span className="label-text text-black">
																							Estoque
																						</span>
																					</div>
																					<div className="join">
																						<div>
																							<div>
																								<input
																									className={`input input-bordered ${
																										errors
																											.productVariations?.[
																											variationIndex
																										]
																											?.options?.[
																											optionIndex
																										]
																											?.stock
																											? `input-error`
																											: `input-success`
																									} w-[130px] join-item`}
																									type="text"
																									placeholder="0"
																									{...register(
																										`productVariations.${variationIndex}.options.${optionIndex}.stock`
																									)}
																									defaultValue={
																										option.stock
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
																						{errors
																							.productVariations?.[
																							variationIndex
																						]
																							?.options?.[
																							optionIndex
																						]
																							?.stock && (
																							<span className="text-red-500 text-xs">
																								{
																									errors
																										.productVariations?.[
																										variationIndex
																									]
																										?.options?.[
																										optionIndex
																									]
																										?.stock
																										.message
																								}
																							</span>
																						)}
																					</div>
																				</label>
																			</div>
																			<div>
																				{errors
																					.productVariations?.[
																					variationIndex
																				]
																					?.options?.[
																					optionIndex
																				]
																					?.imageUrl && (
																					<span className="text-red-500 text-xs">
																						{
																							errors
																								.productVariations?.[
																								variationIndex
																							]
																								?.options?.[
																								optionIndex
																							]
																								?.imageUrl
																								.message
																						}
																					</span>
																				)}
																			</div>
																		</div>
																	)
																)}
																<button
																	className="border-dashed border-[1px] border-primary hover:bg-primary transition-all ease-in duration-200 py-3 rounded-md w-[200px]"
																	type="button"
																	onClick={() => {
																		const newOptions =
																			[
																				...variation.options,
																				{
																					name: "",
																					imageUrl:
																						"",
																				},
																			];
																		onChange(
																			value.map(
																				(
																					v,
																					i
																				) =>
																					i ===
																					variationIndex
																						? {
																								...v,
																								options:
																									newOptions,
																						  }
																						: v
																			)
																		);
																	}}>
																	+ Adicionar
																	Opção
																</button>
															</div>
														)
													)}
												<button
													className="border-dashed border-[1px] border-primary hover:bg-primary transition-all ease-in duration-200 py-3 rounded-md w-[200px]"
													type="button"
													onClick={() => {
														// Garante que value é sempre um array
														const newVariations =
															Array.isArray(value)
																? [
																		...value,
																		{
																			title: "",
																			options:
																				[
																					{
																						name: "",
																						imageUrl:
																							"",
																					},
																				],
																		},
																  ]
																: [];
														onChange(newVariations);
													}}>
													Adicionar Variação
												</button>
											</>
										)}
									/>
								</div>
							</div>
						) : (
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
														<TbCurrencyReal
															size={20}
														/>
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
														<TbCurrencyReal
															size={20}
														/>
													</button>
												</div>
												<div>
													<div>
														<input
															className={`input input-bordered ${
																errors.promocionalPrice
																	? `input-error`
																	: `input-success`
															} join-item`}
															placeholder="0,00"
															{...register(
																"promocionalPrice"
															)}
														/>
													</div>
												</div>
											</div>
											<div className="label">
												{errors.promocionalPrice ? (
													<span className="label-text-alt text-red-500">
														{
															errors
																.promocionalPrice
																.message
														}
													</span>
												) : (
													<span className="label-text-alt text-black">
														Ex.: R$ 1,00
													</span>
												)}
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
															{...register(
																"stock"
															)}
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
									<button
										onClick={() =>
											setDiisplayVariations(true)
										}
										className="btn btn-primary mt-4">
										Criar Variações
									</button>
								</div>
							</div>
						)}
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
											className={`select ${
												errors.condition
													? `select-error`
													: `select-success`
											}  w-full max-w-xs`}
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
											<span className="label-text text-black">
												O item é uma encomenda?
											</span>
										</div>

										<select
											className={`select ${
												errors.preOrder
													? `select-error`
													: `select-success`
											}  w-full max-w-xs`}
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
											onChange={handleFreeShippingChange}
											defaultValue=""
											value={offerFreeShipping}
											className={`select select-success w-full max-w-xs ${
												errors.freeShipping
													? "select-error"
													: "select-success"
											}`}>
											<option value="" disabled selected>
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
												<span className="label-text-alt text-black opacity-0">
													Label não visivel
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
											className={`select ${
												errors.freeShippingRegion
													? `select-error`
													: `select-success`
											} w-full max-w-xs`}
											disabled={
												offerFreeShipping === "false"
											} // Desabilita se "Não" for selecionado
											defaultValue={
												offerFreeShipping === "false"
													? "Nenhuma"
													: ""
											}>
											<option value="" disabled>
												Escolha a região
											</option>
											<option disabled>Nenhuma</option>
											<option value="BR">Brasil</option>
											<option value="SP">
												São Paulo
											</option>
											<option value="RJ">
												Rio de Janeiro
											</option>
											<option value="PR">Paraná</option>
											<option value="MG">
												Minas Gerais
											</option>
											<option value="SC">
												Santa Catarina
											</option>
											<option value="RS">
												Rio Grande do Sul
											</option>
											<option value="ES">
												Espírito Santo
											</option>
											<option value="GO">Goiás</option>
											<option value="DF">
												Destrito Federal
											</option>
											<option value="MS">
												Mato Grosso do Sul
											</option>
											<option value="MT">
												Mato Grosso
											</option>
											<option value="BA">Bahia</option>
											<option value="PE">
												Pernambuco
											</option>
											<option value="CE">Ceará</option>
											<option value="MA">Maranhão</option>
											<option value="RN">
												Rio Grande do Norte
											</option>
											<option value="PB">Paraíba</option>
											<option value="PI">Piauí</option>
											<option value="SE">Sergipe</option>
											<option value="AL">Alagoas</option>
											<option value="PA">Pará</option>
											<option value="AM">Amazonas</option>
											<option value="TO">
												Tocantins
											</option>
											<option value="AP">Amapá</option>
											<option value="RR">Roraima</option>
											<option value="RO">Rondônia</option>
											<option value="AC">Acre</option>
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
												<span className="label-text-alt text-black opacity-0">
													Label não visivel
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
									<button
										type="submit"
										className="btn btn-primary shadow-md">
										Publicar Produto
									</button>
								</div>
							</div>
						</div>
					</form>
					<pre>{output}</pre>
					<br />
				</div>
			</div>
		</section>
	);
}

export default CreateProductPage;
