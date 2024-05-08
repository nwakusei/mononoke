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

function YourOrderComp({ productsInfo, shippingInfo }) {
	const { setTransportadoraInfo } = useContext(CheckoutContext);
	const [totalPedido, setTotalPedido] = useState(0);
	const [couponApplied, setCouponApplied] = useState(0);
	const [couponCode, setCouponCode] = useState("");

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
						partnerID: partnerID,
						transpNome: transportadoraCorreta?.transp_nome,
						vlrFrete: transportadoraCorreta?.vlrFrete,
						prazoEnt: transportadoraCorreta?.prazoEnt,
						// Adicione outras informações que você precisar aqui
					};
				}
			}
			// Atualizando o estado com os dados da transportadora
			setTransportadoraInfo(transportadoraData);

			// Armazenando os dados da transportadora no localStorage
			localStorage.setItem(
				"transportadoraInfo",
				JSON.stringify(transportadoraData)
			);

			console.log(transportadoraData);
		} catch (error) {
			console.error("Ocorreu um erro:", error);
		}
	}

	// useEffect(() => {
	// 	const calcularTotalPedido = () => {
	// 		let subtotal = productsInfo.reduce(
	// 			(total, productInCart) =>
	// 				total + productInCart.productPriceTotal,
	// 			0
	// 		);

	// 		let frete = calculateTotalFrete();

	// 		// Calcula o desconto total
	// 		const descontoTotal = productsInfo.reduce(
	// 			(totalDesconto, product) => {
	// 				// Considera apenas produtos que têm desconto aplicado
	// 				if (product.productPriceTotal !== product.productPrice) {
	// 					const desconto =
	// 						product.productPrice * product.quantityThisProduct -
	// 						product.productPriceTotal;
	// 					return totalDesconto + desconto;
	// 				}
	// 				return totalDesconto;
	// 			},
	// 			0
	// 		);

	// 		// Subtrai o desconto do total
	// 		let total = subtotal + frete;
	// 		setTotalPedido(total < 0 ? 0 : total);

	// 		// Define o desconto total aplicado
	// 		setCouponApplied(descontoTotal);
	// 	};

	// 	calcularTotalPedido();
	// }, [productsInfo, shippingInfo]);

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

			// Soma os valores de discountAmount dos coupons no localStorage
			const couponsStorage = JSON.parse(
				localStorage.getItem("coupons") || "[]"
			);
			const totalDiscountAmount = couponsStorage.reduce(
				(total, coupon) => total + coupon.discountAmount,
				0
			);

			// Subtrai o desconto do total
			let total = subtotal + frete - totalDiscountAmount;
			setTotalPedido(total < 0 ? 0 : total);

			// Define o desconto total aplicado
			setCouponApplied(totalDiscountAmount);
		};

		calcularTotalPedido();
	}, [productsInfo, shippingInfo, couponApplied]);

	// Recupera o valor de couponApplied do localStorage ao carregar a página
	useEffect(() => {
		const couponAppliedFromStorage = localStorage.getItem("couponApplied");
		if (couponAppliedFromStorage) {
			setCouponApplied(parseFloat(couponAppliedFromStorage));
		}
	}, []);

	const calculateTotalFrete = () => {
		let totalFrete = 0;

		if (shippingInfo) {
			Object.values(shippingInfo).forEach((info) => {
				totalFrete += info.vlrFrete || 0;
			});
		}

		return totalFrete;
	};

	const aplicarCupom = async () => {
		try {
			const cupomResponse = await api.get("/coupons/allcoupons");
			const coupons = cupomResponse.data.coupons;

			const cupomInfo = coupons.find(
				(coupon) => coupon.couponCode === couponCode
			);

			if (cupomInfo) {
				// Verifica se o cupom já foi aplicado anteriormente
				const couponsStorage = JSON.parse(
					localStorage.getItem("coupons") || "[]"
				);
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

						// Armazena o array atualizado no localStorage
						localStorage.setItem(
							"coupons",
							JSON.stringify(couponsStorage)
						);

						localStorage.setItem(
							"productsInCart",
							JSON.stringify(produtosComPartnerIDCorreto)
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
										{productInCart.productPrice.toLocaleString(
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
												productInCart.productPrice *
													productInCart.quantityThisProduct,
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
								<h2>Desconto do cupom</h2>
								<h2>
									{couponApplied.toLocaleString("pt-BR", {
										style: "currency",
										currency: "BRL",
									})}
								</h2>
							</div>
						</div>
						<div className="divider"></div>
						<div className="">
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
						<div className="flex flex-col w-[260px]">
							<input
								type="text"
								placeholder="Insira o código do Cupom"
								className="input input-bordered w-full mb-2"
								value={couponCode}
								onChange={(e) => setCouponCode(e.target.value)}
							/>
						</div>
						<button
							className="btn btn-primary w-[130px]"
							onClick={aplicarCupom}>
							Aplicar <Coupon size={20} />
						</button>
					</label>
				</div>
			)}
		</>
	);
}

export { YourOrderComp };
