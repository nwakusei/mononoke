import { useState } from "react";

// Stripe Features
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";

import { toast } from "react-toastify";

function CheckoutCreditCardForm() {
	const stripe = useStripe();
	const elements = useElements();
	const [message, setMessage] = useState<string | null>(null);
	const [processing, setProcessing] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();

		if (!stripe || !elements) {
			return;
		}

		setProcessing(true);

		const { error, paymentIntent } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: `${window.location.origin}/`,
			},
			redirect: "if_required",
		});

		if (error) {
			toast.error(error.message);
			setMessage(error.message);
		} else if (paymentIntent && paymentIntent.status === "succeeded") {
			console.log(paymentIntent);
			setMessage("Payment Status: " + paymentIntent.status);
		} else {
			setMessage("Unexpected state");
		}

		setProcessing(false);
	}

	return (
		<div>
			<form className="w-[450px]" onSubmit={handleSubmit}>
				<div className="payment-element-wrapper">
					<PaymentElement options={{ layout: "tabs" }} />
				</div>

				<button
					type="submit"
					className="btn btn-primary w-full mt-4 shadow-md"
					disabled={processing}>
					<span>{processing ? "´Processando" : "Pagar Agora"}</span>
				</button>

				{message && <div>{message}</div>}
			</form>
		</div>
	);
}

export { CheckoutCreditCardForm };
