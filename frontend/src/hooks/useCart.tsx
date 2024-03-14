import { useState } from "react";

function useCart() {
	const [cart, setCart] = useState(0);
	console.log(cart);
	console.log(setCart);

	return {
		cart,
		setCart,
	};
}

export { useCart };
