"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Icons
import { Coupon } from "@icon-park/react";
import { GoLinkExternal } from "react-icons/go";
import { CiWarning } from "react-icons/ci";
import { FaPercent } from "react-icons/fa";

// React Hook Form, Zod e ZodResolver
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createCouponFormSchema = z.object({
	discountPercentage: z
		.string()
		.min(1, "※ A porcentagem de desconto é obrigatória!")
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
		)
		.refine(
			(value) => {
				const numberValue = Number(value);
				return numberValue > 0;
			},
			{
				message: "※ O desconto mínimo permitido é 1%!",
			}
		)
		.refine(
			(value) => {
				const numberValue = Number(value);
				return numberValue <= 90;
			},
			{
				message: "※ O desconto máximo permitido é 90%!",
			}
		),
	couponCode: z
		.string()
		.min(1, "※ O código do cupom é obrigatório!")
		.max(8, "※ Insira no máximo 8 caracteres!")
		.trim()
		.transform((cCode) => cCode.toUpperCase()) // Transforma o valor para maiúsculas
		.refine(
			(cCode) => {
				const sanitized = DOMPurify.sanitize(cCode); // Sanitiza o texto

				const isValid = /^[A-Za-zÀ-ÿ0-9\s]+$/.test(sanitized); // Verifica se é alfanumérico

				return isValid;
			},
			{
				message: "※ Caractere inválido!",
			}
		),
});

type TCreateCouponFormSchema = z.infer<typeof createCouponFormSchema>;

function CreateCouponPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [partner, setPartner] = useState({});
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
		defaultValues: {},
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

	async function handleCreateCoupon(CouponData) {
		setLoadingButton(true);

		try {
			const response = await api.post("/coupons/create", CouponData, {
				headers: {
					Authorization: `Bearer ${JSON.parse(token)}`,
				},
			});

			setLoadingButton(false);
			toast.success(response.data.message);
			// router.push("/dashboard/mycoupons");

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
						onSubmit={handleSubmit(handleCreateCoupon)}
						autoComplete="off">
						{/* Gadget 1 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mt-4 mb-4 shadow-md">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Criar Cupom de Desconto
								</h1>

								<div className="flex flex-row items-center gap-4">
									{/* Cashback Atual */}
									<label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Cashback oferecido atualmente
											</span>
										</div>
										<div className="join">
											<div>
												<div>
													<input
														className="input input-bordered input-success join-item w-[325px]"
														placeholder={`${partner?.cashback}`}
														disabled
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item flex flex-row items-center">
													<FaPercent size={14} />
												</button>
											</div>
										</div>
										<div className="label">
											<span className="label-text-alt text-black">
												Não possível alterar por aqui
											</span>
										</div>
									</label>

									{/* Desconto a ser oferecido */}
									<label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Você deseja oferecer quantos %
												de desconto?
											</span>
										</div>
										<div className="join">
											<div>
												<div>
													<input
														type="text"
														className={`input input-bordered ${getFieldClass(
															"discountPercentage",
															"input"
														)} w-[325px] join-item`}
														placeholder="0"
														{...register(
															"discountPercentage",
															{
																onChange: () =>
																	trigger(
																		"discountPercentage"
																	),
															}
														)}
														onFocus={() =>
															handleFocus(
																"discountPercentage"
															)
														}
														onBlur={() =>
															handleBlur(
																"discountPercentage"
															)
														}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item flex flex-row items-center">
													<FaPercent size={14} />
												</button>
											</div>
										</div>
										<div className="label">
											{errors.discountPercentage ? (
												<span className="text-red-500 label-text-alt">
													{
														errors
															.discountPercentage
															.message
													}
												</span>
											) : (
												<span className="label-text-alt text-black">
													Ex: 10%
												</span>
											)}
										</div>
									</label>

									{/* Cupom de Desconto a ser criado */}
									<label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Código do Cupom
											</span>
										</div>
										<div className="join">
											<div>
												<div>
													<input
														type="text"
														className={`input input-bordered ${getFieldClass(
															"couponCode",
															"input"
														)} w-[325px] join-item`}
														placeholder="..."
														{...register(
															"couponCode",
															{
																onChange: () =>
																	trigger(
																		"couponCode"
																	),
															}
														)}
														onFocus={() =>
															handleFocus(
																"couponCode"
															)
														}
														onBlur={() =>
															handleBlur(
																"couponCode"
															)
														}
													/>
												</div>
											</div>
											<div className="indicator">
												<button
													type="button"
													className="btn join-item flex flex-row items-center">
													<Coupon size={20} />
												</button>
											</div>
										</div>
										<div className="label">
											{errors.couponCode ? (
												<span className="text-red-500 label-text-alt">
													{errors.couponCode.message}
												</span>
											) : (
												<span className="label-text-alt text-black">
													Ex: OTK5OFF
												</span>
											)}
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Gadget 2 */}
						{/* <div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4 shadow-md">
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Importante!
								</h1>

								<div className="flex flex-row border-[1px] border-dashed border-sky-700 rounded p-4 gap-2">
									<span className="flex items-center w-[650px] h-auto justify-center bg-yellow-500 rounded mr-4">
										<CiWarning
											className="text-black"
											size={80}
										/>
									</span>
									<p className="text-black">
										Atenção: Atualmente só é possível criar
										um cupom de desconto para uma campanha
										de 7 dias. Ao longo dos meses vamos
										melhorar o sistema, para que seja
										possível criar campampanhas para um
										período maior
										<Link
											className="flex flex-row items-center gap-2 text-purple-300 transition-all ease-in duration-200 hover:text-purple-500"
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

						{/* Gadget 3 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 shadow-md">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black mb-4">
									Criar Cupom?
								</h1>
								{/* Nome e Descrição */}

								<div className="flex flex-row gap-4">
									<button
										type="button"
										className="btn btn-outline btn-error hover:shadow-md">
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
											className="btn btn-primary w-[150px] shadow-md">
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

export default CreateCouponPage;
