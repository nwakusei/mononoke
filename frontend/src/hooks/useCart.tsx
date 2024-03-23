import { useState } from "react";

function useCart() {
	const [cart, setCart] = useState(0);
	const [subtotal, setSubtotal] = useState(0);

	return {
		cart,
		setCart,
		subtotal,
		setSubtotal,
	};
}

export { useCart };
