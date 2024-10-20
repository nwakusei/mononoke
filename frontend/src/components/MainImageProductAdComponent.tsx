import React from "react";
import Image from "next/image";

const MainImageProductAdComponent = ({ selectedImage, product }) => {
	let imageUrl = "";

	if (
		selectedImage.type === "carousel" &&
		product?.imagesProduct?.[selectedImage.index]
	) {
		imageUrl = product.imagesProduct[selectedImage.index];
	} else if (
		selectedImage.type === "variation" &&
		product?.productVariations
	) {
		const variationOption = product.productVariations
			.flatMap((v) => v.options)
			.find((_, index) => index === selectedImage.index);
		if (variationOption) {
			imageUrl = variationOption.imageUrl;
		}
	}

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
