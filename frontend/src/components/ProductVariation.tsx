// "use client";

// import { useState, useEffect } from "react";
// import Image from "next/image";

// interface IVariationOption {
// 	name: string;
// 	imageUrl: string;
// 	_id: string;
// }

// interface IVariation {
// 	title: string;
// 	options: IVariationOption[];
// 	_id: string;
// }

// interface IProductVariationProps {
// 	variations: IVariation[];
// }

// function ProductVariation({ variations, handleVariationClick }) {
// 	// // Recupera as variações selecionadas do localStorage, ou um objeto vazio se não houver (State anterior que funciona, se precisar voltar basta ativar)
// 	// const [variation, setVariation] = useState<{ [key: string]: string }>(() =>
// 	// 	JSON.parse(localStorage.getItem("selectedVariations") || "{}")
// 	// );

// 	// Recupera as variações selecionadas do localStorage, mas ignora strings vazias
// 	const initialVariations = JSON.parse(
// 		localStorage.getItem("selectedVariations") || "{}"
// 	);
// 	const filteredVariations = Object.fromEntries(
// 		Object.entries(initialVariations).filter(([, value]) => value !== "")
// 	);

// 	const [variation, setVariation] = useState<{ [key: string]: string }>(
// 		filteredVariations
// 	);

// 	console.log(variation);

// 	// Atualiza o localStorage sempre que as variações mudarem
// 	useEffect(() => {
// 		localStorage.setItem("selectedVariations", JSON.stringify(variation));
// 	}, [variation]);

// 	function handleVariation(variationKey: string, selectedValue: string) {
// 		setVariation((prevState) => {
// 			const updatedVariation = {
// 				...prevState,
// 				[variationKey]:
// 					prevState[variationKey] === selectedValue
// 						? ""
// 						: selectedValue,
// 			};

// 			// Remove a variação do localStorage se a seleção for desfeita
// 			if (prevState[variationKey] === selectedValue) {
// 				delete updatedVariation[variationKey];
// 			}

// 			return updatedVariation;
// 		});
// 	}

// 	return (
// 		<div>
// 			{variations &&
// 				variations.map((variationOption, variationIndex) => {
// 					const variationKey = variationOption._id; // Usando o ID como chave única
// 					const values = variationOption.options; // Obtém as opções para a variação

// 					return (
// 						<div key={variationKey} className="mb-4">
// 							<h2 className="mb-2">{variationOption.title}</h2>
// 							<div className="flex flex-row flex-wrap gap-2 w-[350px]">
// 								{Array.isArray(values) && values.length > 0 ? (
// 									values.map((option, index) => (
// 										<div
// 											key={option._id}
// 											onClick={() => {
// 												handleVariation(
// 													variationKey,
// 													option.name
// 												);
// 												handleVariationClick(
// 													variationIndex,
// 													index
// 												); // Agora é mais claro que estamos lidando com uma variação
// 											}}
// 											className={`${
// 												variation[variationKey] ===
// 												option.name
// 													? "bg-secondary text-white border-solid shadow-md"
// 													: "border-dashed select-none"
// 											} hover:bg-secondary hover:text-white transition-all ease-in duration-150 py-[4px] px-[6px] hover:border-solid border-[1px] border-primary rounded hover:shadow-md cursor-pointer flex items-center gap-[5px]`}>
// 											{option.imageUrl ? (
// 												<Image
// 													className="w-6 rounded-sms pointer-events-none select-none"
// 													src={`http://localhost:5000/images/products/${option.imageUrl}`}
// 													alt={option.name}
// 													width={10}
// 													height={10}
// 													unoptimized
// 												/>
// 											) : (
// 												<></> // Se a imageUrl for vazia, não renderiza nada
// 											)}
// 											<span className="select-none">
// 												{option.name}
// 											</span>
// 										</div>
// 									))
// 								) : (
// 									<p>
// 										Este produto não possui variações
// 										disponíveis.
// 									</p>
// 								)}
// 							</div>
// 						</div>
// 					);
// 				})}
// 		</div>
// 	);
// }

// export { ProductVariation };

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface IVariationOption {
	_id: string;
	imageUrl: string;
	name: string;
	originalPrice: number;
	promotionalPrice: number;
	stock: number; // Inclui o estoque na interface da opção
}

interface IVariation {
	_id: string;
	title: string;
	options: IVariationOption[];
}

interface IProductVariationProps {
	variations: IVariation[];
	handleVariationClick: (variationIndex: number, optionIndex: number) => void;
}

function ProductVariation({
	variations,
	handleVariationClick,
}: IProductVariationProps) {
	// Recupera as variações selecionadas do localStorage, mas ignora strings vazias
	const initialVariations = JSON.parse(
		localStorage.getItem("selectedVariations") || "{}"
	);
	const filteredVariations = Object.fromEntries(
		Object.entries(initialVariations).filter(([, value]) => value !== "")
	);

	const [variation, setVariation] = useState<{ [key: string]: any }>(
		filteredVariations
	);

	// Atualiza o localStorage sempre que as variações mudarem
	useEffect(() => {
		localStorage.setItem("selectedVariations", JSON.stringify(variation));
	}, [variation]);

	function handleVariation(variationKey: string, option: IVariationOption) {
		setVariation((prevState) => {
			// Verifica se a variação já está selecionada
			const isAlreadySelected =
				prevState[variationKey]?.name === option.name;

			// Se já está selecionada, remove-a
			if (isAlreadySelected) {
				const updatedVariation = { ...prevState };
				delete updatedVariation[variationKey];
				return updatedVariation;
			}

			// Caso contrário, atualiza para incluir apenas a nova variação
			return {
				[variationKey]: {
					name: option.name,
					originalPrice: option.originalPrice,
					promotionalPrice: option.promotionalPrice,
					stock: option.stock,
				},
			};
		});
	}

	return (
		<div>
			{variations &&
				variations.map((variationOption, variationIndex) => {
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
													option
												);
												handleVariationClick(
													variationIndex,
													index
												);
											}}
											className={`${
												variation[variationKey]
													?.name === option.name
													? "bg-secondary text-white border-solid shadow-md"
													: "border-dashed select-none"
											} hover:bg-secondary hover:text-white transition-all ease-in duration-150 py-[4px] px-[6px] hover:border-solid border-[1px] border-primary rounded hover:shadow-md cursor-pointer flex items-center gap-[5px]`}>
											{option.imageUrl ? (
												<Image
													className="w-6 rounded-sms pointer-events-none select-none"
													src={`http://localhost:5000/images/products/${option.imageUrl}`}
													alt={option.name}
													width={10}
													height={10}
													unoptimized
												/>
											) : null}
											<span className="select-none">
												{option.name}
											</span>
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
