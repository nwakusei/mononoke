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

function MyRafflesByID() {
	const [myraffle, setMyraffle] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");
	const { id } = useParams();
	const [loadingBtn, setLoadingBtn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const [counter, setCounter] = useState(5);
	const [raffleStatus, setRaffleStatus] = useState("not_started");

	// Fetch inicial dos dados do sorteio
	useEffect(() => {
		fetchRaffleData();
	}, [id, token]);

	// Atualiza o estado de myraffle
	const fetchRaffleData = async () => {
		try {
			const response = await api.get(`/raffles/partner-raffle/${id}`, {
				headers: {
					Authorization: `Bearer ${JSON.parse(token)}`,
				},
			});

			const raffleData = response.data.raffle;
			setMyraffle(raffleData);
			setIsLoading(false);

			// Determinar status com base em winner
			if (raffleData.winner) {
				setRaffleStatus("completed");
			}
		} catch (error) {
			console.error("Erro ao buscar dados do sorteio:", error);
		}
	};

	// Controlar contador e atualização de status
	useEffect(() => {
		if (raffleStatus === "countdown" && counter > 0) {
			const intervalId = setInterval(() => {
				setCounter((prevCounter) => prevCounter - 1);
			}, 1000);

			return () => clearInterval(intervalId);
		} else if (raffleStatus === "countdown" && counter === 0) {
			fetchRaffleData(); // Atualiza os dados do sorteio
			setRaffleStatus("completed"); // Define o status como concluído

			// Exibir alerta após o sorteio ser realizado
			Swal.fire({
				title: "Sorteio realizado com sucesso!",
				text: `O vencedor foi: ${
					myraffle?.winner?.customerName || "Desconhecido"
				}`,
				width: 800,
				icon: "success",
			});
		}
	}, [counter, raffleStatus]);

	// Handler para realizar o sorteio
	async function handleSubmit() {
		if (raffleStatus === "completed") {
			Swal.fire({
				title: "Este sorteio já foi realizado!",
				icon: "info",
				width: 800,
			});
			return;
		}

		setLoadingBtn(true);
		try {
			const response = await api.post(`raffles/sorteio/${id}`, {
				headers: {
					Authorization: `Bearer ${JSON.parse(token)}`,
				},
			});

			setCounter(5);
			setRaffleStatus("countdown");

			// Swal.fire({
			// 	title: response.data.message,
			// 	width: 800,
			// 	icon: "success",
			// });
		} catch (error: any) {
			console.error(error);
			Swal.fire({
				title:
					error.response?.data?.message || "Erro ao realizar sorteio",
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
				<div className="flex flex-row gap-8 bg-white ml-4 mr-8 rounded-md shadow-md">
					{/* Dados do Sorteio */}
					<div className="flex flex-col py-4 pl-4">
						<div className="border-[1px] border-black border-opacity-20 bg-white w-[402px] rounded-md relative shadow-lg">
							<div className="h-[402px] flex items-center justify-center mx-3 my-2">
								{myraffle?.imagesRaffle?.length > 0 && (
									<Image
										className="object-contain h-full pointer-events-none"
										src={`http://localhost:5000/images/raffles/${myraffle.imagesRaffle[0]}`}
										alt={
											myraffle?.productTitle ||
											"Imagem Principal do Sorteio!"
										}
										width={280}
										height={10}
										unoptimized
									/>
								)}
							</div>
						</div>
					</div>

					<div className="flex flex-col w-[640px] text-black py-4 pr-4">
						<div className="text-white w-full bg-primary text-center text-lg py-1 mb-4 rounded-md select-none">
							Detalhes do Sorteio
						</div>
						<h1 className="text-xl font-semibold mb-4">
							{myraffle?.rafflePrize}
						</h1>
						<div className="flex flex-row items-center gap-2">
							<Coupon size={17} />
							<span>
								{`Valor do Ticket: ${myraffle?.raffleCost?.toLocaleString(
									"pt-BR",
									{
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}
								)} OP`}
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<BsPersonFill size={17} />
							<span>
								{`Mínimo de Participantes: ${myraffle?.minNumberParticipants}`}
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<LuCalendarRange size={16} />
							<span>
								{`Data do Sorteio: ${
									myraffle?.raffleDate
										? format(
												new Date(myraffle.raffleDate),
												"dd/MM/yyy"
										  )
										: ""
								}`}
							</span>
						</div>

						<div className="flex flex-row items-center gap-2 mb-4">
							{/* <BsPeopleFill size={17} /> */}
							<MdOutlineLocalActivity size={19} />
							<span>
								{`Tickets Registrados: ${myraffle?.registeredTickets.length}`}
							</span>
						</div>

						<div className="">
							<p className="whitespace-pre-wrap break-words mb-2">
								<span className="font-semibold"></span>
								{`Descrição: ${myraffle?.raffleDescription}`}
							</p>
						</div>
						<div className="divider">E</div>
						<div className="">
							<p className="whitespace-pre-wrap break-words mb-2">
								<span className="font-semibold"></span>
								{`Regras: ${myraffle?.raffleRules}`}
							</p>
						</div>
					</div>
				</div>

				{/* Vencedor */}
				<div className="flex flex-col bg-white rounded-md shadow-md mt-4 ml-4 mr-8">
					<div className="w-full bg-primary text-center text-xl py-2 rounded-t-md shadow-md select-none">
						Vencedor do Sorteio
					</div>
					{raffleStatus === "completed" && myraffle?.winner ? (
						<div className="flex flex-row justify-center my-4 mx-4 gap-2">
							<div className="border-[1px] border-black border-opacity-20 bg-white flex flex-row justify-center py-2 px-4 rounded-md shadow-md gap-2">
								<div className="w-[100px] h-[100px]">
									<Image
										className="object-contain w-full h-full pointer-events-none rounded shadow-md"
										src={`http://localhost:5000/images/customers/${myraffle.winner.customerProfileImage}`}
										alt="Vencedor"
										width={260}
										height={130}
										unoptimized
									/>
								</div>
								<div className="flex flex-col">
									<h1 className="text-black font-semibold">
										{`Nome: ${myraffle?.winner.customerName}`}
									</h1>
									<h2 className="text-black">
										{`Ticket Sorteado: ${myraffle?.winner.ticketNumber}`}
									</h2>
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-row justify-center">
							<div className="flex flex-col items-center gap-2">
								<p className="my-2 text-black text-center">
									{raffleStatus === "countdown"
										? "Realizando o sorteio..."
										: "Este sorteio ainda não foi realizado!"}
								</p>
								{raffleStatus === "countdown" && (
									<span className="countdown font-mono text-6xl mb-4">
										<span
											style={{
												["--value" as any]: counter,
											}}></span>
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Botão */}
				<div className="flex flex-row justify-center mt-8">
					{loadingBtn ? (
						<button className="flex flex-row justify-center items-center w-[250px] btn btn-primary shadow-md">
							<span className="loading loading-spinner loading-md"></span>
						</button>
					) : (
						<button
							onClick={handleSubmit}
							className="w-[250px] btn btn-primary shadow-md disabled:bg-gray-400 disabled:text-gray-500"
							disabled={raffleStatus === "completed"}>
							Sortear
						</button>
					)}
				</div>
			</div>
		</section>
	);
}

export default MyRafflesByID;
