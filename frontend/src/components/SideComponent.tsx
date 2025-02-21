"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// Contexts
import { Context } from "@/context/UserContext";
import { CheckoutContext } from "@/context/CheckoutContext";

// Skeleton
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Icons
import { ShoppingCartOne, PaymentMethod } from "@icon-park/react";
import { LiaShippingFastSolid } from "react-icons/lia";
import { GrLocation } from "react-icons/gr";
import { FiInfo } from "react-icons/fi";
import { LuCalendarClock } from "react-icons/lu";
import { MdOutlineLocationOff } from "react-icons/md";

// React Hook Form, Zod e ZodResolver
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import CryptoJS from "crypto-js";

// Função para criptografar dados
function encryptData(data) {
	return CryptoJS.AES.encrypt(
		JSON.stringify(data), // Converte o objeto inteiro para string
		"chave-secreta"
	).toString();
}

// Função para descriptografar dados
function decryptData(encryptedData) {
	try {
		if (!encryptedData) {
			console.error("Nenhum dado para descriptografar.");
			return null;
		}

		// Descriptografar os dados
		const bytes = CryptoJS.AES.decrypt(encryptedData, "chave-secreta");
		const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

		if (!decryptedString) {
			console.error(
				"Falha ao descriptografar: String vazia ou inválida."
			);
			return null;
		}

		try {
			return JSON.parse(decryptedString); // Retorna o JSON já convertido
		} catch (parseError) {
			console.error("Erro: A string descriptografada não é JSON válido.");
			return null;
		}
	} catch (error) {
		console.error("Erro ao descriptografar:", error);
		return null;
	}
}

function SideComponent({ selectedVariation }) {
	const { slug } = useParams();
	const [product, setProduct] = useState({});
	const [transportadoras, setTransportadoras] = useState([]);
	const [isCalculating, setIsCalculating] = useState(false);
	const [cepDestino, setCepDestino] = useState("");
	const [selectedTransportadora, setSelectedTransportadora] = useState<{
		[key: string]: boolean;
	}>({});
	const stock = product.stock;

	const { partners } = useContext(Context);
	const { setCart, setSubtotal } = useContext(CheckoutContext);

	const partner = partners.find(
		(partner) => partner._id === product.partnerID
	);

	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState({});

	const [selectedImage, setSelectedImage] = useState(0); // Adicione o estado para a imagem selecionada

	const partnerStateAddress =
		partner && partner.address.length > 0 ? partner.address[0].state : "";

	const customerStateAddress =
		user.address && user.address.length > 0 ? user.address[0].state : "";

	useEffect(() => {
		if (!token) return;

		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((responser) => {
			setUser(responser.data);
		});
	}, [token]);

	useEffect(() => {
		const fetchProduct = async () => {
			if (!slug) return;

			try {
				// Faz o lookup para obter o ID correspondente à slug
				const response = await api.get(`/products/convert/${slug}`);

				const id = response.data.id;

				const responseProduct = await api.get(`/products/${id}`);
				setProduct(responseProduct.data.product);
			} catch (error) {
				console.error("Error fetching product:", error);
			}
		};

		setTimeout(() => {
			fetchProduct();
		}, 2000);
	}, [slug]);

	// // Valor a ser Exibido no Anúncio (Preço Original ou Promocional)
	const value =
		product?.productVariations?.length > 0
			? 0 // Inicializa como 0 se houver variações
			: Number(product.promotionalPrice) > 0
			? Number(product.promotionalPrice)
			: Number(product.originalPrice) || 0; // Usa o preço promocional, original ou fallback para 0

	// const value =
	// 	Number(product.promotionalPrice) > 0
	// 		? Number(product.promotionalPrice)
	// 		: Number(product.originalPrice);

	// Função para selecionar variações

	function handleSelected(
		transportadoraIDSimulacao,
		transportadoraId,
		transportadoraNome,
		transportadoraModalidyName,
		transportadoraLogo,
		transportadoraVlrFrete,
		transportadoraPrazo
	) {
		setSelectedTransportadora((prevState) => {
			const deselectedItems = Object.keys(prevState).reduce(
				(acc, key) => ({
					...acc,
					[key]:
						key === transportadoraIDSimulacao
							? !prevState[key]
							: false,
				}),
				{}
			);
			return {
				...deselectedItems,
				[transportadoraIDSimulacao]:
					!prevState[transportadoraIDSimulacao],
				companyID: transportadoraId,
				companyName: transportadoraNome, // Adiciona o nome da transportadora ao estado
				modalidyName: transportadoraModalidyName,
				companyLogo: transportadoraLogo,
				vlrFrete: transportadoraVlrFrete,
				prazo: transportadoraPrazo,
			};
		});
	}

	// Lidando com a relação entre Quantidade e Subtotal baseado no valor do produto (Preço Original ou Promocional)
	// Etapa 1: Adicionando a variável de estado para a quantidade
	const [quantity, setQuantity] = useState<number>(0);
	const [isQuantityOneOrLess, setIsQuantityOneOrLess] = useState(true);
	const [isQuantityAtLimit, setIsQuantityAtLimit] = useState(false);
	const [totalOrder, setTotalOrder] = useState(value);

	// Função para calculo do Subtotal dos produtos
	const renderPrice = () => {
		// Verifica se existem variações
		if (product?.productVariations?.length > 0) {
			// Se a variação foi selecionada e a variação de preço está disponível
			if (selectedVariation) {
				const price =
					selectedVariation.promotionalPrice > 0
						? selectedVariation.promotionalPrice
						: selectedVariation.originalPrice;

				// Verifica se o preço é válido
				if (price && !isNaN(price) && price >= 0) {
					return price.toLocaleString("pt-BR", {
						style: "currency",
						currency: "BRL",
					});
				} else {
					return ""; // Retorna vazio se o preço da variação não for válido
				}
			}

			// Se não houver variação selecionada, exibe o menor preço entre todas as variações
			const minVariationPrice = Math.min(
				...product.productVariations.flatMap((variation) =>
					variation.options.map((option) => {
						const price =
							option.promotionalPrice > 0
								? option.promotionalPrice
								: option.originalPrice;
						return !isNaN(price) && price >= 0 ? price : Infinity; // Ignorar preços inválidos
					})
				)
			);

			// Exibe o menor preço entre as variações
			if (minVariationPrice !== Infinity) {
				return minVariationPrice.toLocaleString("pt-BR", {
					style: "currency",
					currency: "BRL",
				});
			} else {
				return ""; // Retorna vazio se o preço das variações não for válido
			}
		}

		// Se não houver variações, exibe o preço original ou promocional do produto
		const priceToRender =
			Number(product.promotionalPrice) > 0
				? product.promotionalPrice
				: product?.originalPrice;

		// Verifica se o preço do produto é válido
		if (priceToRender && !isNaN(priceToRender) && priceToRender >= 0) {
			return priceToRender.toLocaleString("pt-BR", {
				style: "currency",
				currency: "BRL",
			});
		} else {
			return ""; // Retorna vazio se o preço não for válido
		}
	};

	// Etapa 2: Funções para lidar com incremento e decremento
	const updateTotalOrder = (newQuantity: number) => {
		setQuantity(newQuantity);

		// Verifica se a quantidade é 1 ou menos
		if (newQuantity < 1) {
			setIsQuantityOneOrLess(true);
		} else {
			setIsQuantityOneOrLess(false);
		}

		// Verifica se a quantidade chegou ao limite de estoque
		const estoque =
			product?.productVariations?.length > 0
				? selectedVariation?.stock // Usando estoque da variação selecionada
				: product?.stock; // Usando estoque do produto principal

		if (newQuantity === estoque) {
			setIsQuantityAtLimit(true);
		} else {
			setIsQuantityAtLimit(false);
		}

		// Verifica o valor a ser usado no cálculo (variação ou produto principal)
		const priceToUse =
			product?.productVariations?.length > 0
				? selectedVariation?.promotionalPrice > 0
					? selectedVariation?.promotionalPrice
					: selectedVariation?.originalPrice
				: product?.promotionalPrice > 0
				? product?.promotionalPrice
				: product?.originalPrice;

		// Multiplicando a nova quantidade pelo valor correto
		setTotalOrder(newQuantity * (priceToUse || 0));
	};

	// Incremento de Quantidade (+1)
	const incrementarQuantidade = () => {
		// Se o produto tem variações, usa o estoque da variação selecionada
		const productStock =
			product?.productVariations?.length > 0
				? selectedVariation?.stock // Se tiver variação selecionada, usa o estoque da variação
				: product?.stock; // Se não, usa o estoque geral do produto

		if (quantity < productStock) {
			updateTotalOrder(quantity + 1);
		}
	};

	// Decremento de Quantidade (-1)
	const decrementarQuantidade = () => {
		if (quantity > 0) {
			updateTotalOrder(quantity - 1);
		}
	};

	function handleAddProductInCart(quantity, product, selectedTransportadora) {
		if (quantity <= 0) {
			toast.info("A quantidade precisa ser maior que 0!");
			return;
		}

		// Recupera e descriptografa selectedVariations
		let selectedVariations = localStorage.getItem("selectedVariations");
		selectedVariations = selectedVariations
			? decryptData(selectedVariations)
			: {};

		const hasVariations = product.productVariations.length > 0;

		if (hasVariations) {
			const isVariationSelected = product.productVariations.every(
				(variation) =>
					selectedVariations && selectedVariations[variation._id]
			);

			if (!isVariationSelected) {
				toast.info(
					"Selecione uma variação antes de adicionar ao carrinho!"
				);
				return;
			}
		}

		const transportadoraSelecionada =
			selectedTransportadora &&
			Object.values(selectedTransportadora).some((value) => value);

		const transpFreeShipping = {
			companyID: 0,
			companyName: "Free Shipping",
			modalidyName: "",
			vlrFrete: 0.0,
			prazo: 3,
		};

		if (
			!transportadoraSelecionada &&
			(product.freeShipping !== true ||
				product.freeShippingRegion !== customerStateAddress)
		) {
			toast.info("Selecione uma opção de frete!");
			return;
		}

		// Recupera os produtos do localStorage e descriptografa
		let productsInCart = localStorage.getItem("productsInCart");

		if (productsInCart) {
			try {
				productsInCart = decryptData(productsInCart);
			} catch (error) {
				console.error(
					"Erro ao processar o carrinho do localStorage:",
					error
				);
				productsInCart = [];
			}
		} else {
			productsInCart = [];
		}

		let productPrice;
		let stock;

		if (hasVariations) {
			const selectedVariationValues = Object.values(selectedVariations);

			if (selectedVariationValues.length > 0) {
				const selectedVariation = selectedVariationValues[0];

				productPrice =
					selectedVariation.promotionalPrice > 0
						? selectedVariation.promotionalPrice
						: selectedVariation.originalPrice;

				stock = selectedVariation.stock;
			} else {
				productPrice =
					product.promotionalPrice > 0
						? product.promotionalPrice
						: product.originalPrice || 0;

				stock = product.stock;
			}
		} else {
			productPrice =
				product.promotionalPrice > 0
					? product.promotionalPrice
					: product.originalPrice || 0;

			stock = product.stock;
		}

		const existingProduct = productsInCart.find(
			(p) =>
				p.productID === product._id &&
				JSON.stringify(p.productVariations) ===
					JSON.stringify(Object.values(selectedVariations))
		);

		if (existingProduct) {
			const totalQuantity =
				existingProduct.quantityThisProduct + quantity;
			existingProduct.quantityThisProduct = Math.min(
				totalQuantity,
				stock
			);

			if (totalQuantity > stock) {
				toast.warning(
					"Você atingiu o limite de estoque para este produto!"
				);
			}

			existingProduct.productPriceTotal =
				existingProduct.quantityThisProduct * productPrice;
		} else {
			const newProduct = {
				partnerID: product.partnerID,
				productID: product._id,
				productTitle: product.productTitle,
				imageProduct: product.imagesProduct[0],
				quantityThisProduct: Math.min(quantity, stock),
				productPrice: productPrice,
				productPriceTotal: Math.min(quantity, stock) * productPrice,
				weight: product.weight,
				length: product.length,
				width: product.width,
				height: product.height,
				cepDestino: cepDestino,
				daysShipping: product.daysShipping,
				freeShipping: product.freeShipping,
				transportadora: transportadoraSelecionada
					? selectedTransportadora
					: transpFreeShipping,
				productVariations:
					Object.values(selectedVariations).length > 0
						? Object.values(selectedVariations)
						: null,
			};

			productsInCart.push(newProduct);
		}

		// Criptografa o carrinho inteiro como uma string única
		try {
			const encryptedCart = encryptData(productsInCart);
			localStorage.setItem("productsInCart", encryptedCart);

			const totalQuantityProducts = productsInCart.reduce(
				(total, product) => total + product.quantityThisProduct,
				0
			);

			setCart(totalQuantityProducts);

			const totalCartValue = productsInCart.reduce(
				(total, product) => total + product.productPriceTotal,
				0
			);

			const subtotal = productsInCart.length > 0 ? totalCartValue : 0;
			setSubtotal(subtotal);
			setTransportadoras([]);
		} catch (error) {
			console.log("Erro ao adicionar o produto ao carrinho!", error);
		}
	}

	// // Requisição De simulação Funciona, porém estou ajustando para evitar redundancia
	// async function handleSimulateShipping(cep: number, quantity: number) {
	// 	if (quantity <= 0) {
	// 		toast.info("A quantidade precisa ser maior que 0!");
	// 		return;
	// 	}

	// 	if (product.productVariations.length > 0 && !selectedVariation) {
	// 		return toast.info("Selecione a variação!");
	// 	} else if (
	// 		product.productVariations.length > 0 &&
	// 		selectedVariation.stock === 0
	// 	) {
	// 		return toast.info("Estoque indisponível para essa variação!");
	// 	}

	// 	setIsCalculating(true);
	// 	setTransportadoras([]); // 🔥 Resetando o estado antes de adicionar novos fretes

	// 	let productPrice;

	// 	if (selectedVariation) {
	// 		const variationPrice =
	// 			selectedVariation.promotionalPrice ||
	// 			selectedVariation.originalPrice;
	// 		productPrice =
	// 			Number(variationPrice) > 0
	// 				? Number(variationPrice)
	// 				: Number(product.promotionalPrice) ||
	// 				  Number(product.originalPrice) ||
	// 				  0;
	// 	} else {
	// 		productPrice =
	// 			Number(product.promotionalPrice) > 0
	// 				? Number(product.promotionalPrice)
	// 				: Number(product.originalPrice) || 0;
	// 	}

	// 	if (productPrice === 0) {
	// 		console.error("Preço do produto inválido:", product);
	// 		return;
	// 	}

	// 	if (!Array.isArray(partner.shippingConfiguration)) {
	// 		console.error("shippingConfiguration não é um array válido.");
	// 		setIsCalculating(false);
	// 		return;
	// 	}

	// 	const melhorEnvioOperators = ["Correios", "Loggi"];

	// 	const melhorEnvioOperator = partner.shippingConfiguration.find(
	// 		(service) => melhorEnvioOperators.includes(service.shippingOperator)
	// 	);
	// 	const modicoOperator = partner.shippingConfiguration.find(
	// 		(service) => service.shippingOperator === "Modico"
	// 	);

	// 	let fretesRecebidos: any[] = [];

	// 	try {
	// 		if (!melhorEnvioOperator) {
	// 			console.error(
	// 				"🚨 Nenhuma configuração de envio encontrada para Melhor Envio!",
	// 				partner.shippingConfiguration
	// 			);
	// 		}

	// 		// 🔹 Simula frete pelo Melhor Envio
	// 		if (melhorEnvioOperator) {
	// 			console.log("Iniciando requisição para MelhorEnvio...");
	// 			try {
	// 				const responseMelhorEnvio = await api.post(
	// 					"/shippings/simulate-melhor-envio",
	// 					{
	// 						productID: product._id,
	// 						cepDestino: cep,
	// 						weight: product.weight,
	// 						height: product.height,
	// 						width: product.width,
	// 						length: product.length,
	// 						productPrice: productPrice,
	// 						quantityThisProduct: quantity,
	// 					}
	// 				);

	// 				fretesRecebidos = [
	// 					...fretesRecebidos,
	// 					...responseMelhorEnvio.data,
	// 				];
	// 			} catch (error) {
	// 				console.error("Erro ao simular com MelhorEnvio:", error);
	// 				toast.warn("Falha ao calcular frete com MelhorEnvio.");
	// 			}
	// 		}

	// 		// 🔹 Simula frete pelo Modico
	// 		if (modicoOperator) {
	// 			console.log("Iniciando requisição para Modico...");
	// 			try {
	// 				const responseModico = await api.post(
	// 					"/shippings/simulate-modico",
	// 					{
	// 						productID: product._id,
	// 						cepDestino: cep,
	// 						weight: product.weight,
	// 						height: product.height,
	// 						width: product.width,
	// 						length: product.length,
	// 						productPrice: productPrice,
	// 						quantityThisProduct: quantity,
	// 					}
	// 				);

	// 				if (responseModico?.data) {
	// 					fretesRecebidos = [
	// 						...fretesRecebidos,
	// 						...responseModico.data,
	// 					];
	// 				} else {
	// 					throw new Error("Resposta inválida do Modico.");
	// 				}
	// 			} catch (error) {
	// 				console.error("Erro ao simular com Modico:", error);
	// 				toast.warn("Falha ao calcular frete com Modico.");
	// 			}
	// 		}

	// 		// 🔥 Atualiza o estado com os fretes disponíveis, ordenados pelo menor preço
	// 		setTransportadoras(
	// 			fretesRecebidos.sort(
	// 				(a, b) => Number(a.price) - Number(b.price)
	// 			)
	// 		);
	// 	} finally {
	// 		setIsCalculating(false);
	// 	}
	// }

	async function handleSimulateShipping(cep: number, quantity: number) {
		if (quantity <= 0) {
			toast.info("A quantidade precisa ser maior que 0!");
			return;
		}

		console.log("🚀 handleSimulateShipping foi chamada!", {
			cep,
			quantity,
		});

		if (product.productVariations.length > 0 && !selectedVariation) {
			return toast.info("Selecione a variação!");
		} else if (
			product.productVariations.length > 0 &&
			selectedVariation.stock === 0
		) {
			return toast.info("Estoque indisponível para essa variação!");
		}

		setIsCalculating(true);
		setTransportadoras([]); // 🔥 Resetando o estado antes de adicionar novos fretes

		let productPrice;

		if (selectedVariation) {
			const variationPrice =
				selectedVariation.promotionalPrice ||
				selectedVariation.originalPrice;
			productPrice =
				Number(variationPrice) > 0
					? Number(variationPrice)
					: Number(product.promotionalPrice) ||
					  Number(product.originalPrice) ||
					  0;
		} else {
			productPrice =
				Number(product.promotionalPrice) > 0
					? Number(product.promotionalPrice)
					: Number(product.originalPrice) || 0;
		}

		if (productPrice === 0) {
			console.error("Preço do produto inválido:", product);
			return;
		}

		setIsCalculating(true);
		setTransportadoras([]); // 🔥 Resetando o estado antes de adicionar novos fretes

		let fretesRecebidos: any[] = [];

		try {
			// 🔹 Simula frete pelo Melhor Envio
			console.log("Iniciando requisição para MelhorEnvio...");
			try {
				const responseMelhorEnvio = await api.post(
					"/shippings/simulate-melhor-envio",
					{
						productID: product._id,
						cepDestino: cep,
						weight: product.weight,
						height: product.height,
						width: product.width,
						length: product.length,
						productPrice: productPrice,
						quantityThisProduct: quantity,
					}
				);

				fretesRecebidos = [
					...fretesRecebidos,
					...responseMelhorEnvio.data,
				];
			} catch (error) {
				console.error("Erro ao simular com MelhorEnvio:", error);
				toast.warn("Falha ao calcular frete com MelhorEnvio.");
			}

			// 🔹 Simula frete pelo Modico apenas se o operador estiver configurado
			if (
				partner.shippingConfiguration.some(
					(service) => service.shippingOperator === "Modico"
				)
			) {
				console.log("Iniciando requisição para Modico...");
				try {
					const responseModico = await api.post(
						"/shippings/simulate-modico",
						{
							productID: product._id,
							cepDestino: cep,
							weight: product.weight,
							height: product.height,
							width: product.width,
							length: product.length,
							productPrice: productPrice,
							quantityThisProduct: quantity,
						}
					);

					if (responseModico?.data) {
						fretesRecebidos = [
							...fretesRecebidos,
							...responseModico.data,
						];
					} else {
						throw new Error("Resposta inválida do Modico.");
					}
				} catch (error) {
					console.error("Erro ao simular com Modico:", error);
					toast.warn("Falha ao calcular frete com Modico.");
				}
			}

			// 🔥 Atualiza o estado com os fretes disponíveis, ordenados pelo menor preço
			setTransportadoras(
				fretesRecebidos.sort(
					(a, b) => Number(a.price) - Number(b.price)
				)
			);
		} finally {
			setIsCalculating(false);
		}
	}

	// Função para lidar com o clique no botão de Calculo de Frete
	const handleButtonClick = () => {
		if (!cepDestino) {
			toast.info("O CEP é obrigatório!");
			return;
		} else if (cepDestino.length !== 8 || !/^\d{8}$/.test(cepDestino)) {
			toast.info("O CEP precisa ter 8 números!");
			return;
		} else {
			handleSimulateShipping(cepDestino, quantity);
		}
	};

	// const handleBuyNow = () => {
	// 	if (!selectedTransportadora && !product.freeShipping) {
	// 		toast.info("Selecione uma opção de frete antes de comprar!");
	// 		return;
	// 	}

	// 	// Redireciona para a página de checkout
	// 	router.push("/checkout/delivery");
	// };

	return (
		<div>
			{/* Componente Lateral D. */}
			<div className="flex flex-col w-[300px]">
				<div className="bg-white border-black border-solid border-[1px] border-opacity-20 rounded-lg shadow-md mb-2 mr-2">
					<div className="px-4 mb-2">
						<h1 className="text-black mb-1">Quantidade</h1>
						<div className="flex flex-row justify-between items-center mb-2">
							<div className="border border-black container w-[131px] rounded-md">
								<div className="flex flex-row justify-between items-center h-[36px] gap-1">
									<button
										className={`flex flex-row items-center ml-1 px-[10px] bg-primary transition-all ease-in duration-100 text-white hover:opacity-70 hover:bg-secondary active:scale-[.97] rounded-md ${
											isQuantityOneOrLess
												? "cursor-not-allowed"
												: "cursor-pointer"
										}`}
										onClick={decrementarQuantidade}>
										<span className="mb-1">-</span>
									</button>
									<input
										className="text-lg text-center text-black bg-gray-300 w-[60px] h-[28px] rounded"
										type="text"
										value={quantity}
										readOnly
									/>
									<button
										className={`flex flex-row items-center mr-1 px-[8px] bg-primary transition-all ease-in duration-100 text-white hover:opacity-70 hover:bg-secondary active:scale-[.97] rounded-md ${
											isQuantityAtLimit
												? "cursor-not-allowed"
												: "cursor-pointer"
										}`}
										onClick={incrementarQuantidade}>
										<span className="mb-1">+</span>
									</button>
								</div>
							</div>
							<div className="text-sm text-black">
								{product &&
									product.productVariations?.length > 0 &&
									`${
										selectedVariation?.stock !== undefined
											? `${selectedVariation.stock} un disponíveis`
											: `∞ un disponíveis`
									}`}

								{product &&
									product.productVariations?.length <= 0 &&
									`${stock} un disponíveis`}
							</div>
						</div>

						{/* <div>
							<h3>Estoque: {selectedVariation}</h3>
						</div> */}

						<div className="flex flex-row justify-between mb-2">
							<div className="font-semibold text-black">
								Subtotal
							</div>
							<div className="font-semibold text-black">
								{quantity === 1
									? renderPrice()
									: totalOrder.toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
									  })}
							</div>
						</div>

						<button
							className="btn btn-outline btn-primary w-full mb-2"
							onClick={() =>
								handleAddProductInCart(
									quantity,
									product,
									selectedTransportadora
								)
							}>
							<ShoppingCartOne size={18} />
							Adicionar ao Carrinho
						</button>
						<button
							className="btn btn-primary w-full mb-2"
							onClick={() =>
								handleAddProductInCart(
									quantity,
									product,
									selectedTransportadora
								)
							}>
							<Link
								className="flex flex-row items-center gap-2"
								href="/checkout/-">
								<PaymentMethod size={18} /> Comprar Agora
							</Link>
						</button>
						{/* Componentes pequenos */}
						{/* <div className="flex flex-row justify-center items-center">
							<div className="flex items-center text-sm hover:bg-slate-300 hover:opacity-20 px-2 py-1 gap-1 rounded cursor-pointer">
								<GrChat size={10} />
								<span>Chat</span>
							</div>
							|
							<div className="text-sm flex flex-row items-center hover:bg-slate-300 hover:opacity-20 px-2 py-1 gap-1 rounded cursor-pointer">
								<BsHeart size={10} />
								<span>Wishlist</span>
							</div>
							|
							<div className="text-sm flex flex-row justify-center items-center hover:bg-slate-300 hover:opacity-20 px-2 py-1 gap-1 rounded cursor-pointer">
								<GoShareAndroid size={13} />
								<span>Share</span>
							</div>
						</div> */}
					</div>
				</div>

				<div className="mr-2">
					{/* Etiqueta de Encomenda */}
					{product.preOrder === true ? (
						<div className="flex flex-row justify-center items-center bg-sky-500 p-2 gap-3 rounded-md shadow-md mb-2">
							<LuCalendarClock size={20} />
							<h1>
								Encomenda (envio em {product.daysShipping} dias)
							</h1>
						</div>
					) : (
						<></>
					)}
				</div>

				{/* Meios de envio/Frete */}
				<div className="bg-white flex flex-col border-black border-solid border-[1px] border-opacity-20 p-2 rounded-md shadow-md mr-2">
					<div>
						{/* <div className="text-black flex flex-row items-center gap-2 mb-2">
							<GrLocation size={18} />
							<span className="text-sm">
								{partner &&
								partner.address &&
								partner.address.length > 0 ? (
									partner.address.map((end) => (
										<div key={end._id}>
											<div>{`Enviado de ${end.city}/${end.state}`}</div>
										</div>
									))
								) : (
									<div>
										<span className="text-black">
											Cidade de origem Indefinida...
										</span>
									</div>
								)}
							</span>
						</div> */}

						{product?.freeShipping === true &&
						product.freeShippingRegion === customerStateAddress ? (
							<div>
								<div className="text-black flex flex-row items-center gap-2 mb-2">
									<GrLocation size={18} />
									<span className="text-sm">
										{partner?.address?.length > 0 ? (
											partner.address.map(
												(end, index) => (
													<div key={index}>
														<div>{`Enviado de ${end.city}/${end.state}`}</div>
													</div>
												)
											)
										) : (
											<div>
												<span className="text-black">
													Cidade de origem
													Indefinida...
												</span>
											</div>
										)}
									</span>
								</div>
								<div className="flex flex-row justify-between items-center gap-2 mb-1">
									<div className="flex flex-row items-center text-black gap-2">
										<LiaShippingFastSolid size={24} />
										<span>Frete Grátis</span>
									</div>
									<div
										className="tooltip cursor-pointer text-black"
										data-tip="A transportadora será escolhida pela loja, de acordo com o melhor custo benefício!">
										<FiInfo
											className="animate-pulse"
											size={18}
										/>
									</div>
								</div>
							</div>
						) : partner?.address?.length === 0 ? (
							<div className="flex flex-row justify-between items-center gap-2 mb-1">
								<div className="flex flex-row items-center text-black gap-2 mt-1">
									<MdOutlineLocationOff size={24} />
									<span>Erro de localização</span>
								</div>
								<div
									className="tooltip cursor-pointer text-black mt-1"
									data-tip="Erro na busca do endereço da Loja. Recarregue a página, e se o erro persistir entre em contato com a loja!">
									<FiInfo
										className="animate-pulse text-red-500"
										size={18}
									/>
								</div>
							</div>
						) : partner ? (
							<div>
								<div className="text-black flex flex-row items-center gap-2 mb-2">
									<GrLocation size={18} />
									<span className="text-sm">
										{partner?.address?.length > 0 ? (
											partner.address.map(
												(end, index) => (
													<div key={index}>
														<div>{`Enviado de ${end.city}/${end.state}`}</div>
													</div>
												)
											)
										) : (
											<div>
												<span className="text-black">
													Cidade de origem
													Indefinida...
												</span>
											</div>
										)}
									</span>
								</div>
								<div>
									<h2 className="flex flex-row items-center text-black gap-2 mb-1">
										<LiaShippingFastSolid size={24} />
										<span>Meios de Envio</span>
									</h2>
									<div className="flex flex-row gap-2 mb-2">
										<input
											type="text"
											placeholder="Seu CEP"
											className="input w-full max-w-[180px]"
											value={cepDestino}
											onChange={(e) => {
												const value =
													e.target.value.replace(
														/\D/g,
														""
													);
												if (value.length <= 8) {
													setCepDestino(value);
												}
											}}
											maxLength={8}
										/>
										<button
											type="button"
											className="btn btn-primary w-[120px]"
											onClick={handleButtonClick}
											disabled={isCalculating}>
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
							</div>
						) : (
							<div className="flex flex-row justify-center items-center gap-2 mb-1">
								<SkeletonTheme
									baseColor="#202020"
									highlightColor="#444">
									<Skeleton
										circle={false}
										height={40}
										width={250}
									/>
								</SkeletonTheme>
							</div>
						)}

						{transportadoras.length > 0 ? (
							transportadoras.map((transportadora) => (
								<div
									key={transportadora.id}
									onClick={() =>
										handleSelected(
											transportadora.id,
											transportadora?.company.id,
											transportadora?.company.name,
											transportadora?.name,
											transportadora?.company.picture,
											transportadora.price || null,
											transportadora.delivery_time
										)
									}
									className={`${
										selectedTransportadora[
											transportadora.id
										]
											? `bg-secondary border-solid text-white shadow-md`
											: "border-dashed"
									} hover:bg-secondary text-black hover:text-white transition-all ease-in duration-150 hover:border-solid border-[1px] border-primary rounded hover:shadow-md cursor-pointer p-2 mb-2`}>
									<div className="flex flex-row justify-between items-center gap-2 mb-1">
										<span>
											{`${transportadora?.company.name} (${transportadora.name})`}
										</span>

										<h2>
											{transportadora.price &&
												parseFloat(
													transportadora.price
												).toLocaleString("pt-BR", {
													style: "currency",
													currency: "BRL",
												})}
										</h2>
									</div>
									<div className="flex flex-row justify-between">
										<span className="text-sm">
											Prazo de entrega
										</span>
										<h2 className="text-sm">
											{`≅ ${
												product.daysShipping +
												transportadora.delivery_time
											} dias`}
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
	);
}

export { SideComponent };
