"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// imagens estáticas

// Context
import { CartContext } from "@/context/CartContext";

// Icons
import { Coupon, ShoppingCartOne } from "@icon-park/react";
import { MdOutlineDeleteOutline, MdArrowForwardIos } from "react-icons/md";

import { PiCreditCardBold } from "react-icons/pi";
import { BiIdCard } from "react-icons/Bi";
import { LiaShippingFastSolid } from "react-icons/lia";
import { FiInfo } from "react-icons/fi";

// Components

function CartPage() {
	const { setCart } = useContext(CartContext);
	const [productsInCart, setProductsInCart] = useState([]);
	const [transportadoras, setTransportadoras] = useState(null);
	const [transportadoraInfo, setTransportadoraInfo] = useState({});

	console.log(transportadoraInfo);

	useEffect(() => {
		const savedProductsInCart = localStorage.getItem("productsInCart");
		if (savedProductsInCart) {
			setProductsInCart(JSON.parse(savedProductsInCart));
		}
	}, []);

	useEffect(() => {
		const savedProductsInCart = localStorage.getItem("productsInCart");

		if (savedProductsInCart) {
			const products = JSON.parse(savedProductsInCart);

			// Objeto para armazenar as informações dos produtos por parceiro
			const partnerInfo = {};

			// Variável para armazenar o cepDestino de um dos produtos
			let cepDestino = null;

			// Calcular as informações dos produtos por parceiro
			products.forEach((product) => {
				const partnerID = product.partnerID;
				const weight = product.weight || 0;
				const length = product.length || 0;
				const width = product.width || 0;
				const height = product.height || 0;
				cepDestino = product.cepDestino; // Obter o cepDestino de um dos produtos
				const productPrice = product.productPrice || 0;
				const productPriceTotal = product.productPriceTotal || 0;
				const quantityThisProduct = product.quantityThisProduct || 0;
				const transpID = product.transportadora?.id; // Obter apenas o ID da transportadora

				if (!partnerInfo[partnerID]) {
					partnerInfo[partnerID] = {
						weight: weight,
						length: length,
						width: width,
						height: height,
						productPrice: productPrice,
						productPriceTotal: productPriceTotal,
						quantityThisProduct: quantityThisProduct,
						transportadora: {
							id: transpID, // Inicializa o ID da transportadora
						},
					};
				} else {
					// Se o peso atual for menor que o peso acumulado até agora, atualize-o
					if (weight < partnerInfo[partnerID].weight) {
						partnerInfo[partnerID].weight = weight;
						partnerInfo[partnerID].length = length;
						partnerInfo[partnerID].width = width;
						partnerInfo[partnerID].height = height;
						partnerInfo[partnerID].transportadora.id = transpID;
					}

					// Atualizar os valores de productPriceTotal e quantityThisProduct para a soma de todos os itens
					partnerInfo[partnerID].productPriceTotal +=
						productPriceTotal;
					partnerInfo[partnerID].quantityThisProduct +=
						quantityThisProduct;
				}
			});

			console.log("Informações dos produtos por parceiro:", partnerInfo);

			// Certifique-se de que cepDestino esteja definido antes de chamar handleSimulateShipping
			if (cepDestino) {
				// Chamada da função para simular o frete
				handleSimulateShipping(cepDestino, partnerInfo);
			} else {
				console.error("CepDestino não definido.");
			}
		}
	}, []);

	async function handleSimulateShipping(cepDestino, partnerInfo) {
		console.log(partnerInfo);
		try {
			const transportadoraData = {};

			for (const partnerID in partnerInfo) {
				if (partnerInfo.hasOwnProperty(partnerID)) {
					const partnerData = partnerInfo[partnerID];

					const response = await api.post(
						"/products/simulate-shipping",
						{
							cepDestino: cepDestino,
							weight: partnerData.weight,
							height: partnerData.height,
							width: partnerData.width,
							length: partnerData.length,
							productPrice: partnerData.productPrice,
							productPriceTotal: partnerData.productPriceTotal,
							quantityThisProduct:
								partnerData.quantityThisProduct,
						}
					);

					console.log(response.data);

					const transportadoraCorreta = response.data.find(
						(transportadora) =>
							transportadora.idTransp ===
							partnerData.transportadora?.id
					);

					console.log(
						"Transportadora correta:",
						transportadoraCorreta
					);

					// Adicionando os dados da transportadora ao objeto transportadoraData
					transportadoraData[partnerID] = {
						transpNome: transportadoraCorreta?.transp_nome,
						vlrFrete: transportadoraCorreta?.vlrFrete || 0,
						// Adicione outras informações que você precisar aqui
					};
				}
			}
			// Atualizando o estado com os dados da transportadora
			setTransportadoraInfo(transportadoraData);
			console.log(transportadoraData);
		} catch (error) {
			console.error("Ocorreu um erro:", error);
		}
	}

	// Funções para aumentar e diminuir a quantidade
	const decreaseQuantity = async (productId) => {
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
					setProductsInCart([...productsInCart]);

					// Atualizar o frete
					const partnerInfo = {};

					let cepDestino = null;

					productsInCart.forEach((product) => {
						const partnerID = product.partnerID;
						const weight = product.weight || 0;
						const length = product.length || 0;
						const width = product.width || 0;
						const height = product.height || 0;
						cepDestino = product.cepDestino; // Obter o cepDestino de um dos produtos
						const productPrice = product.productPrice || 0;
						const productPriceTotal =
							product.productPriceTotal || 0;
						const quantityThisProduct =
							product.quantityThisProduct || 0;
						const transpID = product.transportadora?.id; // Obter apenas o ID da transportadora

						if (!partnerInfo[partnerID]) {
							partnerInfo[partnerID] = {
								weight: weight,
								length: length,
								width: width,
								height: height,
								productPrice: productPrice,
								productPriceTotal: productPriceTotal,
								quantityThisProduct: quantityThisProduct,
								transportadora: {
									id: transpID, // Inicializa o ID da transportadora
								},
							};
						} else {
							// Se o peso atual for menor que o peso acumulado até agora, atualize-o
							if (weight < partnerInfo[partnerID].weight) {
								partnerInfo[partnerID].weight = weight;
								partnerInfo[partnerID].length = length;
								partnerInfo[partnerID].width = width;
								partnerInfo[partnerID].height = height;
								partnerInfo[partnerID].transportadora.id =
									transpID;
							}

							// Atualizar os valores de productPriceTotal e quantityThisProduct para a soma de todos os itens
							partnerInfo[partnerID].productPriceTotal +=
								productPriceTotal;
							partnerInfo[partnerID].quantityThisProduct +=
								quantityThisProduct;
						}
					});

					console.log(
						"Informações dos produtos por parceiro:",
						partnerInfo
					);

					if (cepDestino) {
						// Chamada da função para simular o frete
						handleSimulateShipping(cepDestino, partnerInfo);
					} else {
						console.error("CepDestino não definido.");
					}
				}
			}
		} catch (error) {
			console.log("Erro ao diminuir quantidade do produto", error);
			toast.error("Erro ao diminuir quantidade do produto");
		}
	};

	// const increaseQuantity = async (productId) => {
	// 	try {
	// 		let productsInCart =
	// 			JSON.parse(localStorage.getItem("productsInCart")) || [];
	// 		const index = productsInCart.findIndex(
	// 			(item) => item.productID === productId
	// 		);

	// 		if (index !== -1) {
	// 			// Incrementar a quantidade do produto no carrinho
	// 			productsInCart[index].quantityThisProduct++;

	// 			// Calcular o preço total do produto
	// 			const product = productsInCart[index];
	// 			const productPrice = product.productPrice;
	// 			productsInCart[index].productPriceTotal =
	// 				productsInCart[index].quantityThisProduct * productPrice;

	// 			// Atualizar os dados no armazenamento local
	// 			localStorage.setItem(
	// 				"productsInCart",
	// 				JSON.stringify(productsInCart)
	// 			);

	// 			// Atualizar o estado com os produtos no carrinho
	// 			setProductsInCart([...productsInCart]);
	// 		}

	// 		if (productsInCart.length > 0) {
	// 			// Obter as informações dos produtos por parceiro
	// 			const partnerInfo = {};

	// 			// Variável para armazenar o cepDestino de um dos produtos
	// 			let cepDestino = null;

	// 			// Calcular as informações dos produtos por parceiro
	// 			productsInCart.forEach((product) => {
	// 				const partnerID = product.partnerID;
	// 				const weight = product.weight || 0;
	// 				const length = product.length || 0;
	// 				const width = product.width || 0;
	// 				const height = product.height || 0;
	// 				cepDestino = product.cepDestino; // Obter o cepDestino de um dos produtos
	// 				const productPrice = product.productPrice || 0;
	// 				const productPriceTotal = product.productPriceTotal || 0;
	// 				const quantityThisProduct =
	// 					product.quantityThisProduct || 0;
	// 				const transpID = product.transportadora?.id; // Obter apenas o ID da transportadora

	// 				if (!partnerInfo[partnerID]) {
	// 					partnerInfo[partnerID] = {
	// 						weight: 0,
	// 						length: 0,
	// 						width: 0,
	// 						height: 0,
	// 						productPrice: 0,
	// 						productPriceTotal: 0,
	// 						quantityThisProduct: 0,
	// 						transportadora: {
	// 							id: null, // Inicializa o ID da transportadora como null
	// 						},
	// 					};
	// 				}

	// 				partnerInfo[partnerID].weight += weight;
	// 				partnerInfo[partnerID].length += length;
	// 				partnerInfo[partnerID].width += width;
	// 				partnerInfo[partnerID].height += height;
	// 				partnerInfo[partnerID].productPrice += productPrice;
	// 				partnerInfo[partnerID].productPriceTotal +=
	// 					productPriceTotal;
	// 				partnerInfo[partnerID].quantityThisProduct +=
	// 					quantityThisProduct;
	// 				partnerInfo[partnerID].transportadora.id = transpID; // Atualiza o ID da transportadora
	// 			});

	// 			console.log(
	// 				"Informações dos produtos por parceiro:",
	// 				partnerInfo
	// 			);
	// 		}
	// 	} catch (error) {
	// 		console.log("Erro ao aumentar quantidade do produto", error);
	// 		toast.error("Erro ao aumentar quantidade do produto");
	// 	}
	// };

	const increaseQuantity = async (productId) => {
		try {
			// Obter os produtos no carrinho do localStorage
			let productsInCart =
				JSON.parse(localStorage.getItem("productsInCart")) || [];

			// Encontrar o índice do produto pelo ID
			const index = productsInCart.findIndex(
				(item) => item.productID === productId
			);

			if (index !== -1) {
				// Incrementar a quantidade do produto no carrinho
				productsInCart[index].quantityThisProduct++;

				// Calcular o preço total do produto
				const product = productsInCart[index];
				const productPrice = product.productPrice;
				productsInCart[index].productPriceTotal =
					productsInCart[index].quantityThisProduct * productPrice;

				// Atualizar os dados no armazenamento local
				localStorage.setItem(
					"productsInCart",
					JSON.stringify(productsInCart)
				);

				// Atualizar o estado com os produtos no carrinho
				setProductsInCart([...productsInCart]);
			}

			// Verificar se há produtos no carrinho
			if (productsInCart.length > 0) {
				// Inicializar objeto para armazenar informações dos produtos por parceiro
				const partnerInfo = {};

				// Inicializar variável para armazenar o cepDestino
				let cepDestino = null;

				// Calcular as informações dos produtos por parceiro
				productsInCart.forEach((product) => {
					const partnerID = product.partnerID;
					const weight = product.weight || 0;
					const length = product.length || 0;
					const width = product.width || 0;
					const height = product.height || 0;
					cepDestino = product.cepDestino; // Obter o cepDestino de um dos produtos
					const productPrice = product.productPrice || 0;
					const productPriceTotal = product.productPriceTotal || 0;
					const quantityThisProduct =
						product.quantityThisProduct || 0;
					const transpID = product.transportadora?.id; // Obter apenas o ID da transportadora

					if (!partnerInfo[partnerID]) {
						partnerInfo[partnerID] = {
							weight: weight,
							length: length,
							width: width,
							height: height,
							productPrice: productPrice,
							productPriceTotal: productPriceTotal,
							quantityThisProduct: quantityThisProduct,
							transportadora: {
								id: transpID, // Inicializa o ID da transportadora
							},
						};
					} else {
						// Se o peso atual for menor que o peso acumulado até agora, atualize-o
						if (weight < partnerInfo[partnerID].weight) {
							partnerInfo[partnerID].weight = weight;
							partnerInfo[partnerID].length = length;
							partnerInfo[partnerID].width = width;
							partnerInfo[partnerID].height = height;
							partnerInfo[partnerID].transportadora.id = transpID;
						}

						// Atualizar os valores de productPriceTotal e quantityThisProduct para a soma de todos os itens
						partnerInfo[partnerID].productPriceTotal +=
							productPriceTotal;
						partnerInfo[partnerID].quantityThisProduct +=
							quantityThisProduct;
					}
				});

				console.log(
					"Informações dos produtos por parceiro:",
					partnerInfo
				);

				// Certificar-se de que cepDestino esteja definido antes de chamar handleSimulateShipping
				if (cepDestino) {
					// Chamada da função para simular o frete
					handleSimulateShipping(cepDestino, partnerInfo);
				} else {
					console.error("CepDestino não definido.");
				}
			}
		} catch (error) {
			console.log("Erro ao aumentar quantidade do produto", error);
			toast.error("Erro ao aumentar quantidade do produto");
		}
	};

	// Função para remover itens do carrinho de compra
	const handleRemoveFromCart = async (productId) => {
		try {
			let productsInCart =
				JSON.parse(localStorage.getItem("productsInCart")) || [];
			const updatedCart = productsInCart.filter(
				(item) => item.productID !== productId
			);

			// Recalcular o frete após a remoção do produto
			const partnerInfo = {};
			let cepDestino = null;

			updatedCart.forEach((product) => {
				const partnerID = product.partnerID;
				const weight = product.weight || 0;
				const length = product.length || 0;
				const width = product.width || 0;
				const height = product.height || 0;
				cepDestino = product.cepDestino; // Obter o cepDestino de um dos produtos
				const productPrice = product.productPrice || 0;
				const productPriceTotal = product.productPriceTotal || 0;
				const quantityThisProduct = product.quantityThisProduct || 0;
				const transpID = product.transportadora?.id; // Obter apenas o ID da transportadora

				if (!partnerInfo[partnerID]) {
					partnerInfo[partnerID] = {
						weight: weight,
						length: length,
						width: width,
						height: height,
						productPrice: productPrice,
						productPriceTotal: productPriceTotal,
						quantityThisProduct: quantityThisProduct,
						transportadora: {
							id: transpID, // Inicializa o ID da transportadora
						},
					};
				} else {
					// Se o peso atual for menor que o peso acumulado até agora, atualize-o
					if (weight < partnerInfo[partnerID].weight) {
						partnerInfo[partnerID].weight = weight;
						partnerInfo[partnerID].length = length;
						partnerInfo[partnerID].width = width;
						partnerInfo[partnerID].height = height;
						partnerInfo[partnerID].transportadora.id = transpID;
					}

					// Atualizar os valores de productPriceTotal e quantityThisProduct para a soma de todos os itens
					partnerInfo[partnerID].productPriceTotal +=
						productPriceTotal;
					partnerInfo[partnerID].quantityThisProduct +=
						quantityThisProduct;
				}
			});

			if (cepDestino) {
				await handleSimulateShipping(cepDestino, partnerInfo);
			} else {
				console.error("CepDestino não definido.");
			}

			localStorage.setItem("productsInCart", JSON.stringify(updatedCart));
			setProductsInCart(updatedCart);
			setCart(updatedCart.length);
			toast.success("Produto removido com sucesso!");
		} catch (error) {
			console.log("Erro ao remover produto!", error);
			toast.error("Erro ao remover produto!");
		}
	};

	// const handleRemoveFromCart = (productId) => {
	// 	try {
	// 		let productsInCart =
	// 			JSON.parse(localStorage.getItem("productsInCart")) || [];
	// 		const updatedCart = productsInCart.filter(
	// 			(item) => item.productID !== productId
	// 		);
	// 		localStorage.setItem("productsInCart", JSON.stringify(updatedCart));
	// 		setProductsInCart(updatedCart);
	// 		setCart(updatedCart.length);
	// 		toast.success("Produto removido com sucesso!");
	// 	} catch (error) {
	// 		console.log("Erro ao remover produto!", error);
	// 		toast.error("Erro ao remover produto!");
	// 	}
	// };

	const calculateTotalFrete = () => {
		let totalFrete = 0;

		// Verifica se transportadoraInfo não é nulo antes de acessar suas propriedades
		if (transportadoraInfo) {
			Object.values(transportadoraInfo).forEach((info) => {
				console.log("Valor de vlrFrete:", info.vlrFrete);
				totalFrete += info.vlrFrete || 0;
			});
		}
		console.log(totalFrete);
		return totalFrete;
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
						{transportadoraInfo && productsInCart.length > 0 ? (
							Object.values(
								productsInCart.reduce((acc, product) => {
									if (!acc[product.partnerID]) {
										acc[product.partnerID] = [product];
									} else {
										acc[product.partnerID].push(product);
									}
									return acc;
								}, {})
							).map((partnerProducts) => (
								<div
									key={partnerProducts[0].partnerID}
									className="flex flex-col border-[2px] border-gray-500 rounded-md gap-2 p-2 mb-4">
									{partnerProducts.map(
										(productInCart, index) => (
											<div
												key={productInCart.productID}
												className={`flex flex-col gap-4 bg-gray-500 w-[650px] min-h-[100px] p-4 rounded-md ${
													index <
													partnerProducts.length - 1
														? "mb-2"
														: ""
												}`}>
												{/* Renderizar informações do produto */}
												<div className="flex flex-row justify-between items-center gap-4">
													<div className="flex justify-center bg-red-500 w-28 h-28 rounded">
														<Image
															className="object-contain h-full"
															src={`http://localhost:5000/images/products/${productInCart.imageProduct}`}
															alt={
																productInCart.productName
															}
															width={100}
															height={100}
															unoptimized
														/>
													</div>
													<div>
														<h1 className="text-lg">
															{
																productInCart.productName
															}
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
													<div>
														<h1>
															{productInCart.productPrice.toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)}{" "}
															x{" "}
															{
																productInCart.quantityThisProduct
															}
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
															<MdOutlineDeleteOutline
																size={25}
															/>
														</div>
													</div>
												</div>
											</div>
										)
									)}
									{/* Renderizar o total do frete para este parceiro */}
									{Object.entries(transportadoraInfo).map(
										([partnerID, info]) => {
											// Verifica se o partnerID do transporte corresponde ao partnerID atual
											if (
												partnerID ===
												partnerProducts[0].partnerID
											) {
												return (
													<div key={partnerID}>
														<div className="text-right text-lg">
															Frete da Loja:{" "}
															{info.vlrFrete.toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)}
														</div>
														<div className="text-right text-lg">
															Transportadora:{" "}
															{info.transpNome}
														</div>
													</div>
												);
											}
											return null; // Retorna null para não renderizar nada se não houver correspondência
										}
									)}
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
											<h2>
												{/* {productsInCart[0].transportadora?.vlrFrete.toLocaleString(
													"pt-BR",
													{
														style: "currency",
														currency: "BRL",
													}
												)} */}

												{calculateTotalFrete().toLocaleString(
													"pt-BR",
													{
														style: "currency",
														currency: "BRL",
													}
												)}
											</h2>
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
