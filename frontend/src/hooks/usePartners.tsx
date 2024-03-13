import { useState, useEffect } from "react";
import api from "@/utils/api";

function usePartners() {
	const [partners, setPartners] = useState([]);

	useEffect(() => {
		api.get("/partners/allpartners").then((response) => {
			setPartners(response.data.partners);
		});
	}, []);

	return {
		partners,
	};
}

export { usePartners };
