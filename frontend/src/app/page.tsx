import Image from "next/image";

// Imaagens
import Banner from "../../public/banner.png";
import marketplace from "../../public/ecommerce.png";
import cashback from "../../public/cashback.png";

function HomePage() {
	return (
		<section className="text-center grid grid-cols-8 grid-rows-4 gap-4 mx-8 my-8">
			<div className=" col-start-2 col-span-6">
				<Image
					className="rounded-xl shadow-lg w-full"
					src={Banner}
					alt=""
					width={1280}
					unoptimized
					priority
				/>
			</div>
			<div className="bg-white text-black col-start-2 col-span-6 rounded-xl shadow-md">
				<h1 className="text-2xl font-semibold mb-2">
					Shop any store in Japan.
				</h1>
				<p className="text-xl">We'll buy and ship it to you.</p>
			</div>

			<div className="bg-white text-black col-start-2 col-span-6 rounded-xl shadow-md px-8">
				<h1 className="text-2xl font-semibold mb-2">
					Multi Plataforma
				</h1>
				<p className="text-xl mb-4">Aproveito os diveros benefícios.</p>

				<div className="flex flex-row gap-8">
					<div className="flex flex-col items-center justify-center">
						<Image
							className="w-[80px]"
							src={marketplace}
							alt=""
							width={10}
							height={10}
							unoptimized
							priority
						/>
						<span>Marketplace</span>
					</div>

					<div className="flex flex-col items-center justify-center">
						<Image
							className="w-[80px]"
							src={cashback}
							alt=""
							width={10}
							height={10}
							unoptimized
							priority
						/>
						<span>Cashback</span>
					</div>
				</div>
			</div>
		</section>
	);
}

export default HomePage;
