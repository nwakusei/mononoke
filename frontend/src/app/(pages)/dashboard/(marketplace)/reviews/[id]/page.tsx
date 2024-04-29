"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos

// Icons

function ReviewByIdPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [mysales, setMysales] = useState([]);

	// useEffect(() => {
	// 	const fethData = async () => {
	// 		try {
	// 			const response = await api.get("/orders/customer-orders", {
	// 				headers: {
	// 					Authorization: `Bearer ${JSON.parse(token)}`,
	// 				},
	// 			});

	// 			if (response.data && response.data.orders) {
	// 				setMysales(response.data.orders);
	// 			} else {
	// 				console.error("Dados de pedidos inválidos:", response.data);
	// 			}
	// 		} catch (error) {
	// 			console.error("Erro ao obter dados do Pedido:", error);
	// 		}
	// 	};

	// 	fethData();
	// }, [token]);

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-purple-400 w-[1215px] p-6 rounded-md mt-4">
						{/* Adicionar Porduto */}
						<div className="flex flex-col gap-2 mb-6">
							<h1 className="text-2xl font-semibold">
								Avalie o Pedido
							</h1>
						</div>
						<label>
							<div>Descreva a avaliação:</div>
						</label>
						<textarea
							className="textarea textarea-bordered w-[600px]"
							placeholder="Bio"></textarea>
					</div>
				</div>
			</div>
		</section>
	);
}

export default ReviewByIdPage;
