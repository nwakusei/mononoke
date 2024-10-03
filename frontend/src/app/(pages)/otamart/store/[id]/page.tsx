"use client";

import { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import Image from "next/image";

import "./storeId.css";

// Importe suas imagens e ícones aqui
import Amora from "../../../../../../public/amora.jpg";
import imageProfile from "../../../../../public/Kon.jpg";

// Context
import { Context } from "@/context/UserContext";

// Icons
import { MdVerified } from "react-icons/md";
import { Peoples } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill, BsBox2Heart } from "react-icons/bs";
import { CgBox } from "react-icons/cg";
import { FiInfo } from "react-icons/fi";

// Components
import { ProductAdCard } from "@/components/ProductAdCard";
import { LoadingPage } from "@/components/LoadingPageComponent";
import Swal from "sweetalert2";
import { set } from "date-fns";

function StorePage() {
	const [products, setProducts] = useState([]);
	const { partners } = useContext(Context);
	const [isLoading, setIsLoading] = useState(true);
	const { id } = useParams();
	const [searchText, setSearchText] = useState("");
	const [returnedProducts, setReturnedProducts] = useState([]);
	const [noResults, setNoResults] = useState(false); // Nova variável de estado

	const [buttonLoading, setbuttonLoading] = useState(false);
	const [token] = useState(() => localStorage.getItem("token") || "");
	const [followedStores, setFollowedStores] = useState([]);

	const partner = partners.find((p) => p._id === id);
	const rating =
		partner?.rating > 0
			? `${(partner?.rating).toFixed(1)} (XX Notas)`
			: "N/A";
	const totalProducts = products.length;
	const followers = partner?.followers;

	// Função para buscar a lista de lojas seguidas
	const fetchFollowedStores = async () => {
		if (!token) return;

		try {
			const response = await api.get("/otakuprime/check-user", {
				headers: {
					Authorization: `Bearer ${JSON.parse(token)}`,
				},
			});
			setFollowedStores(response.data.followingStores);
		} catch (error) {
			console.error("Erro ao buscar lojas seguidas:", error);
		}
	};

	// Chama a função para buscar as lojas seguidas quando o componente é montado
	useEffect(() => {
		fetchFollowedStores();
	}, [token]);

	useEffect(() => {
		api.get(`/products/getall-products-store/${id}`)
			.then((response) => {
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

	const handleSearch = async () => {
		// Verifica se há texto na pesquisa antes de fazer a requisição
		if (!searchText.trim()) {
			return; // Se não houver texto, não faz a requisição
		}

		setIsLoading(true);
		setNoResults(false);

		const fetchReturnedProduct = async () => {
			try {
				const response = await api.post(
					`/searches/search-store/${id}`,
					{
						productTitle: searchText, // Envia o searchText no corpo da requisição
					}
				);
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

	// Função para lidar com o pressionamento da tecla Enter
	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	const handleFollow = async () => {
		setbuttonLoading(true);
		try {
			// Simula a chamada API para seguir a loja
			await api.post(`/customers/follow-store/${id}`);

			// Atualiza o estado local para refletir a nova lista de lojas seguidas
			setFollowedStores((prevStores) => [
				...prevStores,
				{ storeID: partner?._id },
			]);
		} catch (error) {
			console.error("Erro ao seguir a loja:", error);
		} finally {
			setbuttonLoading(false);
		}
	};

	const handleUnfollow = async () => {
		setbuttonLoading(true);
		try {
			await api.post(`/customers/unfollow-store/${id}`);

			// Remove a loja da lista de seguidos
			setFollowedStores(
				(prevStores) =>
					prevStores.filter((store) => store.storeID !== partner?._id) // Remove a loja
			);
		} catch (error) {
			console.error("Erro ao deixaar de seguir a loja:", error);
		} finally {
			setbuttonLoading(false);
		}
	};

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
							<div className="flex flex-row items-center gap-2 mb-2">
								<span>
									<BsStar size={18} />
								</span>
								<h1>Avaliações: {rating}</h1>
							</div>
							<div className="mt-1">
								{buttonLoading ? (
									<button
										disabled
										className="button bg-[#daa520] hover:bg-[#CD7F32] active:scale-[.95] transition-all ease-in duration-200 w-[150px] px-10 py-1 rounded-md shadow-md flex items-center justify-center">
										<span className="loading loading-spinner loading-md"></span>
									</button>
								) : followedStores?.some(
										(store) =>
											store.storeID === partner?._id
								  ) ? (
									<button
										// Função para deixar de seguir - não implementada ainda
										className="button follow bg-red-500 hover:bg-red-300 border-[1px] border-red-950 active:scale-[.95] transition-all ease-in duration-200 w-[150px] px-10 py-1 rounded-md shadow-md flex items-center justify-center relative">
										<span
											// onClick={handleUnfollow} // Função para deixar de seguir
											className="text-following">
											Deixar de seguir
										</span>
										<span
											onClick={handleUnfollow}
											className="text-follow">
											Seguindo
										</span>
									</button>
								) : (
									<button
										onClick={handleFollow} // Função para seguir
										className="button follow bg-[#daa520] hover:bg-[#CD7F32] active:scale-[.95] transition-all ease-in duration-200 w-[150px] px-10 py-1 rounded-md shadow-md flex items-center justify-center relative">
										Seguir
									</button>
								)}
							</div>
						</div>
						<div className="border-r-[1px] border-r-black"></div>
						<div className="w-[450px]">
							<h1 className="mb-2">Sobre a loja:</h1>
							<p className="whitespace-pre-wrap">
								{partner?.description}
							</p>
						</div>
					</div>
				</div>

				<div className="flex felx-row items-center justify-center gap-3 bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mb-4 rounded-md shadow-md select-none">
					{returnedProducts?.length === 0 ? (
						<span>Produtos da Loja</span>
					) : (
						<>
							<FiInfo className="mt-[2px]" size={20} />
							<span>Resultado da pesquisa para ''</span>
						</>
					)}
				</div>
				<div>
					<label className="input input-bordered input-primary flex items-center w-[1072px] gap-2 mb-8">
						<input
							type="text"
							className="grow bg-base-100"
							placeholder="Pesquisar na Loja"
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
									freeShipping={returnedProduct.freeShipping}
									productImage={`http://localhost:5000/images/products/${returnedProduct.imagesProduct[0]}`}
									title={returnedProduct.productTitle}
									originalPrice={Number(
										returnedProduct.originalPrice
									)}
									promocionalPrice={Number(
										returnedProduct.promocionalPrice
									)}
									price={Number(
										returnedProduct.originalPrice
									)}
									promoPrice={Number(
										returnedProduct.promocionalPrice
									)}
									cashback={cashback}
									rating={returnedProduct.rating}
									quantitySold={
										returnedProduct.productsSold > 1
											? `${returnedProduct.productsSold} Vendidos`
											: `${returnedProduct.productsSold} Vendido`
									}
									linkProductPage={`/otamart/${returnedProduct._id}`}
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
									freeShipping={product.freeShipping}
									productImage={`http://localhost:5000/images/products/${product.imagesProduct[0]}`}
									title={product.productTitle}
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
									cashback={cashback}
									rating={product.rating}
									quantitySold={
										product.productsSold > 1
											? `${product.productsSold} Vendidos`
											: `${product.productsSold} Vendido`
									}
									linkProductPage={`/otamart/${product._id}`}
								/>
							);
						})
					)}
				</div>
			</div>
		</section>
	);
}

export default StorePage;
