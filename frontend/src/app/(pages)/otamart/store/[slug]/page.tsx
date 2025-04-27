"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import Image from "next/image";
import { toast } from "react-toastify";

import "./storeId.css";

// Context
import { Context } from "@/context/UserContext";

// Icons
import {
	NewPicture,
	AddPicture,
	Peoples,
	Send,
	SendOne,
} from "@icon-park/react";
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

import { BsHeadset } from "react-icons/bs";
import { IoCloseSharp } from "react-icons/io5";
import { BsCheck2All, BsCheck2 } from "react-icons/bs";

// Components
import { ProductAdCard } from "@/components/ProductAdCard";
import { MiniCouponCard } from "@/components/MiniCouponCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { LoadingPage } from "@/components/LoadingPageComponent";
import { BiSupport } from "react-icons/Bi";
import { PiChats } from "react-icons/pi";

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

	const [user, setUser] = useState(null); // Inicializa como null
	const [token] = useState(() => localStorage.getItem("token") || "");

	const [buttonLoading, setbuttonLoading] = useState(false);
	const [sendButtonLoading, setSendButtonLoading] = useState(false);
	const [followedStores, setFollowedStores] = useState([]);
	const [partner, setPartner] = useState({});
	const [viewChat, setViewChat] = useState({});
	const [message, setMessage] = useState("");
	const [imageMessage, setImageMessage] = useState<File | null>(null);
	const isImage = (msg) => {
		// Verifica se o sufixo da mensagem corresponde a uma imagem
		return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(msg);
	};

	const [isChatOpen, setIsChatOpen] = useState(false);
	const [buttonPosition, setButtonPosition] = useState(20); // Distância inicial do botão

	// Detecta se o footer está visível
	useEffect(() => {
		const footerElement = document.querySelector("footer");

		const checkFooterVisibility = () => {
			if (footerElement) {
				const footerRect = footerElement.getBoundingClientRect();
				const footerTop = footerRect.top; // Posição superior do footer
				const footerHeight = footerRect.height;
				const windowHeight = window.innerHeight;

				// Calculando a visibilidade do footer
				if (footerTop <= windowHeight) {
					// O quanto do footer está visível
					const visibleFooter = windowHeight - footerTop;

					// Ajustar a posição do botão conforme a quantidade do footer visível
					// O botão deve subir proporcionalmente até 120px
					const newButtonPosition = Math.min(20 + visibleFooter, 120);

					setButtonPosition(newButtonPosition);
				} else {
					// O footer ainda não está visível, o botão fica a 20px
					setButtonPosition(20);
				}
			}
		};

		checkFooterVisibility();
		window.addEventListener("resize", checkFooterVisibility);
		window.addEventListener("scroll", checkFooterVisibility);

		return () => {
			window.removeEventListener("resize", checkFooterVisibility);
			window.removeEventListener("scroll", checkFooterVisibility);
		};
	}, []); // Recalculando posição do botão apenas uma vez na montagem

	useEffect(() => {
		if (!slug) return;

		const fetchData = async () => {
			setIsLoading(true);

			try {
				// 1. Converte o slug em ID
				const response = await api.get(`/partners/convert/${slug}`);
				const id = response.data.id;

				// 2. Busca o parceiro correspondente
				const foundPartner = partners.find((p) => p._id === id);
				if (!foundPartner) {
					console.warn("Loja não encontrada!");
					return;
				}
				setPartner(foundPartner);

				// 3. Monta a promise de usuário (apenas se token for válido)
				const userPromise = token
					? api
							.get("/mononoke/check-user", {
								headers: {
									Authorization: `Bearer ${JSON.parse(
										token
									)}`,
								},
							})
							.catch((err) => {
								if (err.response?.status === 401) {
									console.warn("Token inválido ou expirado.");
									return { data: null };
								}
								throw err;
							})
					: Promise.resolve({ data: null });

				// 4. Requisições simultâneas, mas adicionando uma verificação para o token do chat
				const [productsRes, couponsRes, userRes, chatRes] =
					await Promise.all([
						api.get(
							`/products/getall-products-store/${foundPartner._id}`
						),
						api.get(`/coupons/store-coupons/${foundPartner._id}`),
						userPromise,
						token
							? api
									.get(
										`/chats/get-messages-by-user/${foundPartner._id}`
									)
									.catch((err) => {
										if (err.response?.status === 404) {
											return {
												data: {
													chatFromClientToStore: {},
												},
											};
										}
										throw err;
									})
							: Promise.resolve({
									data: { chatFromClientToStore: {} },
							  }), // Retorna um valor vazio se o token não for encontrado
					]);

				// 5. Atualiza estados
				setProducts(productsRes.data.products);
				setCoupons(couponsRes.data.coupons);
				setViewChat(chatRes.data.chatFromClientToStore);

				if (userRes.data) {
					setUser(userRes.data);
				}
			} catch (err: any) {
				const isAxiosError = !!err?.isAxiosError;

				if (isAxiosError && err.response) {
					console.error("Erro de resposta da API:", {
						status: err.response.status,
						url: err.config?.url,
						message: err.response.data?.message || err.message,
					});
				} else if (isAxiosError && err.request) {
					console.error("Erro de rede ou sem resposta da API:", {
						url: err.config?.url,
						message: err.message,
					});
				} else {
					console.error("Erro inesperado:", err);
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [slug, partners, token]);

	useEffect(() => {
		if (isChatOpen) {
			// Garante que o scroll vá para o final quando o chat for aberto
			const chatMessagesContainer =
				document.querySelector(".chat-messages");
			if (chatMessagesContainer) {
				// Move o scroll para o final, sem inverter as mensagens
				chatMessagesContainer.scrollTop =
					chatMessagesContainer.scrollHeight;
			}
		}
	}, [isChatOpen, viewChat?.messages]);

	// FUNCIONOU EM PARTES
	// useEffect(() => {
	// 	if (isChatOpen) {
	// 		// Garante que o scroll vá para o final quando o chat for aberto
	// 		const chatMessagesContainer =
	// 			document.querySelector(".chat-messages");
	// 		if (chatMessagesContainer) {
	// 			chatMessagesContainer.scrollTop =
	// 				chatMessagesContainer.scrollHeight;
	// 		}
	// 	}
	// }, [isChatOpen, viewChat]);

	const toggleChat = () => {
		setIsChatOpen((prev) => !prev); // Alterna entre aberto e fechado
	};

	const rating =
		partner?.rating > 0 ? `${(partner?.rating).toFixed(1)}` : "N/A";
	const followers = partner?.followers;
	const totalProducts = partner?.totalProducts;
	const productsSold = partner?.productsSold;

	const formatHighValues = (count: number) => {
		if (count >= 1000000) {
			// Formata números acima de 1 milhão
			const formattedCount = (count / 1000000)
				.toFixed(1)
				.replace(/\.0$/, ""); // Converte para milhões com uma casa decimal
			return `${formattedCount} milh${
				formattedCount !== "1" ? "ões" : "ão"
			}`; // Singular ou plural
		} else if (count >= 1000) {
			// Formata números a partir de 1000
			const formattedCount = (count / 1000)
				.toFixed(1)
				.replace(/\.0$/, ""); // Converte para milhar com uma casa decimal
			return `${formattedCount} mil`;
		}
		return count?.toString();
	};

	const renderPartnerRatingIcons = (partnerRating) => {
		// Convertendo a nota para número
		const rating = parseFloat(partnerRating);

		// Verificando se a nota é válida
		if (isNaN(rating) || rating < 0 || rating > 5) {
			// Retorna estrela vazia para valores inválidos
			return <BsStar size={18} />;
		}

		// Arredondando a nota para uma casa decimal
		const roundedRating = Math.round(rating * 10) / 10;

		// Determinando o tipo de estrela com base na nota
		if (roundedRating === 5.0) {
			return <BsStarFill size={18} />;
		} else if (roundedRating >= 0.5 && roundedRating < 5.0) {
			// Notas intermediárias (>= 0.5 e < 5.0) renderizam meia estrela
			return <BsStarHalf size={18} />;
		} else {
			// Notas menores que 0.5 renderizam estrela vazia
			return <BsStar size={18} />;
		}
	};

	// Função para buscar a lista de lojas seguidas
	const fetchFollowedStores = async () => {
		if (!token) return;

		try {
			const response = await api.get("/mononoke/check-user", {
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

	async function handleSendMessage(userTwoID, message, imageMessage) {
		if (!message.trim() && !imageMessage) {
			return;
		}

		// Cria um novo objeto FormData
		const formData = new FormData();

		// Adiciona os dados ao FormData
		formData.append("userTwoID", userTwoID);
		formData.append("message", message);

		// Adiciona a imagem, se houver
		if (imageMessage) {
			formData.append("imageMessage", imageMessage);
		}

		setSendButtonLoading(true);

		try {
			// Faz a requisição POST com o FormData
			const response = await api.post("/chats/send-message", formData);

			// Limpa o campo de mensagem
			setMessage("");
			setImageMessage(null); // Limpa a imagem, se houver
			setViewChat(response.data.chatFromClientToStore); // Atualiza o chat
		} catch (error: any) {
			toast.error(error.response.data.message);
			console.error("Erro ao enviar a mensagem:", error);
		} finally {
			setSendButtonLoading(false);
		}
	}

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
			<div className="flex flex-col items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-16">
				<div className="flex flex-col lg:flex-row gap-2 lg:gap-8 bg-white text-black w-[350px] lg:w-[1100px] min-h-[200px] p-4 mt-8 mb-8 rounded-md shadow-md select-none">
					{/* Card Store Info 1 */}
					<div className="flex flex-col gap-2">
						<div className="w-[297px] h-[149px] bg-pink-200 border border-black border-opacity-20 rounded-md overflow-hidden shadow-md">
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
								className="button w-[297px] h-[50px] bg-[#daa520] hover:bg-[#CD7F32] active:scale-[.95] transition-all ease-in duration-200 px-10 py-1 rounded-md shadow-md flex items-center justify-center">
								<span className="loading loading-spinner loading-md"></span>
							</button>
						) : followedStores?.some(
								(store) => store.storeID === partner?._id
						  ) ? (
							<button
								// Função para deixar de seguir - não implementada ainda
								className="button w-[297px] h-[50px] follow bg-red-500 hover:bg-red-300 border-[1px] border-red-950 active:scale-[.95] transition-all ease-in duration-200 px-10 py-1 rounded-md shadow-md flex items-center justify-center relative">
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
								className="w-[297px] h-[50px] bg-violet-900 transition-all ease-in duration-100 hover:bg-black text-white rounded-md shadow-md flex items-center justify-center">
								Seguir Loja
							</button>
						)}
					</div>

					<div className="flex flex-col w-[245px]">
						{/* Titulo e Selo de verificado */}
						<div className="flex flex-row items-center gap-1 mb-4">
							<div className="text-lg font-semibold">
								{partner?.name}
							</div>
							{partner?.verifiedBadge !== "" && (
								<VerifiedBadge
									partnerVerifiedBadge={
										partner?.verifiedBadge
									}
								/>
							)}
						</div>
						{/* Card Store Info 2 */}
						<div className="flex flex-row items-center gap-2">
							<span>
								<CgBox size={18} />
								{/* <BsBox2Heart size={17} /> */}
							</span>
							<h1>
								{`Produtos: ${formatHighValues(totalProducts)}`}
							</h1>
						</div>
						<div className="flex flex-row items-center gap-2">
							<span>
								<Peoples size={18} />
								{/* <BsPersonCheckFill size={20} /> */}
							</span>
							<h1>
								{`Seguidores: ${formatHighValues(followers)}`}
							</h1>
						</div>
						<div className="flex flex-row items-center gap-2 mb-2">
							<span>{renderPartnerRatingIcons(rating)}</span>
							<h1>
								{partner?.numberOfReviews === 0
									? "Avaliações: N/A"
									: partner?.numberOfReviews > 1
									? `Avaliações: ${
											Number.isInteger(partner?.rating)
												? `${partner?.rating}.0`
												: `${partner?.rating?.toFixed(
														1
												  )}`
									  } (1 Avaliação)`
									: `Avaliações: ${
											Number.isInteger(partner?.rating)
												? `${partner?.rating}.0`
												: `${partner?.rating?.toFixed(
														1
												  )}`
									  } (${formatHighValues(
											partner?.numberOfReviews
									  )} Avaliações)`}
							</h1>
						</div>
						<div className="flex flex-row items-center gap-2 mb-2">
							<span>
								{/* <BsBox2Heart size={18} /> */}
								<BsBagCheck size={18} />
								{/* <BsBagHeart size={18} /> */}
							</span>
							<h1>
								{`Produtos vendidos: ${formatHighValues(
									productsSold
								)}`}
							</h1>
						</div>
					</div>
					<div className="border-r-[1px] border-r-black"></div>
					<div className="w-[450px]">
						<h1 className="mb-2">Sobre a loja:</h1>
						<p className="whitespace-pre-wrap">
							{partner?.description === ""
								? "Essa loja não possui descrição."
								: partner?.description}
						</p>
					</div>
				</div>

				{coupons && coupons.length > 0 && (
					<div className="flex flex-row justify-center gap-4 bg-white text-black w-[350px] lg:w-[1100px] p-4 mb-8 flex-nowrap rounded-md shadow-md select-none">
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
									key={`returned-${returnedProduct._id}`}
									viewAdultContent={user?.viewAdultContent}
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
											? `${formatHighValues(
													returnedProduct.productsSold
											  )} Vendidos`
											: `${formatHighValues(
													returnedProduct.productsSold
											  )} Vendido`
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
									key={`product-${product._id}`}
									viewAdultContent={user?.viewAdultContent}
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
											? `${formatHighValues(
													product.productsSold
											  )} Vendidos`
											: `${formatHighValues(
													product.productsSold
											  )} Vendido`
									}
									linkProductPage={`/otamart/${product.slugTitle}`}
								/>
							);
						})
					)}
				</div>

				{/* CAIXA DE CHAT */}
				{isChatOpen && (
					<div
						className="flex flex-col justify-between chat-box fixed right-5 bg-white shadow-lg p-4 rounded-md border border-gray-300 z-40"
						style={{
							bottom: `${buttonPosition + 70}px`, // A janela de chat aparece 70px acima do botão
						}}>
						<div className="chat-header w-full bg-primary flex flex-row items-center rounded-t-md">
							<div className="flex flex-row items-center gap-2 pl-[16px] py-[8px]">
								<div className="chat-image avatar">
									<div className="w-10 rounded-full">
										<Image
											className="object-contain w-full h-full pointer-events-none"
											src={`http://localhost:5000/images/partners/${partner?.logoImage}`}
											alt="Logo Shop"
											width={300}
											height={150}
											unoptimized
										/>
									</div>
								</div>
								<div className="flex flex-col">
									<h2 className="text-xl font-semibold -mb-1">
										{partner?.name}
									</h2>
									<h3 className="text-sm">Online</h3>
								</div>
							</div>
							<div className="pr-[16px]">
								<IoCloseSharp
									className="cursor-pointer"
									onClick={toggleChat}
									size={30}
								/>
							</div>
						</div>
						{viewChat &&
						Array.isArray(viewChat.messages) &&
						viewChat.messages.length > 0 ? (
							<div
								key={viewChat._id}
								className="chat-messages overflow-y-auto flex-1">
								{/* Exemplo de mensagens */}
								{viewChat.messages.map((message, index) => (
									<div
										key={index}
										className={`chat ${
											message.senderID === user?._id
												? "chat-start"
												: "chat-end"
										} mr-2`}>
										<div className="chat-image avatar">
											<div className="w-10 rounded-full">
												{message.senderID ===
												user?._id ? (
													<Image
														className="object-contain w-full h-full pointer-events-none"
														src={`http://localhost:5000/images/customers/${user?.profileImage}`}
														alt="Logo Shop"
														width={300}
														height={150}
														unoptimized
													/>
												) : (
													<Image
														className="object-contain w-full h-full pointer-events-none"
														src={`http://localhost:5000/images/partners/${partner?.profileImage}`}
														alt="Logo Shop"
														width={300}
														height={150}
														unoptimized
													/>
												)}
											</div>
										</div>
										<div className="chat-header flex flex-row items-center gap-2">
											<span className="mb-1">
												{message.senderID === user?._id
													? user?.nickname
													: partner?.nickname}
											</span>
											<time className="text-xs opacity-50 mt-1 mb-1">
												{`${new Intl.DateTimeFormat(
													"pt-BR",
													{
														hour: "2-digit",
														minute: "2-digit",
													}
												).format(
													new Date(message.timestamp)
												)} hs`}
											</time>
										</div>
										{isImage(message.message) ? (
											<Image
												className="object-contain w-[120px] pointer-events-none rounded shadow-md"
												src={`http://localhost:5000/images/chats/${message.message}`}
												alt="Logo Shop"
												width={300}
												height={150}
												unoptimized
											/>
										) : (
											<div className="chat-bubble break-words whitespace-pre-wrap">
												{message.message}
											</div>
										)}

										{/* <div className="chat-footer opacity-50 flex flex-row gap-1">
											<span className="text-xs">
												Entregue
											</span>
											<BsCheck2 size={16} />
											<BsCheck2All size={16} />
										</div> */}
									</div>
								))}
							</div>
						) : (
							<></>
						)}

						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleSendMessage(
									partner._id,
									message,
									imageMessage
								);
							}}
							className="px-[16px] pb-[16px]">
							{imageMessage && (
								<>
									<hr />
									<div className="flex mt-[4px] relative gap-1">
										<img
											src={URL.createObjectURL(
												imageMessage
											)} // Gera um URL temporário para a imagem
											alt="Imagem Selecionada"
											className="w-[40px] object-cover rounded-sm shadow-md"
										/>
										{/* Botão de close */}
										<button
											onClick={() =>
												setImageMessage(null)
											} // Limpa a imagem
											className="text-white"
											aria-label="Close">
											×
										</button>
									</div>
								</>
							)}

							<textarea
								className="textarea textarea-primary w-full h-[80px] mt-2"
								placeholder="Digite a mensagem..."
								value={message}
								onChange={(e) =>
									setMessage(e.target.value)
								}></textarea>

							<div className="flex flex-row items-center gap-2">
								<label className="bg-primary flex flex-col justify-center items-center w-[40px] h-[40px] transition-all ease-in duration-100 active:scale-[.97] rounded shadow-md mt-2 relative cursor-pointer">
									<NewPicture size={20} />
									<input
										type="file"
										accept="image/*"
										onChange={(e) =>
											setImageMessage(e.target.files[0])
										}
										className="hidden"
									/>
								</label>

								{sendButtonLoading ? (
									<button
										disabled
										className="bg-primary w-[100px] h-[40px] hover:active:scale-[.97] rounded shadow-md mt-2">
										<span className="loading loading-dots loading-sm"></span>
									</button>
								) : (
									<button className="flex flex-row justify-center items-center gap-2 bg-primary w-[100px] h-[40px] transition-all ease-in duration-100 active:scale-[.97] rounded-md shadow-md mt-2">
										<SendOne
											className="cursor-pointer"
											size={20}
										/>
										<span>Enviar</span>
									</button>
								)}
							</div>
						</form>
					</div>
				)}

				{/* BOTÃO DO CHAT */}
				{/* {!isChatOpen ? (
					<button
						onClick={toggleChat}
						className="btn btn-primary w-[60px] h-[60px] rounded-full fixed bottom-5 right-5 shadow-md z-50">
						<BsHeadset size={25} />
					</button>
				) : (
					<button
						onClick={toggleChat}
						className="btn btn-primary w-[60px] h-[60px] rounded-full fixed bottom-5 right-5 shadow-md z-50">
						<IoCloseSharp className="cursor-pointer" size={30} />
					</button>
				)} */}
				<button
					onClick={toggleChat}
					className="btn btn-primary w-[60px] h-[60px] rounded-full shadow-md z-50 transition-all duration-200"
					style={{
						position: "fixed", // Fixar o botão
						bottom: `${buttonPosition}px`, // Ajustar a posição do botão de acordo com a visibilidade do footer
						right: "20px", // Fixo à direita
						marginBottom: "env(safe-area-inset-bottom)", // Respeitar área segura nos dispositivos móveis
					}}>
					{isChatOpen ? (
						<IoCloseSharp size={30} />
					) : (
						// <MdSupportAgent size={50} />
						// <BiSupport size={30} />
						<PiChats size={30} />
					)}
				</button>
			</div>
		</section>
	);
}

export default StorePage;
