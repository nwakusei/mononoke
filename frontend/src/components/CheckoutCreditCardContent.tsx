import { useEffect, useState } from "react";

import api from "@/utils/api";

// Stripe Features
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// Components
import { CheckoutCreditCardForm } from "@/components/CheckoutCreditCardForm";

// Icons
import { PiCreditCardBold } from "react-icons/pi";

function CheckoutCreditCardContent() {
	const [stripePromise, setStripePromise] = useState<Stripe | null>(null);
	const [clientSecret, setClientSecret] = useState("");

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

	return (
		<div className="flex flex-col justify-center items-center">
			<div className="flex flex-row justify-center items-center w-[350px] bg-primary px-2 py-1 mb-4 gap-1 rounded shadow-md">
				<h1 className="select-none">Pague com Cartão de Crédito!</h1>
				<PiCreditCardBold size={18} />
			</div>
			{stripePromise && clientSecret && (
				<Elements stripe={stripePromise} options={{ clientSecret }}>
					<CheckoutCreditCardForm />
				</Elements>
			)}
		</div>
	);
}

export { CheckoutCreditCardContent };
