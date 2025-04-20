// Icons
import { MdVerified } from "react-icons/md";

interface IVerifiedBadgeProps {
	partnerVerifiedBadge: string;
}

// Morganita = Morganite | Ambar = Amber | Safira = Sapphire | Âmbar = Amber
function VerifiedBadge({ partnerVerifiedBadge }: IVerifiedBadgeProps) {
	const badges = [
		{ name: "Fluorite", hex: "#C3A2E3", salesQuantity: "xx" },
		{ name: "Blue", hex: "#2196f3", salesQuantity: "500" },
		{ name: "Bronze", hex: "#CD7F32", salesQuantity: "1 mil" },
		{ name: "Silver", hex: "#C0C0C0", salesQuantity: "2,5 mil" },
		{ name: "Gold", hex: "#daa520", salesQuantity: "5 mil" },
		{ name: "Pearl", hex: "#EAE0C8", salesQuantity: "10 mil" },
		{ name: "Morganite", hex: "#F7A8B8", salesQuantity: "20 mil" },
		{ name: "Peridot", hex: "#A2D86B", salesQuantity: "30 mil" },
		{ name: "Amber", hex: "#FF9C33", salesQuantity: "40 mil" },
		{ name: "Aquamarine", hex: "#13B3AC", salesQuantity: "50 mil" },
		{ name: "Obsidian", hex: "#0B0B0B", salesQuantity: "60 mil" },
		{ name: "Emerald", hex: "#00674f", salesQuantity: "70 mil" },
		{ name: "Sapphire", hex: "#0F52BA", salesQuantity: "80 mil" },
		{ name: "Ruby", hex: "#E0115F", salesQuantity: "90 mil" },
		{ name: "Amethyst", hex: "#4c1d95", salesQuantity: "100 mil" },
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
							<span>{`• Selo ${verifiedBadge?.name}`}</span>
						</div>
						<p className="ml-[25px]">
							{`${
								verifiedBadge?.name === "Fluorite"
									? ""
									: `• Mais de ${verifiedBadge?.salesQuantity} vendas`
							}`}
						</p>
						<p className="ml-[25px]">• Conta verificada</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export { VerifiedBadge };
