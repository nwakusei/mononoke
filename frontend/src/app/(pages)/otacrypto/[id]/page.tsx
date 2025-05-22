"use client";

// Imports Principais
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Icons
import { Blockchain, Currency } from "@icon-park/react";
import { RiArrowRightUpBoxLine, RiTokenSwapLine } from "react-icons/ri";
import { SiBitcoin } from "react-icons/si";
import api from "@/utils/api";

function OtacryptoIdPage() {
	const { id } = useParams();
	const [cryptocurrency, setCryptocurrency] = useState({});

	console.log("CRYPTO:", cryptocurrency);

	useEffect(() => {
		const fetchCryptocurrency = async () => {
			try {
				const response = await api.get(
					`/cryptocurrencies/get-cryptocurrency/${id}`
				);
				setCryptocurrency(response.data.cryptocurrency);
			} catch (error) {
				console.error("Erro ao buscar criptomoeda:", error);
			}
		};

		fetchCryptocurrency();
	}, [id]);

	return (
		<div className="h-screen bg-gray-100">
			<section
				className={`grid grid-cols-6 grid-rows-1 bg-gray-100 gap-4`}>
				{/* <div className="col-start-2 col-span-4 flex flex-row justify-center items-center bg-primary p-4 text-white rounded-md shadow-md gap-2 mt-8">
			<span>
				<Blockchain size={25} />
			</span>
			<h1 className="text-xl font-semibold">OtaCrypto</h1>
		</div> */}

				<main className="col-start-2 col-span-4 bg-white text-black p-4 rounded-md shadow-md mt-8">
					<div className="flex flex-row gap-4">
						<div className="flex flex-row gap-2">
							<span className="w-[50px] h-[50px] bg-secondary rounded shadow-md"></span>
							<div>
								<h2>{cryptocurrency?.cryptocurrencyName}</h2>
								<h3>{cryptocurrency?.cryptocurrencySymbol}</h3>
							</div>
						</div>
						<hr className="w-px h-20 bg-gray-300 border-0" />
						<div>
							{cryptocurrency?.cryptocurrencyValueInUSD !==
								undefined && (
								<h1 className="text-lg">
									{`Price: ${cryptocurrency.cryptocurrencyValueInUSD.toLocaleString(
										"pt-BR",
										{
											style: "currency",
											currency: "USD",
										}
									)}`}
								</h1>
							)}
							{cryptocurrency?.marketCap !== undefined && (
								<div>
									{`Market Cap: ${cryptocurrency.marketCap.toLocaleString(
										"pt-BR",
										{
											style: "currency",
											currency: "USD",
										}
									)}`}
								</div>
							)}

							{/* <div>volMktCap</div>
					<div>volume</div> */}
						</div>

						<div>
							<div>liquidityPool</div>

							{cryptocurrency?.totalSupply !== undefined && (
								<div>{`Max. Supply: ${cryptocurrency?.maxSupply.toLocaleString(
									"pt-BR",
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 6,
									}
								)} ${
									cryptocurrency.cryptocurrencySymbol
								}`}</div>
							)}

							{cryptocurrency?.totalSupply !== undefined && (
								<div>{`Total Supply: ${cryptocurrency.totalSupply.toLocaleString(
									"pt-BR",
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 6,
									}
								)} ${
									cryptocurrency.cryptocurrencySymbol
								}`}</div>
							)}

							{cryptocurrency?.circulatingSupply !==
								undefined && (
								<div>{`Circulating Supply: ${cryptocurrency.circulatingSupply.toLocaleString(
									"pt-BR",
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 6,
									}
								)} ${
									cryptocurrency.cryptocurrencySymbol
								}`}</div>
							)}

							{/* Criptomoedas Mintadas */}
							{cryptocurrency?.mintedCryptocurrency !==
								undefined && (
								<div>{`Minted Cryptocurrencies: ${cryptocurrency?.mintedCryptocurrency.toLocaleString(
									"pt-BR",
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 6,
									}
								)} ${
									cryptocurrency.cryptocurrencySymbol
								}`}</div>
							)}

							{/* Criptomoedas Queimadas */}
							{cryptocurrency?.burnedCryptocurrency !==
								undefined && (
								<div>{`Burned Cryptocurrencies: ${cryptocurrency?.burnedCryptocurrency.toLocaleString(
									"pt-BR",
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 6,
									}
								)} ${
									cryptocurrency.cryptocurrencySymbol
								}`}</div>
							)}
						</div>
					</div>
				</main>

				<div className="flex flex-col bg-white py-2 px-2 rounded-md shadow-md col-start-2 col-span-4 mb-16">
					<div className="flex flex-row justify-between items-center text-black hover:bg-gray-200 hover:bg-opacity-50 hover:rounded-md transition-all ease-in duration-150 gap-2 py-2">
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
							<button className="flex flex-row justify-center items-center bg-primary w-[120px] h-[30px] text-white py-2 rounded-md shadow-md cursor-pointer hover:bg-secondary active:scale-[.97] transition-all ease-in duration-150 mr-4 gap-2">
								<RiTokenSwapLine size={20} />
								<h2>Swap</h2>
							</button>
							<Link
								href={""}
								className="flex flex-row justify-center items-center border-[1px] border-primary text-primary hover:bg-primary w-[120px] h-[30px] hover:text-white py-2 rounded-md hover:shadow-md cursor-pointer active:scale-[.97] transition-all ease-in duration-150 mr-4 gap-2">
								<RiArrowRightUpBoxLine size={20} />
								<h2>Page</h2>
							</Link>
						</div>
					</div>
					<hr />
				</div>
			</section>
		</div>
	);
}

export default OtacryptoIdPage;
