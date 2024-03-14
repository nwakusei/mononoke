"use client";

import { createContext, Dispatch, SetStateAction, ReactNode } from "react";

// Import do Hook useCart
import { useCart } from "@/hooks/useCart";

const CartContext = createContext();

// Tipagem padrão para Children
interface ICartProviderProps {
	children: ReactNode;
}

function CartProvider({ children }: ICartProviderProps) {
	const { cart, setCart } = useCart();
	console.log(cart);
	console.log(setCart);

	return (
		<CartContext.Provider value={{ cart, setCart }}>
			{children}
		</CartContext.Provider>
	);
}

export { CartContext, CartProvider };
