"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";

import api from "@/utils/api";

// imagens estáticas

// Context
import { CheckoutContext } from "@/context/CheckoutContext";

// Icons
import { ShoppingCartOne } from "@icon-park/react";
import {
	MdOutlineDeleteOutline,
	MdArrowBackIos,
	MdArrowForwardIos,
} from "react-icons/md";
import { GrLocation } from "react-icons/gr";
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

function DeliveryPage() {
	const { transportadoraInfo, setTransportadoraInfo } =
		useContext(CheckoutContext);
	const [productsInCart, setProductsInCart] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState({});

	useEffect(() => {
		api.get("/mononoke/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setUser(response.data);
		});
	}, [token]);

	console.log("PRODUCTS IN CART:", productsInCart);

	const [isFreightSimulated, setIsFreightSimulated] = useState(false);

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

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 min-h-screen">
			<div className="col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-4 mb-8">
				<div className="flex flex-col justify-center mb-4">
					<ul className="flex steps steps-vertical lg:steps-horizontal mt-8 mb-8">
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-primary py-1 px-2 rounded shadow-md">
								<ShoppingCartOne size={18} />
								<p>Carrinho</p>
							</span>
						</li>
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-primary py-1 px-2 rounded shadow-md">
								<LiaShippingFastSolid size={18} />
								<p>Entrega</p>
							</span>
						</li>
						<li className="step">
							<span className="flex flex-row items-center gap-1 bg-black py-1 px-2 rounded shadow-md">
								<BiIdCard size={20} />
								<p>Revisão</p>
							</span>
						</li>
						<li className="step">
							<span className="flex flex-row items-center gap-1 bg-black py-1 px-2 rounded shadow-md">
								<PiCreditCardBold size={20} />
								<p>Pagamento</p>
							</span>
						</li>
					</ul>
				</div>

				<div className="flex flex-row justify-between bg-white col-start-2 col-span-4 md:col-start-2 md:col-span-6 rounded-md shadow-md mb-8 p-4 gap-4">
					<div className="w-full">
						<div className="text-black flex flex-row justify-between gap-4 border-[1px] border-black border-opacity-20 bg-white w-full min-h-[100px] p-4 mb-4 rounded-md shadow-md">
							{user.address && user.address.length > 0 ? (
								user.address.map((end, index) => (
									<div
										key={`address-${end.id || index}`}
										className="flex flex-row gap-4">
										<GrLocation size={25} />
										<div>
											<h1 className="text-base font-semibold mb-2">
												Endereço de Entrega:
											</h1>
											<h1 className="text-base">
												{end.street}
											</h1>
											<h2>{end.complement}</h2>
											<h2>{end.neighborhood}</h2>
											<h2>
												{end.city}/{end.state}
											</h2>
											<h2>{end.postalCode}</h2>
										</div>
									</div>
								))
							) : (
								<div>
									<h1 className="text-base font-semibold mb-2">
										Nenhum endereço disponível
									</h1>
								</div>
							)}
						</div>
						<div className="flex flex-col gap-4">
							{Object.entries(transportadoraInfo).map(
								([key, info]) => (
									<div
										key={`transport-${key}`}
										className="text-black flex flex-row justify-between gap-4 border-[1px] border-black border-opacity-20 bg-white w-full min-h-[100px] p-4 rounded-md shadow-md">
										<div className="flex flex-row gap-4">
											<LiaShippingFastSolid size={25} />
											<div>
												<h1>
													Transportadora:{" "}
													{info.companyName}
												</h1>
												<h2>
													Custo do Frete:{" "}
													{info.vlrFrete.toLocaleString(
														"pt-BR",
														{
															style: "currency",
															currency: "BRL",
														}
													)}
												</h2>
												{productsInCart.length > 0 &&
													productsInCart.map(
														(product, index) => (
															<div
																key={`product-${
																	product.id ||
																	index
																}`}>
																<h2>{`Prazo de Envio: ${product.daysShipping} dias`}</h2>
																<h2>{`Previsão de Entrega: ≅ ${
																	product.daysShipping +
																	info.prazo
																} dias`}</h2>
															</div>
														)
													)}
											</div>
										</div>
									</div>
								)
							)}
						</div>
					</div>

					<div className="flex flex-col">
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
							href="/checkout/cart">
							<MdArrowBackIos size={20} />
							Voltar
						</Link>
					</button>

					<button className="btn btn-primary shadow-md">
						<Link
							className="flex flex-row justify-center items-center gap-2"
							href="/checkout/review">
							Continuar
							<MdArrowForwardIos size={20} />
						</Link>
					</button>
				</div>
			</div>
		</section>
	);
}

export default DeliveryPage;
