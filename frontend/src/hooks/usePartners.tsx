import { useState, useEffect } from "react";
import api from "@/utils/api";

function usePartners() {
	const [partners, setPartners] = useState([]);

	console.log(partners);

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
