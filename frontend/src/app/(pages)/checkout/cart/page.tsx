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
import { BiIdCard } from "react-icons/bi";
import { LiaShippingFastSolid } from "react-icons/lia";

// Components
import { YourOrderComp } from "@/components/YourOrderComp";

import CryptoJS from "crypto-js";

function encryptData(data) {
	return CryptoJS.AES.encrypt(
		JSON.stringify(data), // Converte o objeto inteiro para string
		"chave-secreta"
	).toString();
}

function decryptData(encryptedData) {
	try {
		const bytes = CryptoJS.AES.decrypt(encryptedData, "chave-secreta");
		const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

		// Garantir que o dado retornado seja uma string JSON válida
		if (decryptedString) {
			return decryptedString; // Retorna como uma string
		} else {
			console.error("Falha ao descriptografar: Dado inválido.");
			return null;
		}
	} catch (error) {
		console.error("Erro ao descriptografar:", error);
		return null;
	}
}

function CartPage() {
	const { setCart, setSubtotal, transportadoraInfo, setTransportadoraInfo } =
		useContext(CheckoutContext);
	const [productsInCart, setProductsInCart] = useState([]);
	const [isFreightSimulated, setIsFreightSimulated] = useState(false);

	console.log("Produtos no Carrinho:", productsInCart);

	// useEffect(() => {
	// 	const savedProductsInCart = localStorage.getItem("productsInCart");

	// 	if (savedProductsInCart) {
	// 		try {
	// 			// Descriptografa a string antes de tentar parsear
	// 			const decryptedString = decryptData(savedProductsInCart);

	// 			if (decryptedString) {
	// 				// Teste se a string já é JSON ou precisa ser convertida
	// 				try {
	// 					const parsedData = JSON.parse(decryptedString);

	// 					setProductsInCart(parsedData);
	// 				} catch (parseError) {
	// 					console.error(
	// 						"Erro ao tentar fazer JSON.parse:",
	// 						parseError
	// 					);
	// 					console.error(
	// 						"String que causou erro:",
	// 						decryptedString
	// 					);
	// 				}
	// 			} else {
	// 				console.error(
	// 					"Erro ao descriptografar os produtos. Retorno vazio ou inválido."
	// 				);
	// 			}
	// 		} catch (error) {
	// 			console.error(
	// 				"Erro ao processar os produtos do carrinho:",
	// 				error
	// 			);
	// 		}
	// 	}
	// }, []);

	// useEffect(() => {
	// 	const savedProductsInCart = localStorage.getItem("productsInCart");

	// 	if (!savedProductsInCart) {
	// 		setProductsInCart([]);
	// 		return;
	// 	}

	// 	try {
	// 		const decryptedString = decryptData(savedProductsInCart);
	// 		if (!decryptedString) {
	// 			setProductsInCart([]);
	// 			return;
	// 		}

	// 		const parsedData = JSON.parse(decryptedString);
	// 		if (!Array.isArray(parsedData)) {
	// 			setProductsInCart([]);
	// 			return;
	// 		}

	// 		const updateProducts = async () => {
	// 			const updated = await Promise.all(
	// 				parsedData.map(async (item: any) => {
	// 					try {
	// 						const res = await api.get(
	// 							`/products/${item.productID}`
	// 						);
	// 						const data = res.data.product;

	// 						let updatedPrice = 0;
	// 						let updatedImage = item.imageProduct;

	// 						// Produto com variação
	// 						if (
	// 							data.productVariations?.length > 0 &&
	// 							item.productVariations?.length > 0
	// 						) {
	// 							const selectedVariation =
	// 								item.productVariations[0];

	// 							console.log(
	// 								"🟠 Carrinho: name =",
	// 								selectedVariation.name
	// 							);

	// 							const matchedOption =
	// 								data.productVariations[0]?.options.find(
	// 									(opt: any) =>
	// 										opt.name === selectedVariation.name
	// 								);

	// 							console.log(
	// 								"🟢 Variação encontrada:",
	// 								matchedOption
	// 							);

	// 							if (matchedOption) {
	// 								const promo = Number(
	// 									matchedOption.promotionalPrice
	// 								);
	// 								const original = Number(
	// 									matchedOption.originalPrice
	// 								);

	// 								updatedPrice = promo > 0 ? promo : original;
	// 								updatedImage =
	// 									matchedOption.imageUrl ?? updatedImage;
	// 							} else {
	// 								console.warn(
	// 									"⚠️ Variação não encontrada. Usando preço base."
	// 								);
	// 								const promo = Number(data.promotionalPrice);
	// 								const original = Number(data.originalPrice);
	// 								updatedPrice = promo > 0 ? promo : original;
	// 								updatedImage =
	// 									data.productImages?.[0] ?? updatedImage;
	// 							}
	// 						} else {
	// 							// Produto sem variação
	// 							const promo = Number(data.promotionalPrice);
	// 							const original = Number(data.originalPrice);
	// 							updatedPrice = promo > 0 ? promo : original;
	// 							updatedImage =
	// 								data.productImages?.[0] ?? updatedImage;
	// 						}

	// 						if (
	// 							typeof updatedPrice !== "number" ||
	// 							isNaN(updatedPrice) ||
	// 							updatedPrice <= 0
	// 						) {
	// 							throw new Error("❌ Preço final inválido");
	// 						}

	// 						return {
	// 							...item,
	// 							productTitle:
	// 								data.productTitle ?? item.productTitle,
	// 							productPrice: updatedPrice,
	// 							productPriceTotal:
	// 								updatedPrice * item.quantityThisProduct,
	// 							imageProduct: updatedImage,
	// 						};
	// 					} catch (err) {
	// 						console.warn(
	// 							`❗ Erro ao buscar produto ${item.productID}`,
	// 							err
	// 						);
	// 						return item;
	// 					}
	// 				})
	// 			);

	// 			localStorage.setItem("productsInCart", encryptData(updated));
	// 			setProductsInCart(updated);
	// 		};

	// 		updateProducts();
	// 	} catch (err) {
	// 		console.error("Erro ao atualizar carrinho", err);
	// 		setProductsInCart([]);
	// 	}
	// }, []);

	useEffect(() => {
		const savedProductsInCart = localStorage.getItem("productsInCart");

		if (!savedProductsInCart) {
			setProductsInCart([]);
			return;
		}

		try {
			const decryptedString = decryptData(savedProductsInCart);
			if (!decryptedString) {
				setProductsInCart([]);
				return;
			}

			const parsedData = JSON.parse(decryptedString);
			if (!Array.isArray(parsedData)) {
				setProductsInCart([]);
				return;
			}

			const updateProducts = async () => {
				const updated = await Promise.all(
					parsedData.map(async (item: any) => {
						try {
							const res = await api.get(
								`/products/${item.productID}`
							);
							const data = res.data.product;

							let updatedPrice = 0;
							let updatedImage = item.imageProduct;

							if (
								data.productVariations?.length > 0 &&
								item.productVariations?.length > 0
							) {
								const selectedVariation =
									item.productVariations[0];

								const matchedOption =
									data.productVariations[0]?.options.find(
										(opt: any) =>
											opt.name === selectedVariation.name
									);

								if (matchedOption) {
									const promo = Number(
										matchedOption.promotionalPrice
									);
									const original = Number(
										matchedOption.originalPrice
									);

									updatedPrice =
										promo > 0
											? promo
											: original > 0
											? original
											: data.promotionalPrice > 0
											? data.promotionalPrice
											: data.originalPrice;

									updatedImage =
										matchedOption.imageUrl ?? updatedImage;
								} else {
									const promo = Number(data.promotionalPrice);
									const original = Number(data.originalPrice);

									updatedPrice = promo > 0 ? promo : original;
									updatedImage =
										data.productImages?.[0] ?? updatedImage;
								}
							} else {
								const promo = Number(data.promotionalPrice);
								const original = Number(data.originalPrice);

								updatedPrice = promo > 0 ? promo : original;
								updatedImage =
									data.productImages?.[0] ?? updatedImage;
							}

							if (
								typeof updatedPrice !== "number" ||
								isNaN(updatedPrice) ||
								updatedPrice <= 0
							) {
								throw new Error("❌ Preço final inválido");
							}

							return {
								...item,
								productTitle:
									data.productTitle ?? item.productTitle,
								productPrice: updatedPrice,
								productPriceTotal:
									updatedPrice * item.quantityThisProduct,
								imageProduct: updatedImage,
							};
						} catch (err) {
							console.warn(
								`❗ Erro ao buscar produto ${item.productID}`,
								err
							);
							return item;
						}
					})
				);

				localStorage.setItem("productsInCart", encryptData(updated));
				setProductsInCart(updated);
			};

			updateProducts();
		} catch (err) {
			console.error("Erro ao atualizar carrinho", err);
			setProductsInCart([]);
		}
	}, []);

	useEffect(() => {
		// 🚨 Se ainda não carregou os produtos ou já simulou o frete, não executa
		if (
			!Array.isArray(productsInCart) ||
			productsInCart.length === 0 ||
			isFreightSimulated
		)
			return;

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

			// Criptografando o transportadoraInfo antes de salvar
			const encryptedTransportadoraInfo = encryptData(
				defaultTransportadoraData
			);

			// Atualiza o estado com as informações criptografadas
			setTransportadoraInfo((prevInfo) => ({
				...prevInfo,
				...defaultTransportadoraData,
			}));

			// Salva no localStorage
			localStorage.setItem(
				"transportadoraInfo",
				encryptedTransportadoraInfo
			);
		}
	}, [productsInCart]);

	async function handleSimulateShipping(cepDestino, productInfo) {
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

			// 🔥 Criptografando o transportadoraData antes de salvar no localStorage
			const encryptedTransportadoraData = encryptData(transportadoraData);

			// 🔥 Salvando os dados criptografados no localStorage
			try {
				console.log(
					"Salvando dados no localStorage:",
					encryptedTransportadoraData
				);
				localStorage.setItem(
					"transportadoraInfo",
					encryptedTransportadoraData
				);
			} catch (error) {
				console.error("Erro ao salvar no localStorage:", error);
			}
		} catch (error) {
			console.error("Ocorreu um erro:", error);
		}
	}

	const decreaseQuantity = async (productId) => {
		try {
			// Obter os produtos criptografados no localStorage
			const encryptedProducts = localStorage.getItem("productsInCart");

			// Verificar se há produtos no localStorage
			if (!encryptedProducts) {
				toast.error("Nenhum produto no carrinho.");
				return;
			}

			// Descriptografar os produtos corretamente
			let decryptedData = decryptData(encryptedProducts);

			// Garantir que `decryptedData` seja um JSON válido
			let productsInCart;
			try {
				productsInCart = JSON.parse(decryptedData);
			} catch (error) {
				console.error("Erro ao converter JSON:", error);
				toast.error("Erro ao processar produtos do carrinho.");
				return;
			}

			// Verificar se `productsInCart` é um array válido
			if (!Array.isArray(productsInCart)) {
				console.error(
					"Erro: productsInCart não é um array válido!",
					productsInCart
				);
				toast.error("Erro ao processar produtos do carrinho.");
				return;
			}

			// Encontrar o índice do produto usando productId
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

					// Atualizar os dados no armazenamento local (criptografado)
					const encryptedCart = encryptData(productsInCart);
					localStorage.setItem("productsInCart", encryptedCart);

					// Atualizar o estado com os produtos no carrinho
					setProductsInCart([...productsInCart]);

					// Filtrar os produtos para remover aqueles sem CEP
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
							const {
								productID,
								partnerID,
								weight,
								length,
								width,
								height,
								productPrice,
								productPriceTotal,
								quantityThisProduct,
								transportadora,
							} = product;
							const transpID = transportadora?.companyID;

							if (!productInfo[partnerID]) {
								productInfo[partnerID] = {
									weight: weight || 0,
									length: length || 0,
									width: width || 0,
									height: height || 0,
									productPrice: productPrice || 0,
									productPriceTotal: productPriceTotal || 0,
									quantityThisProduct:
										quantityThisProduct || 0,
									transportadora: { companyID: transpID },
									productID,
								};
							} else {
								// Acumular os valores
								productInfo[partnerID].weight += weight;
								productInfo[partnerID].length += length;
								productInfo[partnerID].width += width;
								productInfo[partnerID].height += height;
								productInfo[partnerID].productPrice +=
									productPrice;
								productInfo[partnerID].productPriceTotal +=
									productPriceTotal;
								productInfo[partnerID].quantityThisProduct +=
									quantityThisProduct;
							}

							// Atualizar o cepDestino
							if (
								product.cepDestino &&
								product.cepDestino.trim() !== ""
							) {
								cepDestino = product.cepDestino;
							}
						});

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
					const encryptedCart = encryptData(productsInCart);
					localStorage.setItem("productsInCart", encryptedCart);
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
			// Obter os produtos criptografados no localStorage
			const encryptedProducts = localStorage.getItem("productsInCart");

			console.log("Produtos criptografados:", encryptedProducts);

			// Verificar se há produtos no localStorage
			if (!encryptedProducts) {
				toast.error("Nenhum produto no carrinho.");
				return;
			}

			// Descriptografar os produtos corretamente
			let decryptedData = decryptData(encryptedProducts);

			console.log(
				"Dados descriptografados (antes do parse):",
				decryptedData
			);

			// Garantir que `decryptedData` seja um JSON válido
			let productsInCart;
			try {
				productsInCart = JSON.parse(decryptedData);
			} catch (error) {
				console.error("Erro ao converter JSON:", error);
				toast.error("Erro ao processar produtos do carrinho.");
				return;
			}

			console.log(
				"Dados descriptografados (após o parse):",
				productsInCart
			);

			// Verificar se `productsInCart` é um array válido
			if (!Array.isArray(productsInCart)) {
				console.error(
					"Erro: productsInCart não é um array válido!",
					productsInCart
				);
				toast.error("Erro ao processar produtos do carrinho.");
				return;
			}

			// Encontrar o índice do produto usando productId
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

				// Atualizar os dados no armazenamento local (criptografado)
				const encryptedCart = encryptData(productsInCart);

				console.log(
					"Carrinho criptografado antes de salvar:",
					encryptedCart
				);

				localStorage.setItem("productsInCart", encryptedCart);

				// Atualizar o estado com os produtos no carrinho
				setProductsInCart([...productsInCart]);

				console.log("Quantidade aumentada com sucesso.");

				// Agora recalcular os dados para a simulação do frete
				const filteredProducts = productsInCart.filter(
					(product) =>
						product.cepDestino && product.cepDestino.trim() !== ""
				);

				if (filteredProducts.length > 0) {
					const productInfo = {};
					let cepDestino = null;

					filteredProducts.forEach((product) => {
						const {
							productID,
							partnerID,
							weight,
							length,
							width,
							height,
							productPrice,
							productPriceTotal,
							quantityThisProduct,
							transportadora,
						} = product;
						const transpID = transportadora?.companyID;

						if (!productInfo[partnerID]) {
							productInfo[partnerID] = {
								weight: weight || 0,
								length: length || 0,
								width: width || 0,
								height: height || 0,
								productPrice: productPrice || 0,
								productPriceTotal: productPriceTotal || 0,
								quantityThisProduct: quantityThisProduct || 0,
								transportadora: { companyID: transpID },
								productID,
							};
						} else {
							productInfo[partnerID].weight += weight;
							productInfo[partnerID].length += length;
							productInfo[partnerID].width += width;
							productInfo[partnerID].height += height;
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

					if (cepDestino) {
						handleSimulateShipping(cepDestino, productInfo);
					} else {
						console.error("CepDestino não definido.");
					}
				}
			} else {
				console.error("Produto não encontrado no carrinho.");
				toast.error("Produto não encontrado no carrinho.");
			}
		} catch (error) {
			console.error("Erro ao aumentar quantidade do produto:", error);
			toast.error("Erro ao aumentar quantidade do produto.");
		}
	};

	const handleRemoveFromCart = async (productId, optionId) => {
		try {
			// Obter os produtos criptografados no localStorage
			const encryptedProducts = localStorage.getItem("productsInCart");

			// Verificar se há produtos no localStorage
			if (!encryptedProducts) {
				toast.error("Nenhum produto no carrinho.");
				return;
			}

			// Descriptografar os produtos corretamente
			let decryptedData = decryptData(encryptedProducts);

			// Garantir que `decryptedData` seja um JSON válido
			let productsInCart;
			try {
				productsInCart = JSON.parse(decryptedData);
			} catch (error) {
				console.error("Erro ao converter JSON:", error);
				toast.error("Erro ao processar produtos do carrinho.");
				return;
			}

			// Verificar se `productsInCart` é um array válido
			if (!Array.isArray(productsInCart)) {
				console.error(
					"Erro: productsInCart não é um array válido!",
					productsInCart
				);
				toast.error("Erro ao processar produtos do carrinho.");
				return;
			}

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
					const {
						productID,
						partnerID,
						weight,
						length,
						width,
						height,
						productPrice,
						productPriceTotal,
						quantityThisProduct,
						transportadora,
					} = product;
					const transpID = transportadora?.companyID;

					if (!productInfo[partnerID]) {
						productInfo[partnerID] = {
							weight: weight || 0,
							length: length || 0,
							width: width || 0,
							height: height || 0,
							productPrice: productPrice || 0,
							productPriceTotal: productPriceTotal || 0,
							quantityThisProduct: quantityThisProduct || 0,
							transportadora: { id: transpID },
						};
					} else {
						// Acumular os valores
						productInfo[partnerID].weight += weight;
						productInfo[partnerID].length += length;
						productInfo[partnerID].width += width;
						productInfo[partnerID].height += height;
						productInfo[partnerID].productPrice += productPrice;
						productInfo[partnerID].productPriceTotal +=
							productPriceTotal;
						productInfo[partnerID].quantityThisProduct +=
							quantityThisProduct;
					}

					// Atualizar o cepDestino se o produto tiver um
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

			// Atualizar o localStorage com os produtos criptografados novamente
			const encryptedCart = encryptData(updatedCart);
			localStorage.setItem("productsInCart", encryptedCart);
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

				<div className="flex flex-row justify-between bg-white col-start-2 col-span-4 md:col-start-2 md:col-span-6 rounded-md shadow-md mb-8 p-4">
					<div className="flex flex-col items-center gap-4">
						{transportadoraInfo &&
						Array.isArray(productsInCart) &&
						productsInCart.length > 0 ? (
							Object.entries(
								productsInCart.reduce((acc, product) => {
									if (!acc[product.partnerID]) {
										acc[product.partnerID] = [product];
									} else {
										acc[product.partnerID].push(product);
									}
									return acc;
								}, {})
							).map(([partnerID, partnerProducts]) => (
								<div
									key={partnerID}
									className="flex flex-col border-[1px] border-black border-opacity-20 bg-white rounded-md shadow-md p-2 gap-2 w-full">
									{partnerProducts.map((productInCart) => (
										<div
											key={`${productInCart.productID}-${
												productInCart
													.productVariations?.[0]
													?.optionID || "no-var"
											}`}
											className="flex flex-col gap-4 border-[1px] border-black border-opacity-20 bg-white w-[668px] min-h-[100px] p-4 rounded-md shadow-md">
											<div className="flex flex-row justify-between items-center gap-4">
												<div className="flex flex-row gap-4">
													<div className="flex justify-center border-[1px] border-black border-opacity-20 bg-white w-28 h-28 rounded shadow-md">
														<Image
															className="object-contain h-full"
															src={`http://localhost:5000/images/products/${
																productInCart
																	.productVariations
																	?.length > 0
																	? productInCart
																			.productVariations[0]
																			.imageUrl
																	: productInCart.imageProduct
															}`}
															alt={
																productInCart.productTitle
															}
															width={100}
															height={100}
															unoptimized
														/>
													</div>

													<div>
														<h1 className="text-base text-black max-w-[300px]">
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
																		className="text-black">
																		{
																			variation.name
																		}
																	</h2>
																)
															)
														) : (
															<></>
														)}
														<div className="flex flex-row items-center text-black mt-2 gap-2">
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
																className="text-lg text-center bg-gray-300 w-[60px] h-[32px] rounded"
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
																}
																className="flex items-center justify-center w-[30px] h-[30px] select-none font-mono">
																<h1 className="px-3 py-1 shadow-md shadow-gray-500/50 bg-black text-white rounded cursor-pointer active:scale-[.97]">
																	+
																</h1>
															</button>
														</div>
													</div>
												</div>

												<div className="flex flex-row items-center gap-4">
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
																	?.optionID
															)
														}
														className="text-black hover:text-white flex flex-col items-center justify-center border border-dashed border-slate-900 hover:bg-slate-900 w-10 h-10 transition-all ease-in duration-200 hover:shadow-md active:scale-[.97] rounded cursor-pointer">
														<MdOutlineDeleteOutline
															size={25}
														/>
													</div>
												</div>
											</div>
										</div>
									))}

									{/* Transportadora Info */}
									{Object.entries(transportadoraInfo).map(
										([partnerID, info]) => {
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
															{info.vlrFrete
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
											return null;
										}
									)}
								</div>
							))
						) : (
							<div className="text-black">
								<h1 className="text-center">Carrinho Vazio</h1>
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
