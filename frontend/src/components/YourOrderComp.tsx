"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// Contexts
import { Context } from "@/context/UserContext";
import { CheckoutContext } from "@/context/CheckoutContext";

// Icons
import { FiInfo } from "react-icons/fi";
import { Coupon } from "@icon-park/react";

function YourOrderComp({ productsInfo, shippingInfo }) {
	return (
		<>
			{productsInfo.length > 0 && (
				<div>
					{" "}
					<div className="flex flex-col w-[400px] min-h-[250px] bg-gray-500 p-4 rounded-md mb-2">
						<div>
							<h1 className="text-lg font-semibold mb-4">
								Seu Pedido
							</h1>
							{productsInfo.map((productInCart) => (
								<div
									key={productInCart.productID}
									className="flex justify-between mb-2">
									<h2>
										{productInCart.quantityThisProduct} x{" "}
										{productInCart.productName}
									</h2>
									<h2>
										{productInCart.productPriceTotal.toLocaleString(
											"pt-BR",
											{
												style: "currency",
												currency: "BRL",
											}
										)}
									</h2>
								</div>
							))}
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
								<h2>
									{productsInfo
										.reduce(
											(total, productInCart) =>
												total +
												productInCart.productPriceTotal,
											0
										)
										.toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
										})}
								</h2>
							</div>

							<div className="flex justify-between mb-1">
								<h2>Frete</h2>
								{Object.entries(shippingInfo).map(
									([key, info]) => (
										<div key={key}>
											<h2>
												{info.vlrFrete.toLocaleString(
													"pt-BR",
													{
														style: "currency",
														currency: "BRL",
													}
												)}
											</h2>
										</div>
									)
								)}
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
			)}
		</>
	);
}

export { YourOrderComp };
