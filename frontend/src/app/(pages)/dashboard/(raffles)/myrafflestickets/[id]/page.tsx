"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import Swal from "sweetalert2";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";
import { WhiteTicketHorizontalComponent } from "@/components/WhiteTicketHorizontalComponent";
import { WhiteTicketVerticalComponent } from "@/components/WhiteTicketVerticalComponent";
import { MiniTicketCard } from "@/components/MiniTicketCard";

// Axios
import api from "@/utils/api";

// Icons
import { Coupon } from "@icon-park/react";
import { BsPersonFill } from "react-icons/bs";
import { LuCalendarRange, LuPackageCheck } from "react-icons/lu";
import { MdOutlineLocalActivity, MdOutlineStore } from "react-icons/md";
import { toast } from "react-toastify";

function MyRafflesTicketsByID() {
	const [raffle, setRaffle] = useState({});
	const [myTickets, setMyTickets] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");
	const { id } = useParams();
	const [loadingBtn, setLoadingBtn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [packedLoading, setPackedLoading] = useState(false);

	const [user, setUser] = useState(null); // Inicializa como null para identificar se já foi carregado

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

	useEffect(() => {
		api.get(`/raffles/customer-tickets/${id}`, {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			console.log("API Response:", response.data.tickets); // Verifique o conteúdo da resposta
			setMyTickets(response.data.tickets);
			setIsLoading(false);
		});
	}, [id, token]);

	useEffect(() => {
		const fetchRaffle = async () => {
			try {
				const response = await api.get(
					`/raffles/customer-raffle/${id}`,
					{
						headers: {
							Authorization: `Bearer ${JSON.parse(token)}`,
						},
					}
				);

				setRaffle(response.data.raffle);
			} catch (error) {
				console.log(error);
			}
		};

		fetchRaffle();
	}, [id, token]);

	async function handleReceived() {
		setPackedLoading(true);
		try {
			const response = await api.patch(
				`/raffles/raffle-mark-delivered/${id}`
			);

			// Atualizar o estado localmente para refletir a mudança no status
			setRaffle((prevMysale) => ({
				...prevMysale,
				statusShipping: "Entregue", // Alteração do status local
			}));

			toast.success(response.data.message);
		} catch (error: any) {
			console.log(error);
			toast.error(error.response.data.message);
		}
		setPackedLoading(false);
	}

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
			<Sidebar />

			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4 mb-2">
				<div className="flex flex-col items-center bg-white ml-4 mr-8 rounded-md shadow-md p-4">
					<div className="text-white w-full bg-primary text-center text-lg py-1 mb-4 rounded-md shadow-md select-none">
						Meus tickets deste Sorteio
					</div>
					<div className="flex flex-row justify-center items-center gap-2 mb-6 bg-white border-solid border-[1px] border-opacity-20 border-gray-800 text-black p-2 w-[900px] rounded-md shadow-md">
						<span>{`Organizador: ${raffle?.raffleOrganizer}`}</span>
						<span>|</span>
						<span>
							{raffle?.raffleDate
								? `Data do Sorteio: ${format(
										new Date(raffle.raffleDate),
										"dd/MM/yyyy"
								  )}`
								: "Data não disponível"}
						</span>
						<span>|</span>
						<span>{`Status do Sorteio: ${
							raffle?.winner ? `Realizado` : `Em andamento`
						}`}</span>
					</div>

					{/* <WhiteTicketVerticalComponent />

					<WhiteTicketHorizontalComponent /> */}

					{/* Card Ticket */}
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{myTickets &&
							myTickets?.length > 0 &&
							myTickets.map((ticket) => {
								return (
									<MiniTicketCard
										key={ticket._id}
										TicketNumber={ticket.ticketNumber}
										winningTicket={
											raffle?.winner?.ticketNumber &&
											ticket.ticketNumber ===
												raffle.winner.ticketNumber
										}
									/>
								);
							})}
					</div>
				</div>

				{raffle.winner?.customerID === user?._id && (
					<div className="flex flex-col bg-white rounded-md shadow-md mt-4 ml-4 mr-8">
						<div className="w-full bg-primary text-center text-xl py-2 rounded-t-md shadow-md select-none mb-6">
							Logística
						</div>

						<div className="ml-4 text-black">
							{`Transportadora: ${
								raffle?.logisticOperator
									? raffle?.logisticOperator
									: "A definir"
							}`}
						</div>

						<div className="ml-4 mb-4 text-black">{`Status de Envio: ${raffle?.statusShipping}`}</div>

						{/* {myraffle?.trackingCode !== "" && (
										<div className="flex flex-row items-center ml-4 mb-4 gap-2">
											<div className="text-black">Cod. de Rastreio:</div>
											<div className="bg-primary text-sm cursor-pointer transition-all ease-in duration-150 active:scale-[.95] rounded shadow-md px-2">
												{myraffle?.trackingCode}
											</div>
										</div>
									)}
				 */}

						{raffle?.statusShipping === "Shipped" && (
							<div className="mt-4 mb-2">
								{packedLoading ? (
									<button className="btn btn-primary w-[300px]">
										<span className="loading loading-spinner loading-sm"></span>
									</button>
								) : (
									<button
										onClick={handleReceived}
										className="btn btn-primary w-[300px]">
										<LuPackageCheck size={20} />
										<span>Marcar como recebido</span>
									</button>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</section>
	);
}

export default MyRafflesTicketsByID;
