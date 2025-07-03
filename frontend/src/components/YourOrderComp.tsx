"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// Contexts
import { Context } from "@/context/UserContext";
import { CheckoutContext } from "@/context/CheckoutContext";

// Icons
import { FiInfo } from "react-icons/fi";
import { Coupon } from "@icon-park/react";

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

function YourOrderComp({ productsInfo, shippingInfo }) {
	const { setTransportadoraInfo } = useContext(CheckoutContext);
	const [productsInCart, setProductsInCart] = useState([]);
	const [totalPedido, setTotalPedido] = useState(0);
	const [couponApplied, setCouponApplied] = useState(0);
	const [couponCode, setCouponCode] = useState("");

	const [isFreightSimulated, setIsFreightSimulated] = useState(false);

	useEffect(() => {
		const savedProductsInCart = localStorage.getItem("productsInCart");

		if (savedProductsInCart) {
			try {
				// Descriptografa a string antes de tentar parsear
				const decryptedString = decryptData(savedProductsInCart);

				if (decryptedString) {
					// Teste se a string já é JSON ou precisa ser convertida
					try {
						const parsedData = JSON.parse(decryptedString);

						setProductsInCart(parsedData);
					} catch (parseError) {
						console.error(
							"Erro ao tentar fazer JSON.parse:",
							parseError
						);
						console.error(
							"String que causou erro:",
							decryptedString
						);
					}
				} else {
					console.error(
						"Erro ao descriptografar os produtos. Retorno vazio ou inválido."
					);
				}
			} catch (error) {
				console.error(
					"Erro ao processar os produtos do carrinho:",
					error
				);
			}
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

	useEffect(() => {
		const calcularTotalPedido = () => {
			let subtotal = productsInfo.reduce(
				(total, productInCart) =>
					total + productInCart.productPriceTotal,
				0
			);

			let frete = calculateTotalFrete();

			// Calcula o desconto total
			const descontoTotal = productsInfo.reduce(
				(totalDesconto, product) => {
					// Considera apenas produtos que têm desconto aplicado
					if (product.productPriceTotal !== product.productPrice) {
						const desconto =
							product.productPrice * product.quantityThisProduct -
							product.productPriceTotal;
						return totalDesconto + desconto;
					}
					return totalDesconto;
				},
				0
			);

			// Subtrai o desconto do total
			let total = subtotal + frete;
			setTotalPedido(total < 0 ? 0 : total);

			// Define o desconto total aplicado
			setCouponApplied(descontoTotal);
		};

		calcularTotalPedido();
	}, [productsInfo, shippingInfo]);

	useEffect(() => {
		const calcularTotalPedido = () => {
			let subtotal = productsInfo.reduce(
				(total, productInCart) =>
					total +
					productInCart.productPrice *
						productInCart.quantityThisProduct, // Corrigido para "quantityThisProduct"
				0
			);

			let frete = calculateTotalFrete();

			// Calcula o desconto total
			const descontoTotal = productsInfo.reduce(
				(totalDesconto, product) => {
					// Considera apenas produtos que têm desconto aplicado
					if (product.productPriceTotal !== product.productPrice) {
						const desconto =
							product.productPrice * product.quantityThisProduct -
							product.productPriceTotal;
						return totalDesconto + desconto;
					}
					return totalDesconto;
				},
				0
			);

			// Recupera e descriptografa os cupons do localStorage
			const couponsStorageEncrypted = localStorage.getItem("coupons");
			const decryptedCouponsStorage = couponsStorageEncrypted
				? decryptData(couponsStorageEncrypted)
				: "[]"; // Retorna uma string vazia se não houver cupons

			// Certifique-se de que decryptedCouponsStorage é uma string JSON válida ou um array
			let couponsStorage = [];

			// Se o valor descriptografado for uma string JSON válida, faz o parsing
			try {
				if (typeof decryptedCouponsStorage === "string") {
					couponsStorage = JSON.parse(decryptedCouponsStorage);
				} else {
					couponsStorage = decryptedCouponsStorage; // Caso seja um objeto, já pode ser usado
				}
			} catch (error) {
				console.error("Erro ao parsear os cupons:", error);
			}

			// Certifique-se de que couponsStorage é um array antes de aplicar o .reduce
			if (Array.isArray(couponsStorage)) {
				// Soma os valores de discountAmount dos coupons
				const totalDiscountAmount = couponsStorage.reduce(
					(total, coupon) => total + coupon.discountAmount,
					0
				);

				// Subtrai o desconto do total
				let total = subtotal + frete - totalDiscountAmount;
				setTotalPedido(total < 0 ? 0 : total);

				// Define o desconto total aplicado
				setCouponApplied(totalDiscountAmount);

				// Criptografa e armazena os cupons novamente no localStorage
				const encryptedCoupons = encryptData(couponsStorage);
				localStorage.setItem("coupons", encryptedCoupons);
			} else {
				console.warn("Os cupons não estão no formato esperado");
			}
		};

		calcularTotalPedido();
	}, [productsInfo, shippingInfo, couponApplied]);

	// Calcular o total do frete
	const calculateTotalFrete = () => {
		let totalFrete = 0;

		if (shippingInfo) {
			Object.values(shippingInfo).forEach((info) => {
				totalFrete += info.vlrFrete || 0;
			});
		}

		return totalFrete;
	};

	// Recupera o valor de couponApplied do localStorage ao carregar a página
	useEffect(() => {
		const couponAppliedFromStorage = localStorage.getItem("couponApplied");
		if (couponAppliedFromStorage) {
			setCouponApplied(parseFloat(couponAppliedFromStorage));
		} else {
			setCouponApplied(0); // Caso não exista, define como 0
		}
	}, []);

	const aplicarCupom = async () => {
		try {
			const cupomResponse = await api.get("/coupons/allcoupons");
			const coupons = cupomResponse.data.coupons;

			const cupomInfo = coupons.find(
				(coupon) => coupon.couponCode === couponCode
			);

			if (cupomInfo) {
				// Recupera os cupons do localStorage, se existirem
				const couponsStorageEncrypted = localStorage.getItem("coupons");

				let couponsStorage = [];

				if (couponsStorageEncrypted) {
					const decryptedCouponsStorage = decryptData(
						couponsStorageEncrypted
					);
					if (Array.isArray(decryptedCouponsStorage)) {
						couponsStorage = decryptedCouponsStorage;
					} else {
						console.warn("Formato de cupons inesperado");
					}
				}

				// Verifica se o cupom já foi aplicado anteriormente
				const cupomJaAplicado = couponsStorage.some(
					(coupon) =>
						coupon.partnerID === cupomInfo.partnerID &&
						coupon.couponCode === cupomInfo.couponCode
				);

				if (!cupomJaAplicado) {
					// Verifica se o cupom é aplicável ao parceiro do produto
					const isCouponApplicable = productsInfo.some(
						(product) => product.partnerID === cupomInfo.partnerID
					);

					if (isCouponApplicable) {
						const produtosComPartnerIDCorreto = productsInfo.map(
							(product) => {
								if (product.partnerID === cupomInfo.partnerID) {
									const descontoPercentual =
										cupomInfo.discountPercentage / 100;
									const desconto =
										product.productPriceTotal *
										descontoPercentual;
									product.productPriceTotal -= desconto;
									return product;
								}
								return product;
							}
						);

						// Calcula o desconto total para o partnerID correspondente
						const descontoTotal =
							produtosComPartnerIDCorreto.reduce(
								(totalDesconto, product) => {
									if (
										product.partnerID ===
										cupomInfo.partnerID
									) {
										const desconto =
											product.productPrice *
												product.quantityThisProduct -
											product.productPriceTotal;
										return totalDesconto + desconto;
									}
									return totalDesconto;
								},
								0
							);

						// Armazena as informações do cupom no localStorage
						const cupomLocalStorage = {
							partnerID: cupomInfo.partnerID,
							couponCode: cupomInfo.couponCode,
							discountAmount: descontoTotal, // Adiciona o desconto total
						};

						// Adiciona o novo cupom ao array
						couponsStorage.push(cupomLocalStorage);

						// Criptografa e armazena o array atualizado no localStorage
						const encryptedCoupons = encryptData(couponsStorage);
						localStorage.setItem("coupons", encryptedCoupons);

						// Criptografa os produtos e armazena no localStorage
						const encryptedProductsInCart = encryptData(
							produtosComPartnerIDCorreto
						);
						localStorage.setItem(
							"productsInCart",
							encryptedProductsInCart
						);

						setCouponApplied(descontoTotal); // Define o desconto total aplicado

						toast.success("Cupom aplicado com sucesso!");
					} else {
						toast.error(
							"Este cupom não é aplicável aos produtos no seu carrinho."
						);
					}
				} else {
					toast.warn("Este cupom já foi aplicado anteriormente.");
				}
			} else {
				toast.error("Cupom inválido!");
			}
		} catch (error) {
			toast.error(
				"Erro ao aplicar cupom. Por favor, tente novamente mais tarde."
			);
		}
	};

	return (
		<>
			{productsInfo.length > 0 && (
				<div>
					<div className="text-black flex flex-col w-[400px] min-h-[250px] border-[1px] border-black border-opacity-20 bg-white p-4 rounded-md shadow-md">
						<div>
							<h1 className="text-lg font-semibold mb-6">
								Seu Pedido
							</h1>
							{Array.isArray(productsInfo) &&
								productsInfo.map((productInCart, index) => (
									<div
										key={productInCart.productID || index} // Usando productID ou índice como fallback
										className="flex justify-between mb-2">
										<h2>
											{productInCart.quantityThisProduct}{" "}
											x {productInCart.productTitle}{" "}
											{productInCart.productVariations
												?.length > 0 &&
												productInCart.productVariations.map(
													(variation) => (
														<h2
															key={
																variation.variationID
															}
															className="text-black text-sm">
															{variation.name}
														</h2>
													)
												)}
										</h2>
										<h2>
											{productInCart.productPrice
												? productInCart.productPrice.toLocaleString(
														"pt-BR",
														{
															style: "currency",
															currency: "BRL",
														}
												  )
												: "Preço indisponível"}
										</h2>
									</div>
								))}
						</div>

						<div className="divider before:bg-black after:bg-black before:border-t-[1px] after:border-t-[1px]"></div>

						<div>
							<div className="flex justify-between mb-1">
								<h2 className="flex items-center justify-center gap-1">
									Subtotal
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
									{Array.isArray(productsInfo) &&
									productsInfo.length > 0 ? (
										productsInfo
											.reduce((total, productInCart) => {
												return (
													total +
													productInCart.productPrice *
														productInCart.quantityThisProduct
												);
											}, 0)
											.toLocaleString("pt-BR", {
												style: "currency",
												currency: "BRL",
											})
									) : (
										<span>Preço indisponível</span> // Exibe uma mensagem se productsInfo não for um array ou estiver vazio
									)}
								</h2>
							</div>
							<div className="flex justify-between mb-1">
								<h2>Frete</h2>
								<div>
									<h2>
										{calculateTotalFrete().toLocaleString(
											"pt-BR",
											{
												style: "currency",
												currency: "BRL",
											}
										)}
									</h2>
								</div>
							</div>
							<div className="flex justify-between mb-1">
								<h2>Desconto aplicado</h2>
								<h2>
									{couponApplied
										? `- ${couponApplied.toLocaleString(
												"pt-BR",
												{
													style: "currency",
													currency: "BRL",
												}
										  )}`
										: `R$ 0,00`}
								</h2>
							</div>
						</div>

						<div className="divider before:bg-black after:bg-black before:border-t-[1px] after:border-t-[1px]"></div>

						<div>
							<div className="flex justify-between mb-2">
								<h2 className="font-semibold">
									Total do Pedido
								</h2>
								<h2>
									{totalPedido.toLocaleString("pt-BR", {
										style: "currency",
										currency: "BRL",
									})}
								</h2>
							</div>
						</div>
					</div>

					<label className="flex flex-row w-[400px] gap-2">
						{couponApplied ? (
							<></>
						) : (
							<div className="flex flex-row gap-2 mt-4">
								<div className="w-[262px] ">
									<input
										className="input input-bordered input-primary w-full bg-slate-200 text-slate-900"
										type="text"
										placeholder="Insira o código do Cupom"
										value={couponCode}
										onChange={(e) =>
											setCouponCode(e.target.value)
										}
									/>
								</div>
								<button
									className="btn btn-primary w-[130px] shadow-md"
									onClick={aplicarCupom}>
									Aplicar <Coupon size={20} />
								</button>
							</div>
						)}
					</label>
				</div>
			)}
		</>
	);
}

export { YourOrderComp };
