import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Logos Transportadoras
import MelhorEnvioLogo from "../../public/melhorenvio-logo.png";
import CorreiosLogo from "../../public/correios-logo.png";
import LoggiLogo from "../../public/loggi-logo.png";
import JadlogLogo from "../../public/jadlog-logo.png";
import JapanPostLogo from "../../public/japanpost-logo.png";

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

// Icons
import { LiaShippingFastSolid } from "react-icons/lia";
import { FiInfo } from "react-icons/fi";
import { PiMapPinLine, PiMapPinLineBold } from "react-icons/pi";

function ShippingCard() {
	const router = useRouter();

	return (
		<>
			<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
				{/* Adicionar Porduto */}
				<div className="flex flex-col gap-2">
					<div className="mb-4">
						<label className="flex flex-row justify-between mb-4">
							<div className="flex items-center gap-4">
								<input
									type="checkbox"
									defaultChecked
									className="checkbox"
								/>
								<Image
									className="object-contain w-[100px] rounded"
									src={LoggiLogo}
									alt="Tranportadora Logo"
									width={100}
									height={100}
									unoptimized
								/>
							</div>
							<div>
								<Image
									className="object-contain w-[80px] rounded"
									src={MelhorEnvioLogo}
									alt="Melhor Envio Logo"
									width={150}
									height={150}
									unoptimized
								/>
							</div>
						</label>
						<label></label>

						<div className="flex flex-row items-center gap-4">
							<label className="flex items-center">
								<input type="checkbox" className="checkbox" />
								<span className="ml-2">Loggi (Ponto)</span>
							</label>
							<label className="flex items-center">
								<input type="checkbox" className="checkbox" />
								<span className="ml-2">Loggi (Express)</span>
							</label>
							<label className="flex items-center">
								<input type="checkbox" className="checkbox" />
								<span className="ml-2">Loggi (Coleta)</span>
							</label>
						</div>
					</div>
					<div className="flex flex-row items-center gap-2">
						<FiInfo size={18} />
						<span className="mb-[2px]">
							Informações gerais: Esse tipo de frete é exclusivo
							do Melhor Envio, portanto leia todas as regras no
							site antes de configurar. ⇒{" "}
							<Link
								className="text-secondary transition-all ease-in duration-200 hover:text-primary"
								href={`https://centraldeajuda.melhorenvio.com.br/hc/pt-br/articles/31220401377556-Como-funciona-a-Loggi-pelo-Melhor-Envio`}
								target="_blank">
								Regras
							</Link>{" "}
							⇐
						</span>
					</div>
					<div className="flex flex-row items-center gap-2 -ml-[2px]">
						<PiMapPinLine size={22} />
						<span>
							Pontos de Postagem: Confira os pontos de postagem
							mais próximos à você, no mapa do Melhor Envio. ⇒{" "}
							<Link
								className="text-secondary transition-all ease-in duration-200 hover:text-primary"
								href={`https://melhorenvio.com.br/mapa`}
								target="_blank">
								Mapa
							</Link>{" "}
							⇐
						</span>
					</div>
				</div>
			</div>
		</>
	);
}

export { ShippingCard };
