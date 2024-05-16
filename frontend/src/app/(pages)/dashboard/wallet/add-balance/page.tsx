"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/utils/api";
import QRCode from "qrcode"; // Importe a biblioteca QRCode

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos

// Icons
import { Deposit } from "@icon-park/react";
import { LuQrCode } from "react-icons/lu";
import { FaBullseye, FaPix } from "react-icons/fa6";
import { toast } from "react-toastify";

function AddBalance() {
	const [user, setUser] = useState({});
	// const [userOtakupay, setUserOtakupay] = useState({});
	const [token] = useState(localStorage.getItem("token") || "");
	const [inputValue, setInputValue] = useState("");
	const [pix, setPix] = useState({});
	const [qrCodeUrl, setQrCodeUrl] = useState(""); // Estado para armazenar a URL do QR Code
	const [btnLoading, setBtnLoading] = useState(false);
	// Estado para armazenar o código do Pix copia e cola
	const [pixCode, setPixCode] = useState("");

	console.log(pix);

	useEffect(() => {
		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setUser(response.data);
		});

		// api.get("/otakupay/get-user-otakupay", {
		// 	headers: {
		// 		Authorization: `Bearer ${JSON.parse(token)}`,
		// 	},
		// })
		// 	.then((response) => {
		// 		const newUserOtakupay = response.data; // Ajuste aqui para pegar diretamente a resposta
		// 		setUserOtakupay(newUserOtakupay);
		// 	})
		// 	.catch((error) => {
		// 		console.error("Erro ao obter saldo do OtakuPay:", error);
		// 	});
	}, [token]);

	const handleInputChange = (e) => {
		setInputValue(e.target.value);
	};

	async function handleQRCode(inputValue) {
		let originalValue = inputValue;

		// Verificar se a entrada contém uma vírgula e substituí-la por um ponto
		if (originalValue.includes(",")) {
			originalValue = originalValue.replace(",", ".");
		}

		try {
			setBtnLoading(true);
			const response = await api.post(
				"/interapi/createPixInter",
				{ originalValue },
				{
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
						"Content-Type": "application/json",
					},
				}
			);
			if (response.data && response.data.newInterPix) {
				setPix(response.data.newInterPix);
				setPixCode(response.data.newInterPix.pixCopiaECola);

				// Gerar o QR Code
				QRCode.toDataURL(
					response.data.newInterPix.pixCopiaECola,
					(err, url) => {
						if (err) {
							console.error(err);
							return;
						}
						// Atualizar o estado com a URL do QR Code
						setQrCodeUrl(url);
					}
				);
				setBtnLoading(false);
			}
		} catch (error) {
			setBtnLoading(false);
			toast.error(error.response.data.message);
			console.log(error.response.data);
		}
	}

	// Função para copiar o código do Pix copia e cola para a área de transferência
	const copyPixCode = () => {
		navigator.clipboard.writeText(pixCode);
		toast.success("Código Pix copiado para a área de transferência!");
	};

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="h-screen bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4">
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
				<div className="flex flex-row justify-center items-center bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4 gap-10">
					{/* Tabela de Transações */}
					<div className="flex flex-col w-[250px] gap-2">
						<label className="form-control w-full max-w-xs">
							<div className="label">
								<span className="label-text">
									Digite o valor
								</span>
							</div>
							<div className="join">
								<div className="indicator">
									<span className="btn btn-disabled join-item">
										R$
									</span>
								</div>
								<input
									type="text"
									placeholder="0,00"
									className="input input-bordered input-success w-full max-w-xs rounded-l-none"
									value={inputValue}
									onChange={handleInputChange}
								/>
							</div>
							<div className="label mb-2">
								<span className="label-text-alt text-red-500">
									O valor precisa ser um número válido
								</span>
							</div>

							{btnLoading ? (
								<button className="btn btn-primary">
									<span className="loading loading-spinner loading-sm"></span>
								</button>
							) : (
								<button
									className="btn btn-primary"
									onClick={() => handleQRCode(inputValue)}>
									<LuQrCode size={18} /> Gerar QR Code
								</button>
							)}
						</label>
					</div>
					{/* Exibir o QR Code */}
					{qrCodeUrl ? (
						<div className="flex flex-row justify-center items-center gap-8">
							<div>
								<h2 className="mb-2">Escaneie o QR Code</h2>
								<div className="flex flex-col justify-center items-center bg-blue-500 w-[210px] h-[210px] rounded shadow-md">
									<Image
										className="p-2"
										src={qrCodeUrl}
										alt="QR Code"
										width={200}
										height={200}
										unoptimized
									/>
								</div>
							</div>
							<div className="divider divider-horizontal divider-success">
								OU
							</div>
							<div className="relative">
								<h1 className="mb-2">Pix Copia e Cola</h1>
								<div
									onClick={copyPixCode}
									className="bg-blue-500 w-[480px] h-[120px] overflow-hidden break-words select-none p-2 rounded-md shadow-md cursor-pointer transition-all ease-in duration-200 active:scale-[.97]">
									{pixCode}
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-row justify-center items-center gap-8">
							<div>
								<h2 className="mb-2">Escaneie o QR Code</h2>
								<div className="flex justify-center items-center border border-1 border-dashed border-green-500 w-[210px] h-[210px] rounded">
									<h2 className="mb-2">
										Nenhum QR Code gerado
									</h2>
								</div>
							</div>
							<div className="divider divider-horizontal">OU</div>
							<div className="relative">
								<h1 className="mb-2">Pix Copia e Cola</h1>
								<div className="flex justify-center items-center border border-1 border-dashed border-green-500 w-[480px] h-[120px] overflow-hidden break-words p-2 rounded">
									<h2 className="mb-2">
										Nenhum código Pix gerado
									</h2>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex flex-row justify-center">
					<Link href="/dashboard/wallet">
						<button className="btn btn-primary select-none shadow-md">
							Realizei o Pagamento
						</button>
					</Link>
				</div>
			</div>
		</section>
	);
}

export default AddBalance;
