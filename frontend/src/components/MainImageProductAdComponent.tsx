import React, { useState, useEffect } from "react";

import Image from "next/image";

const MainImageProductAdComponent = ({ selectedImage, product }) => {
	// Inicializa o estado com a imagem padrão
	const [imageUrl, setImageUrl] = useState(product?.imagesProduct?.[0] || ""); // Inicia com a primeira imagem se disponível

	useEffect(() => {
		// Define a imagem a ser renderizada com base nas seleções
		let newImageUrl = imageUrl; // Começa com a imagem atual

		// Verifica se o tipo é 'carousel' e pega a imagem do array de imagens do produto
		if (
			selectedImage.type === "carousel" &&
			product?.imagesProduct?.[selectedImage.index]
		) {
			newImageUrl = product.imagesProduct[selectedImage.index];
		}
		// Verifica se o tipo é 'variation' e pega a imagem correta baseado nos índices fornecidos
		else if (
			selectedImage.type === "variation" &&
			product?.productVariations?.[selectedImage.variationIndex]
		) {
			const variationOption =
				product.productVariations[selectedImage.variationIndex].options[
					selectedImage.index
				];
			if (variationOption) {
				// Verifica se a imagem da variação não é nula ou vazia
				const variationImageUrl = variationOption.imageUrl;
				// Se variationImageUrl existir, atualiza o newImageUrl
				if (variationImageUrl) {
					newImageUrl = variationImageUrl;
				}
				// Caso a variationImageUrl seja vazia ou nula, não altera newImageUrl
			}
		}

		// Atualiza o estado da imagem se newImageUrl for diferente da imagem atual
		if (newImageUrl !== imageUrl) {
			setImageUrl(newImageUrl);
		}
	}, [selectedImage, product, imageUrl]); // Adiciona dependências para atualizar a imagem corretamente

	return (
		<div className="bg-white w-[402px] border-black border-solid border-[1px] border-opacity-20 rounded-md relative shadow-lg mb-2">
			<div className="h-[402px] flex items-center justify-center mx-3 my-2 pointer-events-none select-none">
				{imageUrl && (
					<Image
						className="object-contain w-full h-full"
						src={`http://localhost:5000/images/products/${imageUrl}`}
						alt={product?.productTitle}
						width={10}
						height={10}
						unoptimized
					/>
				)}
			</div>
		</div>
	);
};

export { MainImageProductAdComponent };
