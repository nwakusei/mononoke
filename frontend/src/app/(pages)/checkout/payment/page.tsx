"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";

// Axios
import api from "@/utils/api";

// Sweet Alert
import Swal from "sweetalert2";

// imagens estáticas

// Stripe Features
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// Components
import { CheckoutBalanceContent } from "@/components/CheckoutBalanceContent";
import { CheckoutPixContent } from "@/components/CheckoutPixContent";
import { CheckoutCreditCardContent } from "@/components/CheckoutCreditCardContent";
import { CheckoutCreditCardForm } from "@/components/CheckoutCreditCardForm";
import { CheckoutCreditCardParcelContent } from "@/components/CheckoutCreditCardParcelContent";

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
	const [payLoading, setPayLoading] = useState(false);
	const [visiblePaymentContent, setVisiblePaymentContent] = useState(null);
	const [stripePromise, setStripePromise] = useState(null);
	const [clientSecret, setClientSecret] = useState("");

	useEffect(() => {
		const savedProductsInCart = localStorage.getItem("productsInCart");
		if (savedProductsInCart) {
			setProductsInCart(JSON.parse(savedProductsInCart));
		}
	}, []);

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

	const showPixPaymentContent = () => {
		setVisiblePaymentContent("pixContent");
	};

	const showCreditCardContent = () => {
		setVisiblePaymentContent("creditCardContent");
	};

	async function handlePayment() {
		try {
			setPayLoading(true);

			const productsList = productsInCart.map((product) => ({
				productID: product.productID,
				productName: product.productName,
				productImage: product.imageProduct,
				productPrice: product.priceCost,
				productQuantity: product.quantityThisProduct,
				partnerID: product.partnerID,
			}));

			console.log(transportadoraInfo);

			const shippingCost = Object.values(transportadoraInfo).map(
				(info) => ({
					partnerID: info.partnerID,
					vlrFrete: info.vlrFrete,
					daysShipping: info.prazoEnt,
				})
			);

			// Recupera os cupons do localStorage
			const coupons = JSON.parse(localStorage.getItem("coupons") || "[]");

			const response = await api.post(
				"/otakupay/buy-otamart",
				{
					products: productsList,
					shippingCost: shippingCost,
					coupons: coupons,
				},
				{
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				}
			);

			// Limpar o localStorage após o pagamento ser aprovado
			localStorage.removeItem("productsInCart");
			localStorage.removeItem("transportadoraInfo");
			localStorage.removeItem("coupons");

			setCart(0);
			setSubtotal(0);
			setPayLoading(false);

			Swal.fire({
				title: "Pagamento Realizado com Sucesso!",
				width: 700,
				text: "Agora é só aguardar o envio o/",
				icon: "success",
			});

			router.push("/otamart");
		} catch (error: any) {
			console.log(error);
			setPayLoading(false);
			Swal.fire({
				title: error.response.data.message,
				width: 900,
				icon: "error",
			});
			return error.response.data;
		}
	}

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
					</div>

					<div className="flex flex-col">
						<YourOrderComp
							productsInfo={productsInCart}
							shippingInfo={transportadoraInfo}
						/>
					</div>
				</div>

				<div className="flex flex-col justify-center items-center gap-4 mb-8">
					{stripePromise &&
						clientSecret &&
						visiblePaymentContent === "creditCardContent" && (
							<CheckoutCreditCardParcelContent />
						)}
				</div>

				<div className="flex flex-col justify-center items-center gap-4 mb-8">
					{visiblePaymentContent === "balanceContent" && (
						<CheckoutBalanceContent />
					)}
					{visiblePaymentContent === "pixContent" && (
						<CheckoutPixContent />
					)}
				</div>

				<div className="flex flex-row justify-center items-center gap-4">
					{payLoading ? (
						<button className="btn btn-primary">
							<span className="loading loading-spinner loading-sm"></span>
							<span>Processando...</span>
						</button>
					) : (
						<button
							onClick={handlePayment}
							className="flex flex-row justify-center items-center gap-2 bg-green-800 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
							<FaCheck size={18} />
							Finalizar Pedido
						</button>
					)}
				</div>
			</div>
		</section>
	);
}

export default PaymentPage;
