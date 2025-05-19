// Imports Essenciais
import Image from "next/image";
import Link from "next/link";

// Icons
import { Currency } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill } from "react-icons/bs";
import { LiaShippingFastSolid } from "react-icons/lia";

// Imagens
import AdultProductCover from "../../public/adult-content-cover.png";
import {
	RiCopperCoinLine,
	RiTokenSwapLine,
	RiSwapLine,
	RiSwap2Line,
} from "react-icons/ri";

function ProductAdCardOtaclub({
	viewAdultContent,
	product,
	freeShipping,
	productImage,
	title,
	originalPrice,
	linkProductPage,
}) {
	// LÓGICA DE EXIBIÇÃO DE CONTEÚDO ADULTO
	const isContentAllowed =
		product.adultProduct === true &&
		(viewAdultContent === false || viewAdultContent === undefined)
			? false // Se o produto for adulto e o usuário não pode ver ou está deslogado, não exibe
			: true; // Exibe o produto se for não adulto ou o usuário pode ver conteúdo adulto

	return (
		<div className="bg-white w-[254px] flex flex-col rounded-md relative pb-2 shadow-md select-none">
			<div className="flex flex-col items-center justify-center h-[220px] mx-3 mt-2 -mb-3">
				{freeShipping === true ? (
					<div className="flex flex-col object-contain w-full h-full select-none pointer-events-none">
						<Image
							className="object-contain w-full h-full"
							src={
								isContentAllowed
									? productImage
									: AdultProductCover
							}
							alt="Product Image"
							width={10}
							height={10}
							unoptimized
						/>
						<span className="flex flex-row items-center justify-center gap-2 bg-primary -mx-1 text-center rounded relative bottom-5">
							<LiaShippingFastSolid size={18} />
							Frete Grátis
						</span>
					</div>
				) : (
					<div className="flex flex-col object-contain w-full h-full select-none pointer-events-none">
						<Image
							className="object-contain w-full h-full"
							src={
								isContentAllowed
									? productImage
									: AdultProductCover
							}
							alt="Product Image"
							width={10}
							height={10}
							unoptimized
						/>
					</div>
				)}
			</div>
			<div className="divider before:border-t-[1px] after:border-t-[1px] before:bg-black after:bg-black text-sm text-black mx-2">
				Detalhes
			</div>
			<div className="flex flex-col justify-center mx-4">
				<div className="-mt-2">
					<h1 className="font-semibold text-base text-black line-clamp-2 whitespace-normal min-h-[46px] mb-1">
						{title}
					</h1>
				</div>
				<div className="mb-3">
					<div className="flex flex-row items-center text-base text-black gap-2">
						<RiCopperCoinLine className="mt-[1px]" size={18} />
						<span>{originalPrice.toLocaleString()} OP</span>
					</div>
				</div>
				<button className="flex flex-row items-center btn btn-primary w-full mb-2 shadow-md">
					{/* <RiTokenSwapLine size={20} /> */}
					<RiSwap2Line size={20} />
					<span>
						<Link href={linkProductPage}>Trocar</Link>
					</span>
				</button>
			</div>
		</div>
	);
}

export { ProductAdCardOtaclub };
