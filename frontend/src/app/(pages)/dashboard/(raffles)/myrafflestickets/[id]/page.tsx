"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import Swal from "sweetalert2";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Axios
import api from "@/utils/api";

// Icons
import { Coupon } from "@icon-park/react";
import { BsPersonFill } from "react-icons/bs";
import { LuCalendarRange } from "react-icons/lu";
import { MdOutlineLocalActivity, MdOutlineStore } from "react-icons/md";

function MyRafflesTicketsByID() {
	const [myTickets, setMyTickets] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");
	const { id } = useParams();
	const [loadingBtn, setLoadingBtn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	console.log(id);

	console.log(myTickets);

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

	async function handleSubmit() {
		setLoadingBtn(true);
		try {
			await api
				.post(`raffles/sorteio/${id}`, {
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				})
				.then((responser) => {
					Swal.fire({
						title: responser.data.message,
						width: 800,
						icon: "success",
					});
				});
		} catch (error: any) {
			console.log(error);
			Swal.fire({
				title: error.response.data.message,
				width: 800,
				icon: "error",
			});
		}
		setLoadingBtn(false);
	}

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4 mb-4">
				<div className="flex flex-col  bg-white ml-4 mr-8 rounded-md shadow-md">
					<div className="text-white w-full bg-primary text-center text-lg py-1 mb-4 rounded-md select-none">
						Meus tickets deste Sorteio
					</div>

					{/* Card Ticket */}
					{myTickets &&
						myTickets.length > 0 &&
						myTickets.map((myTicket) => (
							<div
								key={myTicket?._id}
								className="flex flex-col w-[250px] bg-yellow-500 text-black mb-2">
								<div className="flex flex-row items-center">
									<MdOutlineLocalActivity size={19} />
									{myTicket?.ticketNumber}
								</div>
							</div>
						))}

					<div className="flex flex-col w-[700px] bg-blue-800 text-black mt-8">
						<h1 className="text-xl font-semibold mb-4">
							{myTickets?.rafflePrize}
						</h1>
						<div className="flex flex-row items-center">
							{/* <MdOutlineLocalActivity
								className="mt-[1px]"
								size={19}
							/> */}
							<Coupon size={17} />
							<span>
								Valor do Ticket:{" "}
								{myTickets?.raffleCost?.toLocaleString("pt-BR")}{" "}
								OP
							</span>
						</div>
						<div className="flex flex-row items-center">
							<BsPersonFill size={17} />
							<span>
								Mínimo de Participantes:{" "}
								{myTickets?.minNumberParticipants}
							</span>
						</div>
						<div className="flex flex-row items-center">
							<LuCalendarRange size={16} />

							<span>
								{`Data do Sorteio: ${
									myTickets?.raffleDate
										? format(
												new Date(myTickets?.raffleDate),
												"dd/MM/yyy"
										  )
										: ""
								}`}
							</span>
						</div>

						<div className="flex flex-row items-center mb-2">
							{/* <BsPeopleFill size={17} /> */}
							<MdOutlineLocalActivity size={19} />
							<span>
								Tickets Registrados:{" "}
								{myTickets?.registeredTickets?.length}
							</span>
						</div>
					</div>

					<div className="flex flex-col w-[250px] bg-yellow-500 text-black mb-2 rounded-lg shadow-lg overflow-hidden">
						{/* Cabeçalho do Ticket */}
						<div className="flex flex-row items-center p-4 bg-yellow-600 text-white">
							<MdOutlineLocalActivity
								size={19}
								className="mr-2"
							/>
							<span className="font-semibold">Ticket</span>
						</div>

						{/* Corpo do Ticket */}
						<div className="p-4">
							<div className="text-sm mb-2">
								<span className="font-medium">
									Nome do Cliente:
								</span>{" "}
							</div>
							<div className="text-sm mb-2">
								<span className="font-medium">
									Data de Emissão:
								</span>{" "}
							</div>
							{/* Adicione mais detalhes conforme necessário */}
						</div>

						{/* Rodapé do Ticket */}
						<div className="flex justify-between items-center p-4 bg-yellow-400">
							<span className="text-xs">Validade:</span>
							<button className="bg-yellow-600 text-white px-2 py-1 rounded-md text-xs">
								Ver Mais
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default MyRafflesTicketsByID;
