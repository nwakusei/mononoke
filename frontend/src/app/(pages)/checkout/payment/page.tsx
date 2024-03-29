"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import Image from "next/image";

// Axios
import api from "@/utils/api";

// imagens estáticas

// Context
import { CheckoutContext } from "@/context/CheckoutContext";

// Icons
import {
	PaymentMethod,
	Coupon,
	IdCardH,
	ShoppingCartOne,
} from "@icon-park/react";
import {
	MdOutlineDeleteOutline,
	MdArrowBackIos,
	MdArrowForwardIos,
	MdOutlineCancel,
	MdOutlinePix,
} from "react-icons/md";
import { GrLocation } from "react-icons/gr";
import { HiOutlineCreditCard } from "react-icons/hi";
import { PiCreditCardBold } from "react-icons/pi";
import { BiIdCard } from "react-icons/Bi";
import { LiaShippingFastSolid } from "react-icons/lia";
import { FiInfo } from "react-icons/fi";
import { CiStickyNote } from "react-icons/ci";
import { PiNoteBold } from "react-icons/pi";
import { RiCopperCoinLine } from "react-icons/ri";
import { IoWalletOutline } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";

// Components
import { YourOrderComp } from "@/components/YourOrderComp";
import { headers } from "next/headers";
import { toast } from "react-toastify";

function PaymentPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const { transportadoraInfo } = useContext(CheckoutContext);

	console.log(transportadoraInfo);

	const [productsInCart, setProductsInCart] = useState([]);
	// const [transportadoraInfo, setTransportadoraInfo] = useState([]);

	console.log(token);
	console.log(transportadoraInfo);

	useEffect(() => {
		const savedProductsInCart = localStorage.getItem("productsInCart");
		if (savedProductsInCart) {
			setProductsInCart(JSON.parse(savedProductsInCart));
		}
	}, []);

	async function handlePayment() {
		try {
			const productsData = productsInCart.map((product) => ({
				productID: product.productID,
				productName: product.productName,
				paymentMethod: "OtakuPay",
				productsCostTotal: product.productPriceTotal,
				shippingCostTotal: 10,
				orderCostTotal: 10,
				itemsList: [],
				productQuantity: 1,
				shippingMethod: "Loggi",
			}));

			console.log(productsData);

			// Selecione apenas o productID do primeiro item no array de productsData
			const productID = productsData[0].productID;
			const productName = productsData[0].productName;
			const paymentMethod = productsData[0].paymentMethod;
			const productsCostTotal = productsData[0].productsCostTotal;
			const shippingCostTotal = productsData[0].shippingCostTotal;
			const orderCostTotal = productsData[0].orderCostTotal;
			const productQuantity = productsData[0].productQuantity;
			const shippingMethod = productsData[0].shippingMethod;

			console.log(productsData);

			const response = await api.post(
				"/otakupay/buy-otamart",
				{
					productID,
					productName,
					paymentMethod,
					productsCostTotal,
					shippingCostTotal,
					orderCostTotal,
					productQuantity,
					shippingMethod,
				}, // Envie apenas o productID na requisição
				{
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				}
			);

			toast.success("Pagamento Realizado com Sucesso!");

			// Tratar a resposta da API conforme necessário
			console.log(response.data);
		} catch (error) {
			toast.error("Erro ao tentar realizar o pagamento!");
			console.log(error);
			// Tratar erros de requisição, se houver
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
								<button className="flex flex-row justify-center items-center gap-2 bg-purple-500 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
									<PaymentMethod size={20} />
									Saldo em Conta
								</button>
								<button className="flex flex-row justify-center items-center gap-2 bg-purple-500 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
									<PiCreditCardBold size={20} />
									Cartão de Crédito
								</button>
								<button className="flex flex-row justify-center items-center gap-2 bg-purple-500 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
									<MdOutlinePix size={20} />
									Pix
								</button>
								{/* <button className="flex flex-row justify-center items-center gap-2 bg-gray-300 w-[200px] p-3 rounded-lg cursor-not-allowed">
									<RiCopperCoinLine size={20} />
									Otaku Point
								</button> */}
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

				<div className="flex flex-row justify-center items-center gap-4">
					<button className="flex flex-row justify-center items-center gap-2 bg-error w-[120px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
						<Link
							className="flex flex-row justify-center items-center gap-2"
							href="/otamart">
							<MdOutlineCancel size={20} />
							Cancelar
						</Link>
					</button>
					<button
						onClick={handlePayment}
						className="flex flex-row justify-center items-center gap-2 bg-green-800 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
						<FaCheck size={18} />
						Finalizar Pedido
					</button>
				</div>
			</div>
		</section>
	);
}

export default PaymentPage;
