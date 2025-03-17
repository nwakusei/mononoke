import { useState } from "react";

interface IMiniCouponCardProps {
	couponID: string;
	couponDiscount: number;
	cupomCode: string;
}

function MiniCouponCard({
	couponID,
	couponDiscount,
	cupomCode,
}: IMiniCouponCardProps) {
	const [copied, setCopied] = useState(false);

	const handleCopyCupom = (cupomCode: string) => {
		navigator.clipboard.writeText(cupomCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 5000); // Reset após 5 segundos
	};

	const tipText = copied ? "Código Copiado" : "Clique para copiar o código";

	return (
		<div
			key={couponID}
			className="flex flex-row bg-primary w-[253px] h-[100px] gap-2 rounded-md relative overflow-hidden">
			<div className="flex flex-col items-center mt-1 ml-[30px] gap-2">
				<h2 className="text-xl text-white">
					{couponDiscount}% de Desconto
				</h2>
				<div className="tooltip w-full" data-tip={tipText}>
					<button
						onClick={() => handleCopyCupom(cupomCode)}
						className="btn bg-violet-950 w-[130px]">
						Copiar Código
					</button>{" "}
				</div>
			</div>
			{/* Linha vertical */}
			<div
				className="relative h-full w-[1px] ml-[20px] my-[2px]"
				style={{
					background:
						"repeating-linear-gradient(to bottom, white 0, white 5px, transparent 5px, transparent 10px)",
				}}></div>
			{/* Corte côncavo esquerdo */}
			<div
				className="absolute top-1/2 left-0 w-[20px] h-[40px] bg-white"
				style={{
					borderRadius: "0 50% 50% 0",
					transform: "translate(-50%, -50%)",
				}}></div>
			{/* Corte côncavo direito */}
			<div
				className="absolute top-1/2 right-0 w-[20px] h-[40px] bg-white"
				style={{
					borderRadius: "50% 0 0 50%",
					transform: "translate(50%, -50%)",
				}}></div>
		</div>
	);
}

export { MiniCouponCard };
