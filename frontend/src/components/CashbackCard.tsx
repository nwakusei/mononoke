import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Imagens

function CashbackCard({
	partnerID,
	partnerName,
	partnerLogo,
	cashback,
	couponInfo,
}) {
	const [loadingButton, setLoadingButton] = useState(false);
	const router = useRouter();

	function handleclick() {
		setLoadingButton(true);

		setTimeout(() => {
			router.push(`/otamart/store/${partnerID}`);
		}, 1000);
	}

	return (
		<div className="bg-white w-[260px] flex flex-col relative rounded-md shadow-md select-none">
			<div className="h-[130px] mx-3 mt-2 -mb-3 flex items-center justify-center">
				<Image
					className="object-contain w-full h-full pointer-events-none"
					src={partnerLogo}
					alt="Partner Logo"
					width={260}
					height={130}
					unoptimized
				/>
			</div>
			<div className="divider before:bg-black after:bg-black text-black mx-2">
				{partnerName}
			</div>
			<div className="h-[140px] flex flex-col items-center justify-center mx-4 -mt-6">
				<h2 className="text-center font-semibold text-xl text-black">
					{`${cashback}% de Cashback`}
				</h2>
				<p className="text-center text-sm text-black mb-3">
					{couponInfo}
				</p>
				{loadingButton ? (
					<button className="btn btn-primary w-full shadow-md">
						<span className="loading loading-dots loading-md"></span>
					</button>
				) : (
					<button
						onClick={handleclick}
						className="btn btn-primary w-full shadow-md">
						Acessar
					</button>
				)}
			</div>
		</div>
	);
}

export { CashbackCard };
