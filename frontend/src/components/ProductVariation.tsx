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

function ProductVariation({ variations }) {
	// Recupera as variações selecionadas do localStorage, ou um objeto vazio se não houver
	const [variation, setVariation] = useState<{ [key: string]: string }>(() =>
		JSON.parse(localStorage.getItem("selectedVariations") || "{}")
	);

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
			{variations.map((variationOption) => {
				// A chave deve ser o nome da propriedade, ex: "cor"
				const variationKey = Object.keys(variationOption)[0];
				const values = variationOption[variationKey]; // Obtém as variações para a chave

				return (
					<div key={variationKey} className="mb-4">
						<h2 className="mb-1">Escolha o(a) {variationKey}:</h2>
						<div className="flex flex-row flex-wrap gap-2 w-[350px]">
							{Array.isArray(values) && values.length > 0 ? (
								values.map((value, index) => (
									<div
										key={index}
										onClick={() =>
											handleVariation(variationKey, value)
										}
										className={`${
											variation[variationKey] === value
												? "bg-secondary text-white border-solid shadow-md"
												: "border-dashed"
										} hover:bg-secondary hover:text-white transition-all ease-in duration-150 py-2 px-4 hover:border-solid border-[1px] border-primary rounded-md hover:shadow-md cursor-pointer`}>
										<span>{value}</span>
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
