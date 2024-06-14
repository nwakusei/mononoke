"use client";

import { useState, useEffect, useContext } from "react";
import Image from "next/image";

import api from "@/utils/api";

// Context
import { Context } from "@/context/UserContext";

// Imagens
import Otakuyasan from "../../../../public/otakuyasan.png";

// Components
import { CashbackCard } from "@/components/CashbackCard";

function CashbackPage() {
	const { partners } = useContext(Context);
	const [coupons, setCoupons] = useState([]);
	const couponExist = "+ Cupom de Desconto";

	useEffect(() => {
		api.get("/coupons/allcoupons").then((response) => {
			setCoupons(response.data.coupons);
		});
	}, []);

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-2 gap-4 mx-4">
			<div className="bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="divider text-center text-xl md:text-2xl font-semibold mb-4">
					Lojas em Destaque
				</div>

				<div className="flex justify-center">
					<p className="bg-primary w-[850px] text-center py-1 rounded shadow-md mb-6">
						※ Compre em nossos parceiros (loja online e física),
						pagando em OtakuPay, e receba Cashback em Otaku Point ※
					</p>
				</div>

				<div className="flex flex-row flex-wrap gap-4 justify-center mb-4">
					{partners.map((partner) => {
						// Verifique se há um cupom associado a este parceiro
						const associatedCoupon = coupons.find(
							(coupon) => coupon.partnerID === partner._id
						);

						console.log(partner.logoImage);

						// Renderize a informação do cupom se existir, caso contrário, renderize vazio
						return (
							<CashbackCard
								key={partner._id}
								partnerName={partner.name}
								partnerLogo={
									partner.logoImage
										? partner.logoImage
										: Otakuyasan
								}
								cashback={partner.cashback}
								couponInfo={
									associatedCoupon
										? couponExist
										: "em compras na loja"
								}
							/>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export default CashbackPage;
