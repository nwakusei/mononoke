import Image from "next/image";

// Imagens

function CashbackCard({ partnerName, partnerLogo, cashback, couponInfo }) {
	return (
		<div className="bg-base-100 w-[260px] flex flex-col rounded-md relative shadow-lg">
			<div className="h-[150px] mx-3 mt-2 -mb-3 flex items-center justify-center">
				<Image
					className="object-contain w-full h-full"
					src={partnerLogo}
					alt="Partner Logo"
					width={150}
					height={100}
					unoptimized
				/>
			</div>
			<div className="divider mx-2">{partnerName}</div>
			<div className="h-[140px] flex flex-col items-center justify-center mx-4 -mt-6">
				<h2 className="text-center font-semibold text-xl">
					{cashback}% de Cashback
				</h2>
				<p className="text-center text-sm mb-3">{couponInfo}</p>
				<button className="btn btn-primary w-full">Acessar</button>
			</div>
		</div>
	);
}

export { CashbackCard };
