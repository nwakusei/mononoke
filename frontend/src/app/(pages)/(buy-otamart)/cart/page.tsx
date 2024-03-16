"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Image from "next/image";
import api from "@/utils/api";

// imagens estáticas
import Lycoris from "../../../../../public/lycoris.jpg";

// Context

// Icons
import { Coupon, IdCardH, ShoppingCartOne } from "@icon-park/react";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { GrLocation } from "react-icons/gr";
import { HiOutlineCreditCard } from "react-icons/hi";
import { PiCreditCardBold } from "react-icons/pi";
import { BiIdCard } from "react-icons/bi";
import { LiaShippingFastSolid } from "react-icons/lia";
import { FiInfo } from "react-icons/fi";

// Components

function OtamartPage() {
	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 mx-4">
			<div className="bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-4">
				<ul className="flex steps steps-vertical lg:steps-horizontal mt-8 mb-8">
					<li className="step step-primary mr-4">
						<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
							<p>Carrinho</p> <ShoppingCartOne size={18} />
						</span>
					</li>
					<li className="step step-primary mr-4">
						<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
							<p>Entrega</p>
							<LiaShippingFastSolid size={18} />
						</span>
					</li>
					<li className="step mr-4">
						<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
							<p>Revisão</p> <BiIdCard size={20} />
						</span>
					</li>
					<li className="step">
						<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
							<p>Pagamento</p>
							<PiCreditCardBold size={20} />
						</span>
					</li>
				</ul>
				<div className="flex flex-row gap-6 bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-8 min-h-screen">
					<div className="flex flex-col items-center">
						<div className="flex flex-row items-center gap-4 bg-sky-500 w-[650px] h-[150px] p-4 rounded-md mb-4">
							<div className="flex justify-center bg-red-500 w-28 h-28 rounded">
								<Image
									className="object-contain h-full"
									src={Lycoris}
									alt="teste"
									width={100}
									height={100}
								/>
							</div>
							<div className="mr-20">
								<h1 className="text-lg">Nome do Produto</h1>
								<h2>Variação: Preto</h2>
								<input
									className="w-[100px] text-center"
									type="number"
								/>
								<h3>- 2 +</h3>
							</div>
							<div className="mr-20">
								<h1>R$ 5.000,00 x 2</h1>
							</div>
							<div className="flex flex-col items-center justify-center border-[1px] border-purple-500 w-10 h-10 transition-all ease-in duration-200 hover:shadow-md hover:bg-purple-500 rounded cursor-pointer">
								<MdOutlineDeleteOutline size={25} />
							</div>
						</div>
					</div>

					<div className="flex flex-col w-[400px] h-[316px]">
						<div className="flex flex-col w-[400px] h-[316px] bg-sky-500 p-4 rounded-md mb-2">
							<div className="">
								<h1 className="text-lg font-semibold mb-4">
									Seu Pedido
								</h1>
								<div className="flex justify-between mb-2">
									<h2>1 x One Piece Vol.1</h2>
									<h2>R$ 210,00</h2>
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
									<h2>R$ 420,00</h2>
								</div>
								<div className="flex justify-between mb-1">
									<h2>Frete</h2>
									<h2>R$ 10,00</h2>
								</div>
								<div className="flex justify-between mb-1">
									<h2>Desconto</h2>
									<h2>—</h2>
								</div>
							</div>
							<div className="divider"></div>
							<div className="">
								<div className="flex justify-between mb-2">
									<h2 className="font-semibold">
										Total do Pedido
									</h2>
									<h2>R$ 430,00</h2>
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
									placeholder="Insira o Cupom"
									className="input input-bordered w-full mb-2"
								/>
							</div>
							<button className="btn btn-primary w-[130px]">
								Aplicar <Coupon size={20} />
							</button>
						</label>
					</div>
				</div>
			</div>
		</section>
	);
}

export default OtamartPage;
