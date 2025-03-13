"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ToastFy
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// Components
import { Sidebar } from "@/components/Sidebar";

// Icons
import { Coupon, Key } from "@icon-park/react";
import { GoLinkExternal } from "react-icons/go";
import { CiWarning } from "react-icons/ci";
import { FaPercent } from "react-icons/fa";
import { LuCalendarRange } from "react-icons/lu";
import { BsPersonFill } from "react-icons/bs";
import { LoadingPage } from "@/components/LoadingPageComponent";
import { AddPicture, Weight } from "@icon-park/react";

// React Hook Form, Zod e ZodResolver
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const today = new Date().toISOString().split("T")[0];

const createCouponFormSchema = z.object({
	rafflePrize: z
		.string()
		.min(1, "※ O titulo do sorteio é obrigatório!")
		.trim()
		.refine(
			(rPrize) => {
				const sanitized = DOMPurify.sanitize(rPrize);

				const isValid = /^[A-Za-zÀ-ÿ\s\.,—~\-0-9\[\]\(\)]+$/.test(
					sanitized
				);

				return isValid;
			},
			{
				message: "※ O título possui caracteres inválidos!",
			}
		),
	adultRaffle: z.string().min(1, "※ item obrigatório!"),
	raffleDate: z
		.string()
		.refine((val) => !isNaN(Date.parse(val)), {
			message: "※ A data de realização do sorteio é obrigatória!",
		})
		.refine((val) => val >= today, {
			message: "※ A data não pode ser anterior à data atual!",
		}),
	raffleCost: z
		.string()
		.min(1, "※ O custo do sorteio é obrigatório!")
		.trim()
		.refine((value) => /^\d+,\d{2}$/.test(value), {
			message: "※ Insira um valor válido no formato 0,00!",
		})
		.transform((value) => parseFloat(value.replace(",", "."))),
	minNumberParticipants: z
		.string()
		.min(1, "※ A quantidade mínima de participantes é obrigatória!")
		.trim()
		.refine((value) => /^\d+(\.\d+)?$/.test(value), {
			message: "※ Insira um número válido!",
		})
		.refine(
			(value) => {
				const numberValue = Number(value);

				return !isNaN(numberValue) && Number.isInteger(numberValue);
			},
			{
				message: "※ Insira somente números inteiros!",
			}
		),
	raffleDescription: z
		.string()
		.min(1, "※ A descrição do sorteio é obrigatória!")
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
	raffleRules: z
		.string()
		.min(1, "※ As regras do sorteio são obrigatória!")
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
				message: "※ As regras possuem caracteres inválidos!",
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
				message: "※ As regras precisa ter no mínimo 100 caracteres!",
			}
		),
	imagesRaffle: z
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
						file === null || /\.(jpg|jpeg|png)$/i.test(file.name)
				);
			},
			{
				message:
					"※ Insira apenas imagens com extensão .JPG, .JPEG ou .PNG!",
			}
		),
});

type TCreateCouponFormSchema = z.infer<typeof createCouponFormSchema>;

function CreateRafflePage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [partner, setPartner] = useState({});
	const [imagemSelecionada, setImagemSelecionada] = useState<
		string | ArrayBuffer | null
	>(null);
	const [loadingPage, setLoadingPage] = useState(true);
	const [loadingButton, setLoadingButton] = useState(false);

	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors },
		getValues,
		trigger,
	} = useForm<TCreateCouponFormSchema>({
		resolver: zodResolver(createCouponFormSchema),
		// mode: "onBlur",
		defaultValues: {
			adultRaffle: "",
		},
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
		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((responser) => {
			setPartner(responser.data);
			setLoadingPage(false);
		});
	}, [token]);

	const handleImagemSelecionada = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				setImagemSelecionada(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	async function handleCreateRaffle(CouponData: { [key: string]: any }) {
		setLoadingButton(true);

		const formData = new FormData();

		// Itera sobre os campos de texto e adiciona ao FormData
		Object.entries(CouponData).forEach(([key, value]) => {
			if (key !== "imagesRaffle") {
				formData.append(key, value);
			}
		});

		// Itera sobre as imagens e adiciona ao FormData
		if (CouponData.imagesRaffle) {
			CouponData.imagesRaffle.forEach((image: File) => {
				formData.append(`imagesRaffle`, image);
			});
		}

		try {
			const response = await api.post(
				"/raffles/create-raffle",
				formData,
				{
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				}
			);

			setLoadingButton(false);
			toast.success(response.data.message);
			router.push("/dashboard/myraffles");

			return response.data;
		} catch (error: any) {
			toast.error(error.response.data.message);
			return error.response.data;
		}
	}

	if (loadingPage) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					<form
						onSubmit={handleSubmit(handleCreateRaffle)}
						autoComplete="off">
						{/* Gadget 1 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mt-4 mb-4">
							{/* Criar Sorteio */}
							<div className="flex flex-col gap-2 mx-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Criar Sorteio
								</h1>

								<div className="flex flex-col gap-10">
									{/* Nome e Descrição */}
									<div className="flex flex-row gap-8">
										<label className="form-control">
											<div className="label">
												<span className="label-text text-black">
													Prêmio do Sorteio
												</span>
											</div>
											<div className="join">
												<div>
													<div>
														<input
															type="text"
															className={`input input-bordered ${getFieldClass(
																"rafflePrize",
																"input"
															)} w-[1100px]`}
															placeholder={`Digite o título do prêmio...`}
															{...register(
																"rafflePrize",
																{
																	onChange:
																		() =>
																			trigger(
																				"rafflePrize"
																			),
																}
															)}
															onFocus={() =>
																handleFocus(
																	"rafflePrize"
																)
															}
															onBlur={() =>
																handleBlur(
																	"rafflePrize"
																)
															}
														/>
													</div>
												</div>
											</div>
											<div className="label">
												{errors.rafflePrize ? (
													<span className="label-text-alt text-red-500">
														{
															errors.rafflePrize
																.message
														}
													</span>
												) : (
													<span className="label-text-alt text-black">
														Ex.: Figure Luffy - One
														Piece
													</span>
												)}
											</div>
										</label>
									</div>

									<div className="flex flex-row gap-8 w-full">
										{/* Cashback Atual */}
										<label className="form-control">
											<div className="label">
												<span className="label-text text-black">
													Data de Realização
												</span>
											</div>
											<div className="join">
												<div>
													<div>
														<input
															type="date"
															min={today} // Impede datas anteriores a hoje
															className={`input input-bordered ${getFieldClass(
																"raffleDate",
																"input"
															)} w-[296px] join-item`}
															placeholder={`dd/MM`}
															{...register(
																"raffleDate",
																{
																	onChange:
																		() =>
																			trigger(
																				"raffleDate"
																			),
																}
															)}
															onFocus={() =>
																handleFocus(
																	"raffleDate"
																)
															}
															onBlur={() =>
																handleBlur(
																	"raffleDate"
																)
															}
														/>
													</div>
												</div>
												<div className="indicator">
													<button
														type="button"
														className="btn join-item flex flex-row items-center">
														<LuCalendarRange
															size={18}
														/>
													</button>
												</div>
											</div>
											<div className="label">
												{errors.raffleDate ? (
													<span className="text-red-500 label-text-alt">
														{
															errors.raffleDate
																.message
														}
													</span>
												) : (
													<span className="label-text-alt text-black">
														Ex: 20/04/2025
													</span>
												)}
											</div>
										</label>

										{/* Desconto a ser oferecido */}
										<label className="form-control">
											<div className="label">
												<span className="label-text text-black">
													Custo para se inscrever
												</span>
											</div>
											<div className="join">
												<div>
													<div>
														<input
															className={`input input-bordered ${getFieldClass(
																"raffleCost",
																"input"
															)} w-[296px] join-item`}
															placeholder="0"
															{...register(
																"raffleCost",
																{
																	onChange:
																		() =>
																			trigger(
																				"raffleCost"
																			),
																}
															)}
															onFocus={() =>
																handleFocus(
																	"raffleCost"
																)
															}
															onBlur={() =>
																handleBlur(
																	"raffleCost"
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
												{errors.raffleCost ? (
													<span className="text-red-500 label-text-alt">
														{
															errors.raffleCost
																.message
														}
													</span>
												) : (
													<span className="label-text-alt text-black">
														Ex: 10,50 Otaku Points
													</span>
												)}
											</div>
										</label>

										{/* Desconto a ser oferecido */}
										<label className="form-control">
											<div className="label">
												<span className="label-text text-black">
													Quantidade mínima de
													participantes
												</span>
											</div>
											<div className="join">
												<div>
													<div>
														<input
															type="text"
															className={`input input-bordered ${getFieldClass(
																"minNumberParticipants",
																"input"
															)} w-[295px] join-item`}
															placeholder="0"
															{...register(
																"minNumberParticipants",
																{
																	onChange:
																		() =>
																			trigger(
																				"minNumberParticipants"
																			),
																}
															)}
															onFocus={() =>
																handleFocus(
																	"minNumberParticipants"
																)
															}
															onBlur={() =>
																handleBlur(
																	"minNumberParticipants"
																)
															}
														/>
													</div>
												</div>
												<div className="indicator">
													<button
														type="button"
														className="btn join-item flex flex-row items-center">
														<BsPersonFill
															size={18}
														/>
													</button>
												</div>
											</div>
											<div className="label">
												{errors.minNumberParticipants ? (
													<span className="text-red-500 label-text-alt">
														{
															errors
																.minNumberParticipants
																.message
														}
													</span>
												) : (
													<span className="label-text-alt text-black">
														Ex: Informe o nº mínimo
														de participantes
													</span>
												)}
											</div>
										</label>
									</div>

									<div className="flex flex-row items-center gap-8">
										{/* Cupom de Desconto a ser criado */}
										<label className="form-control">
											<div className="label">
												<span className="label-text text-black">
													Descrição
												</span>
											</div>
											<textarea
												className={`textarea textarea-bordered ${getFieldClass(
													"raffleDescription",
													"textarea"
												)} w-[535px] h-[150px]`}
												placeholder="..."
												{...register(
													"raffleDescription",
													{
														onChange: () =>
															trigger(
																"raffleDescription"
															),
													}
												)}
												onFocus={() =>
													handleFocus(
														"raffleDescription"
													)
												}
												onBlur={() =>
													handleBlur(
														"raffleDescription"
													)
												}></textarea>

											<div className="label">
												{errors.raffleDescription ? (
													<span className="text-red-500 label-text-alt">
														{
															errors
																.raffleDescription
																.message
														}
													</span>
												) : (
													<span className="label-text-alt text-black">
														Descreva as informações
													</span>
												)}
											</div>
										</label>

										{/* Cupom de Desconto a ser criado */}
										<label className="form-control">
											<div className="label">
												<span className="label-text text-black">
													Regras
												</span>
											</div>
											<textarea
												className={`textarea textarea-bordered ${getFieldClass(
													"raffleRules",
													"textarea"
												)} w-[535px] h-[150px]`}
												placeholder="..."
												{...register("raffleRules", {
													onChange: () =>
														trigger("raffleRules"),
												})}
												onFocus={() =>
													handleFocus("raffleRules")
												}
												onBlur={() =>
													handleBlur("raffleRules")
												}></textarea>

											<div className="label">
												{errors.raffleRules ? (
													<span className="text-red-500 label-text-alt">
														{
															errors.raffleRules
																.message
														}
													</span>
												) : (
													<span className="label-text-alt text-black">
														Descreva as informações
													</span>
												)}
											</div>
										</label>
									</div>

									<div className="flex flex-row items-center gap-8">
										<label className="form-control w-[200px]">
											<div className="label">
												<span className="label-text text-black">
													É um item adulto?
												</span>
											</div>

											<select
												className={`select select-bordered ${getFieldClass(
													"adultRaffle",
													"select"
												)}`}
												placeholder="..."
												{...register("adultRaffle", {
													onChange: () =>
														trigger("adultRaffle"),
												})}
												onFocus={() =>
													handleFocus("adultRaffle")
												}
												onBlur={() =>
													handleBlur("adultRaffle")
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
											{errors.adultRaffle && (
												<div className="label">
													<span className="label-text-alt text-red-500">
														{
															errors.adultRaffle
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
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Imagens do Prêmio
								</h1>
								{/* Add Imagens */}
								<label className="form-control w-[120px]">
									<div className="label">
										<span className="label-text text-black">
											Imagem Principal
										</span>
									</div>
									<div
										className={`${
											errors.imagesRaffle &&
											`border-error`
										} text-black hover:text-white flex flex-col justify-center items-center h-[120px] border-[1px] border-dashed border-[#3e1d88] hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
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
														"imagesRaffle"
													)}
												/>
											</div>
										)}
									</div>
									<div className="label">
										{errors.imagesRaffle && (
											<span className="label-text-alt text-red-500">
												{errors.imagesRaffle.message}
											</span>
										)}
									</div>
								</label>
							</div>
						</div>

						{/* Gadget 3 */}
						{/* <div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Importante!
								</h1>

								<div className="flex flex-row border-[1px] border-dashed border-primary rounded-md p-4 gap-2">
									<span className="flex items-center w-[650px] h-auto justify-center bg-yellow-500 rounded mr-4">
										<CiWarning
											className="text-black"
											size={80}
										/>
									</span>
									<p className="text-black">
										Atenção: Criar cupons de desconto é uma
										função PAGA. Esse é um serviço de
										marketing que permite criar cupons para
										atrair mais clientes, com a opção de
										direcionar para o seu site caso possua
										um. Também exibimos em uma área
										exclusiva em nosso aumentando a
										visibilidade da sua loja, além de
										divulgação em redes sociais de acordo
										com regras estratégicas. 1. Os cupons
										serão válidos tanto em seu site quanto
										em sua loja no OtaMart. 2. O comprador
										só receberá os cashbacks caso faça o
										pagamento usando OtakuPay.
										<Link
											className="flex flex-row items-center gap-2 text-primary transition-all ease-in duration-200 hover:text-secondary"
											href="https://www.kangu.com.br/ponto-kangu/"
											target="_blank">
											<span>
												Valor Cobrado por Cupom criado:
												R$ 19,90
											</span>
											<GoLinkExternal size={18} />
										</Link>
									</p>
								</div>
							</div>
						</div> */}

						{/* Gadget 4 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black mb-4">
									Criar Sorteio?
								</h1>
								{/* Nome e Descrição */}

								<div className="flex flex-row gap-4">
									<button
										type="button"
										className="btn btn-outline btn-error text-black hover:shadow-md">
										Cancelar
									</button>
									{loadingButton ? (
										<button
											type="submit"
											className="btn btn-primary w-[150px] text-white shadow-md">
											<span className="loading loading-spinner loading-md"></span>
										</button>
									) : (
										<button
											type="submit"
											className="btn btn-primary w-[150px] text-white shadow-md">
											Criar e Publicar
										</button>
									)}
								</div>
							</div>
						</div>
					</form>
					<pre></pre>
				</div>
			</div>
		</section>
	);
}

export default CreateRafflePage;
