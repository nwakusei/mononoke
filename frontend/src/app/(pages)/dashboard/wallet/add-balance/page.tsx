"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos

// Icons
import { Deposit } from "@icon-park/react";
import { LuQrCode } from "react-icons/lu";
import { FaPix } from "react-icons/fa6";
import { headers } from "next/headers";

function AddBalance() {
	const [user, setUser] = useState({});
	const [userOtakupay, setUserOtakupay] = useState({});
	const [token] = useState(localStorage.getItem("token") || "");
	const [inputValue, setInputValue] = useState("");
	const [pix, setPix] = useState();

	console.log(pix);

	useEffect(() => {
		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setUser(response.data);
		});

		api.get("/otakupay/get-user-otakupay", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		})
			.then((response) => {
				const newUserOtakupay = response.data; // Ajuste aqui para pegar diretamente a resposta
				setUserOtakupay(newUserOtakupay);
			})
			.catch((error) => {
				console.error("Erro ao obter saldo do OtakuPay:", error);
			});
	}, [token]);

	const handleInputChange = (e) => {
		setInputValue(e.target.value);
	};

	async function handleQRCode(inputValue) {
		const originalValue = inputValue;
		console.log(typeof originalValue);
		try {
			const response = await api.post(
				"/interapi/createPixInter",
				{ originalValue },
				{
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				}
			);
			if (response.data && response.data.createPixInter) {
				setPix(response.data.createPixInter);
			}
		} catch (error) {
			console.log(error.response.data);
		}
	}

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4">
				{/* Gadget 1 */}
				<div className="flex flex-row gap-4 mb-4">
					<div className="bg-purple-400 w-[1200px] p-6 rounded-md">
						{/* Avatar e Boas vindas */}
						<div className="flex flex-row items-center gap-4 text-lg font-semibold ml-6 mb-6">
							<div className="flex flex-row items-center gap-2">
								<h1 className="text-2xl">
									Adicionar Saldo via PIX
								</h1>
								<FaPix size={22} />
							</div>
						</div>
					</div>
				</div>

				{/* Gadget 2 */}
				<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
					{/* Tabela de Transações */}
					<div className="flex flex-col w-[250px] gap-2">
						<label className="form-control w-full max-w-xs">
							<div className="label">
								<span className="label-text">
									Digite o valor
								</span>
							</div>
							<input
								type="text"
								placeholder="0,00"
								className="input input-bordered input-primary w-full max-w-xs"
								value={inputValue}
								onChange={handleInputChange}
							/>
							<div className="label mb-2">
								<span className="label-text-alt text-red-500">
									O valor precisa ser um número válido
								</span>
							</div>

							<button
								className="btn btn-primary"
								onClick={() => handleQRCode(inputValue)}>
								<LuQrCode size={18} /> Gerar QR Code
							</button>
						</label>
					</div>
				</div>
			</div>
		</section>
	);
}

export default AddBalance;
