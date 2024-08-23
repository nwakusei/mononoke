"use client";

import { useState, useEffect, useContext } from "react";
import api from "@/utils/api";
import Image from "next/image";

// Importe suas imagens e ícones aqui
import Amora from "../../../../../../public/amora.jpg";
import imageProfile from "../../../../../public/Kon.jpg";

// Context
import { Context } from "@/context/UserContext";

// Icons
import { GiEvilBook, GiBattleMech } from "react-icons/gi";
import { IoGameControllerOutline } from "react-icons/io5";
import { LuDisc3 } from "react-icons/lu";
import { PiTShirt } from "react-icons/pi";
import { TbCards } from "react-icons/tb";
import { RiPencilRuler2Line } from "react-icons/ri";
import { MdVerified } from "react-icons/md";
import { Peoples, RightUser } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill, BsBox2Heart } from "react-icons/bs";
import { CiBoxes } from "react-icons/ci";
import { CgBox } from "react-icons/cg";

import { useParams } from "next/navigation";

// Components
import { ProductAdCard } from "@/components/ProductAdCard";
import { LoadingPage } from "@/components/LoadingPageComponent";

function StorePage() {
	const [products, setProducts] = useState([]);
	const { partners } = useContext(Context);
	const [isLoading, setIsLoading] = useState(true);
	const { id } = useParams();

	const partner = partners.find((p) => p._id === id);
	const rating =
		partner?.rating > 0 ? `${partner?.rating} (XX Notas)` : "N/A";
	const totalProducts = products.length;
	const followers = partner?.followers;

	// // Calculando a média total de avaliações dos produtos
	// const averageRating =
	// 	products.length > 0
	// 		? (
	// 				products.reduce(
	// 					(total, product) => total + (product.rating || 0),
	// 					0
	// 				) / products.length
	// 		  ).toFixed(1) // Arredonda para uma casa decimal
	// 		: "N/A"; // Retorna "N/A" se não houver produtos ou avaliações

	useEffect(() => {
		api.get(`/products/getall-products-store/${id}`)
			.then((response) => {
				console.log(response.data.products);
				setProducts(
					response.data.products.filter(
						(product) => product.stock > 0
					)
				);
				setIsLoading(false);
			})
			.catch((error) => {
				console.error("Error fetching products:", error);
				setIsLoading(false); // Pode ser necessário para parar o carregamento em caso de erro
			});
	}, [id]);

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
			<div className="flex flex-col justify-center items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-16">
				<div>
					<div className="flex flex-row gap-8 bg-white text-black w-[1100px] h-[200px] p-4 mt-8 mb-8 rounded-md shadow-md select-none">
						{/* Card Store Info 1 */}
						<div className="flex flex-row gap-2 p-4 bg-pink-200 border-solid border-[1px] border-black border-opacity-20 w-[300px] h-[130px] rounded-md shadow-md">
							<Image
								className="object-contain w-full h-full pointer-events-none"
								src={Amora}
								alt="Logo Shop"
								unoptimized
							/>
						</div>

						<div className="flex flex-col w-[230px]">
							{/* Titulo e Selo de verificado */}
							<div className="flex flex-row items-center gap-1 mb-4">
								<span className="text-lg font-semibold">
									{partner?.name}
								</span>
								<span>
									{/* <MdVerified
										className="text-ametista"
										size={17}
									/> */}

									<div className="relative inline-block mt-[7px]">
										<div className="group">
											{/* Icone Visível no Client Side  */}
											<MdVerified
												className="text-ametista cursor-pointer"
												size={17}
											/>
											{/* Tooltip */}
											<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-64 p-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition duration-300 border-[1px] border-black bg-white text-black text-sm rounded shadow-lg pointer-events-none">
												<div className="flex flex-row items-center gap-2">
													<MdVerified
														className="text-ametista"
														size={18}
													/>
													<span>Selo Ametista</span>
												</div>
												<p className="ml-[25px]">
													Loja com mais de 500 vendas
												</p>
												<p className="ml-[25px]">
													Conta verificada
												</p>
											</div>
										</div>
									</div>
								</span>
							</div>
							{/* Card Store Info 2 */}
							<div className="flex flex-row items-center gap-2">
								<span>
									<CgBox size={18} />
									{/* <BsBox2Heart size={17} /> */}
								</span>
								<h1>Produtos: {totalProducts}</h1>
							</div>
							<div className="flex flex-row items-center gap-2">
								<span>
									<Peoples size={18} />
									{/* <BsPersonCheckFill size={20} /> */}
								</span>
								<h1>Seguidores: {followers}</h1>
							</div>
							<div className="flex flex-row items-center gap-2">
								<span>
									<BsStar size={18} />
								</span>
								<h1>Avaliações: {rating}</h1>
							</div>
						</div>
						<div className="border-r-[1px] border-r-black"></div>
						<div className="w-[450px]">
							<h1 className="mb-2">Sobre a loja:</h1>
							<p>
								A Otakuya-san surgiu da ideia de trazer para o
								Brasil uma loja totalmente voltada a cultura Pop
								Japonesa. Tudo se iniciou em 2018, após passar
								por diversas modificações.
							</p>
						</div>
					</div>
				</div>

				<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mb-4 rounded-md shadow-md select-none">
					Produtos da Loja
				</div>
				<div className="flex flex-row justify-center">
					<label className="input input-bordered input-primary flex items-center w-[1072px] gap-2 mb-8">
						<input
							type="text"
							className="grow bg-base-100"
							placeholder="Pesquisar na loja"
						/>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							fill="currentColor"
							className="h-4 w-4 opacity-70 cursor-pointer active:scale-[.97]">
							<path
								fillRule="evenodd"
								d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
								clipRule="evenodd"
							/>
						</svg>
					</label>
				</div>

				<div className="flex flex-row justify-center flex-wrap gap-4 ">
					{products &&
						products.length > 0 &&
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
										product.originalPrice
									)}
									promocionalPrice={Number(
										product.promocionalPrice
									)}
									price={Number(product.originalPrice)}
									promoPrice={Number(
										product.promocionalPrice
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

export default StorePage;
