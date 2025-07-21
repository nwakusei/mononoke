"use client";

// Imports principais
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
// import { useRouter } from "next/navigation";

// Fonte
import { Poppins } from "next/font/google";

const poppins = Poppins({
	subsets: ["latin"],
	weight: ["400", "600", "700"], // você pode adicionar os pesos que quiser
});

// Icons
import { FaArrowDownLong, FaArrowRightLong } from "react-icons/fa6";

// Imaagens
import Banner from "../../public/banner.png";
import marketplace from "../../public/ecommerce02.png";
import cashback from "../../public/cashback02.png";
import club from "../../public/club02.png";
import discount from "../../public/discount02.png";
import raffle from "../../public/raffle02.png";
import mononoke_masc from "../../public/mononoke_masc.png";
import { IoCloseSharp } from "react-icons/io5";

function HomePage() {
	const [showBanner, setShowBanner] = useState(false);

	// exibe o banner apenas na primeira visita
	useEffect(() => {
		if (localStorage.getItem("homeBannerDismissed") !== "1") {
			setShowBanner(true);
		}
	}, []);

	function handleClose() {
		localStorage.setItem("homeBannerDismissed", "1");
		setShowBanner(false);
	}

	return (
		<>
			{showBanner && (
				<div className="block sm:hidden fixed top-[70px] left-0 w-full z-[9999] p-4">
					<div
						role="note"
						className="flex items-start justify-between bg-slate-800 p-4 rounded-md shadow-md gap-4">
						<div>
							<h2 className="text-lg text-white font-semibold mb-2">
								Importante
							</h2>
							<p className="text-base text-white mb-2">
								Para melhor utilização, sugerimos que acesse
								nosso site prioritariamente via PC. Ainda
								estamos aplicando a responsividade, então você
								verá os elementos fora de lugar ao acessar via
								Smartphone.
							</p>
						</div>

						<button
							onClick={handleClose}
							aria-label="Fechar banner"
							className="p-1 transition-all ease-in duration-150 border-[1px] border-dashed border-white hover:bg-primary hover:text-white rounded shrink-0">
							<IoCloseSharp size={24} />
						</button>
					</div>
				</div>
			)}
			<section
				className={`min-h-screen bg-home grid grid-cols-8 ${
					showBanner
						? "blur-sm sm:blur-none pointer-events-none select-none"
						: ""
				}`}>
				<div className="col-span-12 bg-white relative z-10">
					<div className="grid grid-cols-12">
						<div className="col-start-3 col-span-8 px-8 pt-8 pb-8 flex flex-row justify-center text-black relative">
							<div>
								<div
									className={`${poppins.className} text-4xl font-bold mb-4`}>
									<div className="text-slate-800">
										SEU{" "}
										<span className="text-primary">
											UNIVERSO OTAKU
										</span>{" "}
										COMPLETO
									</div>
								</div>
								<p className="text-xl text-slate-800">
									Mononoke reúne vários benefícios voltados
									para os fãs de anime, mangá, games e cultura
									pop japonesa em geral...
								</p>
							</div>

							{/* IMAGEM VAZANDO */}
							<div className="relative w-[350px] h-[350px] -mb-[170px] z-20">
								<Image
									src={mononoke_masc}
									alt="Marketplace"
									style={{ objectFit: "contain" }}
									unoptimized
									priority
								/>
							</div>
						</div>
					</div>
				</div>

				{/* BLOCO DE BAIXO */}
				<div className="flex flex-col justify-center items-center bg-primary text-black col-span-12 p-8 relative z-0">
					<h1
						className={`${poppins.className} text-3xl text-white font-bold mb-2`}>
						NOSSOS BENEFÍCIOS
					</h1>
					<p className="text-xl text-white mb-8">
						Tudo que um verdadeiro otaku precisa em um só lugar!
					</p>

					<div className="flex flex-row justify-center flex-wrap gap-8 mb-4 max-w-[1200px]">
						<div className="flex flex-col justify-between p-4 w-[350px] h-[230px] bg-black opacity-80 rounded-md shadow-md transition-transform duration-300 hover:scale-110">
							<Image
								className="w-[80px]"
								src={marketplace}
								alt="Marketplace"
								width={10}
								height={10}
								unoptimized
								priority
							/>

							<div className="flex flex-col">
								<span className="text-white text-lg font-semibold">
									Marketplace Integrado
								</span>
								<span className="text-white">
									Compre os melhores produtos otaku
									diretamente de lojas confiáveis, tudo em um
									só lugar.
								</span>
							</div>
						</div>

						<div className="flex flex-col justify-between p-4 w-[350px] h-[230px] bg-black opacity-80 rounded-md shadow-md transition-transform duration-300 hover:scale-110">
							<Image
								className="w-[80px]"
								src={cashback}
								alt="Marketplace"
								width={10}
								height={10}
								unoptimized
								priority
							/>

							<div className="flex flex-col">
								<span className="text-white text-lg font-semibold">
									Cashback em Todas as Compras
								</span>
								<span className="text-white">
									Ganhe parte do seu dinheiro de volta em
									todas as compras realizadas na plataforma.
								</span>
							</div>
						</div>

						<div className="flex flex-col justify-between p-4 w-[350px] h-[230px] bg-black opacity-80 rounded-md shadow-md transition-transform duration-300 hover:scale-110">
							<Image
								className="w-[80px]"
								src={club}
								alt="Marketplace"
								width={10}
								height={10}
								unoptimized
								priority
							/>

							<div className="flex flex-col">
								<span className="text-white text-lg font-semibold">
									Clube de Pontos
								</span>
								<span className="text-white">
									Acumule pontos em todas as suas compras e
									troque por produtos exclusivos.
								</span>
							</div>
						</div>

						<div className="flex flex-col justify-between p-4 w-[350px] h-[230px] bg-black opacity-80 rounded-md shadow-md transition-transform duration-300 hover:scale-110">
							<Image
								className="w-[80px]"
								src={discount}
								alt="Marketplace"
								width={10}
								height={10}
								unoptimized
								priority
							/>

							<div className="flex flex-col">
								<span className="text-white text-lg font-semibold">
									Descontos Exclusivos
								</span>
								<span className="text-white">
									Acesso a promoções e descontos especiais
									disponíveis apenas para clientes Mononoke.
								</span>
							</div>
						</div>

						<div className="flex flex-col justify-between p-4 w-[350px] h-[230px] bg-black opacity-80 rounded-md shadow-md transition-transform duration-300 hover:scale-110">
							<Image
								className="w-[80px]"
								src={raffle}
								alt="Marketplace"
								width={10}
								height={10}
								unoptimized
								priority
							/>

							<div className="flex flex-col">
								<span className="text-white text-lg font-semibold">
									Sorteios
								</span>
								<span className="text-white mb-6">
									Participe de sorteios exclusivos com prêmios
									incríveis toda semana.
								</span>
							</div>
						</div>

						<div className="flex flex-col items-center justify-center p-4 w-[350px] h-[230px]">
							<div className="text-xl text-black hover:text-white flex flex-row items-center justify-center w-[250px] py-2 border-[1px] border-white transition-all ease-in duration-200 hover:bg-black hover:opacity-80 rounded-full cursor-pointer gap-2">
								<span>E muito mais!</span>
								<FaArrowDownLong size={18} />
							</div>
						</div>
					</div>
				</div>

				<div className="bg-secondary flex flex-col justify-center items-center text-black col-start-0 col-span-8 px-8 pt-8 pb-16">
					<div
						className={`${poppins.className} text-3xl font-bold mb-2 text-white`}>
						<div>
							PRONTO PARA ENTRAR NO UNIVERSO{" "}
							<span className="text-black text-opacity-80">
								MONONOKE
							</span>
							?
						</div>{" "}
					</div>
					<p className="text-xl mb-8 text-white">
						Junte-se aos outros otakus que já estão aproveitando
						nossos benefícios exclusivos!
					</p>
					<Link href={"/register"}>
						<div className="flex flex-row items-center justify-center bg-black opacity-80 border-[1px] border-white w-[250px] h-[50px] font-semibold rounded-full shadow-md transition-transform duration-200 active:scale-[.97] cursor-pointer">
							<div className="flex flex-row justify-center items-center gap-2 text-white">
								<span>Cadastre-se grátis</span>
								<FaArrowRightLong size={18} />
							</div>
						</div>
					</Link>
				</div>
			</section>
		</>
	);
}

export default HomePage;
