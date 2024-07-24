"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { format } from "date-fns";

// Components
import { RaffleCard } from "@/components/RaffleCard";

function RafflesPage() {
	const [raffles, setRaffles] = useState([]);

	useEffect(() => {
		api.get("/raffles/get-raffles").then((response) => {
			console.log(response.data);
			setRaffles(response.data.raffles);
		});
	}, []);

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 mx-4">
			<div className="flex flex-col justify-center items-center bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-8">
				<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mt-8 mb-8 rounded-md shadow-md select-none">
					Sorteios em Destaque
				</div>

				<div className="flex flex-row flex-wrap gap-4 justify-center">
					{raffles.length > 0 &&
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
						))}
				</div>
			</div>
		</section>
	);
}

export default RafflesPage;
