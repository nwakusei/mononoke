"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Axios
import api from "@/utils/api";

// Components
import { LoadingPage } from "@/components/LoadingPageComponent";

// Icons
import { LuCalendarRange } from "react-icons/lu";
import { MdOutlineLocalActivity, MdOutlineStore } from "react-icons/md";
import { BsPersonFill, BsPeopleFill } from "react-icons/bs";
import { Coupon } from "@icon-park/react";

function RafflePage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const { id } = useParams();
	const [raffle, setRaffle] = useState({});
	const [maximizedImageProduct, setMaximizedImageProduct] = useState(null);
	const [maximizedImage, setMaximizedImage] = useState(null);
	const [loadingBtn, setLoadingBtn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRaffle = async () => {
			try {
				const response = await api.get(`/raffles/get-raffle/${id}`);
				setRaffle(response.data.raffle);
				setIsLoading(false);
			} catch (error) {
				console.error("Error fetching product:", error);
			}
		};

		fetchRaffle();
	}, [id]);

	const handleOpenImagesProduct = (image) => {
		setMaximizedImageProduct(image);
	};

	const handleCloseImagesProduct = () => {
		setMaximizedImageProduct(null);
	};

	async function handleSubmit() {
		setLoadingBtn(true);
		try {
			await api
				.post(`/raffles/subscription/${id}`, {
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
			<div className="bg-white rounded-md shadow-md p-4 flex flex-col gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-8">
				<div className="flex flex-row gap-8">
					{/* Componente de Imagem Principal */}
					<div className="flex flex-col">
						<div className="border-[1px] border-black border-opacity-20 bg-white w-[402px] rounded-md relative shadow-lg mb-2">
							<div className="h-[402px] flex items-center justify-center mx-3 my-2">
								{raffle?.imagesRaffle &&
									raffle?.imagesRaffle.length > 0 && (
										<Image
											className="object-contain h-full"
											src={`http://localhost:5000/images/raffles/${raffle?.imagesRaffle[0]}`}
											alt={raffle?.productName}
											width={280}
											height={10}
											unoptimized
										/>
									)}
							</div>
						</div>
						{/* Pequenas imagens */}
						<div className="flex flex-row gap-2">
							{raffle?.imagesRaffle &&
								raffle?.imagesRaffle.length > 0 &&
								raffle?.imagesRaffle.map((image, id) => (
									<div className="border-[1px] border-black border-opacity-20 bg-white w-[74px] rounded relative shadow-md">
										<div
											key={id}
											className="h-[74px] flex items-center justify-center">
											<Image
												className="object-contain h-full cursor-pointer"
												src={`http://localhost:5000/images/raffles/${image}`}
												alt="Shoes"
												onClick={() =>
													handleOpenImagesProduct(
														image
													)
												}
												width={50}
												height={10}
											/>
										</div>
									</div>
								))}
						</div>
						{/* Renderizar imagem maximizada se existir */}
						{maximizedImageProduct && (
							<div className="fixed inset-0 z-50 overflow-auto flex items-center justify-center">
								<div className="relative max-w-full max-h-full">
									<Image
										className="object-contain max-w-full max-h-full rounded-md"
										src={`http://localhost:5000/images/raffles/${maximizedImageProduct}`}
										alt="Maximized Image"
										width={400}
										height={200}
										unoptimized
									/>

									<button
										className="absolute top-4 right-4 bg-error px-3 py-1 rounded shadow-md text-white"
										onClick={handleCloseImagesProduct}>
										✕
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Componente intermediário */}
					<div className="flex flex-col w-[700px] text-black">
						<div className="text-white w-full bg-primary text-center text-lg py-1 mb-4 rounded-md select-none">
							Detalhes do Sorteio
						</div>
						<h1 className="text-xl font-semibold mb-4">
							{raffle?.rafflePrize}
						</h1>
						<div className="flex flex-row items-center gap-2">
							{/* <MdOutlineLocalActivity
								className="mt-[1px]"
								size={19}
							/> */}
							<Coupon size={17} />
							<span>
								Valor do Ticket:{" "}
								{raffle?.raffleCost.toLocaleString("pt-BR")} OP
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<BsPersonFill size={17} />
							<span>
								Mínimo de Participantes:{" "}
								{raffle?.minNumberParticipants}
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<LuCalendarRange size={16} />

							<span>
								{`Data do Sorteio: ${
									raffle?.raffleDate
										? format(
												new Date(raffle?.raffleDate),
												"dd/MM/yyy"
										  )
										: ""
								}`}
							</span>
						</div>

						<div className="flex flex-row items-center gap-2">
							{/* <BsPeopleFill size={17} /> */}
							<MdOutlineLocalActivity size={19} />
							<span>
								Tickets Registrados:{" "}
								{raffle?.registeredTickets.length}
							</span>
						</div>

						<div className="flex flex-row items-center gap-2 mb-4">
							<MdOutlineStore size={18} />
							<div>
								Organizado por{" "}
								<span className="text-primary transition-all ease-in duration-200 hover:text-secondary cursor-pointer">
									{raffle?.raffleOrganizer}
								</span>
							</div>
						</div>
						<div>
							<h2 className="mb-2">
								<span className="font-semibold">
									Descrição:
								</span>{" "}
								{raffle?.raffleDescription}
							</h2>
						</div>
						<div>
							<h2 className="">
								<span className="font-semibold">Regras:</span>{" "}
								{raffle?.raffleRules}
							</h2>
						</div>
					</div>
				</div>
				<div className="flex flex-row justify-center">
					{loadingBtn ? (
						<button className="flex flex-row justify-center items-center w-[250px] btn btn-primary shadow-md">
							<span className="loading loading-spinner loading-md"></span>
						</button>
					) : (
						<button
							onClick={handleSubmit}
							className="w-[250px] btn btn-primary shadow-md">
							Inscrever-se
						</button>
					)}
				</div>
			</div>

			{/* Descrição do produto*/}
			<div className="bg-white rounded-md shadow-md gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-8">
				{/* Descrição e Detalhes*/}
				<div className="flex flex-col">
					<div className="w-full bg-primary text-center text-xl py-2 rounded-t-md shadow-md select-none">
						Vencedor do Sorteio
					</div>
					{raffle?.winner ? (
						<>
							<div className="flex flex-row my-4 mx-4 gap-2">
								<div className="bg-ametista w-[100px] h-[100px] rounded-md">
									Foto
								</div>
								<div className="flex flex-col">
									<h1 className="text-black font-semibold">
										{raffle?.winner.customerName}
									</h1>
									<h2 className="text-black">
										{`Ticket Sorteado: ${raffle?.winner.ticketNumber}`}
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
			</div>
		</section>
	);
}

export default RafflePage;
