"use client";

import { useState } from "react";
import Image from "next/image";

// Imagens
import Otakuyasan from "../../../../public/otakuyasan.png";
import Amora from "../../../../public/amora.jpg";
import Konekoshouten from "../../../../public/konekoshouten.jpg";
import Lycoris from "../../../../public/lycoris.jpg";
import Otakuyasan2 from "../../../../public/otakuyasan2.png";

// Icons
import { Currency } from "@icon-park/react";
import { BiTimeFive, BiBullseye } from "react-icons/Bi";
import { BsBullseye } from "react-icons/bs";
import {
	PiHandHeartFill,
	PiHandHeartDuotone,
	PiHandHeartLight,
	PiHandHeart,
} from "react-icons/pi";

function OtakrowdfundingPage() {
	const [progress, setProgress] = useState("20");

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-2 gap-4 mx-4">
			<div className="bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="divider text-center text-xl md:text-2xl font-semibold mb-2">
					Projetos em Destaque
				</div>

				<p className="text-center mb-4">
					※ Apoie projetos voltados para a comunidade Otaku ※
				</p>

				<div className="flex flex-row flex-wrap gap-6 justify-center mb-4">
					<div className="bg-base-100 w-full md:w-[340px] flex flex-col rounded-md relative shadow-lg">
						<div className="h-[130px] md:h-[200px] mx-4 mt-2 -mb-3 flex items-center justify-center">
							<Image
								className="object-contain w-full h-full"
								src={Otakuyasan}
								alt="Cover"
							/>
						</div>
						<div className="divider mx-2">Campanha</div>
						<div className="h-[240px] flex flex-col justify-center mx-4 -mt-5">
							<h1 className="text-base font-semibold truncate gap-2 mb-2">
								Sociedade das Relíquias
								Literáriasddadadasdasdasdasdasdsdsadasda
							</h1>
							<h1 className="text-base flex flex-row items-center gap-2">
								<PiHandHeartDuotone size={18} />
								50 Apoiadores
							</h1>
							<h2 className="text-base mb-2">
								<span className="flex flex-row items-center gap-2">
									<BiTimeFive size={18} />
									10 dias restante
								</span>
							</h2>
							<p className="flex flex-row justify-between items-center gap-2 text-center text-sm text-purple-300 mb-1">
								<span>R$ 0,00</span>
								<span>{progress}%</span>
							</p>
							<progress
								className="progress progress-primary w-full mb-1"
								value={String(progress)}
								max="100"></progress>
							<p className="flex flex-row justify-between items-center gap-2 text-center text-xs mb-4">
								<span className="italic">Arrecadado</span>
								<span className="italic">Meta Alcançada</span>
							</p>
							<button className="btn btn-primary">
								Saiba Mais
							</button>
						</div>
					</div>

					<div className="bg-base-100 w-full md:w-[340px] flex flex-col rounded-md relative shadow-lg">
						<div className="h-[130px] md:h-[200px] mx-4 mt-2 -mb-3 flex items-center justify-center">
							<Image
								className="object-contain w-full h-full"
								src={Otakuyasan}
								alt="Cover"
							/>
						</div>
						<div className="divider mx-2">Campanha</div>
						<div className="h-[240px] flex flex-col justify-center mx-4 -mt-5">
							<h1 className="text-base font-semibold truncate gap-2 mb-2">
								Sociedade das Relíquias
								Literáriasddadadasdasdasdasdasdsdsadasda
							</h1>
							<h1 className="text-base flex flex-row items-center gap-2">
								<PiHandHeartDuotone size={18} />
								50 Apoiadores
							</h1>
							<h2 className="text-base mb-2">
								<span className="flex flex-row items-center gap-2">
									<BiTimeFive size={18} />
									10 dias restante
								</span>
							</h2>
							<p className="flex flex-row justify-between items-center gap-2 text-center text-sm text-purple-300 mb-1">
								<span>R$ 0,00</span>
								<span>{progress}%</span>
							</p>
							<progress
								className="progress progress-primary w-full mb-1"
								value={String(progress)}
								max="100"></progress>
							<p className="flex flex-row justify-between items-center gap-2 text-center text-xs mb-4">
								<span className="italic">Arrecadado</span>
								<span className="italic">Meta Alcançada</span>
							</p>
							<button className="btn btn-primary">
								Saiba Mais
							</button>
						</div>
					</div>

					<div className="bg-base-100 w-full md:w-[340px] flex flex-col rounded-md relative shadow-lg">
						<div className="h-[130px] md:h-[200px] mx-4 mt-2 -mb-3 flex items-center justify-center">
							<Image
								className="object-contain w-full h-full"
								src={Otakuyasan}
								alt="Cover"
							/>
						</div>
						<div className="divider mx-2">Campanha</div>
						<div className="h-[240px] flex flex-col justify-center mx-4 -mt-5">
							<h1 className="text-base font-semibold truncate gap-2 mb-2">
								Sociedade das Relíquias
								Literáriasddadadasdasdasdasdasdsdsadasda
							</h1>
							<h1 className="text-base flex flex-row items-center gap-2">
								<PiHandHeartDuotone size={18} />
								50 Apoiadores
							</h1>
							<h2 className="text-base mb-2">
								<span className="flex flex-row items-center gap-2">
									<BiTimeFive size={18} />
									10 dias restante
								</span>
							</h2>
							<p className="flex flex-row justify-between items-center gap-2 text-center text-sm text-purple-300 mb-1">
								<span>R$ 0,00</span>
								<span>{progress}%</span>
							</p>
							<progress
								className="progress progress-primary w-full mb-1"
								value={String(progress)}
								max="100"></progress>
							<p className="flex flex-row justify-between items-center gap-2 text-center text-xs mb-4">
								<span className="italic">Arrecadado</span>
								<span className="italic">Meta Alcançada</span>
							</p>
							<button className="btn btn-primary">
								Saiba Mais
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default OtakrowdfundingPage;
