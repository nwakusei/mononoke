"use client";

import { createContext, ReactNode } from "react";

// Import do Hook useCart
import { useCheckout } from "@/hooks/useCheckout";

const CheckoutContext = createContext();

// Tipagem padrão para Children
interface ICartProviderProps {
	children: ReactNode;
}

function CheckoutProvider({ children }: ICartProviderProps) {
	const {
		cart,
		setCart,
		subtotal,
		setSubtotal,
		transportadoraInfo,
		setTransportadoraInfo,
	} = useCheckout();

	return (
		<CheckoutContext.Provider
			value={{
				cart,
				setCart,
				subtotal,
				setSubtotal,
				transportadoraInfo,
				setTransportadoraInfo,
			}}>
			{children}
		</CheckoutContext.Provider>
	);
}

export { CheckoutContext, CheckoutProvider };
