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
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-, gap-4 mx-4">
			<div className="bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 min-h-screen">
				<div className="divider text-center text-xl md:text-2xl font-semibold mb-4">
					Cupons em Destaque
				</div>

				<p className="text-center mb-4">
					※ Cupons exclusivos para uso nas lojas online de nossos
					parceiros! ※
				</p>

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
										partner.logoImage
											? partner.logoImage
											: Otakuyasan
									}
									siteLink={partner ? partner.site : null}
									discount={coupon.discountPercentage}
									cashback={partner ? partner.cashback : null}
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
