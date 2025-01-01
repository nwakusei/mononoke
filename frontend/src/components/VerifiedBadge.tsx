// Icons
import { MdVerified } from "react-icons/md";

interface IVerifiedBadgeProps {
	partnerVerifiedBadge: string;
}

function VerifiedBadge({ partnerVerifiedBadge }: IVerifiedBadgeProps) {
	const badges = [
		{ name: "Bronze", hex: "#CD7F32", salesQuantity: "500" },
		{ name: "Prata", hex: "#C0C0C0", salesQuantity: "700" },
		{ name: "Dourado", hex: "#daa520", salesQuantity: "1000" },
		{ name: "Pérola", hex: "#EAE0C8", salesQuantity: "500" },
		{ name: "Obsidiana", hex: "#0B0B0B", salesQuantity: "500" },
		{ name: "Esmeralda", hex: "#50C878", salesQuantity: "500" },
		{ name: "Safira", hex: "#0F52BA", salesQuantity: "500" },
		{ name: "Rubi", hex: "#E0115F", salesQuantity: "5 mil" },
		{ name: "Ametista", hex: "#9966CC", salesQuantity: "5 mil" },
	];

	// Usando o código hexadecimal completo
	const verifiedBadge = badges.find(
		(badge) => badge.name === partnerVerifiedBadge
	);

	return (
		<div className="flex flex-row gap-1">
			<div className="relative inline-block mt-[2px]">
				<div className="group">
					{/* Ícone visível no lado do cliente */}
					<MdVerified
						style={{
							color: verifiedBadge ? verifiedBadge.hex : "#000",
						}} // Cor dinâmica do primeiro badge
						className="cursor-pointer"
						size={17}
					/>
					{/* Tooltip */}
					<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-64 p-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition duration-300 border-[1px] border-black bg-white text-black text-sm rounded shadow-lg pointer-events-none">
						<div className="flex flex-row items-center gap-2">
							<MdVerified
								style={{
									color: verifiedBadge
										? verifiedBadge.hex
										: "#000",
								}}
								size={18}
							/>
							<span>{`Selo ${verifiedBadge?.name}`}</span>
						</div>
						<p className="ml-[25px]">
							{`Loja com mais de ${verifiedBadge?.salesQuantity} vendas`}
						</p>
						<p className="ml-[25px]">Conta verificada</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export { VerifiedBadge };
