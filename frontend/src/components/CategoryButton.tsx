import React, { useState } from "react";

import api from "@/utils/api";

// Icons
import { GiEvilBook, GiBattleMech } from "react-icons/gi";
import { IoGameControllerOutline } from "react-icons/io5";
import { LuDisc3 } from "react-icons/lu";
import { PiTShirt } from "react-icons/pi";
import { BsSmartwatch } from "react-icons/bs";
import { TbCards } from "react-icons/tb";
import { RiPencilRuler2Line } from "react-icons/ri";
import { GiProtectionGlasses } from "react-icons/gi";

function CategoryButton({ categoriesDB, onCategoryClick }) {
	const categories = [
		{ name: "Impressos", tag: "Impresso", icon: GiEvilBook },
		{ name: "Games", tag: "Game", icon: IoGameControllerOutline },
		{ name: "Figures", tag: "Figure", icon: GiBattleMech },
		{ name: "CDs/DVDs", tag: "CD", icon: LuDisc3 },
		{ name: "Vestuário", tag: "Vestuario", icon: PiTShirt },
		{ name: "Acessórios", tag: "Acessorio", icon: BsSmartwatch },
		{ name: "TCGs", tag: "TCG", icon: TbCards },
		{ name: "Papelaria", tag: "Papelaria", icon: RiPencilRuler2Line },
		{ name: "Óculos", tag: "Oculos", icon: GiProtectionGlasses },
	];

	// Filtrar categorias com base nos nomes que existem em categoriesDB
	const filteredCategories = categories.filter((category) =>
		categoriesDB.includes(category.tag)
	);

	return (
		<div className="flex flex-row justify-center gap-4 mt-3">
			{filteredCategories.map((category) => (
				<div
					key={category.name}
					onClick={() => onCategoryClick?.(category.tag)}
					className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg cursor-pointer transition-all ease-in hover:scale-110 active:scale-[.97]">
					{React.createElement(category.icon, {
						className: "mb-1",
						size: 40,
					})}
					<span className="text-xs select-none">{category.name}</span>
				</div>
			))}
		</div>
	);
}

export { CategoryButton };
