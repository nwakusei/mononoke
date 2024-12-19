"use client";

import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/api";

import { Context } from "@/context/UserContext";

// Components
import { CouponCard } from "@/components/CouponCard";
import { LoadingPage } from "@/components/LoadingPageComponent";

function CoupomPage() {
	const { partners } = useContext(Context);
	const [coupons, setCoupons] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showAgeModal, setShowAgeModal] = useState(true); // Controle do modal de aviso

	console.log(coupons);

	useEffect(() => {
		const fetchCoupons = async () => {
			try {
				const response = await api.get("/coupons/allcoupons");
				setCoupons(response.data.coupons); // Atualize o estado com os cupons recebidos da API
				setIsLoading(false);
			} catch (error) {
				console.error("Erro ao buscar cupons:", error);
			}
		};
		fetchCoupons(); // Chame a função fetchCoupons aqui dentro do useEffect
	}, []);

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<>
			{/* Modal de aviso +18 */}
			{showAgeModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-lg">
						<h2 className="text-black text-xl font-semibold mb-4">
							Conteúdo +18
						</h2>
						<p className="text-gray-600 mb-6">
							Este conteúdo é destinado apenas para maiores de 18
							anos. Você confirma que possui mais de 18 anos?
						</p>
						<div className="flex gap-4 justify-center">
							<button
								onClick={() => setShowAgeModal(false)}
								className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">
								Sim, tenho mais de 18
							</button>
							<button
								onClick={() =>
									(window.location.href =
										"https://www.google.com")
								}
								className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition">
								Não
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Conteúdo da página */}
			<section
				className={`min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 ${
					showAgeModal ? "blur-sm" : "blur-none"
				}`}>
				<div className="flex flex-col items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6">
					<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mt-8 mb-4 rounded-md shadow-md select-none">
						Cupons em Destaque
					</div>

					<div className="flex justify-center">
						<p className="bg-primary w-[550px] text-center py-1 rounded shadow-md mb-6 select-none">
							※ Cupons exclusivos para uso nas lojas parceira em
							nosso site! ※
						</p>
					</div>

					<div className="flex flex-row flex-wrap gap-4 justify-center mb-4">
						{coupons.length > 0 ? (
							coupons.map((coupon) => {
								const partner = partners.find(
									(p) => p._id === coupon?.partnerID
								);
								return (
									<CouponCard
										key={coupon?._id}
										partnerLogo={partner?.logoImage}
										partnerName={coupon?.partnerName}
										partnerNickname={
											coupon?.partnerNickname
										}
										discount={coupon?.discountPercentage}
										cashback={
											partner ? partner?.cashback : null
										}
										coupon={coupon?.couponCode}
									/>
								);
							})
						) : (
							<div className="text-black text-center bg-white p-2 min-w-[400px] rounded-md shadow-md">
								Nenhum Cupom disponível no momento!
							</div>
						)}
					</div>
				</div>
			</section>
		</>
	);
}

export default CoupomPage;
