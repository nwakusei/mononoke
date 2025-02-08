"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";

import QRCode from "qrcode"; // Importe a biblioteca QRCode

// Axios
import api from "@/utils/api";

// Sweet Alert
import Swal from "sweetalert2";
import { toast } from "react-toastify";

// imagens estáticas

// Stripe Features
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// Components
import { CheckoutBalanceContent } from "@/components/CheckoutBalanceContent";
import { CheckoutPixContent } from "@/components/CheckoutPixContent";
import { CheckoutCreditCardContent } from "@/components/CheckoutCreditCardContent";
import { CheckoutCreditCardForm } from "@/components/CheckoutCreditCardForm";
import { CheckoutCreditCardInstallmentsContent } from "@/components/CheckoutCreditCardInstallmentsContent";

// Context
import { CheckoutContext } from "@/context/CheckoutContext";

// Icons
import { PaymentMethod, ShoppingCartOne } from "@icon-park/react";
import { MdOutlinePix } from "react-icons/md";
import { PiCreditCardBold } from "react-icons/pi";
import { BiIdCard } from "react-icons/Bi";
import { LiaShippingFastSolid } from "react-icons/lia";
import { IoWalletOutline } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";

// Components
import { YourOrderComp } from "@/components/YourOrderComp";

function PaymentPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const { transportadoraInfo, setSubtotal, setCart, setTransportadoraInfo } =
		useContext(CheckoutContext);
	const [productsInCart, setProductsInCart] = useState([]);
	const router = useRouter();
	const [visiblePaymentContent, setVisiblePaymentContent] = useState(null);
	// const [stripePromise, setStripePromise] = useState(null);
	const [clientSecret, setClientSecret] = useState("");

	const [totalPedido, setTotalPedido] = useState(0);
	const [couponApplied, setCouponApplied] = useState(0);

	const [isFreightSimulated, setIsFreightSimulated] = useState(false);

	// constante para teste PIX
	const totalPedido2 = 0.01;

	const productsList = productsInCart.map((product) => ({
		productID: product.productID,
		productTitle: product.productTitle,
		productImage: product.imageProduct,
		productPrice: product.productPrice,
		productQuantity: product.quantityThisProduct,
		partnerID: product.partnerID,
		productVariations: product.productVariations,
	}));

	const shippingCost = Object.values(transportadoraInfo).map((info) => ({
		partnerID: info.partnerID,
		vlrFrete: info.vlrFrete,
		daysShipping: info.prazoEnt,
	}));
	const coupons = JSON.parse(localStorage.getItem("coupons") || "[]");

	const [pix, setPix] = useState({});
	const [qrCodeUrl, setQrCodeUrl] = useState(""); // Estado para armazenar a URL do QR Code
	const [pixCode, setPixCode] = useState(""); // Estado para armazenar o código do Pix copia e cola
	const [txid, setTxid] = useState("");

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

	// Calculo do total do Pedido
	useEffect(() => {
		const calcularTotalPedido = () => {
			if (!productsInCart || productsInCart.length === 0) {
				setTotalPedido(0);
				return;
			}

			// Calcula o subtotal dos produtos no carrinho
			let subtotal = productsInCart.reduce((total, product) => {
				const productPrice = parseFloat(product.productPrice) || 0;
				const productQuantity =
					parseInt(product.quantityThisProduct, 10) || 0;
				return total + productPrice * productQuantity;
			}, 0);

			// Calcula o total do frete
			let frete = Object.values(transportadoraInfo).reduce(
				(total, info) => {
					return total + (parseFloat(info.vlrFrete) || 0);
				},
				0
			);

			// Calcula o desconto total aplicado aos produtos
			const descontoTotalProdutos = productsInCart.reduce(
				(totalDesconto, product) => {
					const productPrice = parseFloat(product.productPrice) || 0;
					const productPriceTotal =
						parseFloat(product.productPriceTotal) || 0;
					const productQuantity =
						parseInt(product.quantityThisProduct, 10) || 0;
					if (productPriceTotal !== productPrice) {
						const desconto =
							productPrice * productQuantity - productPriceTotal;
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
				(total, coupon) => {
					return total + (parseFloat(coupon.discountAmount) || 0);
				},
				0
			);

			// Subtrai o desconto do total
			let total = subtotal + frete - totalDiscountAmount;
			setTotalPedido(total < 0 ? 0 : total);

			// Define o desconto total aplicado
			setCouponApplied(totalDiscountAmount);
		};

		calcularTotalPedido();
	}, [productsInCart, transportadoraInfo]);

	// useEffect(() => {
	// 	const fetchStripeConfig = async () => {
	// 		try {
	// 			const response = await api.get("/otakupay/send-public-key");
	// 			const publishableKeyStripe = await loadStripe(
	// 				response.data.publishableKey
	// 			);
	// 			setStripePromise(publishableKeyStripe);
	// 		} catch (error) {
	// 			console.log(error);
	// 		}
	// 	};
	// 	fetchStripeConfig();
	// }, []);

	useEffect(() => {
		const fetchPaymentIntent = async () => {
			try {
				const response = await api.post(
					"/otakupay/create-payment-intent"
				);
				const clientSecret = response.data.clientSecret;
				setClientSecret(clientSecret);
			} catch (error) {
				console.log(error);
			}
		};
		fetchPaymentIntent();
	}, []);

	const showBalancePaymentContent = () => {
		setVisiblePaymentContent("balanceContent");
	};

	const showPixPaymentContent = async () => {
		setVisiblePaymentContent("pixContent");

		await handleQRCode(totalPedido2);
	};

	const showCreditCardContent = () => {
		setVisiblePaymentContent("creditCardContent");
	};

	async function handleQRCode(totalPedido) {
		let originalValue = totalPedido;

		// // Verificar se a entrada contém uma vírgula e substituí-la por um ponto
		// if (originalValue.includes(",")) {
		// 	originalValue = originalValue.replace(",", ".");
		// }

		try {
			// setBtnLoading(true);
			const response = await api.post(
				"/otakupay/create-payment-pix-otakupay",
				{ originalValue },
				{
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
						"Content-Type": "application/json",
					},
				}
			);

			console.log(response.data.newPaymentPixOtakuPay.status);

			console.log(response.data.newPaymentPixOtakuPay.txid);

			setTxid(response.data.newPaymentPixOtakuPay.txid);

			if (response.data && response.data.newPaymentPixOtakuPay) {
				setPix(response.data.newPaymentPixOtakuPay);
				setPixCode(response.data.newPaymentPixOtakuPay.pixCopiaECola);

				// Gerar o QR Code
				QRCode.toDataURL(
					response.data.newPaymentPixOtakuPay.pixCopiaECola,
					(err, url) => {
						if (err) {
							console.error(err);
							return;
						}
						// Atualizar o estado com a URL do QR Code
						setQrCodeUrl(url);
					}
				);
				// setBtnLoading(false);
			}
		} catch (error: any) {
			// setBtnLoading(false);
			toast.error(error.response.data.message);
			console.log(error.response.data);
		}
	}

	// Função para copiar o código do Pix copia e cola para a área de transferência
	const copyPixCode = () => {
		navigator.clipboard.writeText(pixCode);
		toast.success("Código Pix copiado para a área de transferência!");
	};

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 min-h-screen">
			<div className="col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-4">
				<div className="flex flex-col justify-center mb-4">
					<ul className="flex steps steps-vertical lg:steps-horizontal mt-8 mb-8">
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-primary py-1 px-2 rounded">
								<p>Carrinho</p> <ShoppingCartOne size={18} />
							</span>
						</li>
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-primary py-1 px-2 rounded">
								<p>Entrega</p>
								<LiaShippingFastSolid size={18} />
							</span>
						</li>
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-primary py-1 px-2 rounded">
								<p>Revisão</p> <BiIdCard size={20} />
							</span>
						</li>
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-primary py-1 px-2 rounded">
								<p>Pagamento</p>
								<PiCreditCardBold size={20} />
							</span>
						</li>
					</ul>
				</div>

				<div className="flex flex-row justify-between bg-white col-start-2 col-span-4 md:col-start-2 md:col-span-6 rounded-md shadow-md mb-8 p-4">
					<div className="flex flex-col items-center">
						<div className="flex flex-row justify-between gap-4 bg-primary w-full min-h-[60px] p-4 mb-4 rounded-md shadow-md select-none">
							<div className="flex flex-row gap-4">
								<IoWalletOutline size={25} />
								<div>
									<h1 className="text-lg">OtakuPay</h1>
								</div>
							</div>
						</div>

						<div className="flex flex-col justify-between gap-4 border-[1px] border-black border-opacity-20 bg-white w-[690px] min-h-[100px] p-4 rounded-md shadow-md">
							<div className="flex flex-row gap-4 text-black">
								<div>
									<h1 className="text-lg">
										Escolha a forma de pagamento
									</h1>
								</div>
							</div>
							<div className="flex flex-row items-center gap-4">
								<button
									onClick={showBalancePaymentContent}
									className="flex flex-row justify-center items-center gap-2 bg-primary hover:bg-secondary w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96] select-none">
									<PaymentMethod size={20} />
									Saldo em Conta
								</button>
								<button
									onClick={showCreditCardContent}
									className="flex flex-row justify-center items-center gap-2 bg-primary hover:bg-secondary w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96] select-none">
									<PiCreditCardBold size={20} />
									Cartão de Crédito
								</button>
								<button
									onClick={showPixPaymentContent}
									className="flex flex-row justify-center items-center gap-2 bg-primary hover:bg-secondary w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96] select-none">
									<MdOutlinePix size={20} />
									Pix
								</button>
							</div>
						</div>
						<div className="flex flex-col justify-between gap-4 w-[650px] min-h-[100px] p-4 mb-4">
							<div className="flex flex-col justify-center items-center gap-4 mb-8">
								{clientSecret &&
									visiblePaymentContent ===
										"creditCardContent" && (
										<CheckoutCreditCardInstallmentsContent
											orderTotalCost={Number(
												totalPedido.toFixed(2)
											)}
											products={productsList}
											shippingCost={shippingCost}
											coupons={coupons}
										/>
									)}
							</div>

							<div className="flex flex-col justify-center items-center gap-4 mb-8">
								{visiblePaymentContent === "balanceContent" && (
									<CheckoutBalanceContent
										products={productsList}
										shippingCost={shippingCost}
										coupons={coupons}
										token={token}
									/>
								)}
								{visiblePaymentContent === "pixContent" && (
									<CheckoutPixContent
										qrCodeUrl={qrCodeUrl}
										copyPixCode={copyPixCode}
										pixCode={pixCode}
										txid={txid}
										token={token}
										products={productsList}
										shippingCost={shippingCost}
										coupons={coupons}
									/>
								)}
							</div>
						</div>
					</div>

					<div className="flex flex-col">
						<YourOrderComp
							productsInfo={productsInCart}
							shippingInfo={transportadoraInfo}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}

export default PaymentPage;
