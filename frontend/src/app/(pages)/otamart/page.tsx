"use client";

import { useState, useEffect, useContext } from "react";
import api from "@/utils/api";

// Context
import { Context } from "@/context/UserContext";

// Icons
import { GiEvilBook, GiBattleMech } from "react-icons/gi";
import { IoGameControllerOutline } from "react-icons/io5";
import { LuDisc3 } from "react-icons/lu";
import { PiTShirt } from "react-icons/pi";
import { BsSmartwatch } from "react-icons/bs";
import { TbCards } from "react-icons/tb";
import { RiPencilRuler2Line } from "react-icons/ri";
import { GiProtectionGlasses } from "react-icons/gi";
import { FiInfo } from "react-icons/fi";

// Components
import { ProductAdCard } from "@/components/ProductAdCard";
import { LoadingPage } from "@/components/LoadingPageComponent";
import { CategoryButton } from "@/components/CategoryButton";

function OtamartPage() {
	const [products, setProducts] = useState<
		{ category: string; [key: string]: any }[]
	>([]);
	const { partners } = useContext(Context);
	const [isLoading, setIsLoading] = useState(true);

	const [searchText, setSearchText] = useState("");
	const [searchedText, setSearchedText] = useState("");
	const [returnedProducts, setReturnedProducts] = useState([]);
	const [rCategory, setRcategory] = useState([]);
	const [noResults, setNoResults] = useState(false); // Nova variável de estado

	const categories = [
		...new Set(products.map((product) => product.category)),
	];

	useEffect(() => {
		api.get("/products/").then((response) => {
			setProducts(response.data.products);
			setIsLoading(false);
		});
	}, []);

	const handleSearch = async () => {
		// Verifica se há texto na pesquisa antes de fazer a requisição
		if (!searchText.trim()) {
			return; // Se não houver texto, não faz a requisição
		}

		setSearchedText(searchText); // Atualiza o texto da pesquisa
		setRcategory([]); // Limpa o estado de categoria
		setIsLoading(true);
		setNoResults(false);

		const fetchReturnedProduct = async () => {
			try {
				const response = await api.post(`/searches/search-otamart`, {
					productTitle: searchText, // Envia o searchText no corpo da requisição
				});
				if (response.data.products.length > 0) {
					setReturnedProducts(response.data.products);
				} else {
					setNoResults(true);
				}
			} catch (error: any) {
				if (error.response && error.response.status === 404) {
					setNoResults(true); // Define como true se o status for 404
				} else {
					console.error("Erro ao buscar o produto:", error);
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchReturnedProduct();
	};

	const handleSearchCategory = async (category) => {
		if (!category) {
			return;
		}

		setReturnedProducts([]); // Limpa os resultados da pesquisa
		setIsLoading(true);
		setNoResults(false);

		try {
			const response = await api.post(`/searches/search-category`, {
				category: category,
			});

			if (response.data.products.length > 0) {
				setRcategory(response.data.products);
			} else {
				setNoResults(true);
			}
		} catch (error) {
			if (error.response && error.response.status === 404) {
				setNoResults(true); // Define como true se o status for 404
			} else {
				console.error("Erro ao buscar o produto:", error);
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Função para lidar com o pressionamento da tecla Enter
	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
			<div className="flex flex-col items-center justify-center col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mt-8 mb-2 rounded-md shadow-md select-none">
					Categorias
				</div>
				<div className="flex flex-row justify-center gap-4 mt-3">
					<div
						onClick={handleSearchCategory}
						className="flex items-center">
						<CategoryButton
							onCategoryClick={handleSearchCategory}
							categoriesDB={categories}
						/>
					</div>
				</div>
			</div>
			<div className="flex flex-col justify-center items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-16">
				<div className="flex felx-row items-center justify-center gap-3 bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mt-8 mb-4 rounded-md shadow-md select-none">
					{returnedProducts?.length === 0 &&
					rCategory.length === 0 ? (
						<span>Produtos em Destaque</span>
					) : rCategory.length > 0 ? (
						<span>Resultado filtrado pela categoria</span>
					) : (
						<>
							<FiInfo className="mt-[2px]" size={20} />
							<span>
								Resultado da pesquisa para '{searchedText}'
							</span>
						</>
					)}

					{/* {returnedProducts?.length === 0 ? (
						<span>Produtos em Destaque</span>
					) : (
						<>
							<FiInfo className="mt-[2px]" size={20} />
							<span>
								Resultado da pesquisa para '{searchedText}'
							</span>
						</>
					)} */}
				</div>
				<div className="flex flex-row justify-center">
					<label className="input input-bordered input-primary flex items-center w-[1072px] gap-2 mb-8">
						<input
							type="text"
							className="grow bg-base-100"
							placeholder="Pesquisar no OtaMart"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							onKeyDown={handleKeyDown}
						/>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							fill="currentColor"
							className="h-4 w-4 opacity-70 cursor-pointer active:scale-[.97]"
							onClick={(e) => handleSearch(e)}>
							<path
								fillRule="evenodd"
								d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
								clipRule="evenodd"
							/>
						</svg>
					</label>
				</div>

				<div className="flex flex-row flex-wrap gap-4 justify-center">
					{noResults ? (
						<div className="min-h-screen">
							<p className="text-black text-center bg-white p-4 w-[500px] rounded-md shadow-md">
								Produto não encontrado!
							</p>
						</div>
					) : rCategory.length > 0 ? (
						// Exibe os produtos filtrados pela categoria
						rCategory.map((categoryProduct) => {
							const partner = partners.find(
								(partner) =>
									partner._id === categoryProduct.partnerID
							);
							const cashback = partner ? partner.cashback : 0;

							return (
								<ProductAdCard
									key={categoryProduct._id}
									product={categoryProduct}
									freeShipping={categoryProduct.freeShipping}
									productImage={`http://localhost:5000/images/products/${categoryProduct.imagesProduct[0]}`}
									title={categoryProduct.productTitle}
									originalPrice={Number(
										categoryProduct.originalPrice
									)}
									promotionalPrice={Number(
										categoryProduct.promotionalPrice
									)}
									price={Number(
										categoryProduct.originalPrice
									)}
									promoPrice={Number(
										categoryProduct.promotionalPrice
									)}
									cashback={cashback}
									rating={categoryProduct.rating}
									quantitySold={
										categoryProduct.productsSold > 1
											? `${categoryProduct.productsSold} Vendidos`
											: `${categoryProduct.productsSold} Vendido`
									}
									linkProductPage={`/otamart/${categoryProduct.slugTitle}`}
								/>
							);
						})
					) : returnedProducts.length > 0 ? (
						// Exibe os produtos filtrados pela pesquisa de texto
						returnedProducts.map((returnedProduct) => {
							const partner = partners.find(
								(partner) =>
									partner._id === returnedProduct.partnerID
							);
							const cashback = partner ? partner.cashback : 0;

							return (
								<ProductAdCard
									key={returnedProduct._id}
									product={returnedProduct}
									freeShipping={returnedProduct.freeShipping}
									productImage={`http://localhost:5000/images/products/${returnedProduct.imagesProduct[0]}`}
									title={returnedProduct.productTitle}
									originalPrice={Number(
										returnedProduct.originalPrice
									)}
									promotionalPrice={Number(
										returnedProduct.promotionalPrice
									)}
									price={Number(
										returnedProduct.originalPrice
									)}
									promoPrice={Number(
										returnedProduct.promotionalPrice
									)}
									cashback={cashback}
									rating={returnedProduct.rating}
									quantitySold={
										returnedProduct.productsSold > 1
											? `${returnedProduct.productsSold} Vendidos`
											: `${returnedProduct.productsSold} Vendido`
									}
									linkProductPage={`/otamart/${returnedProduct.slugTitle}`}
								/>
							);
						})
					) : (
						// Exibe todos os produtos padrão
						products.map((product) => {
							const partner = partners.find(
								(partner) => partner._id === product.partnerID
							);
							const cashback = partner ? partner.cashback : 0;

							return (
								<ProductAdCard
									key={product._id}
									product={product}
									freeShipping={product.freeShipping}
									productImage={`http://localhost:5000/images/products/${product.imagesProduct[0]}`}
									title={product.productTitle}
									originalPrice={Number(
										product.originalPrice
									)}
									promotionalPrice={Number(
										product.promotionalPrice
									)}
									price={Number(product.originalPrice)}
									promoPrice={Number(
										product.promotionalPrice
									)}
									cashback={cashback}
									rating={product.rating}
									quantitySold={
										product.productsSold > 1
											? `${product.productsSold} Vendidos`
											: `${product.productsSold} Vendido`
									}
									linkProductPage={`/otamart/${product.slugTitle}`}
								/>
							);
						})
					)}

					{/* ESSE CÓDIGO DE RETORNO DE PRODUTO FUNCIONA, MAS AO DEIXAR ASSIM EU TERIA PROBLEMAS COM O RETORNO DE INFO PARA CATEGORIA */}
					{/* {noResults ? (
						<div className="min-h-screen">
							<p className="text-black text-center bg-white p-4 w-[500px] rounded-md shadow-md">
								Produto não encontrado!
							</p>
						</div>
					) : returnedProducts.length > 0 ? (
						returnedProducts.map((returnedProduct) => {
							const partner = partners.find(
								(partner) =>
									partner._id === returnedProduct.partnerID
							);
							const cashback = partner ? partner.cashback : 0;

							return (
								<ProductAdCard
									key={returnedProduct._id}
									product={returnedProduct}
									freeShipping={returnedProduct.freeShipping}
									productImage={`http://localhost:5000/images/products/${returnedProduct.imagesProduct[0]}`}
									title={returnedProduct.productTitle}
									originalPrice={Number(
										returnedProduct.originalPrice
									)}
									promotionalPrice={Number(
										returnedProduct.promotionalPrice
									)}
									price={Number(
										returnedProduct.originalPrice
									)}
									promoPrice={Number(
										returnedProduct.promotionalPrice
									)}
									cashback={cashback}
									rating={returnedProduct.rating}
									quantitySold={
										returnedProduct.productsSold > 1
											? `${returnedProduct.productsSold} Vendidos`
											: `${returnedProduct.productsSold} Vendido`
									}
									linkProductPage={`/otamart/${returnedProduct.slugTitle}`}
								/>
							);
						})
					) : (
						products &&
						products.length > 0 &&
						products.map((product) => {
							const partner = partners.find(
								(partner) => partner._id === product.partnerID
							);
							const cashback = partner ? partner.cashback : 0;

							return (
								<ProductAdCard
									key={product._id}
									product={product}
									freeShipping={product.freeShipping}
									productImage={`http://localhost:5000/images/products/${product.imagesProduct[0]}`}
									title={product.productTitle}
									originalPrice={Number(
										product.originalPrice
									)}
									promotionalPrice={Number(
										product.promotionalPrice
									)}
									price={Number(product.originalPrice)}
									promoPrice={Number(
										product.promotionalPrice
									)}
									cashback={cashback}
									rating={product.rating}
									quantitySold={
										product.productsSold > 1
											? `${product.productsSold} Vendidos`
											: `${product.productsSold} Vendido`
									}
									linkProductPage={`/otamart/${product.slugTitle}`}
								/>
							);
						})
					)} */}
				</div>
			</div>
		</section>
	);
}

export default OtamartPage;
