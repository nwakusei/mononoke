"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format } from "date-fns";

// Axios
import api from "@/utils/api";

// Contexts
import { Context } from "@/context/UserContext";

// Components
import { ProductVariation } from "@/components/ProductVariation";
import { SideComponent } from "@/components/SideComponent";

// Importe suas imagens e ícones aqui
import Lycoris from "../../../../../public/lycoris.jpg";
import Amora from "../../../../../public/amora.jpg";
import imageProfile from "../../../../../public/Kon.jpg";

// Icons
import { Currency } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill } from "react-icons/bs";
import { MdVerified } from "react-icons/md";

function ProductPage() {
	const { id } = useParams();
	const [product, setProduct] = useState({});
	const [maximizedImage, setMaximizedImage] = useState(null);

	const { partners } = useContext(Context);

	const partner = partners.find(
		(partner) => partner._id === product.partnerID
	);

	const handleOpen = (image) => {
		setMaximizedImage(image);
	};

	const handleClose = () => {
		setMaximizedImage(null);
	};

	// Calcular a porcentagem de desconto
	const calculateDiscountPercentage = () => {
		if (product.originalPrice === 0 || product.promocionalPrice === 0) {
			return 0;
		}
		const discountPercentage =
			((product.originalPrice - product.promocionalPrice) /
				product.originalPrice) *
			100;
		return Math.round(discountPercentage);
	};

	const discountPercentage = calculateDiscountPercentage();

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const response = await api.get(`/products/${id}`);
				setProduct(response.data.product);
			} catch (error) {
				console.error("Error fetching product:", error);
			}
		};

		fetchProduct();
	}, [id]);

	// Função para renderizar os ícones de classificação com base no rating
	const renderRatingIcons = () => {
		// Arredonda o rating para a casa decimal mais próxima
		const roundedRating = Math.round(product.rating * 10) / 10;

		// Verifica se o roundedRating é igual a 0
		if (roundedRating === 0) {
			return (
				<>
					N/A {/* Renderiza "N/A" */}
					{/* Renderiza as 5 estrelas vazias */}
					{[...Array(5)].map((_, i) => (
						<BsStar key={`empty-${i}`} size={12} />
					))}
				</>
			);
		}

		const ratingIcons = [];

		// Adiciona o número correspondente ao rating antes das estrelas
		const formattedRating =
			roundedRating % 1 === 0 ? `${roundedRating}.0` : `${roundedRating}`;
		ratingIcons.push(
			<span key={`number-${formattedRating}`} className="mr-1">
				{formattedRating}
			</span>
		);

		// Adiciona ícones de estrela com base no rating arredondado
		for (let i = 0; i < Math.floor(roundedRating); i++) {
			ratingIcons.push(<BsStarFill key={`star-${i}`} size={12} />);
		}

		// Se houver uma parte decimal maior que 0, adiciona um ícone de estrela metade preenchido
		if (roundedRating % 1 !== 0) {
			ratingIcons.push(<BsStarHalf key="half" size={12} />);
		}

		// Preenche o restante dos ícones com estrelas vazias
		const remainingIcons = 5 - Math.ceil(roundedRating);
		for (let i = 0; i < remainingIcons; i++) {
			ratingIcons.push(<BsStar key={`empty-${i}`} size={12} />);
		}

		return ratingIcons;
	};

	const renderReviewRatingIcons = (reviewRating) => {
		// Convertendo a string da nota para número
		const rating = parseFloat(reviewRating);

		// Verificando se a nota é um número válido entre 0 e 5
		if (!isNaN(rating) && rating >= 0 && rating <= 5) {
			// Arredondando a nota para a casa decimal mais próxima
			const roundedRating = Math.round(rating * 10) / 10;

			// Array para armazenar os ícones de estrelas
			const ratingIcons = [];

			// Verifica se a nota é um número inteiro e adiciona ".0"
			const formattedRating = Number.isInteger(roundedRating)
				? `${roundedRating}.0`
				: `${roundedRating}`;

			// Adicionando o número correspondente à nota antes das estrelas
			ratingIcons.push(
				<span key={`number-${formattedRating}`} className="mr-1">
					{formattedRating}
				</span>
			);

			// Adicionando ícones de estrela com base na nota arredondada
			for (let i = 0; i < Math.floor(roundedRating); i++) {
				ratingIcons.push(<BsStarFill key={`star-${i}`} size={12} />);
			}

			// Se houver uma parte decimal maior que 0, adiciona um ícone de estrela metade preenchido
			if (roundedRating % 1 !== 0) {
				ratingIcons.push(<BsStarHalf key="half" size={12} />);
			}

			// Preenchendo o restante dos ícones com estrelas vazias
			const remainingIcons = 5 - Math.ceil(roundedRating);
			for (let i = 0; i < remainingIcons; i++) {
				ratingIcons.push(<BsStar key={`empty-${i}`} size={12} />);
			}

			return ratingIcons;
		} else {
			// Se a nota for 0, renderiza "0.0" com 5 estrelas vazias
			if (rating === 0) {
				const formattedRating = "0.0";
				const ratingIcons = [];

				ratingIcons.push(
					<span key={`number-${formattedRating}`} className="mr-1">
						{formattedRating}
					</span>
				);

				for (let i = 0; i < 5; i++) {
					ratingIcons.push(<BsStar key={`empty-${i}`} size={12} />);
				}

				return ratingIcons;
			} else {
				return <span>N/A</span>;
			}
		}
	};

	return (
		<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 mx-4 mt-4">
			<div className="bg-yellow-500 flex flex-row justify-between gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				{/* Componente de Imagem Principal */}
				<div className="flex flex-col">
					<div className="bg-base-100 w-[402px] rounded-md relative shadow-lg mb-2">
						<div className="h-[402px] flex items-center justify-center mx-3 my-2">
							{product.imagesProduct &&
								product.imagesProduct.length > 0 && (
									<Image
										className="object-contain h-full"
										src={`http://localhost:5000/images/products/${product.imagesProduct[0]}`}
										alt={product.productName}
										width={280}
										height={10}
										unoptimized
									/>
								)}
						</div>
					</div>
					{/* Pequenas imagens */}
					<div className="flex flex-row gap-2">
						<div className="bg-base-100 w-[74px] flex flex-col rounded relative shadow-lg">
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain  h-full"
									src={Lycoris}
									alt="Shoes"
								/>
							</div>
						</div>
						<div className="bg-base-100 w-[74px] flex flex-col rounded relative shadow-lg">
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain  h-full"
									src={Lycoris}
									alt="Shoes"
								/>
							</div>
						</div>
						<div className="bg-base-100 w-[74px] flex flex-col rounded relative shadow-lg">
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain  h-full"
									src={Lycoris}
									alt="Shoes"
								/>
							</div>
						</div>
						<div className="bg-base-100 w-[74px] flex flex-col rounded relative shadow-lg">
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain  h-full"
									src={Lycoris}
									alt="Shoes"
								/>
							</div>
						</div>
						<div className="bg-base-100 w-[74px] flex flex-col rounded relative shadow-lg">
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain  h-full"
									src={Lycoris}
									alt="Shoes"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Componente intermediário */}
				<div className="flex flex-col w-[350px]">
					{/* Título */}
					<h1 className="text-xl font-semibold mb-1">
						{product.productName}
					</h1>
					{/* Avaliações e Vendidos */}
					<div className="flex flex-row text-sm mb-4 gap-1">
						<div className="flex items-center gap-1">
							{/* Contêiner flexível para os ícones */}
							{renderRatingIcons()}
						</div>
						<span>|</span>
						<div>
							{product.reviews &&
							Array.isArray(product.reviews) &&
							product.reviews.length === 0
								? "Nenhuma Avaliação"
								: product.reviews &&
								  Array.isArray(product.reviews) &&
								  product.reviews.length === 1
								? "1 Avaliação"
								: product.reviews &&
								  Array.isArray(product.reviews)
								? `${product.reviews.length} Avaliações`
								: "0 Avaliações"}
						</div>
						<span>|</span>
						<div>
							{product.productsSold > 1
								? `${product.productsSold} Vendidos`
								: `${product.productsSold} Vendido`}
						</div>
					</div>

					{/* Preço */}
					{product.promocionalPrice > 0 ? (
						<div>
							{/* Preço promocional */}
							<h2 className="text-2xl text-primary font-semibold">
								{Number(
									product.promocionalPrice
								).toLocaleString("pt-BR", {
									style: "currency",
									currency: "BRL",
								})}
							</h2>
							{/* Preço antes do desconto */}
							<div className="flex flex-row items-center mb-2">
								<span className="text-base line-through mr-2">
									{Number(
										product.originalPrice
									).toLocaleString("pt-BR", {
										style: "currency",
										currency: "BRL",
									})}
								</span>
								<span className="bg-primary text-xs px-1 rounded-sm">
									{discountPercentage}% Off
								</span>
							</div>
						</div>
					) : (
						<div>
							<h2 className="text-2xl text-primary font-semibold">
								{Number(product.originalPrice).toLocaleString(
									"pt-BR",
									{
										style: "currency",
										currency: "BRL",
									}
								)}
							</h2>
						</div>
					)}
					{/* Cashback */}
					{partner && (
						<div className="flex flex-row items-center mb-4">
							<span>
								<p className="flex flex-row items-center gap-2 text-center text-sm text-green-500 mb-2">
									<Currency size={18} /> {partner.cashback}%
									de Cashback
								</p>
							</span>
						</div>
					)}

					{/* Variações */}
					<ProductVariation />
				</div>

				{/* Componente Lateral D. */}
				<SideComponent />
			</div>

			{/* Descrição do produto*/}
			<div className="bg-yellow-500 flex flex-col gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="w-full border-opacity-50">
					{/* Descrição e Detalhes*/}
					<div>
						<h1 className="divider text-xl">
							Descrição e Detalhes do Produto
						</h1>
						<p>{product.description}</p>
					</div>
				</div>
			</div>

			{/* Informações da Loja */}
			<div className="bg-yellow-500 flex flex-col gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="border border-white w-full rounded p-2">
					{/* Logo da Loja */}
					{partner && (
						<div className="flex flex-row gap-4">
							<div className="w-[230px] h-24 bg-pink-900 px-1 rounded-md">
								<Image
									className="object-contain w-full h-full"
									src={Amora}
									alt="Logo Shop"
									unoptimized
								/>
							</div>
							<div className="flex flex-col">
								<div className="flex flex-row items-center gap-1 font-semibold text-lg">
									<h1>{partner.name}</h1>
									<MdVerified
										className="text-blue-500"
										size={18}
									/>
								</div>
								<div className="flex flex-row items-center">
									<BsStarFill
										className="text-blue-500"
										size={14}
									/>
									<span className="ml-1 mr-2">5.0</span> |
									<span className="ml-2">
										{partner.followers} Seguidores
									</span>
								</div>
								<div className="mt-1">
									<button className="bg-green-600 transition-all ease-in duration-200 hover:bg-green-800 px-10 py-1 rounded">
										Seguir
									</button>
								</div>
							</div>
							<div className="divider divider-horizontal"></div>
							<div className="flex flex-col justify-center">
								<div>
									<h1>Avaliações: 5.1mil</h1>
								</div>
								<div>
									<span>Produtos: 2.3mil</span>
								</div>
								<div className="mt-1">
									<button className="border border-solid border-purple-800  transition-all ease-in duration-200 hover:bg-purple-500 px-10 py-1 rounded">
										Ver Loja
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Avaliações*/}
			<div className="bg-yellow-500 flex flex-col gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-4">
				<div className="w-full border-opacity-50">
					<div className="flex flex-col">
						<div className="divider text-xl">
							Avaliações do Produto
						</div>
						{/* Avaliação por Usuário*/}
						{product.reviews && product.reviews.length > 0 ? (
							product.reviews.map((item, index) => (
								<div key={index} className="-mt-2">
									<div className="flex flex-row gap-2 mb-1">
										<div className="avatar">
											<div className="w-16 h-16 rounded-full">
												<Image
													src={imageProfile}
													alt="imageProfile"
												/>
											</div>
										</div>

										<div className="flex flex-col">
											<div>
												{/* Avaliações e Vendidos */}
												<h1 className="text-sm">
													{item.customerName}
												</h1>
												<div className="flex flex-row items-center text-sm">
													<span className="flex flex-row items-center gap-1">
														<p className="flex flex-row items-center gap-1 mr-1 text-sm">
															{renderReviewRatingIcons(
																item.reviewRating
															)}
														</p>
													</span>
												</div>
												<h3 className="text-xs mb-2">
													{item.date
														? format(
																new Date(
																	item.date
																),
																"dd/MM/yyyy - HH:mm"
														  ) + " hs"
														: ""}
												</h3>
												<p className="text-base mb-2">
													{item.reviewDescription}
												</p>
											</div>

											{/* Fotos das avaliações */}
											<div className="flex flex-row gap-2 mb-2">
												<div>
													{/* Renderizar imagens em miniatura */}
													<div className="flex flex-row gap-2 mb-2">
														{item.imagesReview &&
															item.imagesReview.map(
																(image, id) => (
																	<div
																		key={id}
																		className="bg-base-100 w-[74px] rounded relative shadow-lg">
																		<div className="h-[74px] flex items-center justify-center">
																			<Image
																				className="object-contain h-full cursor-pointer"
																				src={`http://localhost:5000/images/reviews/${image}`}
																				alt="Shoes"
																				width={
																					55
																				}
																				height={
																					55
																				}
																				unoptimized
																				onClick={() =>
																					handleOpen(
																						image
																					)
																				}
																			/>
																		</div>
																	</div>
																)
															)}
													</div>

													{/* Renderizar imagem maximizada se existir */}
													{maximizedImage && (
														<div className="fixed inset-0 z-50 overflow-auto flex items-center justify-center">
															<div className="relative max-w-full max-h-full">
																<Image
																	className="object-contain max-w-full max-h-full rounded-md"
																	src={`http://localhost:5000/images/reviews/${maximizedImage}`}
																	alt="Maximized Image"
																	width={400}
																	height={200}
																	unoptimized
																/>
																<button
																	className="absolute top-4 right-4 bg-error px-3 py-1 rounded shadow-md text-white"
																	onClick={
																		handleClose
																	}>
																	✕
																</button>
															</div>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
									<hr className="mx-2" /> <br />
								</div>
							))
						) : (
							<div>
								<div className="text-center mb-2">
									Esse produto ainda não possui avaliações!
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

export default ProductPage;
