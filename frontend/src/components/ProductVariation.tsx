// "use client";

// import { useState, useEffect } from "react";
// import Image from "next/image";
// import Link from "next/link";

// // Icons

// function ProductVariation({}) {
// 	const [variation, setVariation] = useState<{ [key: string]: boolean }>({});

// 	console.log(variation);

// 	function handleVariation(itemId: string) {
// 		setVariation((prevState) => {
// 			// Coment
// 			const deselectedItems = Object.keys(prevState).reduce(
// 				(acc, key) => ({
// 					...acc,
// 					[key]: key === itemId ? !prevState[key] : false,
// 				}),
// 				{}
// 			);
// 			return {
// 				...deselectedItems,
// 				[itemId]: !prevState[itemId],
// 			};
// 		});
// 	}

// 	return (
// 		<div>
// 			{/* Variações */}
// 			<div className="flex flex-col mb-2 text-black">
// 				<h2 className="mb-1">
// 					<span>Escolha a Cor:</span>
// 				</h2>
// 				<div className="flex flex-row flex-wrap gap-2 w-[350px]">
// 					<div
// 						onClick={() => handleVariation("item1")}
// 						className={`${
// 							variation["item1"]
// 								? "bg-secondary text-white border-solid shadow-md"
// 								: "border-dashed"
// 						} hover:bg-secondary hover:text-white transition-all ease-in duration-150 py-2 px-4 hover:border-solid border-[1px] border-primary rounded-md hover:shadow-md cursor-pointer`}>
// 						<span>Preto</span>
// 					</div>

// 					<div
// 						onClick={() => handleVariation("item2")}
// 						className={`${
// 							variation["item2"]
// 								? "bg-secondary text-white border-solid shadow-md"
// 								: "border-dashed"
// 						} hover:bg-secondary hover:text-white transition-all ease-in duration-150 py-2 px-4 hover:border-solid border-[1px] border-primary rounded-md hover:shadow-md cursor-pointer`}>
// 						<span>Azul</span>
// 					</div>

// 					<div
// 						onClick={() => handleVariation("item3")}
// 						className={`${
// 							variation["item3"]
// 								? "bg-secondary text-white border-solid shadow-md"
// 								: "border-dashed"
// 						} hover:bg-secondary hover:text-white transition-all ease-in duration-150 py-2 px-4 hover:border-solid border-[1px] border-primary rounded-md hover:shadow-md cursor-pointer`}>
// 						<span>Rosa</span>
// 					</div>

// 					<div
// 						onClick={() => handleVariation("item4")}
// 						className={`${
// 							variation["item4"]
// 								? "bg-secondary text-white border-solid shadow-md"
// 								: "border-dashed"
// 						} hover:bg-secondary hover:text-white transition-all ease-in duration-150 py-2 px-4 hover:border-solid border-[1px] border-primary rounded-md hover:shadow-md cursor-pointer`}>
// 						<span>Amarelo</span>
// 					</div>
// 				</div>
// 			</div>
// 		</div>
// 	);
// }

// export { ProductVariation };

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface VariationOption {
	name: string;
	imageUrl: string;
	_id: string;
}

interface Variation {
	title: string;
	options: VariationOption[];
	_id: string;
}

interface ProductVariationProps {
	variations: Variation[];
}

function ProductVariation({ variations, handleVariationClick }) {
	// Recupera as variações selecionadas do localStorage, ou um objeto vazio se não houver
	const [variation, setVariation] = useState<{ [key: string]: string }>(() =>
		JSON.parse(localStorage.getItem("selectedVariations") || "{}")
	);

	console.log(variation);

	// Atualiza o localStorage sempre que as variações mudarem
	useEffect(() => {
		localStorage.setItem("selectedVariations", JSON.stringify(variation));
	}, [variation]);

	function handleVariation(variationKey: string, selectedValue: string) {
		setVariation((prevState) => {
			const updatedVariation = {
				...prevState,
				[variationKey]:
					prevState[variationKey] === selectedValue
						? ""
						: selectedValue,
			};
			return updatedVariation;
		});
	}

	return (
		<div>
			{variations &&
				variations.map((variationOption) => {
					const variationKey = variationOption._id; // Usando o ID como chave única
					const values = variationOption.options; // Obtém as opções para a variação

					return (
						<div key={variationKey} className="mb-4">
							<h2 className="mb-2">{variationOption.title}</h2>
							<div className="flex flex-row flex-wrap gap-2 w-[350px]">
								{Array.isArray(values) && values.length > 0 ? (
									values.map((option, index) => (
										<div
											key={option._id}
											onClick={() => {
												handleVariation(
													variationKey,
													option.name
												);
												handleVariationClick(index); // Passando o índice
											}}
											className={`${
												variation[variationKey] ===
												option.name
													? "bg-secondary text-white border-solid shadow-md"
													: "border-dashed"
											} hover:bg-secondary hover:text-white transition-all ease-in duration-150 p-2 hover:border-solid border-[1px] border-primary rounded-md hover:shadow-md cursor-pointer flex items-center gap-2`}>
											<Image
												className="w-6 rounded-sms"
												src={`http://localhost:5000/images/products/${option.imageUrl}`}
												alt={option.name}
												width={10}
												height={10}
												unoptimized
											/>
											<span>{option.name}</span>
										</div>
									))
								) : (
									<p>
										Este produto não possui variações
										disponíveis.
									</p>
								)}
							</div>
						</div>
					);
				})}
		</div>
	);
}

export { ProductVariation };
