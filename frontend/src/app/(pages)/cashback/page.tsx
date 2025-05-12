"use client";

import { useState, useEffect, useContext } from "react";
import Image from "next/image";

import api from "@/utils/api";

// Context
import { Context } from "@/context/UserContext";

// Components
import { CashbackCard } from "@/components/CashbackCard";
import { LoadingPage } from "@/components/LoadingPageComponent";

function CashbackPage() {
	const { partners } = useContext(Context);
	const [coupons, setCoupons] = useState([]);
	const couponExist = "+ Cupom de Desconto";
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		api.get("/coupons/allcoupons").then((response) => {
			setCoupons(response.data.coupons);
			setIsLoading(false); // Termina o loading após os dados serem carregados
		});
	}, []);

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
			<div className="flex flex-col items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mt-8 mb-4 rounded-md shadow-md select-none">
					Lojas em Destaque
				</div>

				<div className="flex justify-center">
					<p className="bg-primary w-[850px] text-center py-1 rounded shadow-md mb-6 select-none">
						※ Compre em nossos parceiros (lojas online e físicas),
						pagando em OtakuPay, e receba Cashback em Otaku Point ※
					</p>
				</div>

				<div className="flex flex-row flex-wrap gap-4 justify-center mb-4">
					{partners.map((partner) => {
						// Verifique se há um cupom associado a este parceiro
						const associatedCoupon = coupons.find(
							(coupon) => coupon.partnerID === partner._id
						);

						// Renderize a informação do cupom se existir, caso contrário, renderize vazio
						return (
							<CashbackCard
								key={partner._id}
								partnerName={partner.name}
								partnerLogo={partner.logoImage}
								cashback={partner.cashback}
								couponInfo={
									associatedCoupon
										? couponExist
										: "em compras na loja"
								}
								partnerNickname={partner.nickname}
							/>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export default CashbackPage;
