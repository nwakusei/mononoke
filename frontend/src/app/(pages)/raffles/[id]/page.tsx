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
import { BsStarFill } from "react-icons/bs";
import { MdVerified } from "react-icons/md";

function RafflePage() {
	const { id } = useParams();
	const [raffle, setRaffle] = useState({});

	useEffect(() => {
		const fetchRaffle = async () => {
			try {
				const response = await api.get(`/raffles/${id}`);
				setRaffle(response.data.product);
			} catch (error) {
				console.error("Error fetching product:", error);
			}
		};

		fetchRaffle();
	}, [id]);

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 mx-4 mt-4">
			<div className="bg-yellow-500 flex flex-row justify-between gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				{/* Componente de Imagem Principal */}
				<div className="flex flex-col">
					<div className="bg-base-100 w-[402px] rounded-md relative shadow-lg mb-2">
						<div className="h-[402px] flex items-center justify-center mx-3 my-2">
							Imagem
						</div>
					</div>
				</div>

				{/* Descrição do produto*/}
				<div className="bg-yellow-500 gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
					{/* Descrição e Detalhes*/}
					<div className="flex flex-col justify-center items-center">
						<h1 className="w-full bg-primary text-center text-xl py-2 rounded-md shadow-md select-none">
							Descrição e Detalhes do Sorteio
						</h1>
					</div>
				</div>
			</div>
		</section>
	);
}

export default RafflePage;
