"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";

// Axios
import api from "@/utils/api";

// Context
import { Context } from "@/context/UserContext";

// Importe suas imagens e ícones aqui
import Lycoris from "../../../../../public/lycoris.jpg";
import Amora from "../../../../../public/amora.jpg";
import imageProfile from "../../../../../public/Kon.jpg";

// Icons
import { Currency, ShoppingCartOne, PaymentMethod } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill, BsHeart } from "react-icons/bs";
import { MdVerified, MdOutlineLocationOn } from "react-icons/md";
import { GoShareAndroid, GoLocation } from "react-icons/go";
import { PiChatTextLight } from "react-icons/pi";
import { GrChat } from "react-icons/gr";
import { TbTruckDelivery } from "react-icons/tb";
import { LiaShippingFastSolid } from "react-icons/lia";
import { GrLocation } from "react-icons/gr";
import { FiInfo } from "react-icons/fi";
import { LuCalendarClock } from "react-icons/lu";

function ProductPage() {
	const { id } = useParams();
	const [product, setProduct] = useState({});
	const [transportadoras, setTransportadoras] = useState([]);
	const [isCalculating, setIsCalculating] = useState(false);
	const [cepDestino, setCepDestino] = useState(""); // Estado para armazenar o valor do input
	const [selected, setSelected] = useState<{ [key: string]: boolean }>({});
	const [variation, setVariation] = useState<{ [key: string]: boolean }>({});
	const stock = product.stock; // Constante que irá representar a quantidade de estoque que vem do Banco de Dados

	const { partners } = useContext(Context);
	const partner = partners.find(
		(partner) => partner._id === product.partnerID
	);

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const response = await api.get(`/products/${id}`);
				setProduct(response.data.product);
			} catch (error) {
				console.error("Error fetching product:", error);
			}
		};

		fetchProduct();
	}, [id]);

	// // Data no padrão original
	// const dataOriginal = "2024-02-28 05:47:42";

	// // Criar um objeto Date a partir da string
	// const data = new Date(dataOriginal);

	// // Obter o dia, mês e ano
	// const dia = data.getDate();
	// const mes = data.getMonth() + 1; // Os meses são baseados em zero, então adicionamos 1

	// // Formatar a data no padrão brasileiro
	// const dataFormatada =
	// 	dia.toString().padStart(2, "0") + "/" + mes.toString().padStart(2, "0");

	// Função para Calcular o Frete
	async function handleSimulateShipping(cep: number) {
		// Adicione cep como parâmetro
		try {
			const response = await api.post("/products/simulate-shipping", {
				cepDestino: cep,
			}); // Passar cep como parte do corpo da solicitação
			setTransportadoras(response.data);
		} catch (error) {
			console.error("Ocorreu um erro:", error);
		}
	}

	// Função para lidar com o clique no botão de Calculo de Frete
	const handleButtonClick = () => {
		setIsCalculating(true);

		handleSimulateShipping(cepDestino);

		setTimeout(() => {
			setIsCalculating(false);
		}, 1000);
	};

	// Valor a ser Exibido no Anúncio (Preço Original ou Promocional)
	const value =
		Number(product.promocionalPrice?.$numberDecimal) > 0
			? Number(product.promocionalPrice?.$numberDecimal)
			: Number(product.originalPrice?.$numberDecimal);

	// Função para selecionar variações
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

	// Lidando com a relação entre Quantidade e Subtotal baseado no valor do produto (Preço Original ou Promocional)
	// Etapa 1: Adicionando a variável de estado para a quantidade
	const [quantity, setQuantity] = useState<number>(1);
	const [isQuantityOneOrLess, setIsQuantityOneOrLess] = useState(true);
	const [isQuantityAtLimit, setIsQuantityAtLimit] = useState(false);
	const [totalOrder, setTotalOrder] = useState(value);

	// Etapa 2: Funções para lidar com incremento e decremento
	const updateTotalOrder = (newQuantity: number) => {
		setTotalOrder(value);

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

		// Multiplicando o novo valor da quantidade pelo valor do produto
		setTotalOrder(newQuantity * value);
	};

	// Incremento de Quantidade (+1)
	const incrementarQuantidade = () => {
		if (quantity < stock) {
			updateTotalOrder(quantity + 1);
		}
	};

	// Decremento de Quantidade (-1)
	const decrementarQuantidade = () => {
		if (quantity > 1) {
			updateTotalOrder(quantity - 1);
		}
	};

	// Função para calculo do Subtotal dos produtos
	const renderPrice = () => {
		const priceToRender =
			Number(product.promocionalPrice?.$numberDecimal) > 0
				? Number(
						product.promocionalPrice.$numberDecimal
				  ).toLocaleString("pt-BR", {
						style: "currency",
						currency: "BRL",
				  })
				: Number(product.originalPrice?.$numberDecimal).toLocaleString(
						"pt-BR",
						{
							style: "currency",
							currency: "BRL",
						}
				  );
		return priceToRender;
	};

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 mx-4 mt-4">
			<div className="bg-yellow-500 flex flex-row gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				{/* Componente de Imagem Principal */}
				<div className="flex flex-col">
					<div className="bg-base-100 w-[402px] rounded-md relative shadow-lg mb-2">
						<div className="h-[402px] flex items-center justify-center mx-3 my-2">
							{product.imagesProduct &&
								product.imagesProduct.length > 0 && (
									<Image
										className="object-contain h-full"
										src={`http://localhost:5000/images/products/${product.imagesProduct[0]}`}
										alt={product.productName}
										width={280}
										height={10}
										unoptimized
									/>
								)}
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
					</div>
				</div>

				{/* Componente intermediário */}
				<div className="flex flex-col">
					{/* Título */}
					<h1 className="text-xl font-semibold mb-1">
						{product.productName}
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
						|<p>0 Avaliações</p>|
						<p>
							{product.productsSold > 1
								? `${product.productsSold} Vendidos`
								: `${product.productsSold} Vendido`}{" "}
						</p>
					</div>
					{/* Preço */}
					{product.promocionalPrice?.$numberDecimal > 0 ? (
						<div>
							{/* Preço promocional */}
							<h2 className="text-2xl text-primary font-semibold">
								{Number(
									product.promocionalPrice?.$numberDecimal
								).toLocaleString("pt-BR", {
									style: "currency",
									currency: "BRL",
								})}
							</h2>
							{/* Preço antes do desconto */}
							<div className="flex flex-row items-center mb-2">
								<span className="text-base line-through mr-2">
									{Number(
										product.originalPrice?.$numberDecimal
									).toLocaleString("pt-BR", {
										style: "currency",
										currency: "BRL",
									})}
								</span>
								<span className="bg-primary text-xs px-1 rounded-sm">
									20% Off
								</span>
							</div>
						</div>
					) : (
						<div>
							<h2 className="text-2xl text-primary font-semibold">
								{Number(
									product.originalPrice?.$numberDecimal
								).toLocaleString("pt-BR", {
									style: "currency",
									currency: "BRL",
								})}
							</h2>
						</div>
					)}
					{/* Cashback */}
					{partner && (
						<div className="flex flex-row items-center mb-4">
							<span>
								<p className="flex flex-row items-center gap-2 text-center text-sm text-green-500 mb-2">
									<Currency size={18} /> {partner.cashback}%
									de Cashback
								</p>
							</span>
						</div>
					)}

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

				{/* Componente Lateral D. */}
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
									{quantity === 1
										? renderPrice()
										: totalOrder.toLocaleString("pt-BR", {
												style: "currency",
												currency: "BRL",
										  })}
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

					<div>
						{/* Etiqueta de Encomenda */}
						{product.preOrder === true ? (
							<div className="flex flex-row justify-center items-center bg-sky-500 p-2 gap-3 rounded shadow mb-2">
								<LuCalendarClock size={20} />
								<h1>
									Encomenda (envio em {product.daysShipping}{" "}
									dias)
								</h1>
							</div>
						) : (
							<></>
						)}
					</div>

					{/* Meios de envio/Frete */}
					<div className="flex flex-col border border-solid p-2 rounded">
						<div>
							<h2 className="flex flex-row items-center gap-2 mb-2">
								<GrLocation size={18} />
								<span className="text-sm">
									Enviado de Joinville/SC
								</span>
							</h2>

							{product.freeShipping === "Sim" ? (
								<div className="flex flex-row justify-between items-center gap-2 mb-1">
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
								</div>
							) : (
								<div>
									<h2 className="flex flex-row items-center gap-2 mb-1">
										<LiaShippingFastSolid size={24} />
										<span>Meios de Envio</span>
									</h2>
									<div className="flex flex-row gap-2 mb-2">
										<input
											type="text"
											placeholder="Seu CEP"
											className="input w-full max-w-[180px]"
											value={cepDestino} // Valor do input é controlado pelo estado cepDestino
											onChange={(e) =>
												setCepDestino(e.target.value)
											} // Atualizar o estado cepDestino quando o valor do input mudar
										/>
										<button
											type="button"
											className="btn btn-primary w-[120px]"
											onClick={handleButtonClick}
											disabled={isCalculating} // Desabilitar o botão enquanto o cálculo estiver em andamento
										>
											{isCalculating ? (
												<div className="btn btn-primary w-[120px]">
													<span className="loading loading-spinner loading-xs"></span>
												</div>
											) : (
												"Calcular"
											)}
										</button>
									</div>
								</div>
							)}

							{transportadoras.length > 0 ? (
								transportadoras.map((transportadora) => (
									<div
										key={transportadora.idSimulacao}
										onClick={() =>
											handleSelected(
												transportadora.idSimulacao
											)
										}
										className={`${
											selected[transportadora.idSimulacao]
												? `bg-sky-500`
												: ""
										} hover:bg-sky-500 transition-all ease-in duration-150 border border-solid p-2 rounded cursor-pointer mb-2`}>
										<div className="flex flex-row justify-between items-center gap-2 mb-1">
											<span>
												{transportadora.transp_nome}
											</span>
											<h2>
												{transportadora.tarifas.map(
													(tarifa, index) => (
														<h2 key={index}>
															{tarifa.valor.toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)}
														</h2>
													)
												)}
											</h2>
										</div>
										<div className="flex flex-row justify-between">
											<span className="text-sm">
												Prazo de entrega
											</span>
											<h2 className="text-sm">
												{product.daysShipping +
													transportadora.prazoEnt}{" "}
												dias
											</h2>
										</div>
									</div>
								))
							) : (
								<></>
							)}
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
						<p>{product.description}</p>
					</div>
				</div>
			</div>

			{/* Informações da Loja */}
			<div className="bg-yellow-500 flex flex-col gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="border border-white w-full rounded p-2">
					{/* Logo da Loja */}
					{partner && (
						<div className="flex flex-row gap-4">
							<div className="w-[230px] h-24 bg-pink-900 px-1 rounded-md">
								<Image
									className="object-contain w-full h-full"
									src={Amora}
									alt="Logo Shop"
									unoptimized
								/>
							</div>
							<div className="flex flex-col">
								<div className="flex flex-row items-center gap-1 font-semibold text-lg">
									<h1>{partner.name}</h1>
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
					)}
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
