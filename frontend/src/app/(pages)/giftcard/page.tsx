"use client";

import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import api from "@/utils/api";

import { Context } from "@/context/UserContext";

// Components
import { LoadingPage } from "@/components/LoadingPageComponent";

// Imagens
import Logo from "../../../../public/logo.png";

function GiftCardPage() {
  const { partners } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {}, []);

  // if (isLoading) {
  // 	return <LoadingPage />;
  // }

  return (
    <>
      {/* Conteúdo da página */}
      <section
        className={`min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4`}
      >
        <div className="flex flex-col items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6">
          <div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mt-8 mb-4 rounded-md shadow-md select-none">
            Gift Cards
          </div>

          <div className="flex justify-center">
            <p className="bg-primary w-[550px] text-center py-1 rounded shadow-md mb-6 select-none">
              ※ Presenteie pessoas com Gift Card! ※
            </p>
          </div>

          <div className="flex flex-row flex-wrap gap-4 justify-center mb-4">
            <div className="flex flex-row justify-between bg-primary w-[300px] h-[160px] rounded-lg shadow-md">
              <div className="w-[100px] ml-10 mt-7 pointer-events-none">
                <Image
                  src={Logo}
                  alt="Logo Mononoke"
                  width={150}
                  height={80}
                  unoptimized
                />
              </div>
              <div>
                <div className="text-lg font-semibold text-right pr-4 mt-2 -mb-1 pointer-events-none">
                  <Image
                    src={Logo}
                    alt="Logo Mononoke"
                    width={110}
                    height={20}
                    unoptimized
                  />
                </div>
                <div className="text-right text-yellow-500 pr-4 select-none">
                  Gift Card
                </div>
                <div className="text-3xl font-bold text-right pr-4 select-none">
                  R$ 15
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default GiftCardPage;
