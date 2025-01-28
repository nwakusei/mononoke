"use client";

import Image from "next/image";
import Link from "next/link";

// Images
import AdultProductCover from "../../public/adult-content-cover.png";

// Icons
import { Currency } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill } from "react-icons/bs";
import { LiaShippingFastSolid } from "react-icons/lia";

function ProductAdCard({
	viewAdultContent,
	product,
	freeShipping,
	productImage,
	title,
	originalPrice,
	promotionalPrice,
	price,
	promoPrice,
	cashback,
	rating,
	quantitySold,
	linkProductPage,
}) {
	// LÓGICA DE EXIBIÇÃO DE CONTEÚDO ADULTO
	const isContentAllowed =
		product.adultProduct === true &&
		(viewAdultContent === false || viewAdultContent === undefined)
			? false // Se o produto for adulto e o usuário não pode ver ou está deslogado, não exibe
			: true; // Exibe o produto se for não adulto ou o usuário pode ver conteúdo adulto

	// Calcular a porcentagem de desconto
	const calculateDiscountPercentage = (product) => {
		if (!product) {
			return ""; // Retorna vazio se o produto não estiver definido
		}

		// Função auxiliar para calcular a porcentagem de desconto
		const calculatePercentage = (original, promotional) => {
			if (original === 0 || promotional === 0) {
				return null; // Retorna null se não houver desconto válido
			}
			const discountPercentage =
				((original - promotional) / original) * 100;
			return Math.round(discountPercentage);
		};

		if (product.productVariations?.length > 0) {
			// Extrai os preços das variações
			const discounts = product.productVariations.flatMap(
				(variation) =>
					variation.options
						.filter((option) => option.promotionalPrice > 0)
						.map((option) =>
							calculatePercentage(
								option.originalPrice,
								option.promotionalPrice
							)
						)
						.filter((discount) => discount !== null) // Filtra descontos inválidos
			);

			if (discounts.length === 0) {
				return ""; // Retorna vazio se nenhuma promoção válida for encontrada
			}

			const lowestDiscount = Math.min(...discounts);
			const highestDiscount = Math.max(...discounts);

			// Retorna a faixa de desconto
			return lowestDiscount === highestDiscount
				? `${lowestDiscount}%`
				: `${lowestDiscount}% ~ ${highestDiscount}%`;
		}

		// Caso não haja variações, usa os preços principais
		const discount = calculatePercentage(
			product.originalPrice,
			product.promotionalPrice
		);
		return discount !== null ? `${discount}%` : ""; // Retorna vazio se não houver desconto
	};

	// const calculateDiscountPercentage = (product) => {
	// 	if (!product) {
	// 		return 0; // Retorna 0 se o produto não estiver definido
	// 	}

	// 	// Função auxiliar para calcular a porcentagem de desconto
	// 	const calculatePercentage = (original, promotional) => {
	// 		if (original === 0 || promotional === 0) {
	// 			return 0;
	// 		}
	// 		const discountPercentage =
	// 			((original - promotional) / original) * 100;
	// 		return Math.round(discountPercentage);
	// 	};

	// 	if (product.productVariations?.length > 0) {
	// 		// Extrai os preços das variações
	// 		const prices = product.productVariations.flatMap((variation) =>
	// 			variation.options.map((option) => ({
	// 				original: option.originalPrice,
	// 				promotional: option.promotionalPrice,
	// 			}))
	// 		);

	// 		// Filtra para encontrar a maior diferença percentual entre os preços
	// 		const highestDiscount = prices.reduce(
	// 			(max, { original, promotional }) => {
	// 				const discount = calculatePercentage(original, promotional);
	// 				return discount > max ? discount : max;
	// 			},
	// 			0
	// 		);

	// 		return highestDiscount;
	// 	}

	// 	// Caso não haja variações, usa os preços principais
	// 	return calculatePercentage(
	// 		product.originalPrice,
	// 		product.promotionalPrice
	// 	);
	// };

	const discountPercentage = calculateDiscountPercentage(product);

	// Função para renderizar os ícones de classificação com base no rating
	const renderRatingIcons = () => {
		// Arredonda o rating para a casa decimal mais próxima
		const roundedRating = Math.round(rating * 10) / 10;

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

	return (
		<div className="bg-white w-[254px] flex flex-col rounded-md relative pb-2 shadow-md select-none">
			<div className="flex flex-col items-center justify-center h-[220px] mx-3 mt-2 -mb-3">
				{Number(discountPercentage) === 0 ? (
					<></>
				) : (
					<span className="flex justify-center items-center bg-primary text-center rounded-tr-md rounded-bl-md absolute -right-0 min-w-[50px] max-w-[150px] h-[30px] px-4 ml-[144px] md:ml-[174px] -mt-[206px] select-none overflow-hidden text-ellipsis whitespace-nowrap">
						{`${discountPercentage} Off`}
					</span>
				)}
				{freeShipping === true ? (
					<div className="flex flex-col object-contain w-full h-full select-none pointer-events-none">
						<Image
							className="object-contain w-full h-full"
							src={
								isContentAllowed
									? productImage
									: AdultProductCover
							}
							alt="Product Image"
							width={10}
							height={10}
							unoptimized
						/>
						<span className="flex flex-row items-center justify-center gap-2 bg-primary -mx-1 text-center rounded relative bottom-5">
							<LiaShippingFastSolid size={18} />
							Frete Grátis
						</span>
					</div>
				) : (
					<div className="flex flex-col object-contain w-full h-full select-none pointer-events-none">
						<Image
							className="object-contain w-full h-full"
							src={
								isContentAllowed
									? productImage
									: AdultProductCover
							}
							alt="Product Image"
							width={10}
							height={10}
							unoptimized
						/>
					</div>
				)}
			</div>
			<div className="divider before:border-t-[1px] after:border-t-[1px] before:bg-black after:bg-black text-sm text-black mx-2">
				Detalhes
			</div>
			<div className="flex flex-col justify-center mx-4 -mt-2">
				<div>
					<h1 className="font-semibold text-base text-black line-clamp-2 whitespace-normal min-h-[48px] mb-2">
						{title}
					</h1>
				</div>
				<div>
					<h1 className="text-base text-black">
						{/* {promotionalPrice === 0 ? (
							<span className="text-primary">
								{price.toLocaleString("pt-BR", {
									style: "currency",
									currency: "BRL",
								})}
							</span>
						) : (
							<>
								<span className="line-through mr-2">
									{price.toLocaleString("pt-BR", {
										style: "currency",
										currency: "BRL",
									})}
								</span>
								<span className="text-primary">
									{promoPrice.toLocaleString("pt-BR", {
										style: "currency",
										currency: "BRL",
									})}
								</span>
							</>
						)} */}

						{product?.productVariations?.length > 0 ? (
							<div>
								{/* Renderiza as variações */}
								{product.productVariations.map(
									(variation, index) => {
										const prices = variation.options.map(
											(option) => ({
												original: option.originalPrice,
												promo: option.promotionalPrice,
											})
										);

										// Calcula valores para exibição e riscado
										const promotionalPrices = prices
											.filter((p) => p.promo > 0)
											.map((p) => p.promo);
										const originalPricesWithPromo = prices
											.filter((p) => p.promo > 0)
											.map((p) => p.original);

										const displayedPrices = prices.map(
											(p) =>
												p.promo > 0
													? p.promo
													: p.original
										);
										const lowestPrice = Math.min(
											...displayedPrices
										);
										const highestPrice = Math.max(
											...displayedPrices
										);

										const lowestOriginalPriceWithPromo =
											Math.min(
												...originalPricesWithPromo
											);
										const highestOriginalPriceWithPromo =
											Math.max(
												...originalPricesWithPromo
											);

										return (
											<div
												key={index}
												className="flex flex-col">
												{/* Exibição de preços */}
												<div>
													{promotionalPrices.length >
													0 ? (
														<h2 className="text-base text-primary font-semibold">
															{`${Number(
																lowestPrice
															).toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)} ~ ${Number(
																highestPrice
															).toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)}`}
														</h2>
													) : (
														<h2 className="text-base text-primary font-semibold">
															{`${Number(
																lowestPrice
															).toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)} ~ ${Number(
																highestPrice
															).toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)}`}
														</h2>
													)}
												</div>
												{/* Exibição de valores riscados, só se houver 2 ou mais promoções */}
												{/* {promotionalPrices.length >
													1 && (
													<div className="flex flex-row items-center mb-2">
														<span className="text-xs text-black line-through mr-2">
															{`${Number(
																lowestOriginalPriceWithPromo
															).toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)} - ${Number(
																highestOriginalPriceWithPromo
															).toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)}`}
														</span>
													</div>
												)} */}
												{/* Exibição de valores riscados, se houver apenas uma promoção */}
												{/* {promotionalPrices.length ===
													1 && (
													<div className="flex flex-row items-center">
														<span className="text-xs text-black line-through mr-2">
															{`${Number(
																originalPricesWithPromo[0]
															).toLocaleString(
																"pt-BR",
																{
																	style: "currency",
																	currency:
																		"BRL",
																}
															)}`}
														</span>
													</div>
												)} */}
											</div>
										);
									}
								)}
							</div>
						) : (
							<div>
								{/* Renderiza o preço do produto principal caso não existam variações */}
								{product?.promotionalPrice > 0 ? (
									<div className="flex flex-row items-center gap-2">
										<h2 className="text-base text-primary font-semibold">
											{Number(
												product?.promotionalPrice
											).toLocaleString("pt-BR", {
												style: "currency",
												currency: "BRL",
											})}
										</h2>
										{/* 
										<span className="text-xs text-black line-through mr-2">
											{Number(
												product?.originalPrice
											).toLocaleString("pt-BR", {
												style: "currency",
												currency: "BRL",
											})}
										</span> */}
									</div>
								) : (
									<h2 className="text-base text-primary font-semibold">
										{Number(
											product?.originalPrice
										).toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
										})}
									</h2>
								)}
							</div>
						)}
					</h1>
					<h2 className="flex flex-row items-center gap-2 text-center text-sm text-green-500 mb-2">
						<Currency size={18} /> {`${cashback}% de Cashback`}
					</h2>
					<h2 className="text-yellow-500 text-sm flex flex-row items-center gap-2">
						{renderRatingIcons()}
					</h2>
					<h3 className="text-sm text-black mb-3">{quantitySold}</h3>
				</div>
				<button className="btn btn-primary w-full mb-2 shadow-md">
					<Link href={linkProductPage}>+ Detalhes</Link>
				</button>
			</div>
		</div>
	);
}

export { ProductAdCard };
