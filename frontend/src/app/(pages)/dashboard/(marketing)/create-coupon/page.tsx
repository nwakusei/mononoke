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

// Icons
import { Coupon } from "@icon-park/react";
import { GoLinkExternal } from "react-icons/go";
import { CiWarning } from "react-icons/ci";
import { FaPercent } from "react-icons/fa";
import { LoadingPage } from "@/components/LoadingPageComponent";

// React Hook Form, Zod e ZodResolver
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createCouponFormSchema = z.object({
	discountPercentage: z
		.string()
		.min(1, "A porcentagem de desconto é obrigatória!")
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
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TCreateCouponFormSchema>({
		resolver: zodResolver(createCouponFormSchema),
		mode: "onBlur",
	});

	useEffect(() => {
		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((responser) => {
			setPartner(responser.data);
			setIsLoading(false);
		});
	}, [token]);

	async function handleCreateCoupon(CouponData) {
		try {
			const response = await api.post("/coupons/create", CouponData, {
				headers: {
					Authorization: `Bearer ${JSON.parse(token)}`,
				},
			});

			toast.success(response.data.message);

			router.push("/dashboard/mycoupons");
			return response.data;
		} catch (error) {
			toast.error(error.response.data.message);
			return error.response.data;
		}
	}

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					<form onSubmit={handleSubmit(handleCreateCoupon)}>
						{/* Gadget 1 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mt-4 mb-4 shadow-md">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Criar Cupom de Desconto
								</h1>

								{/* <div className="flex flex-row gap-10">
									<label className="form-control w-full">
										<div className="label">
											<span className="label-text text-black">
												Site da Loja
											</span>
										</div>
										<input
											type="text"
											placeholder={`${partner.site}`}
											className="input input-bordered input-success"
											disabled
										/>
									</label>
								</div> */}

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
														className={`${
															errors.discountPercentage &&
															`input-error`
														} input input-bordered input-success join-item w-[325px]`}
														placeholder="0"
														{...register(
															"discountPercentage"
														)}
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
														className={`${
															errors.couponCode &&
															`input-error`
														} input input-bordered input-success join-item w-[325px]`}
														placeholder="..."
														{...register(
															"couponCode"
														)}
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
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4 shadow-md">
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
						</div>

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
									<button
										type="submit"
										className="btn btn-primary shadow-md">
										Criar e Publicar
									</button>
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
