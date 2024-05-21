import { useState } from "react";

import { useStripe, useElements } from "@stripe/react-stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";
import { StripePaymentElementOptions } from "@stripe/stripe-js";

function CheckoutForm() {
	const stripe = useStripe();
	const elements = useElements();
	const [message, setMessage] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!stripe || !elements) {
			return;
		}

		setIsProcessing(true);

		const { error, paymentIntent } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: `${window.location.origin}/success`,
			},
			redirect: "if_required",
		});

		if (error) {
			setMessage(error.message);
		} else if (paymentIntent && paymentIntent.status === "succeeded") {
			console.log(paymentIntent);
			setMessage("Payment Status: " + paymentIntent.status);
		} else {
			setMessage("Unexpected state");
		}

		setIsProcessing(false);
	};

	return (
		<div className="flex justify-center">
			<form
				className="w-[500px]"
				id="payment-form"
				onSubmit={handleSubmit}>
				<PaymentElement
					options={{
						layout: "tabs",
					}}
				/>
				<button
					className="btn btn-primary w-full mt-4"
					disabled={isProcessing}
					id="submit">
					<span id="button-text">
						{isProcessing ? "Processing..." : "Pay now"}
					</span>
				</button>

				{message && <div id="payment-message">{message}</div>}
			</form>
		</div>
	);
}

export { CheckoutForm };
