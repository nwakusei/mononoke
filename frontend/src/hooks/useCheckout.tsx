import { useState } from "react";

function useCheckout() {
	const [cart, setCart] = useState(0);
	const [subtotal, setSubtotal] = useState(0);
	const [transportadoraInfo, setTransportadoraInfo] = useState([]);

	return {
		cart,
		setCart,
		subtotal,
		setSubtotal,
		transportadoraInfo,
		setTransportadoraInfo,
	};
}

export { useCheckout };
