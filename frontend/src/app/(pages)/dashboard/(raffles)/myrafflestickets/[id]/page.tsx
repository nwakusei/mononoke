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

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4 mb-4">
				<div className="flex flex-col  bg-white ml-4 mr-8 rounded-md shadow-md p-4">
					<div className="text-white w-full bg-primary text-center text-lg py-1 mb-4 rounded-md select-none">
						Meus tickets deste Sorteio
					</div>

					{/* Card Ticket */}
					<div className="flex flex-row gap-4">
						{myTickets &&
							myTickets.length > 0 &&
							myTickets.map((myTicket) => (
								<div
									key={myTicket?._id}
									className="flex flex-col w-[250px] bg-secondary text-white mb-2 rounded-lg shadow-lg overflow-hidden">
									{/* Cabeçalho do Ticket */}
									<div className="flex flex-row p-4 bg-primary text-white">
										<span className="font-semibold">
											{`Ticket #${myTicket?.ticketNumber}`}
										</span>
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
									<div className="flex justify-between items-center p-4 bg-purple-400">
										<span className="text-xs">
											Validade:
										</span>
										<button className="bg-primary text-white px-2 py-1 rounded-md shadow-md text-xs">
											Ver Mais
										</button>
									</div>
								</div>
							))}
					</div>
				</div>
			</div>
		</section>
	);
}

export default MyRafflesTicketsByID;
