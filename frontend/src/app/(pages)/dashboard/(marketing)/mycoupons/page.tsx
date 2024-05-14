"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/utils/api";

import { toast } from "react-toastify";

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos

// Icons

function MyCouponsPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [coupons, setCoupons] = useState([]);
	const [deleteLoading, setDeletLoading] = useState(null);

	useEffect(() => {
		api.get("/coupons/partner-coupons", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setCoupons(response.data.coupons);
		});
	}, [token]);

	// Função para verificar se o cupom está expirado
	const isCouponExpired = (expirationDate) => {
		// Divide a string da data em dia, mês e ano
		const [day, month, year] = expirationDate.split("/");

		// Obtém a data atual ajustada para o fuso horário de Brasília (UTC-3)
		const currentDate = new Date(new Date().getTime() - 3 * 60 * 60 * 1000); // Subtrai 3 horas em milissegundos // Data atual

		// Cria um novo objeto de data com a data de expiração do cupom, ajustado para o fuso horário de Brasília (UTC-3)
		const couponExpirationDate = new Date(
			Date.UTC(year, month - 1, day, 23, 59, 59)
		);

		console.log(currentDate);
		console.log(couponExpirationDate);

		return couponExpirationDate <= currentDate;
	};

	async function handleRemove(id) {
		try {
			setDeletLoading(id);
			const response = await api.delete("/coupons/remove", {
				data: { id },
			});
			// Atualiza os cupons após a remoção
			const updatedCoupons = coupons.filter(
				(coupon) => coupon._id !== id
			);
			setCoupons(updatedCoupons);
			toast.success(response.data.message); // Exibe a mensagem retornada pela API após a exclusão bem-sucedida
			return response.data;
		} catch (error) {
			toast.error(error.response.data.message);
			console.error("Erro ao remover cupom:", error);
			return error.response.data;
		} finally {
			setDeletLoading(null);
		}
	}

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mt-4">
						{/* Adicionar Produto */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold mb-4">
								Meus Cupons
							</h1>

							{/* Produtos em Catálogo */}
							<div className="overflow-x-auto">
								<table className="table">
									{/* head */}
									<thead>
										<tr>
											<th>
												<label>
													<input
														type="checkbox"
														className="checkbox"
													/>
												</label>
											</th>
											<th className="text-sm">Código</th>
											<th className="text-sm">
												Desconto
											</th>
											<th className="text-sm">
												Válido até
											</th>
											<th className="text-sm">Status</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{/* rows */}
										{coupons.map((coupon) => (
											<tr key={coupon._id}>
												<td>
													<input
														type="checkbox"
														className="checkbox"
													/>
												</td>
												<td>
													<div className="font-bold">
														{coupon.couponCode}
													</div>
												</td>
												<td>
													{coupon.discountPercentage}%
												</td>
												<td>{coupon.expirationDate}</td>
												<td>
													<span
														className={`badge bg-${
															isCouponExpired(
																coupon.expirationDate
															)
																? "yellow-500"
																: "sky-500"
														} badge-sm`}>
														{isCouponExpired(
															coupon.expirationDate
														)
															? "Expirado"
															: "Ativo"}
													</span>
												</td>
												<td>
													<button
														type="button"
														onClick={() =>
															handleRemove(
																coupon._id
															)
														}
														className="btn btn-error btn-xs w-[80px]"
														disabled={
															deleteLoading ===
															coupon._id
														}>
														{deleteLoading ===
														coupon._id ? (
															<div className="btn btn-error btn-xs w-[80px]">
																<span className="loading loading-dots loading-xs"></span>
															</div>
														) : (
															"Excluir"
														)}
													</button>
												</td>
											</tr>
										))}
									</tbody>

									{/* foot */}
									<tfoot>
										<tr>
											<th></th>
											<th>Name</th>
											<th>Job</th>
											<th>Favorite Color</th>
											<th></th>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default MyCouponsPage;
