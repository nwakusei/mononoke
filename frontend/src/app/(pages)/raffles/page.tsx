"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Image from "next/image";
import api from "@/utils/api";

// Context
import { Context } from "@/context/UserContext";

// Icons
import { Currency } from "@icon-park/react";
import { Financing, Cd } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill } from "react-icons/bs";
import { GiEvilBook, GiArchitectMask, GiBattleMech } from "react-icons/gi";
import { IoGameControllerOutline } from "react-icons/io5";
import { LuDisc3 } from "react-icons/lu";
import { PiTShirtLight, PiTShirt } from "react-icons/pi";
import { BsSmartwatch } from "react-icons/bs";
import { FaHatWizard } from "react-icons/fa";
import { TbCards } from "react-icons/tb";
import { LuPencilRuler } from "react-icons/lu";
import { RiPencilRuler2Line } from "react-icons/ri";
import { GiProtectionGlasses } from "react-icons/gi";
import { GiSunglasses } from "react-icons/gi";
import { LiaShippingFastSolid } from "react-icons/lia";

// Components
import { RaffleCard } from "@/components/RaffleCard";

function RafflesPage() {
	const [raffles, setRaffles] = useState([]);

	console.log(raffles);

	useEffect(() => {
		api.get("/raffles/").then((response) => {
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
								raffleDate={raffle.raffleDate}
								raffleCost={raffle.raffleCost}
								raffleOrganizer={raffle.raffleOrganizer}
							/>
						))}
				</div>
			</div>
		</section>
	);
}

export default RafflesPage;
