import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

function useAuth() {
	const [customerAuthenticated, setCustomerAuthenticated] = useState(false);
	const [partnerAuthenticated, setPartnerAuthenticad] = useState(false);
	const [userAuthenticated, setUserAuthenticated] = useState(false);
	const [loading, setLoading] = useState(false);

	const router = useRouter();

	useEffect(() => {
		const token = localStorage.getItem("token");

		if (token) {
			api.defaults.headers.Authorization = `Bearer ${JSON.parse(token)}`;
			setUserAuthenticated(true);
		}
	}, []);

	async function registerCustomer(customer: object) {
		try {
			const data = await api
				.post("/customers/register", customer)
				.then((response) => {
					return response.data;
				});

			await authUser(data);
		} catch (error: any) {
			Swal.fire({
				title: error.response.data.message,
				width: 800,
				icon: "error",
			});
			console.log(error);
		}
	}

	async function registerPartner(partner: object) {
		try {
			const data = await api
				.post("/partners/register", partner)
				.then((response) => {
					Swal.fire({
						title: response.data.message,
						width: 800,
						icon: "success",
					});
					return response.data;
				});

			await authUser(data);
		} catch (error: any) {
			Swal.fire({
				title: error.response.data.message,
				width: 800,
				icon: "error",
			});
			console.log(error);
		}
	}

	async function loginUser(user: object) {
		try {
			const data = await api
				.post("/otakuprime/login", user)
				.then((response) => {
					return response.data;
				});
			await authUser(data);
		} catch (error: any) {
			Swal.fire({
				title: error.response.data.message,
				width: 800,
				icon: "error",
			});
			console.log(error);
		}
	}

	async function logout() {
		setUserAuthenticated(false);
		localStorage.removeItem("token");

		api.defaults.headers.Authorization = null;

		router.push("/login");
	}

	async function authUser(data: any) {
		setUserAuthenticated(true);
		localStorage.setItem("token", JSON.stringify(data.token));
		router.push("/dashboard");
	}

	// async function authCustomer(data: any) {
	// 	setCustomerAuthenticated(true);
	// 	localStorage.setItem("token", JSON.stringify(data.token));
	// 	router.push("/");
	// }

	// async function authPartner(data: any) {
	// 	setPartnerAuthenticad(true);
	// 	localStorage.setItem("token", JSON.stringify(data.token));
	// 	router.push("/");
	// }

	return {
		registerCustomer,
		registerPartner,
		userAuthenticated,
		loginUser,
		logout,
	};
}

export { useAuth };
