"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// Icons
import { Currency } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill } from "react-icons/bs";
import { LiaShippingFastSolid } from "react-icons/lia";
import { RiAuctionLine, RiCopperCoinLine } from "react-icons/ri";

function OtaclubPCard({ productImage, title, cashback, quantitySold }) {
	return (
		<div className="bg-base-100 w-[254px] flex flex-col rounded-md relative pb-2 shadow-lg">
			<div className="flex flex-col items-center justify-center h-[220px] mx-3 mt-2 -mb-3">
				<span className="flex justify-center items-center bg-primary text-center rounded-tr-md rounded-bl-md absolute w-[80px] h-[30px] ml-[144px] md:ml-[174px] -mt-[206px] ">
					10% Off
				</span>
				<div className="flex flex-col object-contain w-full h-full pb-5">
					<Image
						className="object-contain w-full h-full"
						src={productImage}
						alt="Product Image"
					/>
					<span className="flex flex-row items-center justify-center gap-2 bg-primary -mx-1 text-center rounded">
						<LiaShippingFastSolid size={18} />
						Frete Grátis
					</span>
				</div>
			</div>
			<div className="divider text-sm mx-2">Detalhes</div>
			<div className="flex flex-col justify-center mx-4 -mt-3">
				<div>
					<h1 className="font-semibold text-base line-clamp-2 whitespace-normal mb-2 min-h-[48px]">
						{title}
					</h1>
				</div>
				<div>
					<h1 className="flex flex-row items-center text-base gap-1">
						<RiCopperCoinLine size={15} />
						<span className="text-purple-400 mr-2">50</span>
					</h1>
					<h2 className="text-yellow-500 text-sm flex flex-row items-center gap-2 mb-2">
						5.0
						<BsStarFill size={12} />
						<BsStarFill size={12} />
						<BsStarFill size={12} />
						<BsStarFill size={12} />
						<BsStarFill size={12} />
					</h2>
					<button className="btn btn-primary w-full mb-2">
						<Link href={"/otamart/:id"}>Ver mais</Link>
					</button>
				</div>
			</div>
		</div>
	);
}

export { OtaclubPCard };
