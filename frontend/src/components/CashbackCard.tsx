import Image from "next/image";
import Link from "next/link";

// Imagens

function CashbackCard({
	partnerID,
	partnerName,
	partnerLogo,
	cashback,
	couponInfo,
}) {
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
				<button className="btn btn-primary w-full shadow-md">
					<Link href={`/otamart/store/${partnerID}`}>Acessar</Link>
				</button>
			</div>
		</div>
	);
}

export { CashbackCard };
