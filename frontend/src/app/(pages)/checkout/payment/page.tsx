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
	const { transportadoraInfo, setSubtotal, setCart } =
		useContext(CheckoutContext);
	const [productsInCart, setProductsInCart] = useState([]);
	const router = useRouter();
	const [visiblePaymentContent, setVisiblePaymentContent] = useState(null);
	const [stripePromise, setStripePromise] = useState(null);
	const [clientSecret, setClientSecret] = useState("");

	const [totalPedido, setTotalPedido] = useState(0);
	const [couponApplied, setCouponApplied] = useState(0);

	// constante para teste PIX
	const totalPedido2 = 0.01;

	const productsList = productsInCart.map((product) => ({
		productID: product.productID,
		productName: product.productName,
		productImage: product.imageProduct,
		productPrice: product.productPrice,
		productQuantity: product.quantityThisProduct,
		partnerID: product.partnerID,
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

	console.log(pixCode);

	useEffect(() => {
		const savedProductsInCart = localStorage.getItem("productsInCart");
		if (savedProductsInCart) {
			setProductsInCart(JSON.parse(savedProductsInCart));
		}
	}, []);

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

	useEffect(() => {
		const fetchStripeConfig = async () => {
			try {
				const response = await api.get("/otakupay/send-public-key");
				const publishableKeyStripe = await loadStripe(
					response.data.publishableKey
				);
				setStripePromise(publishableKeyStripe);
			} catch (error) {
				console.log(error);
			}
		};
		fetchStripeConfig();
	}, []);

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
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 min-h-screen mx-4">
			<div className="bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-4">
				<div className="flex flex-col justify-center mb-8">
					<ul className="flex steps steps-vertical lg:steps-horizontal mt-8 mb-8">
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
								<p>Carrinho</p> <ShoppingCartOne size={18} />
							</span>
						</li>
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
								<p>Entrega</p>
								<LiaShippingFastSolid size={18} />
							</span>
						</li>
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
								<p>Revisão</p> <BiIdCard size={20} />
							</span>
						</li>
						<li className="step step-primary">
							<span className="flex flex-row items-center gap-1 bg-purple-500 py-1 px-2 rounded">
								<p>Pagamento</p>
								<PiCreditCardBold size={20} />
							</span>
						</li>
					</ul>
				</div>
				<div className="flex flex-row justify-center gap-6 bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-8">
					<div className="flex flex-col items-center">
						<div className="flex flex-row justify-between gap-4 bg-purple-500 w-[650px] min-h-[60px] p-4 rounded-md shadow mb-4">
							<div className="flex flex-row gap-4">
								<IoWalletOutline size={25} />
								<div>
									<h1 className="text-lg">OtakuPay</h1>
								</div>
							</div>
						</div>

						<div className="flex flex-col justify-between gap-4 bg-gray-500 w-[650px] min-h-[100px] p-4 rounded-md mb-4">
							<div className="flex flex-row gap-4">
								<div>
									<h1 className="text-lg">
										Escolha a forma de pagamento
									</h1>
								</div>
							</div>
							<div className="flex flex-row items-center gap-4">
								<button
									onClick={showBalancePaymentContent}
									className="flex flex-row justify-center items-center gap-2 bg-purple-500 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
									<PaymentMethod size={20} />
									Saldo em Conta
								</button>
								<button
									onClick={showCreditCardContent}
									className="flex flex-row justify-center items-center gap-2 bg-purple-500 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
									<PiCreditCardBold size={20} />
									Cartão de Crédito
								</button>
								<button
									onClick={showPixPaymentContent}
									className="flex flex-row justify-center items-center gap-2 bg-purple-500 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
									<MdOutlinePix size={20} />
									Pix
								</button>
							</div>
						</div>
						<div className="flex flex-col justify-between gap-4 w-[650px] min-h-[100px] p-4 mb-4">
							<div className="flex flex-col justify-center items-center gap-4 mb-8">
								{stripePromise &&
									clientSecret &&
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
