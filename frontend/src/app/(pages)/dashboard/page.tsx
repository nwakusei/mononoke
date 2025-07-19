"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/utils/api";
import { useRouter } from "next/navigation";

// Imagens
import imageProfile from "../../../../public/kon.jpg";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Icons
import {
	ShoppingCartOne,
	ShoppingBag,
	Coupon,
	PaymentMethod,
	Currency,
} from "@icon-park/react";
import { GrChat } from "react-icons/gr";
import { LuSettings, LuQrCode } from "react-icons/lu";
import { RiAccountPinBoxLine } from "react-icons/ri";
import { MdOutlineWarehouse } from "react-icons/md";
import { BsShopWindow, BsChatSquareText } from "react-icons/bs";
import { GoArrowUpRight } from "react-icons/go";
import { PiHandHeartDuotone, PiChatCenteredText } from "react-icons/pi";

function DashboardPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState(null); // Inicializa como null para identificar se já foi carregado
	const [isLoading, setIsLoading] = useState(true); // Estado de loading

	const router = useRouter();

	useEffect(() => {
		api.get("/mononoke/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		})
			.then((response) => {
				setUser(response.data);
				setIsLoading(false); // Termina o loading após os dados serem carregados
			})
			.catch((error) => {
				console.error("Erro ao buscar usuário:", error);
				setIsLoading(false); // Mesmo se der erro, encerra o loading
			});
	}, [token]);

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-100 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="h-screen col-start-3 col-span-4 md:col-start-3 md:col-span-10">
				<div className="flex flex-row gap-4 mt-4">
					{/* Gadget 1 */}
					<div className="bg-white w-[700px] p-6 rounded-md shadow-md">
						{/* Avatar e Boas vindas */}
						<div className="flex flex-row items-center gap-4 text-lg font-semibold mb-6">
							<div className="avatar">
								<div className="w-12 h-12 rounded">
									<Image
										src={`https://mononokebucket.s3.us-east-1.amazonaws.com/${user?.profileImage}`}
										alt="image profile"
										width={48}
										height={48}
										unoptimized
									/>
								</div>
							</div>
							<h1 className="text-black">
								Bem vindo(a) {user?.name}!
							</h1>
						</div>

						{/* Total de Vendas e Performance Hoje */}
						{/* <div className="flex flex-row">
							<div className="border-r-[1px] border-black pr-6">
								<h1 className="flex flex-row items-center text-3xl font-semibold text-black gap-2">
									R$ 999,90{" "}
									<GoArrowUpRight
										className="text-green-700"
										size={18}
									/>
								</h1>
								<h2 className="text-sm text-black">
									Vendas Hoje
								</h2>
							</div>

							<div className="ml-6">
								<h1 className="flex flex-row items-center text-3xl font-semibold text-black gap-2">
									85%{" "}
									<GoArrowUpRight
										className="text-green-500"
										size={18}
									/>
								</h1>
								<h2 className="text-sm text-black">
									Performance
								</h2>
							</div>
						</div> */}
					</div>

					{/* Gadget 2 */}
					<div className="text-black bg-white w-[455px] p-6 rounded-md shadow-md">
						{/* Despesas */}
						<div className="flex flex-col">
							<h1 className="flex flex-row text-lg font-semibold mb-4">
								Esse é o seu Dashboard
							</h1>
							<h2 className="text-sm">
								Todas as novidades estarão disponíveis aqui.
							</h2>
						</div>
					</div>

					{/* Gadget 3 */}
				</div>
			</div>
		</section>
	);
}

export default DashboardPage;
