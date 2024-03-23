"use client";

import { createContext, ReactNode } from "react";

// Import do Hook useCart
import { useCart } from "@/hooks/useCart";

const CartContext = createContext();

// Tipagem padrão para Children
interface ICartProviderProps {
	children: ReactNode;
}

function CartProvider({ children }: ICartProviderProps) {
	const { cart, setCart, subtotal, setSubtotal } = useCart();

	return (
		<CartContext.Provider value={{ cart, setCart, subtotal, setSubtotal }}>
			{children}
		</CartContext.Provider>
	);
}

export { CartContext, CartProvider };
