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

	useEffect(() => {
		api.get("/raffles/get-raffles").then((response) => {
			console.log(response.data);
			setRaffles(response.data.raffles);
			setIsLoading(false);
		});
	}, []);

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
			<div className="flex flex-col col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-8 mb-8">
				<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mb-6 rounded-md shadow-md select-none">
					Sorteios em Destaque
				</div>

				<div className="flex flex-row flex-wrap gap-4 justify-center">
					{raffles.length > 0 ? (
						raffles.map((raffle, index) => (
							<RaffleCard
								key={index}
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
