"use client";

import { createContext } from "react";

import { useCart } from "@/hooks/useCart";

const Context2 = createContext();

function CartProvider({ children }) {
	const { cart, setCart } = useCart();
	console.log(cart);
	console.log(setCart);

	return (
		<Context2.Provider value={{ cart, setCart }}>
			{children}
		</Context2.Provider>
	);
}

export { Context2, CartProvider };
