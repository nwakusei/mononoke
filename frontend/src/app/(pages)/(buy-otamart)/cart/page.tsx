"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Image from "next/image";
import api from "@/utils/api";

// Context

// Icons
import { MdOutlineDeleteOutline } from "react-icons/md";

// Components

function OtamartPage() {
	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 mx-4">
			<div className="bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-4">
				<div className="flex flex-col items-center bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-8 min-h-screen">
					<ul className=" steps steps-vertical lg:steps-horizontal mt-8 mb-8">
						<li className="step step-primary">
							<span className="bg-purple-500 py-1 px-2 rounded">
								Carrinho
							</span>
						</li>
						<li className="step step-primary">
							<span className="bg-purple-500 py-1 px-2 rounded">
								Detalhes
							</span>
						</li>
						<li className="step">
							<span className="bg-purple-500 py-1 px-2 rounded">
								Pagamento
							</span>
						</li>
						<li className="step">
							<span className="bg-purple-500 py-1 px-2 rounded">
								Revisão
							</span>
						</li>
					</ul>

					<div className="flex flex-row items-center gap-4 bg-sky-500 w-[650px] h-[150px] p-4 rounded">
						<div className="bg-red-500 w-28 h-28 p-2 rounded">
							Foto do Produto
						</div>

						<div>
							<h1 className="text-lg">Nome do Produto</h1>
							<h2>Variação: Preto</h2>
						</div>
						<div className="mr-4">- 2 +</div>
						<div className="mr-4">
							<h1>Preço: R$ 50,00 x 2</h1>
						</div>
						<div className="flex flex-col items-center justify-center border-[1px] border-purple-500 w-10 h-10 transition-all ease-in duration-200 hover:shadow-md hover:bg-purple-500 rounded cursor-pointer">
							<MdOutlineDeleteOutline size={25} />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default OtamartPage;
