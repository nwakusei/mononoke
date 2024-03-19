"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";

// imagens estáticas

// Context
import { CartContext } from "@/context/CartContext";

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
	const { setCart } = useContext(CartContext);
	const [quantity, setQuantity] = useState(1);
	const [productsInCart, setProductsInCart] = useState([]);

	useEffect(() => {
		// Recupera os produtos do carrinho do localStorage
		const savedProductsInCart = localStorage.getItem("productsInCart");

		// Verifica se há produtos no carrinho no localStorage
		if (savedProductsInCart) {
			// Se houver, atualiza o estado com os produtos do carrinho
			setProductsInCart(JSON.parse(savedProductsInCart));
		}
	}, []); // Executa apenas uma vez, quando o componente é montado

	// Funções para aumentar e diminuir a quantidade
	const decreaseQuantity = (productId) => {
		try {
			let productsInCart =
				JSON.parse(localStorage.getItem("productsInCart")) || [];
			const index = productsInCart.findIndex(
				(item) => item.productID === productId
			);

			if (index !== -1) {
				if (productsInCart[index].quantityThisProduct > 1) {
					productsInCart[index].quantityThisProduct--;

					const productPrice = productsInCart[index].productPrice;
					productsInCart[index].productPriceTotal =
						productsInCart[index].quantityThisProduct *
						productPrice;

					localStorage.setItem(
						"productsInCart",
						JSON.stringify(productsInCart)
					);

					// Atualiza o estado local imediatamente após a modificação do localStorage
					setProductsInCart([...productsInCart]);

					// Atualiza o estado do carrinho com a nova quantidade de itens
					const totalQuantityProducts = productsInCart.reduce(
						(total, product) => total + product.quantityThisProduct,
						0
					);
					setCart(totalQuantityProducts);
				}
			}
		} catch (error) {
			console.log("Erro ao diminuir quantidade do produto", error);
		}
	};

	const increaseQuantity = (productId) => {
		try {
			let productsInCart =
				JSON.parse(localStorage.getItem("productsInCart")) || [];
			const index = productsInCart.findIndex(
				(item) => item.productID === productId
			);

			if (index !== -1) {
				productsInCart[index].quantityThisProduct++;

				const productPrice = productsInCart[index].productPrice;
				productsInCart[index].productPriceTotal =
					productsInCart[index].quantityThisProduct * productPrice;

				localStorage.setItem(
					"productsInCart",
					JSON.stringify(productsInCart)
				);

				// Atualiza o estado local imediatamente após a modificação do localStorage
				setProductsInCart([...productsInCart]);

				// Atualiza o estado do carrinho com a nova quantidade de itens
				const totalQuantityProducts = productsInCart.reduce(
					(total, product) => total + product.quantityThisProduct,
					0
				);
				setCart(totalQuantityProducts);
			}
		} catch (error) {
			console.log("Erro ao aumentar quantidade do produto", error);
			toast.error("Erro ao aumentar quantidade do produto");
		}
	};

	// Função para remover itens do carrinho de compra
	const handleRemoveFromCart = (productId) => {
		try {
			// Recupera o array atual do localStorage
			let productsInCart =
				JSON.parse(localStorage.getItem("productsInCart")) || [];

			// Filtra o array para remover o item com o ID específico
			const updatedCart = productsInCart.filter(
				(item) => item.productID !== productId
			);

			// Salva o novo array no localStorage
			localStorage.setItem("productsInCart", JSON.stringify(updatedCart));

			// Atualiza o estado local productsInCart
			setProductsInCart(updatedCart);

			// Atualiza o estado do carrinho com a nova quantidade de itens
			setCart(updatedCart.length);
			toast.success("Produto removido com sucesso!");
		} catch (error) {
			console.log("Erro ao remover produto!", error);
			toast.error("Erro ao remover produto!");
		}
	};

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 mx-4 min-h-screen">
			<div className="bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-4 mb-8">
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
						{productsInCart.length > 0 ? (
							productsInCart.map((productInCart) => (
								<div
									key={productInCart.productID}
									className="flex flex-row justify-between items-center gap-4 bg-gray-500 w-[650px] min-h-[100px] p-4 rounded-md mb-4">
									<div className="flex flex-row gap-4">
										<div className="flex justify-center bg-red-500 w-28 h-28 rounded">
											<Image
												className="object-contain h-full"
												src={`http://localhost:5000/images/products/${productInCart.imageProduct}`}
												alt={productInCart.productName}
												width={100}
												height={100}
												unoptimized
											/>
										</div>
										<div>
											<h1 className="text-lg">
												{productInCart.productName}
											</h1>
											<h2 className="mb-2">
												Variação: Preto
											</h2>
											<div className="flex flex-row items-center gap-2">
												<button
													onClick={() =>
														decreaseQuantity(
															productInCart.productID
														)
													}
													className="flex items-center justify-center  w-[30px] h-[30px] select-none font-mono">
													<h1 className="px-3 py-1 shadow-lg shadow-gray-500/50 bg-black text-white rounded-lg cursor-pointer active:scale-[.97]">
														-
													</h1>
												</button>
												<span className="text-lg">
													{
														productInCart.quantityThisProduct
													}
												</span>

												<button
													onClick={() =>
														increaseQuantity(
															productInCart.productID
														)
													}
													className="flex items-center justify-center  w-[30px] h-[30px] select-none font-mono">
													<h1 className="px-3 py-1 shadow-lg shadow-gray-500/50 bg-black text-white rounded-lg  cursor-pointer active:scale-[.97]">
														+
													</h1>
												</button>
											</div>
										</div>
									</div>
									<div>
										<h1>
											{productInCart.productPrice.toLocaleString(
												"pt-BR",
												{
													style: "currency",
													currency: "BRL",
												}
											)}{" "}
											x{" "}
											{productInCart.quantityThisProduct}
										</h1>
									</div>

									<div>
										<div
											onClick={() =>
												handleRemoveFromCart(
													productInCart.productID
												)
											}
											className="flex flex-col items-center justify-center border-[1px] border-purple-500 w-10 h-10 transition-all ease-in duration-200 hover:shadow-md hover:bg-purple-500 active:scale-[.97] rounded cursor-pointer">
											<MdOutlineDeleteOutline size={25} />
										</div>
									</div>
								</div>
							))
						) : (
							<div>
								<h1>Carrinho Vazio</h1>
							</div>
						)}
					</div>

					<div>
						{productsInCart.length > 0 && (
							<div>
								{" "}
								<div className="flex flex-col w-[400px] min-h-[250px] bg-gray-500 p-4 rounded-md mb-2">
									<div>
										<h1 className="text-lg font-semibold mb-4">
											Seu Pedido
										</h1>
										{productsInCart.map((productInCart) => (
											<div
												key={productInCart.productID}
												className="flex justify-between mb-2">
												<h2>
													{
														productInCart.quantityThisProduct
													}{" "}
													x{" "}
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
												{productsInCart
													.reduce(
														(
															total,
															productInCart
														) =>
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
					</div>
				</div>

				<div className="flex flex-row justify-center items-center gap-4">
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
