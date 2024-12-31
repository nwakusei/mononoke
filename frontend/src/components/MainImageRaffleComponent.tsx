import React, { useState, useEffect } from "react";

import Image from "next/image";

const MainImageRaffleComponent = ({ selectedImage, raffle }) => {
	// Inicializa o estado com a imagem padrão
	const [imageUrl, setImageUrl] = useState(raffle?.imagesRaffle?.[0] || ""); // Inicia com a primeira imagem se disponível

	useEffect(() => {
		// Define a imagem a ser renderizada com base nas seleções
		let newImageUrl = imageUrl; // Começa com a imagem atual

		// Verifica se o tipo é 'carousel' e pega a imagem do array de imagens do produto
		if (
			selectedImage.type === "carousel" &&
			raffle?.imagesRaffle?.[selectedImage.index]
		) {
			newImageUrl = raffle.imagesRaffle[selectedImage.index];
		}

		// Atualiza o estado da imagem se newImageUrl for diferente da imagem atual
		if (newImageUrl !== imageUrl) {
			setImageUrl(newImageUrl);
		}
	}, [selectedImage, raffle, imageUrl]); // Adiciona dependências para atualizar a imagem corretamente

	return (
		<div className="bg-white w-[402px] border-black border-solid border-[1px] border-opacity-20 rounded-md relative shadow-lg mb-2">
			<div className="h-[402px] flex items-center justify-center mx-3 my-2 pointer-events-none select-none">
				{imageUrl && (
					<Image
						className="object-contain w-full h-full"
						src={`http://localhost:5000/images/raffles/${imageUrl}`}
						alt={
							raffle?.raffleTitle || "Imagem Miniatura do sorteio"
						}
						width={10}
						height={10}
						unoptimized
					/>
				)}
			</div>
		</div>
	);
};

export { MainImageRaffleComponent };
