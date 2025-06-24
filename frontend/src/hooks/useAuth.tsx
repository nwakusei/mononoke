import { useState, useEffect } from "react";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

function useAuth() {
	const [customerAuthenticated, setCustomerAuthenticated] = useState(false);
	const [partnerAuthenticated, setPartnerAuthenticad] = useState(false);
	const [userAuthenticated, setUserAuthenticated] = useState(false);
	const [isMounted, setIsMounted] = useState(false); // <- nova flag
	const [loading, setLoading] = useState(false);

	const router = useRouter();

	useEffect(() => {
		setIsMounted(true);

		const token = localStorage.getItem("token");
		if (token) {
			try {
				api.defaults.headers.Authorization = `Bearer ${JSON.parse(
					token
				)}`;
				setUserAuthenticated(true);
			} catch (error) {
				console.error("Erro ao analisar token:", error);
				localStorage.removeItem("token");
			}
		}
	}, []);

	async function registerCustomer(customer: object) {
		try {
			const data = await api
				.post("/customers/register", customer)
				.then((res) => {
					Swal.fire({
						width: 800,
						icon: "success",
						title: res.data.message,
						customClass: {
							confirmButton: "swal2-custom-confirm",
						},
					});
					return res.data;
				});
			await authUser(data);
		} catch (error: any) {
			Swal.fire({
				width: 800,
				icon: "error",
				title:
					error.response?.data?.message ||
					"Erro ao registrar cliente",
			});
			console.log(error);
		}
	}

	async function registerPartner(partner: object) {
		try {
			const data = await api
				.post("/partners/register", partner)
				.then((res) => {
					Swal.fire({
						width: 800,
						icon: "success",
						title: res.data.message,
						confirmButtonText: "Ok",
						customClass: {
							confirmButton: "swal2-custom-confirm",
						},
					});
					return res.data;
				});
			await authUser(data);
		} catch (error: any) {
			Swal.fire({
				width: 800,
				icon: "error",
				title:
					error.response?.data?.message ||
					"Erro ao registrar parceiro",
			});
			console.log(error);
		}
	}

	async function loginUser(user: object) {
		try {
			const data = await api
				.post("/mononoke/login", user)
				.then((res) => res.data);
			await authUser(data);
		} catch (error: any) {
			Swal.fire({
				title: error.response?.data?.message || "Erro ao fazer login",
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
		api.defaults.headers.Authorization = `Bearer ${data.token}`;
		router.push("/dashboard");
	}

	return {
		registerCustomer,
		registerPartner,
		userAuthenticated: isMounted ? userAuthenticated : false,
		loginUser,
		logout,
	};
}

export { useAuth };
