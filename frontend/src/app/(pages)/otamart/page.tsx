"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Image from "next/image";
import api from "@/utils/api";

// Context
import { Context } from "@/context/UserContext";

// Icons
import { Currency } from "@icon-park/react";
import { Financing, Cd } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill } from "react-icons/bs";
import { GiEvilBook, GiArchitectMask, GiBattleMech } from "react-icons/gi";
import { IoGameControllerOutline } from "react-icons/io5";
import { LuDisc3 } from "react-icons/lu";
import { PiTShirtLight, PiTShirt } from "react-icons/pi";
import { BsSmartwatch } from "react-icons/bs";
import { FaHatWizard } from "react-icons/fa";
import { TbCards } from "react-icons/tb";
import { LuPencilRuler } from "react-icons/lu";
import { RiPencilRuler2Line } from "react-icons/ri";
import { GiProtectionGlasses } from "react-icons/gi";
import { GiSunglasses } from "react-icons/gi";
import { LiaShippingFastSolid } from "react-icons/lia";

// Components
import { ProductAdCard } from "@/components/ProductAdCard";
import { headers } from "next/headers";
import { set } from "react-hook-form";
import { error } from "console";

function OtamartPage() {
	const [products, setProducts] = useState([]);

	const { partners } = useContext(Context);

	useEffect(() => {
		api.get("/products/").then((response) => {
			console.log(response.data);
			setProducts(response.data.products);
		});
	}, []);

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 min-h-screen mx-4">
			<div className="flex flex-col items-center justify-center bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="divider text-xl md:text-2xl font-semibold">
					Categorias
				</div>
				<div className="flex flex-row justify-center gap-4 my-3">
					<div className="flex items-center">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 active:scale-[.97] cursor-pointer">
							<GiEvilBook className="mb-1" size={40} />
							<span className="text-xs">Impressos</span>
						</div>
					</div>

					<div className="flex items-center">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 active:scale-[.97] cursor-pointer">
							<IoGameControllerOutline
								className="mb-1"
								size={40}
							/>
							<span className="text-xs">Games</span>
						</div>
					</div>

					<div className="flex items-center">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 active:scale-[.97] cursor-pointer">
							<GiBattleMech className="mb-1" size={40} />
							<span className="text-xs">Figures</span>
						</div>
					</div>

					<div className="flex items-center">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 active:scale-[.97] cursor-pointer">
							<LuDisc3 className="mb-1" size={40} />
							<span className="text-xs">CDs/DVDs</span>
						</div>
					</div>

					<div className="flex items-center">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 active:scale-[.97] cursor-pointer">
							<PiTShirt className="mb-1" size={40} />
							<span className="text-xs">Roupas</span>
						</div>
					</div>

					<div className="flex items-center">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 active:scale-[.97] cursor-pointer">
							<BsSmartwatch className="mb-1" size={40} />
							<span className="text-xs">Acessórios</span>
						</div>
					</div>

					<div className="flex items-center">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 active:scale-[.97] cursor-pointer">
							<TbCards className="mb-1" size={40} />
							<span className="text-xs">TCG</span>
						</div>
					</div>

					<div className="flex items-center">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 active:scale-[.97] cursor-pointer">
							<RiPencilRuler2Line className="mb-1" size={40} />
							<span className="text-xs">Papelaria</span>
						</div>
					</div>

					<div className="flex items-center">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 active:scale-[.97] cursor-pointer">
							<GiProtectionGlasses className="mb-1" size={40} />
							<span className="text-xs">Óculos</span>
						</div>
					</div>

					{/* <div className="flex items-center">
						<div className="flex flex-col justify-center items-center w-20 h-20 bg-primary rounded-md shadow-lg transition-all ease-in hover:scale-110 cursor-pointer">
							<GiSunglasses className="mb-1" size={40} />
							<span className="text-xs">Ótica</span>
						</div>
					</div> */}
				</div>
			</div>

			<div className="bg-yellow-500 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-8">
				<div className="divider text-center text-xl md:text-2xl font-semibold mb-8">
					Produtos em Destaque
				</div>

				<div className="flex flex-row flex-wrap gap-4 justify-center">
					{products.length > 0 &&
						products.map((product) => {
							// Encontrar o parceiro correspondente com base no partnerID do produto
							const partner = partners.find(
								(partner) => partner._id === product.partnerID
							);

							// Obter o cashback do parceiro, se existir
							const cashback = partner ? partner.cashback : 0;

							return (
								<ProductAdCard
									key={product._id}
									freeShipping={product.freeShipping}
									productImage={`http://localhost:5000/images/products/${product.imagesProduct[0]}`}
									title={product.productName}
									originalPrice={Number(
										product.originalPrice.$numberDecimal
									)}
									promocionalPrice={Number(
										product.promocionalPrice.$numberDecimal
									)}
									price={Number(
										product.originalPrice.$numberDecimal
									)}
									promoPrice={Number(
										product.promocionalPrice.$numberDecimal
									)}
									cashback={cashback} // Passar o cashback para o componente ProductAdCard
									rating={product.rating}
									quantitySold={
										product.productsSold > 1
											? `${product.productsSold} Vendidos`
											: `${product.productsSold} Vendido`
									}
									linkProductPage={`/otamart/${product._id}`}
								/>
							);
						})}
				</div>
			</div>
		</section>
	);
}

export default OtamartPage;
