"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/utils/api";

// imagens estáticas
import Lycoris from "../../../../../public/lycoris.jpg";

// Context

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

// Components

function CartPage() {
	const [quantity, setQuantity] = useState(1);

	// Funções para aumentar e diminuir a quantidade
	const decreaseQuantity = () => {
		if (quantity > 1) {
			setQuantity(quantity - 1);
		}
	};

	const increaseQuantity = () => {
		setQuantity(quantity + 1);
	};

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 mx-4 min-h-screen">
			<div className="bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-4">
				<div className="flex flex-col justify-center mb-8">
					<ul className="flex steps steps-vertical lg:steps-horizontal mt-8 mb-8">
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
								<p>Carrinho</p> <ShoppingCartOne size={18} />
							</span>
						</li>
						<li className="step">
							<span className="flex flex-row items-center gap-1 bg-black py-1 px-2 rounded">
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
						<div className="flex flex-row justify-between items-center gap-4 bg-gray-500 w-[650px] min-h-[100px] p-4 rounded-md mb-4">
							<div className="flex flex-row gap-4">
								<div className="flex justify-center bg-red-500 w-28 h-28 rounded">
									<Image
										className="object-contain h-full"
										src={Lycoris}
										alt="teste"
										width={100}
										height={100}
									/>
								</div>
								<div>
									<h1 className="text-lg">One Piece Vol.1</h1>
									<h2 className="mb-2">Variação: Preto</h2>
									<div className="flex flex-row items-center gap-2">
										<button
											onClick={decreaseQuantity}
											className="flex items-center justify-center  w-[30px] h-[30px] select-none font-mono">
											<h1 className="px-3 py-1 shadow-lg shadow-gray-500/50 bg-black text-white rounded-lg cursor-pointer active:scale-[.97]">
												-
											</h1>
										</button>
										<span className="text-lg">
											{quantity}
										</span>

										<button
											onClick={increaseQuantity}
											className="flex items-center justify-center  w-[30px] h-[30px] select-none font-mono">
											<h1 className="px-3 py-1 shadow-lg shadow-gray-500/50 bg-black text-white rounded-lg  cursor-pointer active:scale-[.97]">
												+
											</h1>
										</button>
									</div>
								</div>
							</div>
							<div>
								<h1>R$ 500,00 x 2</h1>
							</div>

							<div>
								<div className="flex flex-col items-center justify-center border-[1px] border-purple-500 w-10 h-10 transition-all ease-in duration-200 hover:shadow-md hover:bg-purple-500 rounded cursor-pointer">
									<MdOutlineDeleteOutline size={25} />
								</div>
							</div>
						</div>
					</div>

					<div>
						<div className="flex flex-col w-[400px] min-h-[250px] bg-gray-500 p-4 rounded-md mb-2">
							<div className="">
								<h1 className="text-lg font-semibold mb-4">
									Seu Pedido
								</h1>
								<div className="flex justify-between mb-2">
									<h2>2 x One Piece Vol.1</h2>
									<h2>R$ 420,00</h2>
								</div>
								<div className="flex justify-between">
									<h2>1 x One Piece Vol.2</h2>
									<h2>R$ 210,00</h2>
								</div>
							</div>
							<div className="divider"></div>
							<div className="">
								<div className="flex justify-between mb-1">
									<h2 className="flex items-center justify-center gap-1">
										Subtotal{" "}
										<div
											className="tooltip cursor-pointer"
											data-tip="Não inclui o valor do frete!">
											<FiInfo
												className="animate-pulse"
												size={16}
											/>
										</div>
									</h2>
									<h2>R$ 630,00</h2>
								</div>
								<div className="flex justify-between mb-1">
									<h2>Frete</h2>
									<h2>R$ 10,00</h2>
								</div>
								<div className="flex justify-between mb-1">
									<h2>Desconto do cupom</h2>
									<h2>—</h2>
								</div>
							</div>
							<div className="divider"></div>
							<div className="">
								<div className="flex justify-between mb-2">
									<h2 className="font-semibold">
										Total do Pedido
									</h2>
									<h2>R$ 640,00</h2>
								</div>
							</div>
						</div>
						<label className="flex flex-row w-[400px] gap-2">
							<div className="flex flex-col w-[260px]">
								{/* <div className="label">
									<span className="label-text font-semibold">
										Cupom de Desconto
									</span>
								</div> */}
								<input
									type="text"
									placeholder="Insira o código do Cupom"
									className="input input-bordered w-full mb-2"
								/>
							</div>
							<button className="btn btn-primary w-[130px]">
								Aplicar <Coupon size={20} />
							</button>
						</label>
					</div>
				</div>

				<div className="flex flex-row justify-center items-center gap-4">
					<button className="btn">
						<Link
							className="flex flex-row justify-center items-center gap-2"
							href="/">
							<MdArrowBackIos size={20} />
							Voltar
						</Link>
					</button>

					<button className="btn">
						<Link
							className="flex flex-row justify-center items-center gap-2"
							href="/checkout/delivery">
							Continuar
							<MdArrowForwardIos size={20} />
						</Link>
					</button>
				</div>
			</div>
		</section>
	);
}

export default CartPage;
