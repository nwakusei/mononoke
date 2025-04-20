import React from "react";
import Image from "next/image";

// Images
import Frame from "../../public/frame.png";
import Mug from "../../public/mug.png";
import Backpack from "../../public/backpack.png";
import Cushion from "../../public/cushion.png";
import Plush from "../../public/plush.png";
import Keychain from "../../public/keychain2.png";
import Cosplay from "../../public/cosplay.png";
import Boot from "../../public/boot.png";

// Icons
import { GiEvilBook, GiBattleMech } from "react-icons/gi";
import { IoGameControllerOutline } from "react-icons/io5";
import { LuDisc3 } from "react-icons/lu";
import { PiTShirt } from "react-icons/pi";
import { BsSmartwatch } from "react-icons/bs";
import { TbCards } from "react-icons/tb";
import { RiPencilRuler2Line } from "react-icons/ri";
import { GiProtectionGlasses } from "react-icons/gi";
import { LuSticker } from "react-icons/lu";

function CategoryButton({ categoriesDB, onCategoryClick }) {
	const categories = [
		{ name: "Impressos", tag: "Printed", icon: GiEvilBook },
		{ name: "Figures", tag: "Figure", icon: GiBattleMech },
		{ name: "TCG", tag: "TCG", icon: TbCards },
		{ name: "Vestuário", tag: "Clothing", icon: PiTShirt },
		{ name: "Acessórios", tag: "Accessory", icon: BsSmartwatch },
		{ name: "CD/DVD", tag: "Disc", icon: LuDisc3 },
		{ name: "Quadros", tag: "Frame", icon: Frame },
		{ name: "Papelaria", tag: "Stationery", icon: RiPencilRuler2Line },
		{ name: "Chaveiros", tag: "Keychain", icon: Keychain },
		{ name: "Canecas", tag: "Mug", icon: Mug },
		{ name: "Pelúcias", tag: "Plush", icon: Plush },
		{ name: "Cosplay", tag: "Cosplay", icon: Cosplay },
		{ name: "Games", tag: "Game", icon: IoGameControllerOutline },
		{ name: "Mochilas", tag: "Backpack", icon: Backpack },
		{ name: "Almofadas", tag: "Cushion", icon: Cushion },
		{ name: "Adesivos", tag: "Sticker", icon: LuSticker },
		{ name: "Óculos", tag: "Glasses", icon: GiProtectionGlasses },
		{ name: "Calçados", tag: "Boot", icon: Boot },
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
					{typeof category.icon === "function" ? ( // Se for um ícone React
						React.createElement(category.icon, {
							className: "mb-1",
							size: 40,
						})
					) : (
						<Image // Se for uma imagem
							src={category.icon}
							alt={category.name}
							width={40}
							height={40}
							className="mb-1 object-contain"
						/>
					)}

					<span className="text-xs select-none">{category.name}</span>
				</div>
			))}
		</div>
	);
}

export { CategoryButton };
