"use client";

// Imports Principais
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";

// Icons
import { RiTokenSwapLine } from "react-icons/ri";
import { SiBitcoin } from "react-icons/si";
import api from "@/utils/api";
import { FiInfo } from "react-icons/fi";
import { toast } from "react-toastify";
import { LiaReadme } from "react-icons/lia";

// Images
import OTK from "../../../../../public/otk.png";

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

  async function buyOtaCrypto(amountOfCryptocurrencyToBePurchased: number) {
    try {
      const response = await api.post(
        `/cryptocurrencies/buy-cryptocurrency/${id}`,
        { amountOfCryptocurrencyToBePurchased }
      );
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  }

  async function transactionValues() {
    const { value: amount, isConfirmed } = await Swal.fire({
      title: "Digite o valor",
      input: "number",
      inputLabel: `Quantidade de ${cryptocurrency?.cryptocurrencySymbol} a comprar`,
      inputPlaceholder: "Ex.: 10,5",
      showCancelButton: true,
      confirmButtonText: "Comprar",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: "swal2-custom-confirm",
        cancelButton: "swal2-custom-cancel",
      },
      inputAttributes: {
        min: "0",
        step: "0.000001",
      },
      inputValidator: (value) => {
        if (!value || parseFloat(value) <= 0) {
          return "Por favor, insira um valor maior que zero!";
        }
        return null;
      },
    });

    if (isConfirmed) {
      buyOtaCrypto(parseFloat(amount));
    }
  }

  return (
    <div className="h-screen bg-gray-100">
      <section className={`grid grid-cols-6 grid-rows-1 bg-gray-100 gap-4`}>
        {/* <div className="col-start-2 col-span-4 flex flex-row justify-center items-center bg-primary p-4 text-white rounded-md shadow-md gap-2 mt-8">
			<span>
				<Blockchain size={25} />
			</span>
			<h1 className="text-xl font-semibold">OtaCrypto</h1>
		</div> */}

        <main className="col-start-2 col-span-4 bg-white text-black p-4 rounded-md shadow-md mt-8">
          <div className="flex flex-row gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-row gap-2">
                <Image
                  className="w-[60px] h-[60px] rounded shadow-md"
                  src={OTK}
                  alt="Logo da Crypto"
                  width={60}
                  height={60}
                />
                <div>
                  <div className="flex flex-row items-center gap-2">
                    <span className="text-xl font-semibold">
                      {cryptocurrency?.cryptocurrencyName}
                    </span>
                    <span className="text-sm">
                      {`「 ${cryptocurrency?.cryptocurrencySymbol} 」`}
                    </span>
                  </div>

                  <div className="font-semibold">
                    {cryptocurrency?.cryptocurrencyValueInUSD !== undefined && (
                      <h1 className="text-xl">
                        {`${cryptocurrency.cryptocurrencyValueInUSD.toLocaleString(
                          "pt-BR",
                          {
                            style: "currency",
                            currency: "USD",
                          }
                        )}`}
                      </h1>
                    )}
                  </div>
                </div>

                {/* <div>volMktCap</div> */}
                {/* <div>volume</div> */}
              </div>
              <button
                onClick={transactionValues}
                className="flex flex-row justify-center items-center bg-primary w-[200px] h-[30px] text-white py-2 rounded-md shadow-md cursor-pointer hover:bg-secondary active:scale-[.97] transition-all ease-in duration-150 mr-4 gap-2"
              >
                <RiTokenSwapLine size={20} />
                <h2>Swap</h2>
              </button>
            </div>

            {/* <div>
							<hr className="w-px h-24 bg-gray-300 border-0" />
						</div> */}

            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-2">
                <div className="w-[200px] border-[1px] rounded shadow-md px-4 py-2">
                  <div className="text-sm flex justify-between items-center">
                    <span className="">Market Cap</span>
                    <span className="cursor-pointer">
                      <FiInfo className="animate-pulse" size={13} />
                    </span>
                  </div>
                  {cryptocurrency?.marketCap !== undefined && (
                    <div>
                      {`${cryptocurrency.marketCap.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "USD",
                      })}`}
                    </div>
                  )}
                </div>

                <div className="w-[200px] border-[1px] rounded shadow-md px-4 py-2">
                  <div className="text-sm flex justify-between items-center">
                    <span className="">Max. Supply</span>
                    <span className="cursor-pointer">
                      <FiInfo className="animate-pulse" size={13} />
                    </span>
                  </div>
                  {cryptocurrency?.totalSupply !== undefined && (
                    <div className="font-semibold">
                      {`${cryptocurrency?.maxSupply.toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      })} ${cryptocurrency.cryptocurrencySymbol}`}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="w-[200px] border-[1px] rounded shadow-md px-4 py-2">
                  <div className="text-sm flex justify-between items-center">
                    <span className="">Total Supply</span>
                    <span className="cursor-pointer">
                      <FiInfo className="animate-pulse" size={13} />
                    </span>
                  </div>
                  {cryptocurrency?.totalSupply !== undefined && (
                    <div>
                      {cryptocurrency?.totalSupply !== undefined && (
                        <div>{`${cryptocurrency.totalSupply.toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 6,
                          }
                        )} ${cryptocurrency.cryptocurrencySymbol}`}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-[200px] border-[1px] rounded shadow-md px-4 py-2">
                  <div className="text-sm flex justify-between items-center">
                    <span className="">Circulating Supply</span>
                    <span className="cursor-pointer">
                      <FiInfo className="animate-pulse" size={13} />
                    </span>
                  </div>
                  {cryptocurrency?.circulatingSupply !== undefined && (
                    <div>{`${cryptocurrency.circulatingSupply.toLocaleString(
                      "pt-BR",
                      {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      }
                    )} ${cryptocurrency.cryptocurrencySymbol}`}</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Criptomoedas Mintadas */}
                <div className="w-[200px] border-[1px] rounded shadow-md px-4 py-2">
                  <div className="text-sm flex justify-between items-center">
                    <span className="">Minted Crypto</span>
                    <span className="cursor-pointer">
                      <FiInfo className="animate-pulse" size={13} />
                    </span>
                  </div>
                  {cryptocurrency?.mintedCryptocurrency !== undefined && (
                    <div>{`${cryptocurrency?.mintedCryptocurrency.toLocaleString(
                      "pt-BR",
                      {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      }
                    )} ${cryptocurrency.cryptocurrencySymbol}`}</div>
                  )}
                </div>

                {/* Criptomoedas Queimadas */}
                <div className="w-[200px] border-[1px] rounded shadow-md px-4 py-2">
                  <div className="text-sm flex justify-between items-center">
                    <span className="">Burned Crypto</span>
                    <span className="cursor-pointer">
                      <FiInfo className="animate-pulse" size={13} />
                    </span>
                  </div>
                  {cryptocurrency?.burnedCryptocurrency !== undefined && (
                    <div>{`${cryptocurrency?.burnedCryptocurrency.toLocaleString(
                      "pt-BR",
                      {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6,
                      }
                    )} ${cryptocurrency.cryptocurrencySymbol}`}</div>
                  )}
                </div>

                {/* <div>liquidityPool</div> */}
              </div>
            </div>
          </div>
        </main>

        <div className="flex flex-col rounded-md shadow-md col-start-2 col-span-4 mb-16">
          <div className="bg-primary text-xl text-center px-4 py-2 rounded-t-md">
            Novidades
          </div>
          <div className="bg-white py-2 px-2 rounded-b-md">
            <div className="flex flex-row justify-between items-center text-black hover:bg-gray-200 hover:bg-opacity-50 hover:rounded-md transition-all ease-in duration-150 gap-2 py-2">
              <div className="flex flex-row items-center gap-2 ml-4">
                <span>
                  {/* Logo da Crypto */}
                  <SiBitcoin size={20} />
                </span>
                {/* Nome da Crypto */}
                <p className="text-base">
                  Agora é possível comprar com moeda FIAT...
                </p>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-row items-center">
                <button className="flex flex-row justify-center items-center bg-primary w-[120px] h-[30px] text-white py-2 rounded-md shadow-md cursor-pointer hover:bg-secondary active:scale-[.97] transition-all ease-in duration-150 mr-4 gap-2">
                  <LiaReadme size={20} />
                  <h2>Ler</h2>
                </button>
              </div>
            </div>
            <hr />
          </div>
        </div>
      </section>
    </div>
  );
}

export default OtacryptoIdPage;
