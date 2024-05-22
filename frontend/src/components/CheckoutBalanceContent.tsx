// Icons
import { PaymentMethod } from "@icon-park/react";

function CheckoutBalanceContent() {
	return (
		<div className="flex flex-row justify-center items-center w-[350px] bg-primary px-2 py-1 gap-1 rounded shadow-md">
			<h1 className="select-none">Pague com Saldo em Conta!</h1>
			<PaymentMethod size={17} />
		</div>
	);
}

export { CheckoutBalanceContent };
