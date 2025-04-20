"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Importe suas imagens e ícones aqui
import Otakuyasan from "../../../../../public/otakuyasan.png";
import Lycoris from "../../../../../public/lycoris.jpg";
import Otakuyasan2 from "../../../../../public/otakuyasan2.png";
import Amora from "../../../../../public/amora.jpg";
import MundosInfinitos from "../../../../../public/mundos-infinitos.png";
import imageProfile from "../../../../../public/Kon.jpg";

// Icons
import {
	Currency,
	Financing,
	ShoppingCartOne,
	PaymentMethod,
	Communication,
} from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill, BsHeart } from "react-icons/bs";
import { MdVerified, MdOutlineLocationOn } from "react-icons/md";
import { GoShareAndroid, GoLocation } from "react-icons/go";
import { PiChatTextLight } from "react-icons/pi";
import { GrChat } from "react-icons/gr";
import { TbTruckDelivery } from "react-icons/tb";
import { LiaShippingFastSolid } from "react-icons/lia";
import { GrLocation } from "react-icons/gr";
import { FiInfo } from "react-icons/fi";

function ProductPage() {
	// Valor do Produto (Virá do Banco de dados)
	const value = 99.9;

	// Etapa 1: Adicione a variável de estado para a quantidade
	const [quantity, setQuantity] = useState<number>(1);
	const [isQuantityOneOrLess, setIsQuantityOneOrLess] = useState(true);
	const [isQuantityAtLimit, setIsQuantityAtLimit] = useState(false);
	const [totalOrder, setTotalOrder] = useState<string>(
		value.toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL",
		})
	);

	const [selected, setSelected] = useState<{ [key: string]: boolean }>({});
	const [variation, setVariation] = useState<{ [key: string]: boolean }>({});

	// Constante que irá representar a quantidade de estoque que vem do Banco de Dados
	const stock = 5;

	// Etapa 2: Crie funções para lidar com incremento e decremento
	const updateTotalOrder = (newQuantity: number) => {
		setQuantity(newQuantity);

		if (newQuantity <= 1) {
			setIsQuantityOneOrLess(true);
		} else {
			setIsQuantityOneOrLess(false);
		}

		if (newQuantity === stock) {
			setIsQuantityAtLimit(true);
		} else {
			setIsQuantityAtLimit(false);
		}

		setTotalOrder(
			(newQuantity * value).toLocaleString("pt-BR", {
				style: "currency",
				currency: "BRL",
			})
		);
	};

	const incrementarQuantidade = () => {
		if (quantity < stock) {
			updateTotalOrder(quantity + 1);
		}
	};

	const decrementarQuantidade = () => {
		if (quantity > 1) {
			updateTotalOrder(quantity - 1);
		}
	};

	function handleSelected(itemId: string) {
		setSelected((prevState) => {
			// Desmarca todos os itens selecionados, exceto o item clicado
			const deselectedItems = Object.keys(prevState).reduce(
				(acc, key) => ({
					...acc,
					[key]: key === itemId ? !prevState[key] : false,
				}),
				{}
			);

			return {
				...deselectedItems,
				[itemId]: !prevState[itemId],
			};
		});
	}

	function handleVariation(itemId: string) {
		setVariation((prevState) => {
			// Coment
			const deselectedItems = Object.keys(prevState).reduce(
				(acc, key) => ({
					...acc,
					[key]: key === itemId ? !prevState[key] : false,
				}),
				{}
			);
			return {
				...deselectedItems,
				[itemId]: !prevState[itemId],
			};
		});
	}

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 mx-4 mt-4">
			<div className="bg-yellow-500 flex flex-row gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				{/* Componente de Imagem Principal */}
				<div className="flex flex-col">
					<div className="bg-base-100 w-[402px] rounded-md relative shadow-lg mb-2">
						<div className="h-[402px] flex items-center justify-center mx-3 my-2">
							<Image
								className="object-contain h-full"
								src={Lycoris}
								alt="Shoes"
							/>
						</div>
					</div>
					{/* Pequenas imagens */}
					<div className="flex flex-row gap-2">
						<div className="bg-base-100 w-[74px] flex flex-col rounded relative shadow-lg">
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain  h-full"
									src={Lycoris}
									alt="Shoes"
								/>
							</div>
						</div>

						<div className="bg-base-100 w-[74px] flex flex-col rounded relative shadow-lg">
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain h-full"
									src={Lycoris}
									alt="Shoes"
								/>
							</div>
						</div>

						<div className="bg-base-100 w-[74px] flex flex-col rounded relative shadow-lg">
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain h-full"
									src={Lycoris}
									alt="Shoes"
								/>
							</div>
						</div>

						<div className="bg-base-100 w-[74px] flex flex-col rounded relative shadow-lg">
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain h-full"
									src={Lycoris}
									alt="Shoes"
								/>
							</div>
						</div>

						<div className="bg-base-100 w-[74px] flex flex-col rounded relative shadow-lg">
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain h-full"
									src={Lycoris}
									alt="Shoes"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Titulo, Avaliações e Vendidos */}
				<div className="flex flex-col">
					{/* Título */}
					<h1 className="text-xl font-semibold mb-1">
						One Piece Vol.1 (Mangá em Japonês)
					</h1>
					{/* Avaliações e Vendidos */}
					<div className="flex flex-row items-center text-sm mb-4 gap-2">
						<span className="flex flex-row items-center gap-1">
							<p className="mr-1">N/A</p>
							<BsStar size={12} />
							<BsStar size={12} />
							<BsStar size={12} />
							<BsStar size={12} />
							<BsStar size={12} />
						</span>
						|<p>0 Avaliações</p>|<p>0 Vendido</p>
					</div>
					{/* Preço */}
					<h2 className="text-2xl text-primary font-semibold">
						R$ {value}
					</h2>
					{/* Preço antes do desconto */}
					<div className="flex flex-row items-center mb-2">
						<span className="text-base line-through mr-2">
							R$ 109,90
						</span>
						<span className="bg-primary text-xs px-1 rounded-sm">
							20% Off
						</span>
					</div>
					{/* Cashback */}
					<div className="flex flex-row items-center mb-4">
						<span>
							<p className="flex flex-row items-center gap-2 text-center text-sm text-green-500 mb-2">
								<Currency size={18} /> 1% de Cashback
							</p>
						</span>
					</div>

					{/* Variações */}
					<div className="flex flex-col mb-2">
						<h2 className="mb-1">
							<span>Escolha a Cor:</span>
						</h2>
						<div className="flex flex-row gap-2">
							<div
								onClick={() => handleVariation("item1")}
								className={`${
									variation["item1"] ? "bg-sky-500" : ""
								} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
								<span>Preto</span>
							</div>

							<div
								onClick={() => handleVariation("item2")}
								className={`${
									variation["item2"] ? "bg-sky-500" : ""
								} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
								<span>Azul</span>
							</div>

							<div
								onClick={() => handleVariation("item3")}
								className={`${
									variation["item3"] ? "bg-sky-500" : ""
								} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
								<span>Rosa</span>
							</div>

							<div
								onClick={() => handleVariation("item4")}
								className={`${
									variation["item4"] ? "bg-sky-500" : ""
								} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
								<span>Amarelo</span>
							</div>
						</div>
					</div>
					{/* Variações */}
					<div className="flex flex-col mb-2">
						<h2 className="mb-1">
							<span>Escolha a Cor:</span>
						</h2>
						<div className="flex flex-row gap-2">
							<div
								onClick={() => handleVariation("item5")}
								className={`${
									variation["item5"] ? "bg-sky-500" : ""
								} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
								<span>P</span>
							</div>

							<div
								onClick={() => handleVariation("item6")}
								className={`${
									variation["item6"] ? "bg-sky-500" : ""
								} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
								<span>M</span>
							</div>

							<div
								onClick={() => handleVariation("item7")}
								className={`${
									variation["item7"] ? "bg-sky-500" : ""
								} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
								<span>G</span>
							</div>

							<div
								onClick={() => handleVariation("item8")}
								className={`${
									variation["item8"] ? "bg-sky-500" : ""
								} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
								<span>GG</span>
							</div>
						</div>
					</div>
				</div>

				{/* Componente Lateral */}
				<div className="flex flex-col">
					<div className="border rounded-lg mb-2">
						<div className="px-4 mb-2">
							<h1 className="mb-1">Quantidade</h1>
							<div className="flex flex-row justify-between items-center mb-2">
								<div className="border container w-[120px] rounded-md">
									<div className="flex flex-row justify-between items-center h-[30px]">
										<button
											className={`ml-1 px-2 hover:bg-slate-300 hover:opacity-20 hover:text-black rounded-md ${
												isQuantityOneOrLess
													? "cursor-not-allowed"
													: "cursor-pointer"
											}`}
											onClick={decrementarQuantidade} // Etapa 3: Adicione o evento de clique
										>
											-
										</button>
										<input
											className="w-12 text-center bg-yellow-500 appearance-none"
											type="number"
											value={quantity}
											readOnly
										/>
										<button
											className={`mr-1 px-2 hover:bg-slate-300 hover:opacity-20 hover:text-black rounded-md ${
												isQuantityAtLimit
													? "cursor-not-allowed"
													: "cursor-pointer"
											}`}
											onClick={incrementarQuantidade}>
											+
										</button>
									</div>
								</div>
								<div className="text-sm">
									{stock} un disponíveis
								</div>
							</div>

							<div className="flex flex-row justify-between mb-2">
								<div className="font-semibold">Subtotal</div>
								<div className="font-semibold">
									{totalOrder}
								</div>
							</div>

							<button className="btn btn-outline btn-primary w-full mb-2">
								<ShoppingCartOne size={18} />
								Adicionar ao Carrinho
							</button>
							<button className="btn btn-primary w-full mb-2">
								<PaymentMethod size={18} /> Comprar Agora
							</button>
							{/* Componentes pequenos */}
							<div className="flex flex-row justify-center items-center">
								<div className="text-sm flex flex-row justify-center items-center hover:bg-slate-300 hover:opacity-20 px-2 py-1 gap-1 rounded cursor-pointer">
									<GrChat size={12} />
									<span>Chat</span>
								</div>
								|
								<div className=" text-sm flex flex-row justify-center items-center hover:bg-slate-300 hover:opacity-20 px-2 py-1 gap-1 rounded cursor-pointer">
									<BsHeart size={12} />
									<span>Wishlist</span>
								</div>
								|
								<div className="text-sm flex flex-row justify-center items-center hover:bg-slate-300 hover:opacity-20 px-2 py-1 gap-1 rounded cursor-pointer">
									<GoShareAndroid size={16} />
									<span>Share</span>
								</div>
							</div>
						</div>
					</div>

					{/* Meios de envio/Frete */}
					<div className="flex flex-col border border-solid p-2 rounded">
						<div className="mb-2">
							<h2 className="flex flex-row items-center gap-2 mb-2">
								<GrLocation size={18} />
								<span className="text-sm">
									Enviado de Joinville
								</span>
							</h2>
							{/* <div className="flex flex-row justify-between items-center gap-2 mb-1">
								<div className="flex flex-row items-center gap-2">
									<LiaShippingFastSolid size={24} />
									<span>Frete Grátis</span>
								</div>
								<div
									className="tooltip cursor-pointer"
									data-tip="A transportadora será escolhida pela loja, de acordo com o melhor custo benefício!">
									<FiInfo
										className="animate-pulse"
										size={18}
									/>
								</div>
							</div> */}
							<h2 className="flex flex-row items-center gap-2 mb-1">
								<LiaShippingFastSolid size={24} />
								<span>Meios de Envio</span>
							</h2>
							<div className="flex flex-row gap-2">
								<input
									type="text"
									placeholder="Seu CEP"
									className="input w-full max-w-[180px]"
								/>
								<button className="btn btn-primary">
									Calcular
								</button>
							</div>
						</div>
						<div
							onClick={() => handleSelected("item1")}
							className={`${
								selected["item1"] ? `bg-sky-500` : ""
							} hover:bg-sky-500 transition-all ease-in duration-150 border border-solid p-2 rounded cursor-pointer mb-2`}>
							<div className="flex flex-row justify-between items-center gap-2 mb-1">
								<span>Loggi</span>
								<h2>R$ 8,45</h2>
							</div>
							<div className="flex flex-row justify-between">
								<span className="text-sm">
									Previsão de envio
								</span>
								<h2 className="text-sm">30 dias</h2>
							</div>
						</div>
						<div
							onClick={() => handleSelected("item2")}
							className={`${
								selected["item2"] ? `bg-sky-500` : ""
							} hover:bg-sky-500 transition-all ease-in duration-150 border border-solid p-2 rounded cursor-pointer mb-2`}>
							<div className="flex flex-row justify-between items-center gap-2 mb-1">
								<span>Uello</span>
								<h2>R$ 10,65</h2>
							</div>
							<div className="flex flex-row justify-between">
								<span className="text-sm">
									Previsão de envio
								</span>
								<h4 className="text-sm">30 dias</h4>
							</div>
						</div>
						<div
							onClick={() => handleSelected("item3")}
							className={`${
								selected["item3"] ? `bg-sky-500` : ""
							} hover:bg-sky-500 transition-all ease-in duration-150 border border-solid p-2 rounded cursor-pointer mb-2`}>
							<div className="flex flex-row justify-between items-center gap-2 mb-1">
								<span>Rede Sul</span>
								<h2>R$ 12,66</h2>
							</div>
							<div className="flex flex-row justify-between">
								<span className="text-sm">
									Previsão de envio
								</span>
								<h4 className="text-sm">30 dias</h4>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Descrição do produto*/}
			<div className="bg-yellow-500 flex flex-col gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="w-full border-opacity-50">
					{/* Descrição e Detalhes*/}
					<div>
						<h1 className="divider text-xl">
							Descrição e Detalhes do Produto
						</h1>
						<p>
							Lorem Ipsum is simply dummy text of the printing and
							typesetting industry. Lorem Ipsum has been the
							industry's standard dummy text ever since the 1500s,
							when an unknown printer took a galley of type and
							scrambled it to make a type specimen book. It has
							survived not only five centuries, but also the leap
							into electronic typesetting, remaining essentially
							unchanged. It was popularised in the 1960s with the
							release of Letraset sheets containing Lorem Ipsum
							passages, and more recently with desktop publishing
							software like Aldus PageMaker including versions of
							Lorem Ipsum.
						</p>
					</div>
				</div>
			</div>

			{/* Informações da Loja */}
			<div className="bg-yellow-500 flex flex-col gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="border border-white w-full rounded p-2">
					<div className="flex flex-row gap-4">
						{/* Logo da Loja */}
						<div className="w-[230px] h-24 bg-pink-900 px-1 rounded-md">
							<Image
								className="object-contain w-full h-full"
								src={Amora}
								alt="Avatar"
								unoptimized
							/>
						</div>
						<div className="flex flex-col">
							<div className="flex flex-row items-center gap-1 font-semibold text-lg">
								<h1>Amora Book Store</h1>
								<MdVerified
									className="text-blue-700"
									size={18}
								/>
							</div>
							<div className="flex flex-row items-center">
								<BsStar size={14} />
								<span className="ml-1 mr-2">5.0</span> |
								<span className="ml-2">10 Seguidores</span>
							</div>
							<div className="mt-1">
								<button className="bg-green-600 transition-all ease-in duration-200 hover:bg-green-800 px-10 py-1 rounded">
									Seguir
								</button>
							</div>
						</div>
						<div className="divider divider-horizontal">|</div>
						<div className="flex flex-col justify-center">
							<div>
								<h1>Avaliações: 5.1mil</h1>
							</div>
							<div>
								<span>Produtos: 2.3mil</span>
							</div>
							<div className="mt-1">
								<button className="border border-solid border-purple-800  transition-all ease-in duration-200 hover:bg-purple-500 px-10 py-1 rounded">
									Ver Loja
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Avaliações*/}
			<div className="bg-yellow-500 flex flex-col gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-4">
				<div className="w-full border-opacity-50">
					<div className="flex flex-col">
						<div className="divider text-xl">
							Avaliações do Produto
						</div>
						{/* Avaliação por Usuário*/}
						<div className="flex flex-row gap-2">
							<div className="avatar">
								<div className="w-16 h-16 rounded-full">
									<Image
										src={imageProfile}
										alt="imageProfile"
									/>
								</div>
							</div>
							<div className="flex flex-col">
								<div>
									{/* Avaliações e Vendidos */}
									<h1 className="text-sm">Reinaldo Guedes</h1>
									<div className="flex flex-row items-center text-sm">
										<span className="flex flex-row items-center gap-1">
											<p className="mr-1 text-sm">5.0</p>
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
										</span>
									</div>
									<h3 className="text-xs mb-2">24/01/2024</h3>
									<p className="text-base mb-2">
										Ótimo produto. Chegou rápido e muito bem
										embalado, recomendo!
									</p>
								</div>

								{/* Fotos das avaliações */}
								<div className="flex flex-row gap-2 mb-2">
									<div className="bg-base-100 w-[74px] rounded relative shadow-lg">
										<div className="h-[74px] flex items-center justify-center">
											<Image
												className="object-contain  h-full"
												src={Lycoris}
												alt="Shoes"
											/>
										</div>
									</div>

									<div className="bg-base-100 w-[74px] rounded relative shadow-lg">
										<div className="h-[74px] flex items-center justify-center">
											<Image
												className="object-contain  h-full"
												src={Lycoris}
												alt="Shoes"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
						<hr className="mx-2" /> <br />
						{/* Avaliação por Usuário*/}
						<div className="flex flex-row gap-2">
							<div className="avatar">
								<div className="w-16 h-16 rounded-full">
									<Image
										src={imageProfile}
										alt="imageProfile"
									/>
								</div>
							</div>
							<div className="flex flex-col">
								<div>
									{/* Avaliações e Vendidos */}
									<h1 className="text-sm">
										Marina Penharver
									</h1>
									<div className="flex flex-row items-center text-sm">
										<span className="flex flex-row items-center gap-1">
											<p className="mr-1 text-sm">5.0</p>
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
										</span>
									</div>
									<h3 className="text-xs mb-2">24/01/2024</h3>
									<p className="text-base mb-2">
										Ótimo produto. Chegou rápido e muito bem
										embalado, recomendo!
									</p>
								</div>

								{/* Fotos das avaliações */}
								<div className="flex flex-row gap-2 mb-2">
									<div className="bg-base-100 w-[74px] rounded relative shadow-lg">
										<div className="h-[74px] flex items-center justify-center">
											<Image
												className="object-contain  h-full"
												src={Lycoris}
												alt="Shoes"
											/>
										</div>
									</div>

									<div className="bg-base-100 w-[74px] rounded relative shadow-lg">
										<div className="h-[74px] flex items-center justify-center">
											<Image
												className="object-contain  h-full"
												src={Lycoris}
												alt="Shoes"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
						<hr className="mx-2" /> <br />
					</div>
				</div>
			</div>
		</section>
	);
}

export default ProductPage;
