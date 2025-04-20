"use client";

import { useState, useEffect, useContext } from "react";
import api from "@/utils/api";
import { Context } from "@/context/UserContext";

// Components
import { CouponCard } from "@/components/CouponCard";
import { LoadingPage } from "@/components/LoadingPageComponent";

function CoupomPage() {
	const { partners } = useContext(Context);
	const [coupons, setCoupons] = useState([]);

	const [isLoading, setIsLoading] = useState(true); // Carregando página

	useEffect(() => {
		// Busca os cupons
		const fetchCoupons = async () => {
			try {
				const response = await api.get("/coupons/allcoupons");
				setCoupons(response.data.coupons);
			} catch (error) {
				console.error("Erro ao buscar cupons:", error);
			} finally {
				setIsLoading(false); // Encerra o loading
			}
		};
		fetchCoupons();
	}, []);

	// Exibe página de carregamento enquanto está carregando
	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section
			className={`min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 transition`}>
			<div className="flex flex-col items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mt-8 mb-4 rounded-md shadow-md select-none">
					Cupons em Destaque
				</div>

				<div className="flex justify-center">
					<p className="bg-primary w-[550px] text-center py-1 rounded shadow-md mb-6 select-none">
						※ Cupons exclusivos para uso nas lojas parceiras em
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
									partnerNickname={coupon?.partnerNickname}
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
	);
}

export default CoupomPage;
