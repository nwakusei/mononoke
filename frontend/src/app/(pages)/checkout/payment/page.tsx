"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import Image from "next/image";

// imagens estáticas
import Lycoris from "../../../../../public/lycoris.jpg";

// Context

// Icons
import {
	PaymentMethod,
	Coupon,
	IdCardH,
	ShoppingCartOne,
} from "@icon-park/react";
import {
	MdOutlineDeleteOutline,
	MdArrowBackIos,
	MdArrowForwardIos,
	MdOutlineCancel,
	MdOutlinePix,
} from "react-icons/md";
import { GrLocation } from "react-icons/gr";
import { HiOutlineCreditCard } from "react-icons/hi";
import { PiCreditCardBold } from "react-icons/pi";
import { BiIdCard } from "react-icons/Bi";
import { LiaShippingFastSolid } from "react-icons/lia";
import { FiInfo } from "react-icons/fi";
import { CiStickyNote } from "react-icons/ci";
import { PiNoteBold } from "react-icons/pi";
import { RiCopperCoinLine } from "react-icons/ri";
import { IoWalletOutline } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";

// Components

function PaymentPage() {
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
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
								<p>Pagamento</p>
								<PiCreditCardBold size={20} />
							</span>
						</li>
					</ul>
				</div>
				<div className="flex flex-row justify-center gap-6 bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-8">
					<div className="flex flex-col items-center">
						<div className="flex flex-row justify-between gap-4 bg-purple-500 w-[650px] min-h-[60px] p-4 rounded-md shadow mb-4">
							<div className="flex flex-row gap-4">
								<IoWalletOutline size={25} />
								<div>
									<h1 className="text-lg">OtakuPay</h1>
								</div>
							</div>
						</div>

						<div className="flex flex-col justify-between gap-4 bg-gray-500 w-[650px] min-h-[100px] p-4 rounded-md mb-4">
							<div className="flex flex-row gap-4">
								<div>
									<h1 className="text-lg">
										Escolha a forma de pagamento
									</h1>
								</div>
							</div>
							<div className="flex flex-row items-center gap-4">
								<button className="flex flex-row justify-center items-center gap-2 bg-purple-500 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
									<PaymentMethod size={20} />
									Saldo em Conta
								</button>
								<button className="flex flex-row justify-center items-center gap-2 bg-purple-500 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
									<PiCreditCardBold size={20} />
									Cartão de Crédito
								</button>
								<button className="flex flex-row justify-center items-center gap-2 bg-purple-500 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
									<MdOutlinePix size={20} />
									Pix
								</button>
								{/* <button className="flex flex-row justify-center items-center gap-2 bg-gray-300 w-[200px] p-3 rounded-lg cursor-not-allowed">
									<RiCopperCoinLine size={20} />
									Otaku Point
								</button> */}
							</div>
						</div>
					</div>

					<div className="flex flex-col">
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
							<div>
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
							<button className="btn btn-primary w-[130px] shadow-md">
								Aplicar <Coupon size={20} />
							</button>
						</label>
					</div>
				</div>

				<div className="flex flex-row justify-center items-center gap-4">
					<button className="flex flex-row justify-center items-center gap-2 bg-error w-[120px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
						<Link
							className="flex flex-row justify-center items-center gap-2"
							href="/otamart">
							<MdOutlineCancel size={20} />
							Cancelar
						</Link>
					</button>
					<button className="flex flex-row justify-center items-center gap-2 bg-green-800 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
						<FaCheck size={18} />
						Finalizar Pedido
					</button>
				</div>
			</div>
		</section>
	);
}

export default PaymentPage;
