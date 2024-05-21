"use client";

import { useEffect, useState } from "react";

import api from "@/utils/api";

// Stripe
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import { CheckoutForm } from "@/components/CheckoutForm";

function PaymentPage() {
	const [stripePromise, setStripePromise] = useState<Stripe | null>(null);
	const [clientSecret, setClientSecret] = useState("");

	useEffect(() => {
		const fetchStripeConfig = async () => {
			try {
				const response = await api.get("/otakupay/stripe-config");
				const stripe = await loadStripe(response.data.publishableKey);
				setStripePromise(stripe);
			} catch (error) {
				console.error("Failed to load Stripe:", error);
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
				console.error("Failed to load Stripe:", error);
			}
		};

		fetchPaymentIntent();
	}, []);

	return (
		<div className="h-screen">
			<h1 className="text-center my-4">
				NextJS Stripe and the Payment Element
			</h1>
			{stripePromise && clientSecret && (
				<Elements stripe={stripePromise} options={{ clientSecret }}>
					<CheckoutForm />
				</Elements>
			)}
		</div>
	);
}

export default PaymentPage;
