"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import CryptoJS from "crypto-js";

// Função para criptografar dados
function encryptData(data) {
	return CryptoJS.AES.encrypt(
		JSON.stringify(data), // Converte o objeto inteiro para string
		"chave-secreta"
	).toString();
}

// Função para descriptografar dados
function decryptData(encryptedData) {
	try {
		if (!encryptedData) {
			console.error("Nenhum dado para descriptografar.");
			return null;
		}

		const bytes = CryptoJS.AES.decrypt(encryptedData, "chave-secreta");
		const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

		if (!decryptedString) {
			console.error(
				"Falha ao descriptografar: String vazia ou inválida."
			);
			return null;
		}

		return JSON.parse(decryptedString);
	} catch (error) {
		console.error("Erro ao descriptografar:", error);
		return null;
	}
}

interface IVariationOption {
	_id: string;
	imageUrl: string;
	name: string;
	originalPrice: number;
	promotionalPrice: number;
	stock: number;
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
	// Recupera as variações selecionadas do localStorage e descriptografa
	const encryptedVariations = localStorage.getItem("selectedVariations");
	const initialVariations = encryptedVariations
		? decryptData(encryptedVariations) || {}
		: {};

	const [variation, setVariation] = useState<{ [key: string]: any }>(
		initialVariations
	);

	// Atualiza o localStorage sempre que as variações mudarem
	useEffect(() => {
		const encryptedData = encryptData(variation);
		localStorage.setItem("selectedVariations", encryptedData);
	}, [variation]);

	function handleVariation(variationKey: string, option: IVariationOption) {
		setVariation((prevState) => {
			const isAlreadySelected =
				prevState[variationKey]?.name === option.name;

			if (isAlreadySelected) {
				const updatedVariation = { ...prevState };
				delete updatedVariation[variationKey];
				return updatedVariation;
			}

			const variationTitle = variations.find(
				(v) => v._id === variationKey
			)?.title;

			return {
				...prevState,
				[variationKey]: {
					variationID: variationKey,
					variationName: variationTitle,
					optionID: option._id,
					imageUrl: option.imageUrl,
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
			{variations.map((variationOption, variationIndex) => {
				const variationKey = variationOption._id;
				const values = variationOption.options;

				return (
					<div key={variationKey} className="mb-4 text-black text-sm">
						<h2 className="mb-2">{variationOption.title}</h2>
						<div className="flex flex-row flex-wrap gap-2 w-[350px]">
							{values.length > 0 ? (
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
											variation[variationKey]?.name ===
											option.name
												? "bg-secondary text-white border-solid shadow-md"
												: "border-dashed select-none"
										} hover:bg-secondary hover:text-white transition-all ease-in duration-150 py-[4px] px-[6px] hover:border-solid border-[1px] border-primary rounded hover:shadow-md cursor-pointer flex items-center gap-[5px]`}>
										{option.imageUrl && (
											<Image
												className="w-6 rounded-sms pointer-events-none select-none"
												src={`https://mononokebucket.s3.us-east-1.amazonaws.com/${option.imageUrl}`}
												alt={option.name}
												width={10}
												height={10}
												unoptimized
											/>
										)}
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
