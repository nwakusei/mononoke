"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { format } from "date-fns";

// Components
import { RaffleCard } from "@/components/RaffleCard";
import { LoadingPage } from "@/components/LoadingPageComponent";

function RafflesPage() {
	const [raffles, setRaffles] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	const [user, setUser] = useState(null); // Inicializa como null
	const [token] = useState(() => localStorage.getItem("token") || "");

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Faz o lookup para obter o ID correspondente à slug
				const rafflesPromise = await api.get("/raffles/getall-raffles");

				// Busca os dados do usuário, se o token estiver presente
				const userPromise = token
					? api.get("/mononoke/check-user", {
							headers: {
								Authorization: `Bearer ${JSON.parse(token)}`,
							},
					  })
					: Promise.resolve({ data: null }); // Se não estiver logado, retorna uma resposta "vazia" para o usuário

				// Aguarda todas as promessas
				const [rafflesResponse, userResponse] = await Promise.all([
					rafflesPromise,
					userPromise,
				]);

				setRaffles(rafflesResponse.data.raffles);
				// Se o usuário estiver logado, atualiza os dados do usuário
				if (userResponse.data) {
					setUser(userResponse.data);
				}
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setIsLoading(false); // Encerra o estado de carregamento
			}
		};

		setIsLoading(true); // Ativa o estado de carregamento antes de iniciar a busca
		fetchData();
	}, [token]);

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
			<div className="flex flex-col items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-8 mb-8">
				<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mb-6 rounded-md shadow-md select-none">
					Sorteios em Destaque
				</div>

				<div className="flex flex-row flex-wrap gap-4 justify-center">
					{raffles.length > 0 ? (
						raffles.map((raffle, index) => (
							<RaffleCard
								key={index}
								viewAdultContent={user?.viewAdultContent}
								raffle={raffle}
								rafflePrize={raffle.rafflePrize}
								raffleImage={`http://localhost:5000/images/raffles/${raffle.imagesRaffle[0]}`}
								raffleDate={`${format(
									new Date(raffle.raffleDate),
									"dd/MM"
								)}`}
								raffleCost={raffle.raffleCost}
								raffleOrganizer={raffle.raffleOrganizer}
								linkRafflePage={`/raffles/${raffle._id}`}
							/>
						))
					) : (
						<div className="text-black text-center bg-white p-2 min-w-[400px] rounded-md shadow-md">
							Nenhum Sorteio disponível no momento!
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

export default RafflesPage;
