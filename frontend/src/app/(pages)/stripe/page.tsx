"use client";

import { useState } from "react";
import api from "@/utils/api";
import {
	CardElement,
	Elements,
	useStripe,
	useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
	"pk_test_51NoKxfCpHjNCai65Us34PtzFZVqGvqvOChovzEw8EcC9JO0cGj6n0C2Rxa814cqBacxRhWuNo8QDitE2KpyrMVyS00EbiLs7wk"
);

const PaymentForm = () => {
	const stripe = useStripe();
	const elements = useElements();
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);

		if (!stripe || !elements) {
			// Stripe.js ainda não carregado, aguarde...
			return;
		}

		const { error, paymentMethod } = await stripe.createPaymentMethod({
			type: "card",
			card: elements.getElement(CardElement),
		});

		if (!error) {
			try {
				const response = await api.post("/otakupay/card-otamart", {
					payment_method_id: paymentMethod.id,
				});
				console.log(response.data);
				// Lidar com o sucesso do pagamento
			} catch (error) {
				console.error("Erro ao processar pagamento:", error);
				// Lidar com o erro do pagamento
			}
		}

		setLoading(false);
	};

	return (
		<div className="h-screen">
			<form
				className="flex flex-col items-center"
				onSubmit={handleSubmit}>
				<CardElement className="w-[350px] py-10 p-4 rounded" />
				<button
					className="btn btn-primary mb-8"
					type="submit"
					disabled={!stripe || loading}>
					{loading ? "Processando..." : "Pagar"}
				</button>
			</form>
		</div>
	);
};

const PaymentPage = () => (
	<Elements stripe={stripePromise}>
		<PaymentForm />
	</Elements>
);

export default PaymentPage;
