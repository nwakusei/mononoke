"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// Icons

function ProductVariation({}) {
	const [variation, setVariation] = useState<{ [key: string]: boolean }>({});

	function handleVariation(itemId: string) {
		setVariation((prevState) => {
			// Coment
			const deselectedItems = Object.keys(prevState).reduce(
				(acc, key) => ({
					...acc,
					[key]: key === itemId ? !prevState[key] : false,
				}),
				{}
			);
			return {
				...deselectedItems,
				[itemId]: !prevState[itemId],
			};
		});
	}

	return (
		<div>
			{/* Variações */}
			<div className="flex flex-col mb-2">
				<h2 className="mb-1">
					<span>Escolha a Cor:</span>
				</h2>
				<div className="flex flex-row gap-2">
					<div
						onClick={() => handleVariation("item1")}
						className={`${
							variation["item1"] ? "bg-sky-500" : ""
						} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
						<span>Preto</span>
					</div>

					<div
						onClick={() => handleVariation("item2")}
						className={`${
							variation["item2"] ? "bg-sky-500" : ""
						} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
						<span>Azul</span>
					</div>

					<div
						onClick={() => handleVariation("item3")}
						className={`${
							variation["item3"] ? "bg-sky-500" : ""
						} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
						<span>Rosa</span>
					</div>

					<div
						onClick={() => handleVariation("item4")}
						className={`${
							variation["item4"] ? "bg-sky-500" : ""
						} hover:bg-sky-500 transition-all ease-in duration-150 py-2 px-4 border-solid border-2 border-blue-500 rounded-md cursor-pointer`}>
						<span>Amarelo</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export { ProductVariation };
