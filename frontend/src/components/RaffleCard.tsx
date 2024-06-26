"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// Icons
import { Currency } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill } from "react-icons/bs";
import { LiaShippingFastSolid } from "react-icons/lia";
import { RiCopperCoinLine } from "react-icons/ri";
import { LuCalendarRange } from "react-icons/lu";

function RaffleCard({ rafflePrize, raffleDate, raffleCost, raffleOrganizer }) {
	return (
		<div className="bg-base-100 w-[254px] flex flex-col rounded-md relative pb-2 shadow-lg">
			<div className="flex flex-col items-center justify-center h-[220px] mx-3 mt-2 -mb-3">
				Imagem
			</div>
			<div className="divider text-sm mx-2">Detalhes</div>
			<div className="flex flex-col justify-center mx-4 -mt-2">
				<div>
					<h1 className="font-semibold text-base line-clamp-2 whitespace-normal min-h-[48px] mb-2">
						{rafflePrize}
					</h1>
				</div>
				<div>
					<div className="flex flex-row items-center gap-1 text-base mb-2">
						<LuCalendarRange size={18} />
						<span>{raffleDate}</span>
					</div>
					<div className="flex flex-row items-center gap-1 text-center text-sm mb-2">
						<RiCopperCoinLine size={18} />{" "}
						<span>{raffleCost} OP</span>
					</div>
					<h2 className="text-yellow-500 text-sm flex flex-row items-center gap-2 mb-2">
						{raffleOrganizer}
					</h2>
				</div>
				<button className="btn btn-primary w-full mb-2">
					{/* <Link>+ Detalhes</Link> */}+ Detalhes
				</button>
			</div>
		</div>
	);
}

export { RaffleCard };
