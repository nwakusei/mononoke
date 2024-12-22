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

function CategoryButton({ categoriesDB }) {
	const categories = [
		{ name: "Impressos", Tag: "Impresso", icon: GiEvilBook },
		{ name: "Games", Tag: "Game", icon: IoGameControllerOutline },
		{ name: "Figures", Tag: "Figure", icon: GiBattleMech },
		{ name: "CDs/DVDs", Tag: "CD", icon: LuDisc3 },
		{ name: "Vestuário", Tag: "Vestuario", icon: PiTShirt },
		{ name: "Acessórios", Tag: "Acessorio", icon: BsSmartwatch },
		{ name: "TCGs", Tag: "TCG", icon: TbCards },
		{ name: "Papelaria", Tag: "Papelaria", icon: RiPencilRuler2Line },
		{ name: "Óculos", Tag: "Oculos", icon: GiProtectionGlasses },
	];

	// Filtrar categorias com base nos nomes que existem em categoriesDB
	const filteredCategories = categories.filter((category) =>
		categoriesDB.includes(category.Tag)
	);

	return (
		<div className="flex flex-col items-center justify-center col-start-2 col-span-4 md:col-start-2 md:col-span-6">
			<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mt-8 mb-2 rounded-md shadow-md select-none">
				Categorias
			</div>
			<div className="flex flex-row justify-center gap-4 mt-3">
				{filteredCategories.map((category) => (
					<div
						key={category.name}
						className="flex items-center cursor-pointer">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 active:scale-[.97]">
							{React.createElement(category.icon, {
								className: "mb-1",
								size: 40,
							})}
							<span className="text-xs select-none">
								{category.name}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export { CategoryButton };
