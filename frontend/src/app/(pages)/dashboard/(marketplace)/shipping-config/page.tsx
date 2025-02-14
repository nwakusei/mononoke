"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Logos Transportadoras
import MelhorEnvioLogo from "../../../../../../public/melhorenvio-logo.png";
import CorreiosLogo from "../../../../../../public/correios-logo.png";
import LoggiLogo from "../../../../../../public/loggi-logo.png";
import JadlogLogo from "../../../../../../public/jadlog-logo.png";
import JapanPostLogo from "../../../../../../public/japanpost-logo.png";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// React Hook Form e Zod
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Axios
import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";
import { ShippingCard } from "@/components/ShippingCard";

// Icons
import { LiaShippingFastSolid } from "react-icons/lia";
import { FiInfo } from "react-icons/fi";
import { PiMapPinLine, PiMapPinLineBold } from "react-icons/pi";

function ShippingConfigPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState({});

	const [isLoading, setIsLoading] = useState(true);
	const [loadingButton, setLoadingButton] = useState(false);
	const router = useRouter();

	useEffect(() => {
		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setUser(response.data);
			setIsLoading(false);
		});
	}, [token]);

	const handleCancelar = () => {
		// Redirecionar para outra página ao clicar em Cancelar
		router.push("/dashboard");
	};

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mt-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4">
						{/* Título da Página */}
						<div className="flex flex-row items-center gap-4">
							<LiaShippingFastSolid size={35} />
							<h1 className="text-2xl font-semibold text-black">
								Configurações de Envio
							</h1>
						</div>
					</div>
					<form>
						<ShippingCard />

						{/* Gadget 3 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold mb-4 text-black">
									Deseja atualizar as configurações de envio?
								</h1>
								{/* Nome e Descrição */}

								<div className="flex flex-row gap-4">
									<button
										type="button"
										onClick={handleCancelar}
										className="btn btn-outline btn-error hover:shadow-md">
										Cancelar
									</button>
									{loadingButton ? (
										<button className="btn btn-primary shadow-md w-[200px]">
											<span className="loading loading-spinner loading-md"></span>
										</button>
									) : (
										<button
											type="submit"
											className="btn btn-primary shadow-md w-[200px]">
											Atualizar
										</button>
									)}
								</div>
							</div>
						</div>
					</form>
					{/* <pre>{output}</pre> */}
					<br />
				</div>
			</div>
		</section>
	);
}

export default ShippingConfigPage;
