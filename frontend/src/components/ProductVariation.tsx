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
													option.name
												);
												handleVariationClick(
													variationIndex,
													index
												); // Agora é mais claro que estamos lidando com uma variação
											}}
											className={`${
												variation[variationKey] ===
												option.name
													? "bg-secondary text-white border-solid shadow-md"
													: "border-dashed"
											} hover:bg-secondary hover:text-white transition-all ease-in duration-150 py-[4px] px-[6px] hover:border-solid border-[1px] border-primary rounded hover:shadow-md cursor-pointer flex items-center gap-[5px]`}>
											{option.imageUrl ? (
												<Image
													className="w-6 rounded-sms"
													src={`http://localhost:5000/images/products/${option.imageUrl}`}
													alt={option.name}
													width={10}
													height={10}
													unoptimized
												/>
											) : (
												<></> // Se a imageUrl for vazia, não renderiza nada
											)}
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
