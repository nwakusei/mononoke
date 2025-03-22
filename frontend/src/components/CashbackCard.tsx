import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Imagens
import Otakuyasan from "../../public/otakuyasan.png";

import crypto from "crypto";

const secretKey = "chaveSuperSecretaDe32charsdgklot";

// Função para Descriptografar dados sensíveis no Banco de Dados
function decrypt(encryptedBalance: string): number | null {
	let decrypted = "";

	try {
		// Divide o IV do texto criptografado
		const [ivHex, encryptedData] = encryptedBalance.split(":");
		if (!ivHex || !encryptedData) {
			throw new Error("Formato inválido do texto criptografado.");
		}

		const iv = Buffer.from(ivHex, "hex");

		const decipher = crypto.createDecipheriv(
			"aes-256-cbc",
			Buffer.from(secretKey, "utf-8"),
			iv
		);

		decipher.setAutoPadding(false);

		decrypted = decipher.update(encryptedData, "hex", "utf8");
		decrypted += decipher.final("utf8");

		const balanceNumber = parseFloat(decrypted.trim()); // Remove espaços em branco extras
		if (isNaN(balanceNumber)) {
			return null;
		}
		return parseFloat(balanceNumber.toFixed(2));
	} catch (error) {
		console.error("Erro ao descriptografar o saldo:", error);
		return null;
	}
}

function CashbackCard({
	partnerNickname,
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
			router.push(`/otamart/store/${partnerNickname}`);
		}, 1000);
	}

	return (
		<div className="bg-white w-[260px] flex flex-col relative rounded-md shadow-md select-none">
			<div className="h-[130px] mx-3 mt-2 -mb-3 flex items-center justify-center">
				<Image
					className="object-contain w-full h-full pointer-events-none"
					src={
						partnerLogo
							? `http://localhost:5000/images/partners/${partnerLogo}`
							: Otakuyasan
					}
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
					{`${decrypt(cashback)}% de Cashback`}
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
						Acessar Loja
					</button>
				)}
			</div>
		</div>
	);
}

export { CashbackCard };
