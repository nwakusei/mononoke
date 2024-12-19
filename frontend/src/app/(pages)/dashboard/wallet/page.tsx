"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Components
import { Sidebar } from "@/components/Sidebar";

// Axios
import api from "@/utils/api";

// Imagens e Logos
import Otakuyasan from "../../../../../public/otakuyasan.png";

// Icons
import { Deposit, Wallet } from "@icon-park/react";
import { AiOutlineMoneyCollect } from "react-icons/ai";
import { LoadingPage } from "@/components/LoadingPageComponent";

function WalletPage() {
	const [user, setUser] = useState({});
	const [userOtakupay, setUserOtakupay] = useState({});
	const [token] = useState(localStorage.getItem("token") || "");
	const [isLoading, setIsLoading] = useState(true);
	const [loadingButtonId, setLoadingButtonId] = useState(false);

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

	const handleClick = () => {
		setLoadingButtonId(true);
		setTimeout(() => {
			router.push(`/dashboard/wallet/add-balance`);
		}, 2000); // O tempo pode ser ajustado conforme necessário
	};

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4">
				{/* Gadget 1 */}
				<div className="flex flex-row gap-4 mb-4">
					<div className="bg-white w-[1200px] p-6 rounded-md shadow-md">
						{/* Avatar e Boas vindas */}
						<div className="flex flex-row items-center gap-4 text-lg text-black font-semibold ml-6 mb-6">
							<h1 className="text-2xl">OtakuPay Wallet</h1>
							<Wallet size={24} />
						</div>
					</div>
				</div>

				{/* Gadget 2 */}
				<div className="flex flex-row gap-4 mb-4">
					<div className="bg-white w-[520px] p-6 rounded-md shadow-md">
						{/* Saldo Disponivel */}
						<div className="flex flex-col -mb-4">
							<div className="flex flex-row items-center ml-6 gap-5">
								<div>
									<h2 className="text-sm text-black">
										Saldo Disponível
									</h2>
									<h1 className="flex flex-row items-center text-3xl font-semibold text-black">
										{parseFloat(
											userOtakupay?.balanceAvailable || ""
										).toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
										})}
									</h1>
								</div>
								<div className="flex flex-col mx-6 gap-4">
									{loadingButtonId ? (
										<button className="flex flex-row items-center btn btn-primary text-black shadow-md w-[200px]">
											<span className="loading loading-dots loading-md"></span>
										</button>
									) : (
										<button
											onClick={handleClick}
											className="flex flex-row items-center btn btn-outline btn-primary text-black w-[200px] hover:shadow-md">
											<AiOutlineMoneyCollect size={22} />
											Adicionar Crédito
										</button>
									)}
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
					<div className="bg-white w-[210px] p-6 rounded-md shadow-md">
						{/* Saldo Disponivel */}
						<div className="flex flex-col">
							<div className="flex flex-row pb-2 mb-2">
								<div>
									<h2 className="text-sm text-black">
										Saldo Pendente
									</h2>
									<h1 className="flex flex-row items-center text-xl font-semibold text-black gap-2">
										{parseFloat(
											userOtakupay?.balancePending || ""
										).toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
										})}
									</h1>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white w-[210px] p-6 rounded-md shadow-md">
						{/* Saldo Disponivel */}
						<div className="flex flex-col">
							<div className="flex flex-row pb-2 mb-2">
								<div>
									<h2 className="text-sm text-black">
										Otaku Point Disponível
									</h2>
									<h1 className="flex flex-row items-center text-xl font-semibold text-black gap-2">
										{parseFloat(
											userOtakupay?.otakuPointsAvailable
										) === 0
											? `0,00 OP`
											: `${parseFloat(
													userOtakupay?.otakuPointsAvailable
											  ).toLocaleString("pt-BR")} OP`}
									</h1>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white w-[212px] p-6 rounded-md shadow-md mr-4">
						{/* Saldo Disponivel */}
						<div className="flex flex-col">
							<div className="flex flex-row">
								<div>
									<h2 className="text-sm text-black">
										Otaku Point Pendente
									</h2>
									<h1 className="flex flex-row items-center text-xl font-semibold text-black gap-2">
										{userOtakupay?.otakuPointsPending !==
										undefined
											? parseFloat(
													userOtakupay?.otakuPointsPending
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
				<div className="h-screen bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-8">
					{/* Tabela de Transações */}
					<div className="divider mb-2 text-lg text-black before:bg-black after:bg-black before:border-t-[1px] after:border-t-[1px]">
						Últimas atividades
					</div>
					<table className="table">
						{/* head */}
						<thead>
							<tr>
								<th className="text-sm text-black">
									{/* {user?.accountType === "partner"
										? `Cliente`
										: `Loja`} */}
								</th>
								<th className="text-sm text-black">
									Transação
								</th>
								<th className="text-sm text-black">
									Valor Total
								</th>
								<th className="text-sm text-black">Data</th>
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
											<div className="font-bold text-black">
												Otakuya-san
											</div>
											<div className="text-sm text-black opacity-50">
												Otamart
											</div>
										</div>
									</div>
								</td>
								<td>
									<div className="text-black">
										One Piece Vol.1
									</div>
									<span className="badge badge-accent badge-sm text-white py-2">
										Compra Online
									</span>
								</td>
								<td>
									<div className="font-normal text-red-700">
										- R$ 49,90
									</div>
								</td>
								<td>
									<div className="text-black">
										07 de Março
									</div>
								</td>
								<th>
									{/* Modal de Detalhes da Transação */}
									<button
										className="btn btn-primary hover:btn-secondary btn-xs text-white shadow-md"
										onClick={() =>
											document
												.getElementById("my_modal_1")
												.showModal()
										}>
										+ detalhes
									</button>
									<dialog id="my_modal_1" className="modal">
										<div className="modal-box bg-secondary">
											<h3 className="font-bold text-lg mb-4">
												Detalhes da Transação{" "}
											</h3>
											<p className="mb-1">
												Data do Pagamento: 20/08 - 03:28
												hs
											</p>
											<p className="">
												Hash da Transação:
												151gds151sg15d1s515]
											</p>

											<div className="modal-action">
												<form method="dialog">
													{/* if there is a button in form, it will close the modal */}
													<button className="btn btn-primary">
														Fechar
													</button>
												</form>
											</div>
										</div>
									</dialog>
								</th>
							</tr>
							{/* row 2 */}
							<tr>
								<td>
									<div className="flex items-center gap-3">
										<div className="avatar">
											<div className="mask mask-squircle w-12 h-12">
												<img
													src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
													alt="Avatar Tailwind CSS Component"
												/>
											</div>
										</div>
										<div>
											<div className="font-bold text-black">
												Marina Penharver
											</div>
											<div className="text-sm text-black opacity-50">
												Site da Loja
											</div>
										</div>
									</div>
								</td>
								<td>
									<div className="text-black">
										Pulseira Elfa
									</div>
									<span className="badge badge-success badge-sm text-white py-2">
										Venda Online
									</span>
								</td>
								<td>
									<div className="font-normal text-green-600">
										+ 29,90
									</div>
								</td>
								<td>
									<div className="text-black">
										07 de Março
									</div>
								</td>
								<th>
									<button className="btn btn-primary hover:btn-secondary btn-xs text-white shadow-md">
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
