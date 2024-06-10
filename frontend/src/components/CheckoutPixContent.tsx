import Image from "next/image";

// Icons
import { MdOutlinePix } from "react-icons/md";
import { FaCheck } from "react-icons/fa";

import Swal from "sweetalert2";

import api from "@/utils/api";

function CheckoutPixContent({ qrCodeUrl, copyPixCode, pixCode, txid, token }) {
	async function handlePaymentPix(e) {
		e.preventDefault();

		if (txid) {
			console.log(txid);
			try {
				const response = await api.get(
					`/interapi/getCobPixInter?txid=${txid}`,
					{
						headers: {
							Authorization: `Bearer ${JSON.parse(token)}`,
							"Content-Type": "application/json",
						},
					}
				);

				console.log(response.data.status);
			} catch (error) {
				console.log(error);
			}
		} else {
			Swal.fire({
				title: "Erro ao finalizar pedido!",
				width: 700,
				icon: "error",
			});
		}
	}

	return (
		<>
			<div className="flex flex-row justify-center items-center w-[350px] bg-primary px-2 py-1 gap-1 rounded shadow-md">
				<h1 className="select-none">Pague com Pix!</h1>
				<MdOutlinePix size={16} />
			</div>
			<div className="flex flex-col justify-center items-center gap-8">
				<div>
					<h2 className="mb-2">Escaneie o QR Code</h2>
					{qrCodeUrl ? (
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
					) : (
						<div className="flex justify-center items-center border border-1 border-dashed border-green-500 w-[210px] h-[210px] rounded">
							<h2 className="mb-2">Nenhum QR Code gerado</h2>
						</div>
					)}
				</div>
				<div className="divider divider-vertical divider-success">
					OU
				</div>
				<div className="relative">
					<h1 className="mb-2">Pix Copia e Cola</h1>
					{pixCode ? (
						<div
							onClick={copyPixCode}
							className="bg-blue-500 w-[480px] h-[120px] overflow-hidden break-words select-none p-2 rounded-md shadow-md cursor-pointer transition-all ease-in duration-200 active:scale-[.97]">
							{pixCode}
						</div>
					) : (
						<div className="flex justify-center items-center border border-1 border-dashed border-green-500 w-[480px] h-[120px] overflow-hidden break-words p-2 rounded">
							<h2 className="mb-2">Nenhum código Pix gerado</h2>
						</div>
					)}
				</div>
			</div>
			<button
				onClick={handlePaymentPix}
				className="flex flex-row justify-center items-center gap-2 bg-green-800 w-[200px] p-3 rounded-lg shadow-md cursor-pointer transition-all ease-linear active:scale-[.96]">
				<FaCheck size={18} />
				Finalizar Pedido
			</button>
		</>
	);
}

export { CheckoutPixContent };
