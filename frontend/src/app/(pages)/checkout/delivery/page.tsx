"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";

import api from "@/utils/api";

// imagens estáticas

// Context
import { CheckoutContext } from "@/context/CheckoutContext";

// Icons
import { ShoppingCartOne } from "@icon-park/react";
import {
	MdOutlineDeleteOutline,
	MdArrowBackIos,
	MdArrowForwardIos,
} from "react-icons/md";
import { GrLocation } from "react-icons/gr";
import { PiCreditCardBold } from "react-icons/pi";
import { BiIdCard } from "react-icons/Bi";
import { LiaShippingFastSolid } from "react-icons/lia";

// Components
import { YourOrderComp } from "@/components/YourOrderComp";

function DeliveryPage() {
	const { transportadoraInfo } = useContext(CheckoutContext);
	const [productsInCart, setProductsInCart] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState({});

	useEffect(() => {
		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setUser(response.data);
		});
	}, [token]);

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
						<li className="step">
							<span className="flex flex-row items-center gap-1 bg-black py-1 px-2 rounded">
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
							{user.address && user.address.length > 0 ? (
								user.address.map((end) => (
									<>
										<div
											key={end.id}
											className="flex flex-row gap-4">
											<GrLocation size={25} />
											<div>
												<h1 className="text-base font-semibold mb-2">
													Endereço de Entrega:
												</h1>
												<h1 className="text-base">
													{end.logradouro}
												</h1>
												<h2>{end.complemento}</h2>
												<h2>{end.bairro}</h2>
												<h2>
													{end.cidade}/{end.uf}
												</h2>
												<h2>{end.cep}</h2>
											</div>
										</div>

										<div>
											<div className="flex flex-col items-center justify-center border-[1px] border-purple-500 w-10 h-10 transition-all ease-in duration-200 hover:shadow-md hover:bg-purple-500 rounded cursor-pointer">
												<MdOutlineDeleteOutline
													size={25}
												/>
											</div>
										</div>
									</>
								))
							) : (
								<div>
									<h1 className="text-base font-semibold mb-2">
										Nenhum endereço disponpivel
									</h1>
								</div>
							)}
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
											<h2>
												Custo do Frete:{" "}
												{info.vlrFrete.toLocaleString(
													"pt-BR",
													{
														style: "currency",
														currency: "BRL",
													}
												)}
											</h2>
											<h2>Prazo de Envio: 3 dias</h2>
											<h2>
												Previsão de Entrega: 10 dias
											</h2>
										</div>
									</div>
								</div>
							)
						)}
					</div>

					<div className="flex flex-col">
						<YourOrderComp
							productsInfo={productsInCart}
							shippingInfo={transportadoraInfo}
						/>
					</div>
				</div>
				<div className="flex flex-row justify-center items-center gap-4">
					<button className="btn">
						<Link
							className="flex flex-row justify-center items-center gap-2"
							href="/checkout/cart">
							<MdArrowBackIos size={20} />
							Voltar
						</Link>
					</button>

					<button className="btn">
						<Link
							className="flex flex-row justify-center items-center gap-2"
							href="/checkout/review">
							Continuar
							<MdArrowForwardIos size={20} />
						</Link>
					</button>
				</div>
			</div>
		</section>
	);
}

export default DeliveryPage;
