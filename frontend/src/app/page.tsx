// Imports principais
import Image from "next/image";
import Link from "next/link";
// import { useRouter } from "next/navigation";

// Imaagens
import Banner from "../../public/banner.png";
import marketplace from "../../public/ecommerce.png";
import cashback from "../../public/cashback.png";
import club from "../../public/club.png";
import discount from "../../public/discount.png";
import raffle from "../../public/raffle.png";
import { FaArrowRight } from "react-icons/fa";
import { FaArrowDownLong, FaArrowRightLong } from "react-icons/fa6";

function HomePage() {
	// const router = useRouter();

	return (
		<section className="bg-home text-center grid grid-cols-8 gap-4">
			{/* <div className="col-start-2 col-span-6">
				<Image
					className="rounded-xl shadow-lg w-full"
					src={Banner}
					alt=""
					width={1280}
					unoptimized
					priority
				/>
			</div> */}

			<div className="bg-white text-black col-start-2 col-span-6 rounded-xl shadow-md p-8 mt-8">
				<h1 className="text-2xl font-semibold mb-2">
					SEU UNIVERSO OTAKU COMPLETO
				</h1>
				<p className="text-xl">
					Os maiores benefícios para Otakus em um só lugar!
				</p>
				<p className="text-xl">
					Marketplace, cashback, criptomoedas e muito mais em uma
					única plataforma!
				</p>
			</div>

			<div className="flex flex-col justify-center items-center bg-white text-black col-start-0 col-span-8 p-8">
				<h1 className="text-2xl font-semibold mb-2">NOSSOS SERVIÇOS</h1>
				<p className="text-xl mb-4">
					Tudo que um verdadeiro otaku precisa em um só lugar!
				</p>

				<div className="flex flex-row gap-8 mb-4">
					<div className="flex flex-col items-center justify-between py-4 w-[150px] h-[150px] bg-primary rounded-md shadow-md transition-transform duration-300 hover:scale-110">
						<Image
							className="w-[80px]"
							src={marketplace}
							alt="Marketplace"
							width={10}
							height={10}
							unoptimized
							priority
						/>
						<span className="text-white">Marketplace</span>
					</div>

					<div className="flex flex-col items-center justify-between py-4 w-[150px] h-[150px] bg-primary rounded-md shadow-md transition-transform duration-300 hover:scale-110">
						<Image
							className="w-[80px]"
							src={cashback}
							alt="Cashback"
							width={10}
							height={10}
							unoptimized
							priority
						/>
						<span className="text-white">Cashback</span>
					</div>

					<div className="flex flex-col items-center justify-between py-4 w-[150px] h-[150px] bg-primary rounded-md shadow-md transition-transform duration-300 hover:scale-110">
						<Image
							className="w-[80px]"
							src={club}
							alt="Clube de Pontos"
							width={10}
							height={10}
							unoptimized
							priority
						/>
						<span className="text-white">Clube de Pontos</span>
					</div>

					<div className="flex flex-col items-center justify-between py-4 w-[150px] h-[150px] bg-primary rounded-md shadow-md transition-transform duration-300 hover:scale-110">
						<Image
							className="w-[80px]"
							src={discount}
							alt="Descontos"
							width={10}
							height={10}
							unoptimized
							priority
						/>
						<span className="text-white">Descontos</span>
					</div>

					<div className="flex flex-col items-center justify-between py-4 w-[150px] h-[150px] bg-primary rounded-md shadow-md transition-transform duration-300 hover:scale-110">
						<Image
							className="w-[80px]"
							src={raffle}
							alt="Sorteios"
							width={10}
							height={10}
							unoptimized
							priority
						/>
						<span className="text-white">Sorteios</span>
					</div>
				</div>

				<p className="text-xl">
					E muito mais! <FaArrowDownLong size={18} />
				</p>
			</div>

			<div className="flex flex-col justify-center items-center text-black col-start-2 col-span-6 p-8">
				<h1 className="text-2xl font-semibold mb-2 text-white">
					PRONTO PARA ENTRAR NO UNIVERSO MONONOKE?
				</h1>
				<p className="text-xl mb-8 text-white">
					Junte-se a milhares de otakus que já estão aproveitando
					nossos benefícios exclusivos!
				</p>
				<Link href={"/register"}>
					<div className="flex flex-row items-center justify-center bg-error border-[1px] border-white w-[250px] h-[50px] font-semibold rounded-full shadow-md transition-transform duration-200 active:scale-[.97] cursor-pointer">
						<div className="flex flex-row justify-center items-center gap-2 text-white">
							<span>Cadastre-se grátis</span>
							<FaArrowRightLong size={18} />
						</div>
					</div>
				</Link>
			</div>
		</section>
	);
}

export default HomePage;
