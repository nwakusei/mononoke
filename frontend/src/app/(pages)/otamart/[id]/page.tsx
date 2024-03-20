"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// Contexts
import { Context } from "@/context/UserContext";
import { CartContext } from "@/context/CartContext";

// Components
import { ProductVariation } from "@/components/ProductVariation";
import { SideComponent } from "@/components/SideComponent";

// Importe suas imagens e ícones aqui
import Lycoris from "../../../../../public/lycoris.jpg";
import Amora from "../../../../../public/amora.jpg";
import imageProfile from "../../../../../public/Kon.jpg";

// Icons
import { Currency, ShoppingCartOne, PaymentMethod } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill, BsHeart } from "react-icons/bs";
import { MdVerified, MdOutlineLocationOn } from "react-icons/md";
import { GoShareAndroid, GoLocation } from "react-icons/go";
import { PiChatTextLight } from "react-icons/pi";
import { GrChat } from "react-icons/gr";
import { TbTruckDelivery } from "react-icons/tb";
import { LiaShippingFastSolid } from "react-icons/lia";
import { GrLocation } from "react-icons/gr";
import { FiInfo } from "react-icons/fi";
import { LuCalendarClock } from "react-icons/lu";

function ProductPage() {
	const { id } = useParams();
	const [product, setProduct] = useState({});
	const [transportadoras, setTransportadoras] = useState([]);
	const [isCalculating, setIsCalculating] = useState(false);
	const [cepDestino, setCepDestino] = useState(""); // Estado para armazenar o valor do input
	const [selectedTransportadoraId, setSelectedTransportadoraId] = useState<{
		[key: string]: boolean;
	}>({});
	const stock = product.stock; // Constante que irá representar a quantidade de estoque que vem do Banco de Dados

	const { partners } = useContext(Context);
	const { setCart, setSubtotal } = useContext(CartContext);

	const partner = partners.find(
		(partner) => partner._id === product.partnerID
	);

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

	// Valor a ser Exibido no Anúncio (Preço Original ou Promocional)
	const value =
		Number(product.promocionalPrice?.$numberDecimal) > 0
			? Number(product.promocionalPrice?.$numberDecimal)
			: Number(product.originalPrice?.$numberDecimal);

	// Função para selecionar variações
	function handleSelected(itemId: string) {
		setSelectedTransportadoraId((prevState) => {
			// Desmarca todos os itens selecionados, exceto o item clicado
			const deselectedItems = Object.keys(prevState).reduce(
				(acc, key) => ({
					...acc,
					[key]: key === itemId ? !prevState[key] : false,
				}),
				{}
			);

			return {
				...deselectedItems,
				[itemId]: !prevState[itemId],
			};
		});
	}

	// Lidando com a relação entre Quantidade e Subtotal baseado no valor do produto (Preço Original ou Promocional)
	// Etapa 1: Adicionando a variável de estado para a quantidade
	const [quantity, setQuantity] = useState<number>(1);
	const [isQuantityOneOrLess, setIsQuantityOneOrLess] = useState(true);
	const [isQuantityAtLimit, setIsQuantityAtLimit] = useState(false);
	const [totalOrder, setTotalOrder] = useState(value);

	// Etapa 2: Funções para lidar com incremento e decremento
	const updateTotalOrder = (newQuantity: number) => {
		setTotalOrder(value);

		setQuantity(newQuantity);

		if (newQuantity <= 1) {
			setIsQuantityOneOrLess(true);
		} else {
			setIsQuantityOneOrLess(false);
		}

		if (newQuantity === stock) {
			setIsQuantityAtLimit(true);
		} else {
			setIsQuantityAtLimit(false);
		}

		// Multiplicando o novo valor da quantidade pelo valor do produto
		setTotalOrder(newQuantity * value);
	};

	// Incremento de Quantidade (+1)
	const incrementarQuantidade = () => {
		if (quantity < stock) {
			updateTotalOrder(quantity + 1);
		}
	};

	// Decremento de Quantidade (-1)
	const decrementarQuantidade = () => {
		if (quantity > 1) {
			updateTotalOrder(quantity - 1);
		}
	};

	// Função para calculo do Subtotal dos produtos
	const renderPrice = () => {
		const priceToRender =
			Number(product.promocionalPrice?.$numberDecimal) > 0
				? Number(
						product.promocionalPrice.$numberDecimal
				  ).toLocaleString("pt-BR", {
						style: "currency",
						currency: "BRL",
				  })
				: Number(product.originalPrice?.$numberDecimal).toLocaleString(
						"pt-BR",
						{
							style: "currency",
							currency: "BRL",
						}
				  );
		return priceToRender;
	};

	// Função para renderizar os ícones de classificação com base no rating
	const renderRatingIcons = () => {
		const roundedRating = Math.round(product.rating * 2) / 2; // Arredonda o rating para a casa decimal mais próxima

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

		const formattedRating = Number.isInteger(roundedRating)
			? `${roundedRating}.0`
			: roundedRating;
		const ratingIcons = [];

		// Adiciona o número correspondente ao rating antes das estrelas
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

	function handleAddProductInCart(
		quantity,
		product,
		selectedTransportadoraId
	) {
		const transportadoraId = Object.keys(selectedTransportadoraId)[0];

		// Recupera os produtos já existentes no localStorage, se houver
		let productsInCart = localStorage.getItem("productsInCart");

		if (!productsInCart) {
			productsInCart = [];
		} else {
			productsInCart = JSON.parse(productsInCart);
		}

		// Calcula o preço total do produto
		let productPrice;
		let productPriceTotal;

		if (
			product.promocionalPrice &&
			product.promocionalPrice.$numberDecimal &&
			Number(product.promocionalPrice.$numberDecimal) > 0
		) {
			productPrice = Number(product.promocionalPrice.$numberDecimal);
			productPriceTotal: Number(product.promocionalPrice.$numberDecimal);
		} else if (
			product.originalPrice &&
			product.originalPrice.$numberDecimal &&
			Number(product.originalPrice.$numberDecimal) > 0
		) {
			productPrice = Number(product.originalPrice.$numberDecimal);
			productPriceTotal: Number(product.originalPrice.$numberDecimal);
		} else {
			// Se não houver nenhum preço válido, retorna um erro ou define como 0
			console.error("Preço do produto inválido:", product);
			return;
		}

		// Verifica se o produto já está no carrinho pelo ID
		const existingProduct = productsInCart.find(
			(p) => p.productID === product._id
		);

		if (existingProduct) {
			// Se o produto já estiver no carrinho, apenas atualiza a quantidade,
			// limitando ao estoque disponível
			const totalQuantity =
				existingProduct.quantityThisProduct + quantity;
			existingProduct.quantityThisProduct = Math.min(
				totalQuantity,
				product.stock
			);

			// Verifica se a quantidade ultrapassou o estoque
			if (totalQuantity > product.stock) {
				toast.warning(
					"Você atingiu o limite de estoque para este produto!"
				);
			}

			// Atualiza o preço total do produto no carrinho multiplicando a quantidade pelo preço unitário
			existingProduct.productPriceTotal =
				existingProduct.quantityThisProduct * productPrice;
		} else {
			// Caso contrário, adiciona o novo produto ao array de produtos
			const newProduct = {
				productID: product._id,
				productName: product.productName,
				imageProduct: product.imagesProduct[0],
				quantityThisProduct: Math.min(quantity, product.stock),
				productPrice: productPrice,
				productPriceTotal:
					Math.min(quantity, product.stock) * productPrice, // Calcula o preço total do produto
				daysShipping: product.daysShipping,
				freeShipping: product.freeShipping,
				transportadora: {
					id: selectedTransportadoraId,
					// Outros dados relevantes da transportadora
				},
			};
			productsInCart.push(newProduct);

			// Adicione a transportadora selecionada ao objeto do produto
			newProduct.selectedTransportadoraId = transportadoraId;
		}

		// Tenta armazenar o array de produtos no localStorage
		try {
			localStorage.setItem(
				"productsInCart",
				JSON.stringify(productsInCart)
			);
			// Atualiza o estado do carrinho com o total de produtos
			const totalQuantityProducts = productsInCart.reduce(
				(total, product) => total + product.quantityThisProduct,
				0
			);

			setCart(totalQuantityProducts);
			// Calcula o preço total do carrinho
			const totalCartValue = productsInCart.reduce(
				(total, product) => total + product.productPriceTotal, // Soma os preços totais de cada produto
				0
			);
			// Define o subtotal como 0 se o carrinho estiver vazio
			const subtotal = productsInCart.length > 0 ? totalCartValue : 0;
			setSubtotal(subtotal);
		} catch (error) {
			console.log("Erro ao adicionar o produto ao carrinho!", error);
		}
	}

	// Função para Calcular o Frete
	async function handleSimulateShipping(cep: number) {
		let productPrice;

		if (
			product.promocionalPrice &&
			product.promocionalPrice.$numberDecimal &&
			Number(product.promocionalPrice.$numberDecimal) > 0
		) {
			// Se houver um preço promocional válido, use-o como preço do produto
			productPrice = Number(product.promocionalPrice.$numberDecimal);
		} else if (
			product.originalPrice &&
			product.originalPrice.$numberDecimal &&
			Number(product.originalPrice.$numberDecimal) > 0
		) {
			// Se não houver preço promocional válido, mas houver um preço original válido, use-o como preço do produto
			productPrice = Number(product.originalPrice.$numberDecimal);
		} else {
			// Se não houver nenhum preço válido, retorne um erro ou defina o preço como 0
			console.error("Preço do produto inválido:", product);
			return;
		}

		try {
			const response = await api.post("/products/simulate-shipping", {
				cepDestino: cep,
				weight: product.weight, // Adicione o peso do produto
				height: product.height, // Adicione a altura do produto
				width: product.width, // Adicione a largura do produto
				length: product.length, // Adicione o comprimento do produto
				productPrice: productPrice, // Adicione o preço unitário do produto
				productPriceTotal: productPrice * quantity, // Adicione o preço total do produto
				quantityThisProduct: quantity, // Adicione a quantidade do produto
			}); // Passar cep como parte do corpo da solicitação
			setTransportadoras(response.data);
		} catch (error) {
			console.error("Ocorreu um erro:", error);
		}
	}

	// Função para lidar com o clique no botão de Calculo de Frete
	const handleButtonClick = (selectedTransportadoraId) => {
		setIsCalculating(true);

		handleSimulateShipping(cepDestino, selectedTransportadoraId);

		setTimeout(() => {
			setIsCalculating(false);
		}, 1000);
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
					{product.promocionalPrice?.$numberDecimal > 0 ? (
						<div>
							{/* Preço promocional */}
							<h2 className="text-2xl text-primary font-semibold">
								{Number(
									product.promocionalPrice?.$numberDecimal
								).toLocaleString("pt-BR", {
									style: "currency",
									currency: "BRL",
								})}
							</h2>
							{/* Preço antes do desconto */}
							<div className="flex flex-row items-center mb-2">
								<span className="text-base line-through mr-2">
									{Number(
										product.originalPrice?.$numberDecimal
									).toLocaleString("pt-BR", {
										style: "currency",
										currency: "BRL",
									})}
								</span>
								<span className="bg-primary text-xs px-1 rounded-sm">
									20% Off
								</span>
							</div>
						</div>
					) : (
						<div>
							<h2 className="text-2xl text-primary font-semibold">
								{Number(
									product.originalPrice?.$numberDecimal
								).toLocaleString("pt-BR", {
									style: "currency",
									currency: "BRL",
								})}
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
										className="text-blue-700"
										size={18}
									/>
								</div>
								<div className="flex flex-row items-center">
									<BsStar size={14} />
									<span className="ml-1 mr-2">5.0</span> |
									<span className="ml-2">10 Seguidores</span>
								</div>
								<div className="mt-1">
									<button className="bg-green-600 transition-all ease-in duration-200 hover:bg-green-800 px-10 py-1 rounded">
										Seguir
									</button>
								</div>
							</div>
							<div className="divider divider-horizontal">|</div>
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
						<div className="flex flex-row gap-2">
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
									<h1 className="text-sm">Reinaldo Guedes</h1>
									<div className="flex flex-row items-center text-sm">
										<span className="flex flex-row items-center gap-1">
											<p className="mr-1 text-sm">5.0</p>
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
										</span>
									</div>
									<h3 className="text-xs mb-2">24/01/2024</h3>
									<p className="text-base mb-2">
										Ótimo produto. Chegou rápido e muito bem
										embalado, recomendo!
									</p>
								</div>

								{/* Fotos das avaliações */}
								<div className="flex flex-row gap-2 mb-2">
									<div className="bg-base-100 w-[74px] rounded relative shadow-lg">
										<div className="h-[74px] flex items-center justify-center">
											<Image
												className="object-contain  h-full"
												src={Lycoris}
												alt="Shoes"
											/>
										</div>
									</div>

									<div className="bg-base-100 w-[74px] rounded relative shadow-lg">
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
						</div>
						<hr className="mx-2" /> <br />
						{/* Avaliação por Usuário*/}
						<div className="flex flex-row gap-2">
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
										Marina Penharver
									</h1>
									<div className="flex flex-row items-center text-sm">
										<span className="flex flex-row items-center gap-1">
											<p className="mr-1 text-sm">5.0</p>
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
											<BsStarFill size={12} />
										</span>
									</div>
									<h3 className="text-xs mb-2">24/01/2024</h3>
									<p className="text-base mb-2">
										Ótimo produto. Chegou rápido e muito bem
										embalado, recomendo!
									</p>
								</div>

								{/* Fotos das avaliações */}
								<div className="flex flex-row gap-2 mb-2">
									<div className="bg-base-100 w-[74px] rounded relative shadow-lg">
										<div className="h-[74px] flex items-center justify-center">
											<Image
												className="object-contain  h-full"
												src={Lycoris}
												alt="Shoes"
											/>
										</div>
									</div>

									<div className="bg-base-100 w-[74px] rounded relative shadow-lg">
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
						</div>
						<hr className="mx-2" /> <br />
					</div>
				</div>
			</div>
		</section>
	);
}

export default ProductPage;
