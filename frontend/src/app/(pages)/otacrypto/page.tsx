"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import Link from "next/link";

import Swal from "sweetalert2";

// Axios
import api from "@/utils/api";

// Contexts
import { Context } from "@/context/UserContext";

// Components

// Imagens

// Icons
import { Blockchain } from "@icon-park/react";
import { SiBitcoin, SiSolana } from "react-icons/si";
import {
	RiArrowRightUpBoxLine,
	RiExchangeFundsFill,
	RiTokenSwapLine,
	RiXrpFill,
} from "react-icons/ri";
import { LiaMonero } from "react-icons/lia";
import { IoCloseSharp } from "react-icons/io5";
import { headers } from "next/headers";
import { toast } from "react-toastify";

function OtacryptoPage() {
	const [token] = useState(() => localStorage.getItem("token") || "");
	const [user, setUser] = useState(null); // Inicializa como null
	const [isLoading, setIsLoading] = useState(true);
	const [loadingButtonId, setLoadingButtonId] = useState(null);
	const [cryptocurrencies, setCryptocurrencies] = useState([]);

	const [showBanner, setShowBanner] = useState(false);

	// exibe o banner apenas na primeira visita
	useEffect(() => {
		if (localStorage.getItem("otaBannerDismissed") !== "1") {
			setShowBanner(true);
		}
	}, []);

	function handleClose() {
		localStorage.setItem("otaBannerDismissed", "1");
		setShowBanner(false);
	}

	useEffect(() => {
		try {
			const fetchCryptocurrencies = async () => {
				const response = await api.get(
					`/cryptocurrencies/get-all-cryptocurrencies`
				);

				setCryptocurrencies(response.data.cryptocurrencies);
			};

			fetchCryptocurrencies();
		} catch (error) {
			console.log(error);
		}
	}, []);

	async function buyOtaCrypto() {
		const amountOfCryptocurrencyToBePurchased = 10.66;

		try {
			const response = await api.post(
				"/cryptocurrencies/buy-cryptocurrency/682c0df01bb4e0504a13d8aa",
				{ amountOfCryptocurrencyToBePurchased }
			);
			toast.success(response.data.message);
		} catch (error: any) {
			toast.error(error.response.data.message);
		}
	}

	return (
		<section className={`bg-gray-100 grid grid-cols-6 grid-rows-1 gap-4`}>
			<div className="col-start-2 col-span-4 flex flex-row justify-center items-center bg-primary p-4 text-white rounded-md shadow-md gap-2 mt-8">
				<span>
					<Blockchain size={25} />
				</span>
				<h1 className="text-xl font-semibold">OtaCrypto</h1>
			</div>

			{showBanner && (
				<div
					role="note"
					className="col-start-2 col-span-4 flex items-start justify-between bg-white text-black p-4 rounded-md shadow-md gap-4">
					<div>
						<h2 className="text-lg font-semibold mb-2">
							O que são OtaCrypto?
						</h2>
						<p className="text-base text-gray-700 mb-2">
							OtaCrypto são pseudo-criptomoedas, ou seja, se
							comportam como criptomoedas mas não possuem sua
							própria blockchain e não rodam em uma blockchain de
							terceiros.
						</p>
						<p className="text-base text-gray-700">
							Futuramente elas terão sua própria Blockchain ou
							estão integradas a Blockchains de terceiros.
						</p>
					</div>

					<button
						onClick={handleClose}
						aria-label="Fechar banner"
						className="p-1 transition-all ease-in duration-150 border-[1px] border-dashed border-primary hover:bg-secondary hover:text-white rounded shrink-0">
						<IoCloseSharp size={24} />
					</button>
				</div>
			)}

			<main className="col-start-2 col-span-4 bg-white text-black p-4 rounded-md shadow-md">
				<div className="flex flex-col gap-2">
					<div className="flex flex-row items-center gap-2">
						<span className="text-black">
							<RiExchangeFundsFill size={25} />
						</span>
						<h2 className="text-lg font-semibold">Exchange</h2>
					</div>
					<div>
						<p className="text-base text-gray-700">
							OtaCrypto são pseudo-criptomoedas, ou seja, se
							comportam como criptomoedas mas não possuem sua
							própria blockchain e não rodam em uma blockchain de
							terceiros.
						</p>
					</div>
				</div>
			</main>

			<div className="flex flex-col bg-white py-2 px-2 rounded-md shadow-md col-start-2 col-span-4 mb-16">
				{cryptocurrencies &&
					cryptocurrencies.length > 0 &&
					cryptocurrencies.map((cryptocurrency) => (
						<div
							key={cryptocurrency._id}
							className="flex flex-row justify-between items-center text-black hover:bg-gray-200 hover:bg-opacity-50 hover:rounded-md transition-all ease-in duration-150 gap-2 py-2">
							<div className="flex flex-row items-center gap-2 ml-4">
								<span>
									{/* Logo da Crypto */}
									<SiBitcoin size={20} />
								</span>
								{/* Nome da Crypto */}
								<h2 className="text-base">BTC</h2>
							</div>

							{/* Números da Crypto */}
							<div className="flex flex-row items-center gap-4">
								<h2>Preço (U$)</h2>
								<h2>marketCap</h2>
								<h2>volume</h2>
								<h2>circulatingSupply</h2>
							</div>

							{/* Botões de ação */}
							<div className="flex flex-row items-center">
								<button
									onClick={buyOtaCrypto}
									className="flex flex-row justify-center items-center bg-primary w-[120px] h-[30px] text-white py-2 rounded-md shadow-md cursor-pointer hover:bg-secondary active:scale-[.97] transition-all ease-in duration-150 mr-4 gap-2">
									<RiTokenSwapLine size={20} />
									<h2>Swap</h2>
								</button>
								<Link
									href={`/otacrypto/${cryptocurrency._id}`}
									className="flex flex-row justify-center items-center border-[1px] border-primary text-primary hover:bg-primary w-[120px] h-[30px] hover:text-white py-2 rounded-md hover:shadow-md cursor-pointer active:scale-[.97] transition-all ease-in duration-150 mr-4 gap-2">
									<RiArrowRightUpBoxLine size={20} />
									<h2>Page</h2>
								</Link>
							</div>
						</div>
					))}
				<hr />
			</div>
		</section>
	);
}

export default OtacryptoPage;
