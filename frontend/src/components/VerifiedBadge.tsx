// Icons
import { MdVerified } from "react-icons/md";

interface IVerifiedBadgeProps {
	partnerVerifiedBadge: string;
}

function VerifiedBadge({ partnerVerifiedBadge }: IVerifiedBadgeProps) {
	const badges = [
		{ name: "AzulComprado", hex: "#80c6ff", salesQuantity: "500" },
		{ name: "Azul", hex: "#2196f3", salesQuantity: "500" },
		{ name: "Bronze", hex: "#CD7F32", salesQuantity: "1 mil" },
		{ name: "Prata", hex: "#C0C0C0", salesQuantity: "2 mil" },
		{ name: "Dourado", hex: "#daa520", salesQuantity: "5 mil" },
		{ name: "Pérola", hex: "#EAE0C8", salesQuantity: "10 mil" },
		{ name: "Morganita Clara", hex: "#F4C1C1", salesQuantity: "xx mil" },
		{ name: "Morganita Médio", hex: "#F7A8B8", salesQuantity: "xx mil" },
		{ name: "Morganita Pêssego", hex: "#F1C0A0", salesQuantity: "xx mil" },
		{ name: "Peridoto", hex: "#A2D86B", salesQuantity: "xx mil" },
		{ name: "Safira Laranja", hex: "#E65C00", salesQuantity: "xx mil" },
		{ name: "Âmbar Médio", hex: "#FF9C33", salesQuantity: "xx mil" },
		{ name: "Âmbar Escuro", hex: "#D9773B", salesQuantity: "xx mil" },
		{ name: "Aquamarina", hex: "#7FB7D1", salesQuantity: "xx mil" },
		{ name: "Obsidiana", hex: "#0B0B0B", salesQuantity: "20 mil" },
		{ name: "Esmeralda", hex: "#00674f", salesQuantity: "30 mil" },
		{ name: "Safira", hex: "#0F52BA", salesQuantity: "50 mil" },
		{ name: "Rubi", hex: "#E0115F", salesQuantity: "75 mil" },
		{ name: "Ametista", hex: "#4c1d95", salesQuantity: "100 mil" },
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
							{`• Mais de ${verifiedBadge?.salesQuantity} vendas`}
						</p>
						<p className="ml-[25px]">• Conta verificada</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export { VerifiedBadge };
