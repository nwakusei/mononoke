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

	useEffect(() => {
		api.get(`/raffles/partner-raffle/${id}`, {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			console.log("API Response:", response.data.raffle); // Verifique o conteúdo da resposta
			setMyraffle(response.data.raffle);
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
				<div className="flex flex-row gap-8 bg-white ml-4 mr-8 rounded-md shadow-md">
					{/* Componente de Imagem Principal */}
					<div className="flex flex-col py-4 pl-4">
						<div className="border-[1px] border-black border-opacity-20 bg-white w-[402px] rounded-md relative shadow-lg">
							<div className="h-[402px] flex items-center justify-center mx-3 my-2">
								{myraffle?.imagesRaffle &&
									myraffle?.imagesRaffle.length > 0 && (
										<Image
											className="object-contain h-full"
											src={`http://localhost:5000/images/raffles/${myraffle?.imagesRaffle[0]}`}
											alt={myraffle?.productName}
											width={280}
											height={10}
											unoptimized
										/>
									)}
							</div>
						</div>
					</div>

					{/* Componente intermediário */}
					<div className="flex flex-col w-[700px] text-black py-4 pr-4">
						<div className="text-white w-full bg-primary text-center text-lg py-1 mb-4 rounded-md select-none">
							Detalhes do Sorteio
						</div>
						<h1 className="text-xl font-semibold mb-4">
							{myraffle?.rafflePrize}
						</h1>
						<div className="flex flex-row items-center gap-2">
							{/* <MdOutlineLocalActivity
								className="mt-[1px]"
								size={19}
							/> */}
							<Coupon size={17} />
							<span>
								Valor do Ticket:{" "}
								{myraffle?.raffleCost?.toLocaleString("pt-BR")}{" "}
								OP
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<BsPersonFill size={17} />
							<span>
								Mínimo de Participantes:{" "}
								{myraffle?.minNumberParticipants}
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<LuCalendarRange size={16} />

							<span>
								{`Data do Sorteio: ${
									myraffle?.raffleDate
										? format(
												new Date(myraffle?.raffleDate),
												"dd/MM/yyy"
										  )
										: ""
								}`}
							</span>
						</div>

						<div className="flex flex-row items-center gap-2 mb-2">
							{/* <BsPeopleFill size={17} /> */}
							<MdOutlineLocalActivity size={19} />
							<span>
								Tickets Registrados:{" "}
								{myraffle?.registeredTickets?.length}
							</span>
						</div>
						<div>
							<h2 className="mb-2">
								<span className="font-semibold">
									Descrição:
								</span>{" "}
								{myraffle?.raffleDescription}
							</h2>
						</div>
						<div>
							<h2 className="">
								<span className="font-semibold">Regras:</span>{" "}
								{myraffle?.raffleRules}
							</h2>
						</div>
					</div>
				</div>

				{/* Descrição e Detalhes*/}
				<div className="flex flex-col bg-white rounded-md shadow-md mt-4 ml-4 mr-8">
					<div className="w-full bg-primary text-center text-xl py-2 rounded-t-md shadow-md select-none">
						Vencedor do Sorteio
					</div>
					{myraffle?.winner ? (
						<>
							<div className="flex flex-row my-4 mx-4 gap-2">
								<div className="bg-ametista w-[100px] h-[100px] rounded-md">
									Foto
								</div>
								<div className="flex flex-col">
									<h1 className="text-black font-semibold">
										{myraffle?.winner.customerName}
									</h1>
									<h2 className="text-black">
										{`Ticket Sorteado: ${myraffle?.winner.ticketNumber}`}
									</h2>
								</div>
							</div>
						</>
					) : (
						<>
							<p className="my-2 text-black text-center">
								Este sorteio ainda não foi realizado!
							</p>
						</>
					)}
				</div>

				<div className="flex flex-row justify-center mt-8">
					{loadingBtn ? (
						<button className="flex flex-row justify-center items-center w-[250px] btn btn-primary shadow-md">
							<span className="loading loading-spinner loading-md"></span>
						</button>
					) : (
						<button
							onClick={handleSubmit}
							className="w-[250px] btn btn-primary shadow-md">
							Sortear
						</button>
					)}
				</div>
			</div>
		</section>
	);
}

export default MyRafflesByID;
