"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import Image from "next/image";

// imagens estáticas
import Lycoris from "../../../../../public/lycoris.jpg";

// Context
import { CheckoutContext } from "@/context/CheckoutContext";

// Icons
import { Coupon, IdCardH, ShoppingCartOne } from "@icon-park/react";
import {
	MdOutlineDeleteOutline,
	MdArrowBackIos,
	MdArrowForwardIos,
} from "react-icons/md";
import { GrLocation } from "react-icons/gr";
import { HiOutlineCreditCard } from "react-icons/hi";
import { PiCreditCardBold } from "react-icons/pi";
import { BiIdCard } from "react-icons/Bi";
import { LiaShippingFastSolid } from "react-icons/lia";
import { FiInfo } from "react-icons/fi";
import { CiStickyNote } from "react-icons/ci";
import { PiNoteBold } from "react-icons/pi";

// Components
import { YourOrderComp } from "@/components/YourOrderComp";

function ReviewInfoPage() {
	const { transportadoraInfo } = useContext(CheckoutContext);

	const [productsInCart, setProductsInCart] = useState([]);
	// const [transportadoraInfo, setTransportadoraInfo] = useState([]);

	console.log(productsInCart);
	console.log(transportadoraInfo);

	useEffect(() => {
		const savedProductsInCart = localStorage.getItem("productsInCart");
		if (savedProductsInCart) {
			setProductsInCart(JSON.parse(savedProductsInCart));
		}
	}, []);

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 min-h-screen mx-4">
			<div className="bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-4">
				<div className="flex flex-col justify-center mb-8">
					<ul className="flex steps steps-vertical lg:steps-horizontal mt-8 mb-8">
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
								<p>Carrinho</p> <ShoppingCartOne size={18} />
							</span>
						</li>
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
								<p>Entrega</p>
								<LiaShippingFastSolid size={18} />
							</span>
						</li>
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
								<p>Revisão</p> <BiIdCard size={20} />
							</span>
						</li>
						<li className="step">
							<span className="flex flex-row items-center gap-1 bg-black py-1 px-2 rounded">
								<p>Pagamento</p>
								<PiCreditCardBold size={20} />
							</span>
						</li>
					</ul>
				</div>
				<div className="flex flex-row justify-center gap-6 bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-8">
					<div className="flex flex-col items-center">
						<div className="flex flex-row justify-between gap-4 bg-gray-500 w-[650px] min-h-[100px] p-4 rounded-md mb-4">
							<div className="flex flex-row gap-4">
								<BiIdCard size={25} />
								<div>
									<h1>Reinaldo Guedes do Nascimento</h1>
									<h1>CPF: 390.270.358-51</h1>
									<h2>Email: rguedes_arq@hotmail.com</h2>
									<h1>Tel.: (11) 94928-6647</h1>
								</div>
							</div>
						</div>
						<div className="flex flex-row justify-between gap-4 bg-gray-500 w-[650px] min-h-[100px] p-4 rounded-md mb-4">
							<div className="flex flex-row gap-4">
								<GrLocation size={25} />
								<div>
									<h1 className="text-base font-semibold mb-2">
										Endereço de Entrega:
									</h1>
									<h1 className="text-base">
										Avenida Lourenço Cabreira, 648
									</h1>
									<h2>Apto. 12 A</h2>
									<h2>Jardim Ana Lúcia</h2>
									<h2>São Paulo/SP</h2>
									<h2>04812-010</h2>
								</div>
							</div>
						</div>
						{Object.entries(transportadoraInfo).map(
							([key, info]) => (
								<div
									key={key}
									className="flex flex-row justify-between gap-4 bg-gray-500 w-[650px] min-h-[80px] p-4 rounded-md mb-4">
									<div className="flex flex-row gap-4">
										<LiaShippingFastSolid size={25} />
										<div>
											<h1>
												Transportadora:{" "}
												{info.transpNome}
											</h1>

											<h2>Prazo de Envio: 3 dias</h2>
											<h2>
												Previsão de Entrega: 10 dias
											</h2>
										</div>
									</div>
								</div>
							)
						)}

						<div className="flex flex-row justify-between gap-4 bg-gray-500 w-[650px] min-h-[100px] p-4 rounded-md mb-4">
							<div className="flex flex-col w-[650px] gap-4">
								{/* <CiStickyNote className="font-bold" size={25} /> */}
								<div className="flex flex-row gap-4">
									<PiNoteBold size={25} />
									<div>
										<h1>Comentário adicional</h1>
									</div>
								</div>
								<div className="flex flex-row gap-4 w-full">
									<textarea
										className="textarea textarea-bordered w-full"
										placeholder="Bio"></textarea>
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-col">
						<YourOrderComp
							productsInfo={productsInCart}
							shippingInfo={transportadoraInfo}
						/>
					</div>
				</div>
				<div className="flex flex-row justify-center items-center gap-4 mb-12">
					<button className="btn">
						<Link
							className="flex flex-row justify-center items-center gap-2"
							href="/checkout/delivery">
							<MdArrowBackIos size={20} />
							Voltar
						</Link>
					</button>

					<button className="btn">
						<Link
							className="flex flex-row justify-center items-center gap-2"
							href="/checkout/payment">
							Continuar
							<MdArrowForwardIos size={20} />
						</Link>
					</button>
				</div>
			</div>
		</section>
	);
}

export default ReviewInfoPage;
