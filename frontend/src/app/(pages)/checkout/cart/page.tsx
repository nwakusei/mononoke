"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// imagens estáticas

// Context
import { CheckoutContext } from "@/context/CheckoutContext";

// Icons
import { ShoppingCartOne } from "@icon-park/react";
import { MdOutlineDeleteOutline, MdArrowForwardIos } from "react-icons/md";
import { PiCreditCardBold } from "react-icons/pi";
import { BiIdCard } from "react-icons/Bi";
import { LiaShippingFastSolid } from "react-icons/lia";

// Components
import { YourOrderComp } from "@/components/YourOrderComp";

function CartPage() {
	const { setCart, setSubtotal, transportadoraInfo, setTransportadoraInfo } =
		useContext(CheckoutContext);
	const [productsInCart, setProductsInCart] = useState([]);
	const [isFreightSimulated, setIsFreightSimulated] = useState(false);

	useEffect(() => {
		const savedProductsInCart = localStorage.getItem("productsInCart");
		if (savedProductsInCart) {
			setProductsInCart(JSON.parse(savedProductsInCart));
		}
	}, []);

	useEffect(() => {
		// 🚨 Se ainda não carregou os produtos ou já simulou o frete, não executa
		if (productsInCart.length === 0 || isFreightSimulated) return;

		// 🔥 Objeto para armazenar as informações dos produtos por parceiro
		const productInfo = {};
		let cepDestino = null;

		// 🔹 Filtrar produtos elegíveis para cálculo de frete
		const eligibleProducts = productsInCart.filter(
			(product) => product.cepDestino && product.cepDestino.trim() !== ""
		);

		eligibleProducts.forEach((product) => {
			const partnerID = product.partnerID;

			if (!productInfo[partnerID]) {
				productInfo[partnerID] = {
					weight: product.weight || 0,
					length: product.length || 0,
					width: product.width || 0,
					height: product.height || 0,
					productPrice: product.productPrice || 0,
					productPriceTotal: product.productPriceTotal || 0,
					quantityThisProduct: product.quantityThisProduct || 0,
					transportadora: {
						companyID: product.transportadora?.companyID,
					},
					productID: product.productID,
				};
			} else {
				// 🔹 Acumulando valores de produtos do mesmo parceiro
				productInfo[partnerID].weight += product.weight || 0;
				productInfo[partnerID].length += product.length || 0;
				productInfo[partnerID].width += product.width || 0;
				productInfo[partnerID].height += product.height || 0;
				productInfo[partnerID].productPrice +=
					product.productPrice || 0;
				productInfo[partnerID].productPriceTotal +=
					product.productPriceTotal || 0;
				productInfo[partnerID].quantityThisProduct +=
					product.quantityThisProduct || 0;
			}

			if (product.cepDestino && product.cepDestino.trim() !== "") {
				cepDestino = product.cepDestino;
			}
		});

		console.log("🚀 Enviando para handleSimulateShipping:", productInfo);

		if (cepDestino) {
			handleSimulateShipping(cepDestino, productInfo)
				.then(() => setIsFreightSimulated(true)) // 🔥 Evita simulações duplicadas
				.catch((error) => console.error("Erro na simulação:", error));
		}

		// 🔹 Processa produtos com frete grátis
		const freeShippingProducts = productsInCart.filter(
			(product) => !product.cepDestino || product.cepDestino.trim() === ""
		);

		if (freeShippingProducts.length > 0) {
			const defaultTransportadoraData = {};

			freeShippingProducts.forEach((product) => {
				const partnerID = product.partnerID;
				if (!defaultTransportadoraData[partnerID]) {
					defaultTransportadoraData[partnerID] = {
						partnerID: partnerID,
						companyName: "Frete Grátis",
						modalidyName: "",
						vlrFrete: 0.0,
						prazo: 3,
					};
				}
			});

			setTransportadoraInfo((prevInfo) => ({
				...prevInfo,
				...defaultTransportadoraData,
			}));

			localStorage.setItem(
				"transportadoraInfo",
				JSON.stringify({
					...JSON.parse(
						localStorage.getItem("transportadoraInfo") || "{}"
					),
					...defaultTransportadoraData,
				})
			);
		}
	}, [productsInCart]); // 🚀 Só executa quando `productsInCart` for atualizado

	async function handleSimulateShipping(cepDestino, productInfo) {
		console.log(
			"Recebido em handleSimulateShipping:",
			JSON.stringify(productInfo, null, 2)
		);

		try {
			let transportadoraData = {}; // 🔥 Resetando os dados antes de adicionar novos

			for (const partnerID in productInfo) {
				if (productInfo.hasOwnProperty(partnerID)) {
					const partnerData = productInfo[partnerID];

					let fretesRecebidos = []; // 🔥 Resetando para cada parceiro

					try {
						const requests = [];

						// Simulação de Melhor Envio
						requests.push(
							api
								.post("/shippings/simulate-melhor-envio", {
									productID: partnerData.productID,
									cepDestino: cepDestino,
									weight: partnerData.weight,
									height: partnerData.height,
									width: partnerData.width,
									length: partnerData.length,
									productPrice: partnerData.productPrice,
									productPriceTotal:
										partnerData.productPriceTotal,
									quantityThisProduct:
										partnerData.quantityThisProduct,
								})
								.catch((error) => {
									console.warn(
										`Erro ao simular Melhor Envio para ${partnerID}:`,
										error
									);
									return { data: [] }; // Retorna array vazio para evitar falhas
								})
						);

						// Simulação de Modico
						requests.push(
							api
								.post("/shippings/simulate-modico", {
									productID: partnerData.productID,
									cepDestino: cepDestino,
									weight: partnerData.weight,
									height: partnerData.height,
									width: partnerData.width,
									length: partnerData.length,
									productPrice: partnerData.productPrice,
									productPriceTotal:
										partnerData.productPriceTotal,
									quantityThisProduct:
										partnerData.quantityThisProduct,
								})
								.catch((error) => {
									console.warn(
										`Erro ao simular Modico para ${partnerID}:`,
										error
									);
									return { data: [] }; // Retorna array vazio para evitar falhas
								})
						);

						// Aguarda ambas as requisições e coleta os resultados
						const [responseMelhorEnvio, responseModico] =
							await Promise.all(requests);

						// Verifica se as respostas são válidas e são arrays
						const fretesMelhorEnvio = Array.isArray(
							responseMelhorEnvio.data
						)
							? responseMelhorEnvio.data
							: [];
						const fretesModico = Array.isArray(responseModico.data)
							? responseModico.data
							: [];

						// Junta os fretes das duas fontes
						fretesRecebidos = [
							...fretesMelhorEnvio,
							...fretesModico,
						];

						// Ordena pelo menor preço
						const sortedFretes = fretesRecebidos.sort(
							(a, b) => Number(a.price) - Number(b.price)
						);

						// Filtra a transportadora correta com base no companyID salvo no banco de dados
						const transportadoraCorreta = sortedFretes.find(
							(transportadora) =>
								transportadora.company?.id ===
								partnerData.transportadora?.companyID
						);

						if (transportadoraCorreta) {
							console.log(
								"Transportadora encontrada:",
								transportadoraCorreta
							);
						} else {
							console.log(
								"Nenhuma transportadora correspondente encontrada."
							);
						}

						// Atualiza o objeto transportadoraData
						transportadoraData[partnerID] = {
							partnerID: partnerID,
							companyName:
								transportadoraCorreta?.company?.name ??
								"Desconhecida",
							modalidyName: transportadoraCorreta?.name ?? "-",
							vlrFrete: Number(transportadoraCorreta?.price) || 0,
							prazo: transportadoraCorreta?.delivery_time || "-",
						};

						console.log(
							"TransportadoraData atualizado:",
							transportadoraData
						);
					} catch (error) {
						console.error(
							`Erro ao simular frete para o parceiro ${partnerID}:`,
							error
						);
					}
				}
			}

			// Verifica se transportadoraData não está vazio
			if (Object.keys(transportadoraData).length === 0) {
				console.log("Transportadora data está vazio.");
			} else {
				console.log("Transportadora data:", transportadoraData);
			}

			// 🔥 Atualizando o estado sem acumular valores antigos
			setTransportadoraInfo(transportadoraData);

			// 🔥 Salvando no localStorage
			try {
				console.log(
					"Salvando dados no localStorage:",
					transportadoraData
				);
				localStorage.setItem(
					"transportadoraInfo",
					JSON.stringify(transportadoraData)
				);
			} catch (error) {
				console.error("Erro ao salvar no localStorage:", error);
			}
		} catch (error) {
			console.error("Ocorreu um erro:", error);
		}
	}

	// async function handleSimulateShipping(cepDestino, productInfo) {
	// 	try {
	// 		const transportadoraData = {};

	// 		for (const partnerID in productInfo) {
	// 			if (productInfo.hasOwnProperty(partnerID)) {
	// 				const partnerData = productInfo[partnerID];

	// 				const response = await api.post(
	// 					"/products/simulate-melhor-enviomelhor-envio",
	// 					{
	// 						productID: partnerData.productID, // Incluindo o productID
	// 						cepDestino: cepDestino,
	// 						weight: partnerData.weight,
	// 						height: partnerData.height,
	// 						width: partnerData.width,
	// 						length: partnerData.length,
	// 						productPrice: partnerData.productPriceTotal,
	// 						productPriceTotal: partnerData.productPriceTotal,
	// 						quantityThisProduct:
	// 							partnerData.quantityThisProduct,
	// 					}
	// 				);

	// 				const transportadoraCorreta = response.data.find(
	// 					(transportadora) => {
	// 						return (
	// 							transportadora.company?.id ===
	// 							partnerData.transportadora?.companyID
	// 						);
	// 					}
	// 				); // Trasnportadora Correta para Melhor Envio

	// 				// const transportadoraCorreta = response.data[0]; // Trasnportadora Correta para Módico

	// 				console.log(
	// 					"DADOS DA TRANSPORTADORA CORRETA:",
	// 					transportadoraCorreta
	// 				);

	// 				// Adicionando os dados da transportadora ao objeto transportadoraData
	// 				transportadoraData[partnerID] = {
	// 					partnerID: partnerID,
	// 					companyName: transportadoraCorreta?.company?.name, // Corrigido para acessar o nome da empresa corretamente
	// 					vlrFrete: Number(transportadoraCorreta?.price),
	// 					prazo: transportadoraCorreta?.delivery_time,
	// 				};
	// 			}
	// 		}

	// 		// Verifique se transportadoraData não está vazio
	// 		if (Object.keys(transportadoraData).length === 0) {
	// 			console.log("Transportadora data está vazio.");
	// 		} else {
	// 			console.log("Transportadora data:", transportadoraData);
	// 		}

	// 		// Atualizando o estado com os dados da transportadora
	// 		setTransportadoraInfo(transportadoraData);
	// 		// Salvando no localStorage
	// 		try {
	// 			console.log(
	// 				"Salvando dados no localStorage:",
	// 				transportadoraData
	// 			);
	// 			localStorage.setItem(
	// 				"transportadoraInfo",
	// 				JSON.stringify(transportadoraData)
	// 			);
	// 		} catch (error) {
	// 			console.error("Erro ao salvar no localStorage:", error);
	// 		}
	// 	} catch (error) {
	// 		console.error("Ocorreu um erro:", error);
	// 	}
	// }

	const decreaseQuantity = async (productId) => {
		try {
			// Obter os produtos no carrinho do localStorage
			let productsInCart =
				JSON.parse(localStorage.getItem("productsInCart")) || [];

			// Encontrar o índice do produto usando apenas o productID
			const index = productsInCart.findIndex(
				(item) => item.productID === productId
			);

			if (index !== -1) {
				if (productsInCart[index].quantityThisProduct > 1) {
					// Decrementar a quantidade do produto no carrinho
					productsInCart[index].quantityThisProduct--;

					// Calcular o preço total do produto
					const productPrice = productsInCart[index].productPrice;
					productsInCart[index].productPriceTotal =
						productsInCart[index].quantityThisProduct *
						productPrice;

					// Atualizar os dados no armazenamento local
					localStorage.setItem(
						"productsInCart",
						JSON.stringify(productsInCart)
					);

					// Atualizar o estado com os produtos no carrinho
					setProductsInCart([...productsInCart]);

					// Filtrar os produtos para remover aqueles com frete grátis e cep vazio
					const filteredProducts = productsInCart.filter(
						(product) =>
							product.cepDestino &&
							product.cepDestino.trim() !== ""
					);

					// Verificar se há produtos no carrinho após a filtragem
					if (filteredProducts.length > 0) {
						const productInfo = {};
						let cepDestino = null;

						// Calcular as informações dos produtos por parceiro
						filteredProducts.forEach((product) => {
							const productID = product.productID;
							const partnerID = product.partnerID;
							const weight = product.weight || 0;
							const length = product.length || 0;
							const width = product.width || 0;
							const height = product.height || 0;
							const productPrice = product.productPrice || 0;
							const productPriceTotal =
								product.productPriceTotal || 0;
							const quantityThisProduct =
								product.quantityThisProduct || 0;
							const transpID =
								product.transportadora?.companyID || null; // Obter apenas o ID da transportadora

							if (!productInfo[partnerID]) {
								productInfo[partnerID] = {
									weight: weight,
									length: length,
									width: width,
									height: height,
									productPrice: productPrice,
									productPriceTotal: productPriceTotal,
									quantityThisProduct: quantityThisProduct,
									transportadora: {
										companyID: transpID, // Inicializa o ID da transportadora
									},
									productID: productID,
								};
							} else {
								// Acumular os valores de peso, comprimento, largura, altura e quantidade
								productInfo[partnerID].weight = weight;
								productInfo[partnerID].length = length;
								productInfo[partnerID].width = width;
								productInfo[partnerID].height = height;
								productInfo[partnerID].productPrice +=
									productPrice;
								productInfo[partnerID].productPriceTotal +=
									productPriceTotal;
								productInfo[partnerID].quantityThisProduct +=
									quantityThisProduct;
							}

							// Atualize o cepDestino se o produto tiver um
							if (
								product.cepDestino &&
								product.cepDestino.trim() !== ""
							) {
								cepDestino = product.cepDestino;
							}
						});

						console.log(
							"Informações dos produtos por parceiro:",
							productInfo
						);

						if (cepDestino) {
							// Chamada da função para simular o frete
							handleSimulateShipping(cepDestino, productInfo);
						} else {
							console.error("CepDestino não definido.");
						}
					}
				} else {
					// Se a quantidade for 1, remover o item do carrinho
					productsInCart.splice(index, 1);

					// Atualizar o localStorage e o estado
					localStorage.setItem(
						"productsInCart",
						JSON.stringify(productsInCart)
					);
					setProductsInCart([...productsInCart]);
				}
			} else {
				toast.error("Produto não encontrado no carrinho.");
			}
		} catch (error) {
			console.log("Erro ao diminuir quantidade do produto", error);
			toast.error("Erro ao diminuir quantidade do produto");
		}
	};

	const increaseQuantity = async (productId) => {
		try {
			// Obter os produtos no carrinho do localStorage
			let productsInCart =
				JSON.parse(localStorage.getItem("productsInCart")) || [];

			// Encontrar o índice do produto usando productID
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
			} else {
				// Se o produto não for encontrado, mostrar erro
				toast.error("Produto não encontrado no carrinho.");
			}

			// Filtrar os produtos para remover aqueles com frete grátis e cep vazio
			const filteredProducts = productsInCart.filter(
				(product) =>
					product.cepDestino && product.cepDestino.trim() !== ""
			);

			// Verificar se há produtos no carrinho após a filtragem
			if (filteredProducts.length > 0) {
				const productInfo = {};
				let cepDestino = null;

				// Calcular as informações dos produtos por parceiro
				filteredProducts.forEach((product) => {
					const productID = product.productID;
					const partnerID = product.partnerID;
					const weight = product.weight || 0;
					const length = product.length || 0;
					const width = product.width || 0;
					const height = product.height || 0;
					const productPrice = product.productPrice || 0;
					const productPriceTotal = product.productPriceTotal || 0;
					const quantityThisProduct =
						product.quantityThisProduct || 0;
					const transpID = product.transportadora?.companyID;

					if (!productInfo[partnerID]) {
						productInfo[partnerID] = {
							weight: weight,
							length: length,
							width: width,
							height: height,
							productPrice: productPrice,
							productPriceTotal: productPriceTotal,
							quantityThisProduct: quantityThisProduct,
							transportadora: {
								companyID: transpID,
							},
							productID: productID,
						};
					} else {
						productInfo[partnerID].weight = weight;
						productInfo[partnerID].length = length;
						productInfo[partnerID].width = width;
						productInfo[partnerID].height = height;
						productInfo[partnerID].productPrice += productPrice;
						productInfo[partnerID].productPriceTotal +=
							productPriceTotal;
						productInfo[partnerID].quantityThisProduct +=
							quantityThisProduct;
					}

					if (
						product.cepDestino &&
						product.cepDestino.trim() !== ""
					) {
						cepDestino = product.cepDestino;
					}
				});

				console.log(
					"Informações dos produtos por parceiro:",
					productInfo
				);

				if (cepDestino) {
					// Chamada da função para simular o frete
					handleSimulateShipping(cepDestino, productInfo);
				} else {
					console.error("CepDestino não definido.");
				}
			}
		} catch (error) {
			console.log("Erro ao aumentar quantidade do produto", error);
			toast.error("Erro ao aumentar quantidade do produto");
		}
	};

	const handleRemoveFromCart = async (productId, optionId) => {
		try {
			// Obter os produtos no carrinho do localStorage
			let productsInCart =
				JSON.parse(localStorage.getItem("productsInCart")) || [];

			// Filtrar o carrinho para remover o item correspondente
			const updatedCart = productsInCart.filter(
				(item) =>
					!(
						item.productID === productId &&
						item.productVariations?.[0]?.optionID === optionId
					)
			);

			// Recalcular o frete após a remoção do produto
			const filteredProducts = updatedCart.filter(
				(product) =>
					product.cepDestino && product.cepDestino.trim() !== ""
			);

			if (filteredProducts.length > 0) {
				const productInfo = {};
				let cepDestino = null;

				// Processar os produtos restantes para recalcular informações de frete
				filteredProducts.forEach((product) => {
					const partnerID = product.partnerID;
					const weight = product.weight || 0;
					const length = product.length || 0;
					const width = product.width || 0;
					const height = product.height || 0;
					const productPrice = product.productPrice || 0;
					const productPriceTotal = product.productPriceTotal || 0;
					const quantityThisProduct =
						product.quantityThisProduct || 0;
					const transpID = product.transportadora?.companyID; // Obter apenas o ID da transportadora

					if (!productInfo[partnerID]) {
						productInfo[partnerID] = {
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
						// Acumular os valores de peso, comprimento, largura, altura e quantidade
						productInfo[partnerID].weight = weight;
						productInfo[partnerID].length = length;
						productInfo[partnerID].width = width;
						productInfo[partnerID].height = height;
						productInfo[partnerID].productPrice += productPrice;
						productInfo[partnerID].productPriceTotal +=
							productPriceTotal;
						productInfo[partnerID].quantityThisProduct +=
							quantityThisProduct;
					}

					// Atualize o cepDestino se o produto tiver um
					if (
						product.cepDestino &&
						product.cepDestino.trim() !== ""
					) {
						cepDestino = product.cepDestino;
					}
				});

				if (cepDestino) {
					await handleSimulateShipping(cepDestino, productInfo);
				} else {
					console.error("CepDestino não definido.");
				}
			} else {
				// Se não houver produtos elegíveis para frete, limpar a transportadoraInfo
				localStorage.removeItem("transportadoraInfo");
				setTransportadoraInfo({});
			}

			// Atualizar o localStorage e os estados
			localStorage.setItem("productsInCart", JSON.stringify(updatedCart));
			setProductsInCart(updatedCart);

			// Limpar o localStorage quando o carrinho estiver vazio
			if (updatedCart.length === 0) {
				localStorage.removeItem("productsInCart");
				localStorage.removeItem("transportadoraInfo");
				localStorage.removeItem("coupons");
				localStorage.removeItem("selectedVariations");

				// Resetar o carrinho e o subtotal
				setCart(0);
				setSubtotal(0);
			}

			toast.success("Produto removido com sucesso!");
		} catch (error) {
			console.log("Erro ao remover produto!", error);
			toast.error("Erro ao remover produto!");
		}
	};

	// const handleRemoveFromCart = async (productId, optionId) => {
	// 	try {
	// 		// Obter os produtos no carrinho do localStorage
	// 		let productsInCart =
	// 			JSON.parse(localStorage.getItem("productsInCart")) || [];

	// 		// Filtrar o carrinho para remover o item correspondente
	// 		const updatedCart = productsInCart.filter(
	// 			(item) =>
	// 				!(
	// 					item.productID === productId &&
	// 					item.productVariations?.[0]?.optionID === optionId
	// 				)
	// 		);

	// 		// Verificar se ainda há produtos com "cepDestino" no carrinho
	// 		const filteredProducts = updatedCart.filter(
	// 			(product) =>
	// 				product.cepDestino && product.cepDestino.trim() !== ""
	// 		);

	// 		if (filteredProducts.length > 0) {
	// 			// Preparar dados para recalcular o frete
	// 			const productInfo = {};
	// 			let cepDestino = null;

	// 			filteredProducts.forEach((product) => {
	// 				const partnerID = product.partnerID;
	// 				const weight = product.weight || 0;
	// 				const quantity = product.quantityThisProduct || 1;

	// 				if (!productInfo[partnerID]) {
	// 					productInfo[partnerID] = {
	// 						weight: weight * quantity,
	// 						length: product.length || 0,
	// 						width: product.width || 0,
	// 						height: product.height || 0,
	// 						productPriceTotal: product.productPriceTotal || 0,
	// 						quantityThisProduct: quantity,
	// 					};
	// 				} else {
	// 					productInfo[partnerID].weight += weight * quantity;
	// 					productInfo[partnerID].productPriceTotal +=
	// 						product.productPriceTotal || 0;
	// 					productInfo[partnerID].quantityThisProduct += quantity;
	// 				}

	// 				if (
	// 					product.cepDestino &&
	// 					product.cepDestino.trim() !== ""
	// 				) {
	// 					cepDestino = product.cepDestino;
	// 				}
	// 			});

	// 			// Recalcular o frete
	// 			if (cepDestino) {
	// 				await handleSimulateShipping(cepDestino, productInfo);
	// 			} else {
	// 				console.error("Erro: cepDestino não definido.");
	// 			}
	// 		} else {
	// 			// Limpar transportadoraInfo se não houver produtos elegíveis para frete
	// 			localStorage.removeItem("transportadoraInfo");
	// 			setTransportadoraInfo({});
	// 		}

	// 		// Atualizar o localStorage e os estados
	// 		localStorage.setItem("productsInCart", JSON.stringify(updatedCart));
	// 		setProductsInCart(updatedCart);

	// 		// Atualizar subtotal e carrinho
	// 		if (updatedCart.length === 0) {
	// 			setCart(0);
	// 			setSubtotal(0);
	// 		} else {
	// 			const newSubtotal = updatedCart.reduce(
	// 				(acc, item) => acc + (item.productPriceTotal || 0),
	// 				0
	// 			);
	// 			setSubtotal(newSubtotal);
	// 		}

	// 		// Notificar o usuário
	// 		toast.success("Produto removido com sucesso!");
	// 	} catch (error) {
	// 		console.error("Erro ao remover produto:", error);
	// 		toast.error("Erro ao remover produto!");
	// 	}
	// };

	// const calculateTotalFrete = () => {
	// 	let totalFrete = 0;

	// 	// Verifica se transportadoraInfo não é nulo antes de acessar suas propriedades
	// 	if (transportadoraInfo) {
	// 		Object.values(transportadoraInfo).forEach((info) => {
	// 			console.log("Valor de vlrFrete:", info.vlrFrete);
	// 			totalFrete += info.vlrFrete || 0;
	// 		});
	// 	}
	// 	console.log(totalFrete);
	// 	return totalFrete;
	// };

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 min-h-screen">
			<div className="col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-4 mb-8">
				<div className="flex flex-col justify-center mb-4">
					<ul className="flex steps steps-vertical lg:steps-horizontal mt-8 mb-8">
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-primary py-1 px-2 rounded shadow-md">
								<p>Carrinho</p> <ShoppingCartOne size={18} />
							</span>
						</li>
						<li className="step">
							<span className="flex flex-row items-center gap-1 bg-black py-1 px-2 rounded shadow-md">
								<p>Entrega</p>
								<LiaShippingFastSolid size={18} />
							</span>
						</li>
						<li className="step">
							<span className="flex flex-row items-center gap-1 bg-black py-1 px-2 rounded shadow-md">
								<p>Revisão</p> <BiIdCard size={20} />
							</span>
						</li>
						<li className="step">
							<span className="flex flex-row items-center gap-1 bg-black py-1 px-2 rounded shadow-md">
								<p>Pagamento</p>
								<PiCreditCardBold size={20} />
							</span>
						</li>
					</ul>
				</div>

				<div className="flex flex-row justify-between bg-white col-start-2 col-span-4 md:col-start-2 md:col-span-6 rounded-md shadow-md mb-8 p-4 gap-4">
					<div className="flex flex-col items-center gap-4">
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
									className="flex flex-col border-[1px] border-black border-opacity-20 bg-white rounded-md shadow-md p-2 gap-2 w-full">
									{partnerProducts.map(
										(productInCart, index) => (
											<div
												key={productInCart.productID}
												className={`flex flex-col gap-4 border-[1px] border-black border-opacity-20 bg-white w-[672px] min-h-[100px] p-4 rounded-md shadow-md`}>
												{/* Renderizar informações do produto */}
												<div className="flex flex-row justify-between items-center gap-4">
													{productInCart
														.productVariations
														?.length > 0 ? (
														productInCart.productVariations.map(
															(variation) => (
																<div
																	key={
																		variation.variationID
																	}
																	className="flex justify-center border-[1px] border-black border-opacity-20 bg-white w-28 h-28 rounded shadow-md">
																	<div
																		key={
																			variation.variationID
																		}
																		className="flex justify-center border-[1px] border-black border-opacity-20 bg-white w-28 h-28 rounded shadow-md">
																		<Image
																			className="object-contain h-full"
																			src={`http://localhost:5000/images/products/${variation.imageUrl}`}
																			alt={
																				productInCart.productTitle
																			}
																			width={
																				100
																			}
																			height={
																				100
																			}
																			unoptimized
																		/>
																	</div>
																</div>
															)
														)
													) : (
														<div className="flex justify-center border-[1px] border-black border-opacity-20 bg-white w-28 h-28 rounded shadow-md">
															<Image
																className="object-contain h-full"
																src={`http://localhost:5000/images/products/${productInCart.imageProduct}`}
																alt={
																	productInCart.productTitle
																}
																width={100}
																height={100}
																unoptimized
															/>
														</div>
													)}

													<div>
														<h1 className="text-lg text-black">
															{
																productInCart.productTitle
															}
														</h1>
														{productInCart
															.productVariations
															?.length > 0 ? (
															productInCart.productVariations.map(
																(variation) => (
																	<h2
																		key={
																			variation.variationID
																		}
																		className="mb-2 text-black">
																		{
																			variation.variationName
																		}
																		:{" "}
																		{
																			variation.name
																		}
																	</h2>
																)
															)
														) : (
															<h2 className="mb-2 text-black">
																Sem variações
															</h2>
														)}
														<div className="flex flex-row items-center text-black gap-2">
															<button
																onClick={() =>
																	decreaseQuantity(
																		productInCart.productID
																	)
																}
																className="flex items-center justify-center w-[30px] h-[30px] select-none font-mono">
																<h1 className="px-3 py-1 shadow-md shadow-gray-500/50 bg-black text-white rounded cursor-pointer active:scale-[.97]">
																	-
																</h1>
															</button>
															<input
																className="text-lg text-center bg-gray-300
                            w-[60px] h-[32px]
                            rounded"
																type="text"
																value={
																	productInCart.quantityThisProduct
																}
																readOnly
															/>
															<button
																onClick={() =>
																	increaseQuantity(
																		productInCart.productID
																	)
																} // Passando apenas o productID
																className="flex items-center justify-center w-[30px] h-[30px] select-none font-mono">
																<h1 className="px-3 py-1 shadow-md shadow-gray-500/50 bg-black text-white rounded cursor-pointer active:scale-[.97]">
																	+
																</h1>
															</button>
														</div>
													</div>
													<div>
														<h1 className="text-black">
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
													<div
														onClick={() =>
															handleRemoveFromCart(
																productInCart.productID,
																productInCart
																	.productVariations?.[0]
																	?.optionID // Verificação segura
															)
														}
														className="text-black hover:text-white flex flex-col items-center justify-center border-dashed hover:border-solid border-[1px] border-primary hover:bg-secondary w-10 h-10 transition-all ease-in duration-200 hover:shadow-md active:scale-[.97] rounded cursor-pointer">
														<MdOutlineDeleteOutline
															size={25}
														/>
													</div>
												</div>
											</div>
										)
									)}
									{/* {partnerProducts.map(
										(productInCart, index) => (
											<div
												key={productInCart.productID}
												className={`flex flex-col gap-4 border-[1px] border-black border-opacity-20 bg-white w-[672px] min-h-[100px] p-4 rounded-md shadow-md ${
													index <
													partnerProducts.length - 1
														? "mb-2"
														: ""
												}`}>
												<div className="flex flex-row justify-between items-center gap-4">
													<div className="flex justify-center border-[1px] border-black border-opacity-20 bg-white w-28 h-28 rounded shadow-md">
														<Image
															className="object-contain h-full"
															src={`http://localhost:5000/images/products/${productInCart.imageProduct}`}
															alt={
																productInCart.productTitle
															}
															width={100}
															height={100}
															unoptimized
														/>
													</div>
													<div>
														<h1 className="text-lg text-black">
															{
																productInCart.productTitle
															}
														</h1>
														<h2 className="mb-2 text-black">
															Variação: Preto
														</h2>
														<div className="flex flex-row items-center text-black gap-2">
															<button
																onClick={() =>
																	decreaseQuantity(
																		productInCart.productID
																	)
																}
																className="flex items-center justify-center  w-[30px] h-[30px] select-none font-mono">
																<h1 className="px-3 py-1 shadow-md shadow-gray-500/50 bg-black text-white rounded cursor-pointer active:scale-[.97]">
																	-
																</h1>
															</button>
															<input
																className="text-lg text-center bg-gray-300
																w-[60px] h-[32px]
																rounded"
																type="text"
																value={
																	productInCart.quantityThisProduct
																}
															/>
															<button
																onClick={() =>
																	increaseQuantity(
																		productInCart.productID
																	)
																}
																className="flex items-center justify-center  w-[30px] h-[30px] select-none font-mono">
																<h1 className="px-3 py-1 shadow-md shadow-gray-500/50 bg-black text-white rounded cursor-pointer active:scale-[.97]">
																	+
																</h1>
															</button>
														</div>
													</div>
													<div>
														<h1 className="text-black">
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
															className="text-black hover:text-white flex flex-col items-center justify-center border-dashed hover:border-solid border-[1px] border-primary hover:bg-secondary w-10 h-10 transition-all ease-in duration-200 hover:shadow-md active:scale-[.97] rounded cursor-pointer">
															<MdOutlineDeleteOutline
																size={25}
															/>
														</div>
													</div>
												</div>
											</div>
										)
									)} */}
									{Object.entries(transportadoraInfo).map(
										([partnerID, info]) => {
											// Verifica se o partnerID do transporte corresponde ao partnerID atual
											const matchingProduct =
												partnerProducts.find(
													(product) =>
														product.partnerID ===
														partnerID
												);
											if (matchingProduct) {
												return (
													<div
														key={partnerID}
														className="text-black border-[1px] border-black border-opacity-20 bg-white p-4 rounded-md shadow-md">
														<div>
															{info.companyName ===
															"Frete Grátis"
																? info.companyName
																: `Transportadora: ${info.companyName} (${info.modalidyName})`}
														</div>
														<div>
															Frete da Loja:{" "}
															{info &&
															info.vlrFrete
																? info.vlrFrete.toLocaleString(
																		"pt-BR",
																		{
																			style: "currency",
																			currency:
																				"BRL",
																		}
																  )
																: `R$ 0,00`}
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
						<YourOrderComp
							productsInfo={productsInCart}
							shippingInfo={transportadoraInfo}
						/>
					</div>
				</div>

				<div className="flex flex-row justify-center items-center gap-4">
					<button className="btn btn-primary shadow-md">
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
