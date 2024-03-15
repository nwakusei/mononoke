import { useState } from "react";

function useCart() {
	const [cart, setCart] = useState(0);
	const [subtotal, setSubtotal] = useState(0);
	console.log(cart);
	console.log(setCart);

	return {
		cart,
		setCart,
		subtotal,
		setSubtotal,
	};
}

export { useCart };
