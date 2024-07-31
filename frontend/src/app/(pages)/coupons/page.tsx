"use client";

import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import api from "@/utils/api";

import { Context } from "@/context/UserContext";

// Importe suas imagens e ícones aqui
import Otakuyasan from "../../../../public/otakuyasan.png";

import { CouponCard } from "@/components/CouponCard";

function CoupomPage() {
	const { partners } = useContext(Context);
	const [coupons, setCoupons] = useState([]);

	useEffect(() => {
		const fetchCoupons = async () => {
			try {
				const response = await api.get("/coupons/allcoupons");
				setCoupons(response.data.coupons); // Atualize o estado com os cupons recebidos da API
			} catch (error) {
				console.error("Erro ao buscar cupons:", error);
			}
		};
		fetchCoupons(); // Chame a função fetchCoupons aqui dentro do useEffect
	}, []);

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 min-h-screen">
			<div className="flex flex-col items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mt-8 mb-2 rounded-md shadow-md select-none">
					Cupons em Destaque
				</div>

				<div className="flex justify-center">
					<p className="bg-primary w-[550px] text-center py-1 rounded shadow-md mb-6 select-none">
						※ Cupons exclusivos para uso nas lojas online de nossos
						parceiros! ※
					</p>
				</div>

				<div className="flex flex-row flex-wrap gap-4 justify-center mb-4">
					{coupons.length > 0 ? (
						coupons.map((coupon) => {
							const partner = partners.find(
								(p) => p._id === coupon.partnerID
							);
							return (
								<CouponCard
									key={coupon._id}
									partnerLogo={
										partner?.logoImage
											? partner.logoImage
											: Otakuyasan
									}
									siteLink={partner ? partner?.site : null}
									discount={coupon.discountPercentage}
									cashback={
										partner ? partner?.cashback : null
									}
									coupon={coupon.couponCode}
								/>
							);
						})
					) : (
						<p>Nenhum Cupom Disponível no momento!</p>
					)}
				</div>
			</div>
		</section>
	);
}

export default CoupomPage;
