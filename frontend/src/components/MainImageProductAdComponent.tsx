import React from "react";
import Image from "next/image";

const MainImageProductAdComponent = ({ selectedImage, product }) => {
	// Verifica se o índice selecionado é válido para imagesProduct
	const isValidImageIndex =
		product?.imagesProduct?.[selectedImage] !== undefined;

	// Obtém a URL da imagem da imagem principal ou da variação
	const imageUrl = isValidImageIndex
		? product.imagesProduct[selectedImage]
		: product?.productVariations?.[0]?.options?.[selectedImage]?.imageUrl; // Busca a imagem com base no índice de selectedImage das opções de variação

	return (
		<div className="bg-white w-[402px] border-black border-solid border-[1px] border-opacity-20 rounded-md relative shadow-lg mb-2">
			<div className="h-[402px] flex items-center justify-center mx-3 my-2">
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
