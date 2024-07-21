"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format } from "date-fns";

// Axios
import api from "@/utils/api";

// Contexts
import { Context } from "@/context/UserContext";

// Components
import { ProductVariation } from "@/components/ProductVariation";
import { SideComponent } from "@/components/SideComponent";

// Importe suas imagens e ícones aqui
import Amora from "../../../../../public/amora.jpg";
import imageProfile from "../../../../../public/Kon.jpg";

// Icons
import { Currency } from "@icon-park/react";
import { MdVerified } from "react-icons/md";
import { LuCalendarRange } from "react-icons/lu";
import { MdOutlineLocalActivity, MdOutlineStore } from "react-icons/md";
import { BsPersonFill, BsPeopleFill } from "react-icons/bs";

function RafflePage() {
	const { id } = useParams();
	const [raffle, setRaffle] = useState({});
	const [maximizedImageProduct, setMaximizedImageProduct] = useState(null);
	const [maximizedImage, setMaximizedImage] = useState(null);

	console.log(raffle);

	useEffect(() => {
		const fetchRaffle = async () => {
			try {
				const response = await api.get(`/raffles/${id}`);
				setRaffle(response.data.raffle);
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

	if (!raffle || !raffle.raffleCost || !raffle.activeParticipants) {
		return <div>Loading...</div>; // Ou qualquer outro componente de carregamento ou mensagem de erro
	}

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 mx-4 mt-4">
			<div className="flex flex-col bg-yellow-500 gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="flex flex-row gap-8">
					{/* Componente de Imagem Principal */}
					<div className="flex flex-col">
						<div className="bg-base-100 w-[402px] rounded-md relative shadow-lg mb-2">
							<div className="h-[402px] flex items-center justify-center mx-3 my-2">
								{raffle.imagesRaffle &&
									raffle.imagesRaffle.length > 0 && (
										<Image
											className="object-contain h-full"
											src={`http://localhost:5000/images/raffles/${raffle.imagesRaffle[0]}`}
											alt={raffle.productName}
											width={280}
											height={10}
											unoptimized
										/>
									)}
							</div>
						</div>
						{/* Pequenas imagens */}
						<div className="flex flex-row gap-2">
							{raffle.imagesRaffle &&
								raffle.imagesRaffle.length > 0 &&
								raffle.imagesRaffle.map((image, id) => (
									<div className="bg-base-100 w-[74px] rounded relative shadow-lg">
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
					<div className="flex flex-col w-[700px]">
						<div className="w-full bg-primary text-center text-lg py-1 mb-4 rounded-md">
							Detalhes do Sorteio
						</div>
						<h1 className="text-xl font-semibold mb-4">
							{raffle.rafflePrize}
						</h1>
						<div className="flex flex-row items-center gap-2">
							<MdOutlineLocalActivity
								className="mt-[1px]"
								size={19}
							/>
							<span>
								Valor do Ticket:{" "}
								{raffle.raffleCost.toLocaleString("pt-BR")} OP
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<BsPersonFill size={17} />
							<span>
								Mínimo de Participantes:{" "}
								{raffle.minNumberParticipants}
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<LuCalendarRange size={16} />

							<span>Data do Sorteio: 13/06</span>
						</div>

						<div className="flex flex-row items-center gap-2">
							<BsPeopleFill size={17} />
							<span>
								Participantes Registrados:{" "}
								{raffle.activeParticipants.length}
							</span>
						</div>

						<div className="flex flex-row items-center gap-2 mb-4">
							<MdOutlineStore size={18} />
							<div>
								Organizado por{" "}
								<span className="text-blue-300 transition-all ease-in hover:text-blue-100 cursor-pointer">
									{raffle.raffleOrganizer}
								</span>
							</div>
						</div>
						<div>
							<h2 className="mb-2">
								<span className="font-semibold">
									Descrição:
								</span>{" "}
								{raffle.raffleDescription}
							</h2>
						</div>
						<div>
							<h2 className="">
								<span className="font-semibold">Regras:</span>{" "}
								{raffle.raffleRules}
							</h2>
						</div>
					</div>
				</div>
			</div>

			{/* Descrição do produto*/}
			<div className="bg-yellow-500 gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				{/* Descrição e Detalhes*/}
				<div className="flex flex-col justify-center items-center">
					<h1 className="w-full bg-primary text-center text-xl py-2 rounded-md shadow-md select-none">
						Vencedor do Sorteio
					</h1>
					{/* <p>{product.description}</p> */}Este sorteio ainda não
					foi realizado!
				</div>
			</div>
		</section>
	);
}

export default RafflePage;
