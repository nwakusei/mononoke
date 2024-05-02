"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/utils/api";

// Imagens
import imageProfile from "../../../../public/Kon.jpg";

// Components
import { Sidebar } from "@/components/Sidebar";

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
	const [user, setUser] = useState({});

	useEffect(() => {
		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((responser) => {
			setUser(responser.data);
		});
	}, [token]);

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="bg-yellow-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10">
				<div className="flex flex-row gap-4">
					{/* Gadget 1 */}
					<div className="bg-purple-400 w-[700px] p-6 rounded-md ">
						{/* Avatar e Boas vindas */}
						<div className="flex flex-row items-center gap-4 text-lg font-semibold mb-6">
							<div className="avatar">
								<div className="w-12 rounded-full">
									<Image
										src={imageProfile}
										alt="image profile"
										width={10}
										height={10}
										unoptimized
									/>
								</div>
							</div>
							<h1>Bem vindo(a) de volta {user.name}!</h1>
						</div>

						<div className="flex flex-row">
							{/* Total de Vendas e Performance Hoje */}
							<div className="border-r-[1px] border-yellow-500 pr-6">
								<h1 className="flex flex-row items-center text-3xl font-semibold gap-2">
									R$ 999,90{" "}
									<GoArrowUpRight
										className="text-green-500"
										size={18}
									/>
								</h1>
								<h2 className="text-sm">Vendas Hoje</h2>
							</div>

							<div className="ml-6">
								<h1 className="flex flex-row items-center text-3xl font-semibold gap-2">
									85%{" "}
									<GoArrowUpRight
										className="text-green-500"
										size={18}
									/>
								</h1>
								<h2 className="text-sm">Performance</h2>
							</div>
						</div>
					</div>

					{/* Gadget 2 */}
					<div className="border-2 border-purple-500 w-[220px] p-6 rounded-md ">
						{/* Despesas */}
						<div className="flex flex-col">
							<h1 className="flex flex-row text-xl font-semibold">
								R$ 10.000,00
							</h1>
							<h2 className="text-sm">Despesas</h2>
						</div>
					</div>

					{/* Gadget 3 */}
					<div className="border-2 border-purple-500 w-[220px] p-6 rounded-md ">
						{/* Vendas Totais */}
						<div className="flex flex-col">
							<h1 className="flex flex-row text-xl font-semibold">
								R$ 99.000,00
							</h1>
							<h2 className="text-sm">Vendas no Mês</h2>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default DashboardPage;
