import React from "react";
import Image from "next/image";

const MainImageProductAdComponent = ({ selectedImage, product }) => {
	return (
		<div className="bg-white w-[402px] border-black border-solid border-[1px] border-opacity-20 rounded-md relative shadow-lg mb-2">
			<div className="h-[402px] flex items-center justify-center mx-3 my-2">
				{product?.imagesProduct &&
					product?.imagesProduct.length > 0 && (
						<Image
							className="object-contain h-full"
							src={`http://localhost:5000/images/products/${product?.imagesProduct[selectedImage]}`}
							alt={product?.productTitle}
							width={280}
							height={10}
							unoptimized
						/>
					)}
			</div>
		</div>
	);
};

export { MainImageProductAdComponent };
