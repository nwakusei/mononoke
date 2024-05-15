"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos
import Otakuyasan from "../../../../../public/otakuyasan.png";

// Icons
import { Deposit } from "@icon-park/react";

function WalletPage() {
	const [user, setUser] = useState({});
	const [userOtakupay, setUserOtakupay] = useState({});
	const [token] = useState(localStorage.getItem("token") || "");

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

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4">
				{/* Gadget 1 */}
				<div className="flex flex-row gap-4 mb-4">
					<div className="bg-purple-400 w-[1200px] p-6 rounded-md">
						{/* Avatar e Boas vindas */}
						<div className="flex flex-row items-center gap-4 text-lg font-semibold ml-6 mb-6">
							<h1 className="text-2xl">OtakuPay Wallet</h1>
						</div>
					</div>
				</div>

				{/* Gadget 2 */}
				<div className="flex flex-row gap-4 mb-4">
					<div className="bg-purple-400 w-[460px] p-6 rounded-md">
						{/* Saldo Disponivel */}
						<div className="flex flex-col -mb-4">
							<div className="flex flex-row items-center ml-6 gap-2">
								<div>
									<h2 className="text-sm">
										Saldo Disponível
									</h2>
									<h1 className="flex flex-row items-center text-3xl font-semibold">
										{parseFloat(
											userOtakupay.balanceAvailable || ""
										).toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
										})}
									</h1>
								</div>
								<div className="flex flex-col mx-6 gap-4">
									<Link href="/dashboard/wallet/add-balance">
										<button className="flex flex-row btn btn-outline btn-success w-[200px]">
											<Deposit size={18} />
											Adicionar Crédito
										</button>
									</Link>

									{/* <button className="btn btn-success">
										<Expenses size={18} />
										Sacar
									</button> */}
								</div>
							</div>
							{/* <div className="flex flex-row mx-6 gap-4">
								<button className="btn btn-outline btn-success">
									<Deposit size={18} />
									Adicionar Dinheiro
								</button>
								<button className="btn btn-success">
									<Expenses size={18} />
									Sacar
								</button>
							</div> */}
						</div>
					</div>

					{/* Outro Saldos */}
					<div className="bg-purple-400 w-[240px] p-6 rounded-md">
						{/* Saldo Disponivel */}
						<div className="flex flex-col">
							<div className="flex flex-row pb-2 mb-2">
								<div>
									<h2 className="text-sm">Saldo Pendente</h2>
									<h1 className="flex flex-row items-center text-xl font-semibold gap-2">
										{parseFloat(
											userOtakupay.balancePending || ""
										).toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
										})}
									</h1>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-purple-400 w-[240px] p-6 rounded-md">
						{/* Saldo Disponivel */}
						<div className="flex flex-col">
							<div className="flex flex-row pb-2 mb-2">
								<div>
									<h2 className="text-sm">
										Otaku Point Disponível
									</h2>
									<h1 className="flex flex-row items-center text-xl font-semibold gap-2">
										{parseFloat(
											userOtakupay.otakuPointsAvailable
										) === 0
											? `0,00 OP`
											: `${parseFloat(
													userOtakupay.otakuPointsAvailable
											  ).toLocaleString("pt-BR")} OP`}
									</h1>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-purple-400 w-[240px] p-6 rounded-md mr-4">
						{/* Saldo Disponivel */}
						<div className="flex flex-col">
							<div className="flex flex-row">
								<div>
									<h2 className="text-sm">
										Otaku Point Pendente
									</h2>
									<h1 className="flex flex-row items-center text-xl font-semibold gap-2">
										{userOtakupay.otakuPointsPending !==
										undefined
											? parseFloat(
													userOtakupay.otakuPointsPending
											  )
													.toFixed(2)
													.replace(".", ",") + " OP"
											: "0,00 OP"}
									</h1>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Gadget 2 */}
				<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
					{/* Tabela de Transações */}
					<div className="divider mb-2">Últimas atividades</div>
					<table className="table">
						{/* head */}
						<thead>
							<tr>
								<th className="text-base">
									{user.accountType === "partner"
										? `Cliente`
										: `Loja`}
								</th>
								<th className="text-base">Transação</th>
								<th className="text-base">Valor Total</th>
								<th className="text-base">Data</th>
								<th></th>
							</tr>
						</thead>
						<tbody className="p-10">
							{/* row 1 */}
							<tr>
								<td>
									<div className="flex items-center gap-3">
										<div className="avatar">
											<div className="mask mask-squircle w-12 h-12">
												<Image
													src={Otakuyasan}
													alt="Avatar Tailwind CSS Component"
												/>
											</div>
										</div>
										<div>
											<div className="font-bold">
												Otakuya-san
											</div>
											<div className="text-sm opacity-50">
												Otamart
											</div>
										</div>
									</div>
								</td>
								<td>
									One Piece Vol.1
									<br />
									<span className="badge badge-accent badge-sm">
										Compra Online
									</span>
								</td>
								<td>
									<div className="font-normal text-red-500">
										- R$ 49,90
									</div>
								</td>
								<td>
									<div>07 de Março</div>
								</td>
								<th>
									<button className="btn btn-ghost btn-xs">
										+ detalhes
									</button>
								</th>
							</tr>
							{/* row 2 */}
							<tr>
								<td>
									<div className="flex items-center gap-3">
										<div className="avatar">
											<div className="mask mask-squircle w-12 h-12">
												<img
													src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
													alt="Avatar Tailwind CSS Component"
												/>
											</div>
										</div>
										<div>
											<div className="font-bold">
												Marina Penharver
											</div>
											<div className="text-sm opacity-50">
												Site da Loja
											</div>
										</div>
									</div>
								</td>
								<td>
									Pulseira Elfa
									<br />
									<span className="badge badge-success badge-sm">
										Venda Online
									</span>
								</td>
								<td>
									<div className="font-normal text-green-500">
										+ 29,90
									</div>
								</td>
								<td>
									<div>07 de Março</div>
								</td>
								<th>
									<button className="btn btn-ghost btn-xs">
										+ detalhes
									</button>
								</th>
							</tr>
						</tbody>
						{/* foot */}
						<tfoot>
							<tr>
								<th></th>
								<th>Name</th>
								<th>Job</th>
								<th>Favorite Color</th>
								<th></th>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</section>
	);
}

export default WalletPage;
