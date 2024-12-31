"use client";

import { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import Image from "next/image";
import { toast } from "react-toastify";

import "./storeId.css";

// Context
import { Context } from "@/context/UserContext";

// Icons
import { MdVerified } from "react-icons/md";
import { Peoples } from "@icon-park/react";
import {
	BsStar,
	BsBagHeart,
	BsBagCheck,
	BsBox2Heart,
	BsStarHalf,
	BsStarFill,
} from "react-icons/bs";
import { CgBox } from "react-icons/cg";
import { FiInfo } from "react-icons/fi";

// Components
import { ProductAdCard } from "@/components/ProductAdCard";
import { MiniCouponCard } from "@/components/MiniCouponCard";
import { LoadingPage } from "@/components/LoadingPageComponent";

function StorePage() {
	const [products, setProducts] = useState([]);
	const [coupons, setCoupons] = useState([]);
	const { partners } = useContext(Context);
	const [isLoading, setIsLoading] = useState(true);
	const { slug } = useParams();
	const [searchText, setSearchText] = useState("");
	const [searchedText, setSearchedText] = useState("");
	const [returnedProducts, setReturnedProducts] = useState([]);
	const [noResults, setNoResults] = useState(false); // Nova variável de estado

	const [buttonLoading, setbuttonLoading] = useState(false);
	const [token] = useState(() => localStorage.getItem("token") || "");
	const [followedStores, setFollowedStores] = useState([]);

	const [partner, setPartner] = useState({});

	useEffect(() => {
		// Verifica se `id` já foi definido.
		if (!slug) return;

		try {
			const fetchPartner = async () => {
				// Faz o lookup para obter o ID correspondente à slug
				const response = await api.get(`/partners/convert/${slug}`);

				const id = response.data.id;

				// Encontra o parceiro com base no slug.
				const foundPartner = partners.find((p) => p._id === id);

				if (foundPartner) {
					// Atualiza o estado com o parceiro encontrado.
					setPartner(foundPartner);
				} else {
					console.log("Loja não encontrada!");
				}
			};

			const fetchGetAllProductsStore = async () => {
				// Faz o lookup para obter o ID correspondente à slug
				const response = await api.get(`/partners/convert/${slug}`);

				const id = response.data.id;

				// Encontra o parceiro com base no slug.
				const foundPartner = partners.find((p) => p._id === id);

				if (foundPartner) {
					// Atualiza o estado com o parceiro encontrado
					setPartner(foundPartner);

					// Verifica se foundPartner._id existe antes de fazer a requisição dos produtos
					if (foundPartner._id) {
						const responseGetAllProductsStore = await api.get(
							`/products/getall-products-store/${foundPartner._id}`
						);
						setProducts(responseGetAllProductsStore.data.products);
						setIsLoading(false);
					} else {
						console.log("ID do parceiro não encontrado!");
					}
				} else {
					console.log("Loja não encontrada!");
				}
			};

			const fetchCoupons = async () => {
				// Faz o lookup para obter o ID correspondente à slug
				const response = await api.get(`/partners/convert/${slug}`);

				const id = response.data.id;

				// Encontra o parceiro com base no slug.
				const foundPartner = partners.find((p) => p._id === id);

				if (foundPartner) {
					// Atualiza o estado com o parceiro encontrado
					setPartner(foundPartner);

					// Verifica se foundPartner._id existe antes de fazer a requisição dos produtos
					if (foundPartner._id) {
						const response = await api.get(
							`/coupons/store-coupons/${foundPartner._id}`
						);
						setCoupons(response.data.coupons); // Atualize o estado com os cupons recebidos da API
						setIsLoading(false);
					} else {
						console.log("ID do parceiro não encontrado!");
					}
				} else {
					console.log("Loja não encontrada!");
				}
			};

			fetchCoupons(); // Chame a função fetchCoupons aqui dentro do useEffect

			fetchPartner();

			fetchGetAllProductsStore();
		} catch (error) {
			console.error("Erro ao deixaar de seguir a loja:", error);
		}
	}, [slug, partners]); // Dependências adequadas: `id` e `partners`.

	const rating =
		partner?.rating > 0
			? `${(partner?.rating).toFixed(1)} (XX Notas)`
			: "N/A";
	const totalProducts = products.length;
	const followers = partner?.followers;

	const productsSold = partner?.productsSold;

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

	const handleSearch = async () => {
		// Verifica se há texto na pesquisa antes de fazer a requisição
		if (!searchText.trim()) {
			return; // Se não houver texto, não faz a requisição
		}

		setIsLoading(true);
		setNoResults(false);

		// Atualiza searchedText imediatamente
		setSearchedText(searchText);

		const fetchReturnedProduct = async () => {
			try {
				const response = await api.post(
					`/searches/search-store/${partner._id}`,
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
			const response = await api.post(
				`/customers/follow-store/${partner._id}`
			);

			setFollowedStores((prevStores) => [
				...prevStores,
				{ storeID: partner?._id },
			]);
			toast.success(response.data.message);
		} catch (error: any) {
			const errorMessage =
				error?.response?.data?.message || "Ocorreu um erro!";
			toast.error(errorMessage);
			console.warn("Erro ao seguir loja:", errorMessage); // Usar warn para mensagens informativas
		} finally {
			setbuttonLoading(false);
		}
	};

	const handleUnfollow = async () => {
		setbuttonLoading(true);
		try {
			await api.post(`/customers/unfollow-store/${partner._id}`);

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
				<div className="flex flex-col lg:flex-row gap-2 lg:gap-8 bg-white text-black w-[350px] lg:w-[1100px] min-h-[200px] p-4 mt-8 mb-8 rounded-md shadow-md select-none">
					{/* Card Store Info 1 */}
					<div className="flex flex-col gap-2">
						<div className="w-[300px] h-[150px] bg-pink-200 border border-black border-opacity-20 rounded-md overflow-hidden shadow-md">
							<Image
								className="object-contain w-full h-full pointer-events-none"
								src={`http://localhost:5000/images/partners/${partner?.logoImage}`}
								alt="Logo Shop"
								width={300}
								height={150}
								unoptimized
							/>
						</div>
						{buttonLoading ? (
							<button
								disabled
								className="w-[300px] h-[50px] button bg-[#daa520] hover:bg-[#CD7F32] active:scale-[.95] transition-all ease-in duration-200 px-10 py-1 rounded-md shadow-md flex items-center justify-center">
								<span className="loading loading-spinner loading-md"></span>
							</button>
						) : followedStores?.some(
								(store) => store.storeID === partner?._id
						  ) ? (
							<button
								// Função para deixar de seguir - não implementada ainda
								className="w-[300px] h-[50px] button follow bg-red-500 hover:bg-red-300 border-[1px] border-red-950 active:scale-[.95] transition-all ease-in duration-200 px-10 py-1 rounded-md shadow-md flex items-center justify-center relative">
								<span className="text-following">
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
								onClick={handleFollow}
								className="w-[300px] h-[50px] bg-violet-950 transition-all ease-in duration-100 hover:bg-black text-white rounded-md shadow-md flex items-center justify-center">
								Seguir Loja
							</button>
						)}
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
						<div className="flex flex-row items-center gap-2 mb-2">
							<span>
								{/* <BsBox2Heart size={18} /> */}
								<BsBagCheck size={18} />
								{/* <BsBagHeart size={18} /> */}
							</span>
							<h1>Produtos vendidos: {productsSold}</h1>
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

				{coupons && coupons.length > 0 && (
					<div className="flex flex-row justify-center gap-4 bg-white text-black w-[1100px] p-4 mb-8 flex-nowrap rounded-md shadow-md select-none">
						{/* Cupons de Desconto */}
						{coupons.map(
							(coupon: {
								_id: string;
								discountPercentage: number;
								couponCode: string;
							}) => (
								<MiniCouponCard
									key={coupon._id} // Aqui é onde a key é necessária, pois estamos iterando sobre cupons
									couponID={coupon._id}
									couponDiscount={coupon.discountPercentage}
									cupomCode={coupon.couponCode}
								/>
							)
						)}
					</div>
				)}

				<div className="flex felx-row items-center justify-center gap-3 bg-primary w-[300px] sm:w-[400px] md:sm:w-[600px] lg:w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mb-4 rounded-md shadow-md select-none">
					{!searchedText ? (
						<h1>Produtos da Loja</h1>
					) : (
						<span className="flex flex-row items-center gap-2 px-6 w-full">
							<FiInfo className="mt-[2px]" size={20} />
							<h1 className="truncate flex-1">
								Resultado da pesquisa para {`'${searchedText}'`}
							</h1>
						</span>
					)}
				</div>
				<div>
					<label className="input input-bordered input-primary flex items-center w-[262px] sm:w-[362px] md:sm:w-[562px] lg:w-[1072px] gap-2 mb-8">
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
								Nenhum produto encontrado!
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
										partner.productsSold > 1
											? `${partner.productsSold} Vendidos`
											: `${partner.productsSold} Vendido`
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
					)}
				</div>
			</div>
		</section>
	);
}

export default StorePage;
