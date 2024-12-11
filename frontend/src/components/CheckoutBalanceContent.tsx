import { useState, useContext } from "react";
import { useRouter } from "next/navigation";

// Icons
import { PaymentMethod } from "@icon-park/react";
import { FaCheck } from "react-icons/fa";

// Context
import { CheckoutContext } from "@/context/CheckoutContext";

// Axios
import api from "@/utils/api";

// Sweet Alert
import Swal from "sweetalert2";

function CheckoutBalanceContent({ products, shippingCost, coupons, token }) {
	const { transportadoraInfo, setSubtotal, setCart } =
		useContext(CheckoutContext);
	const [payLoading, setPayLoading] = useState(false);
	const router = useRouter();

	async function handlePayment() {
		try {
			setPayLoading(true);

			console.log(transportadoraInfo);

			const shippingCost = Object.values(transportadoraInfo).map(
				(info) => ({
					partnerID: info?.partnerID,
					transportadora: info?.transpNome, // Esse dado pode ser excluído aqui, e também no Backend (atualizando ambos ao mesmo tempo)
					vlrFrete: info?.vlrFrete,
					daysShipping: info?.prazoEnt,
				})
			);

			// Recupera os cupons do localStorage
			const coupons = JSON.parse(localStorage.getItem("coupons") || "[]");

			const response = await api.post(
				"/otakupay/buy-otamart",
				{
					products,
					shippingCost,
					coupons,
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
			localStorage.removeItem("selectedVariations");
			localStorage.removeItem("coupons");

			setCart(0);
			setSubtotal(0);
			setPayLoading(false);

			Swal.fire({
				title: "Pagamento Realizado com Sucesso!",
				width: 900,
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
		<div className="border-[1px] border-black border-opacity-20 bg-white rounded-md shadow-md p-4 -mt-12">
			<div className="flex flex-row justify-center items-center w-[650px] bg-primary px-2 py-1 gap-1 rounded shadow-md mb-8">
				<h1 className="select-none">Pague com Saldo em Conta!</h1>
				<PaymentMethod size={17} />
			</div>
			<div className="flex flex-row justify-center items-center gap-4">
				{payLoading ? (
					<button className="flex flex-row justify-center items-center gap-2 bg-green-800 w-[200px] p-3 rounded-lg shadow-md">
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
	);
}

export { CheckoutBalanceContent };
