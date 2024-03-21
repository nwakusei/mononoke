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

// Icons
import { ShoppingCartOne, PaymentMethod } from "@icon-park/react";
import { BsHeart } from "react-icons/bs";
import { GoShareAndroid } from "react-icons/go";
import { GrChat } from "react-icons/gr";
import { LiaShippingFastSolid } from "react-icons/lia";
import { GrLocation } from "react-icons/gr";
import { FiInfo } from "react-icons/fi";
import { LuCalendarClock } from "react-icons/lu";

function SideComponent() {
	const { id } = useParams();
	const [product, setProduct] = useState({});
	const [transportadoras, setTransportadoras] = useState([]);
	const [isCalculating, setIsCalculating] = useState(false);
	const [cepDestino, setCepDestino] = useState(""); // Estado para armazenar o valor do input
	const [selectedTransportadora, setSelectedTransportadora] = useState<{
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
	function handleSelected(
		transportadoraId,
		transportadoraNome,
		transportadoraCNPJ,
		transportadoraLogo,
		transportadoraVlrFrete,
		transportadoraPrazoMin,
		transportadoraPrazoEnt,
		transportadoraDtPrevEntMin,
		transportadoraDtPrevEnt
	) {
		setSelectedTransportadora((prevState) => {
			const deselectedItems = Object.keys(prevState).reduce(
				(acc, key) => ({
					...acc,
					[key]: key === transportadoraId ? !prevState[key] : false,
				}),
				{}
			);
			return {
				...deselectedItems,
				[transportadoraId]: !prevState[transportadoraId],
				id: transportadoraId,
				nome: transportadoraNome, // Adiciona o nome da transportadora ao estado
				cnpj: transportadoraCNPJ,
				logo: transportadoraLogo,
				vlrFrete: transportadoraVlrFrete,
				prazoMin: transportadoraPrazoMin,
				prazoEnt: transportadoraPrazoEnt,
				dtPrevEntMin: transportadoraDtPrevEntMin,
				dtPrevEnt: transportadoraDtPrevEnt,
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

	function handleAddProductInCart(quantity, product, selectedTransportadora) {
		// Verifica se alguma transportadora foi selecionada
		const transportadoraSelecionada = Object.values(
			selectedTransportadora
		).some((value) => value);

		if (!transportadoraSelecionada && !product.freeShipping === true) {
			toast.warning("Selecione uma opção de frete!");
			return; // Retorna para evitar a adição do produto ao carrinho sem transportadora selecionada
		}

		// Recupera os produtos já existentes no localStorage, se houver
		let productsInCart = localStorage.getItem("productsInCart");

		if (!productsInCart) {
			productsInCart = [];
		} else {
			productsInCart = JSON.parse(productsInCart);
		}

		// Calcula o preço do produto
		let productPrice;

		if (
			product.promocionalPrice &&
			product.promocionalPrice.$numberDecimal &&
			Number(product.promocionalPrice.$numberDecimal) > 0
		) {
			productPrice = Number(product.promocionalPrice.$numberDecimal);
		} else if (
			product.originalPrice &&
			product.originalPrice.$numberDecimal &&
			Number(product.originalPrice.$numberDecimal) > 0
		) {
			productPrice = Number(product.originalPrice.$numberDecimal);
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
				transportadora: selectedTransportadora,
			};
			productsInCart.push(newProduct);
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

		setTransportadoras([]);
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
	const handleButtonClick = () => {
		setIsCalculating(true);

		handleSimulateShipping(cepDestino);

		setTimeout(() => {
			setIsCalculating(false);
		}, 1000);
	};

	return (
		<div>
			{/* Componente Lateral D. */}
			<div className="flex flex-col w-[300px]">
				<div className="border rounded-lg mb-2">
					<div className="px-4 mb-2">
						<h1 className="mb-1">Quantidade</h1>
						<div className="flex flex-row justify-between items-center mb-2">
							<div className="border container w-[120px] rounded-md">
								<div className="flex flex-row justify-between items-center h-[30px]">
									<button
										className={`ml-1 px-2 hover:bg-slate-300 hover:opacity-20 hover:text-black rounded-md ${
											isQuantityOneOrLess
												? "cursor-not-allowed"
												: "cursor-pointer"
										}`}
										onClick={decrementarQuantidade} // Etapa 3: Adicione o evento de clique
									>
										-
									</button>
									<input
										className="w-12 text-center bg-yellow-500 appearance-none"
										type="number"
										value={quantity}
										readOnly
									/>
									<button
										className={`mr-1 px-2 hover:bg-slate-300 hover:opacity-20 hover:text-black rounded-md ${
											isQuantityAtLimit
												? "cursor-not-allowed"
												: "cursor-pointer"
										}`}
										onClick={incrementarQuantidade}>
										+
									</button>
								</div>
							</div>
							<div className="text-sm">
								{stock} un disponíveis
							</div>
						</div>

						<div className="flex flex-row justify-between mb-2">
							<div className="font-semibold">Subtotal</div>
							<div className="font-semibold">
								{quantity === 1
									? renderPrice()
									: totalOrder.toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
									  })}
							</div>
						</div>

						<button
							className="btn btn-outline btn-primary w-full mb-2"
							onClick={() =>
								handleAddProductInCart(
									quantity,
									product,
									selectedTransportadora
								)
							}>
							<ShoppingCartOne size={18} />
							Adicionar ao Carrinho
						</button>
						<button className="btn btn-primary w-full mb-2">
							<PaymentMethod size={18} /> Comprar Agora
						</button>
						{/* Componentes pequenos */}
						<div className="flex flex-row justify-center items-center">
							<div className="text-sm flex flex-row items-center hover:bg-slate-300 hover:opacity-20 px-2 py-1 gap-1 rounded cursor-pointer">
								<GrChat size={12} />
								<span>Chat</span>
							</div>
							|
							<div className="text-sm flex flex-row items-center hover:bg-slate-300 hover:opacity-20 px-2 py-1 gap-1 rounded cursor-pointer">
								<BsHeart size={12} />
								<span>Wishlist</span>
							</div>
							|
							<div className="text-sm flex flex-row justify-center items-center hover:bg-slate-300 hover:opacity-20 px-2 py-1 gap-1 rounded cursor-pointer">
								<GoShareAndroid size={15} />
								<span>Share</span>
							</div>
						</div>
					</div>
				</div>

				<div>
					{/* Etiqueta de Encomenda */}
					{product.preOrder === true ? (
						<div className="flex flex-row justify-center items-center bg-sky-500 p-2 gap-3 rounded shadow mb-2">
							<LuCalendarClock size={20} />
							<h1>
								Encomenda (envio em {product.daysShipping} dias)
							</h1>
						</div>
					) : (
						<></>
					)}
				</div>

				{/* Meios de envio/Frete */}
				<div className="flex flex-col border border-solid p-2 rounded">
					<div>
						<h2 className="flex flex-row items-center gap-2 mb-2">
							<GrLocation size={18} />
							<span className="text-sm">
								Enviado de Joinville/SC
							</span>
						</h2>

						{product.freeShipping === true ? (
							<div className="flex flex-row justify-between items-center gap-2 mb-1">
								<div className="flex flex-row items-center gap-2">
									<LiaShippingFastSolid size={24} />
									<span>Frete Grátis</span>
								</div>
								<div
									className="tooltip cursor-pointer"
									data-tip="A transportadora será escolhida pela loja, de acordo com o melhor custo benefício!">
									<FiInfo
										className="animate-pulse"
										size={18}
									/>
								</div>
							</div>
						) : (
							<div>
								<h2 className="flex flex-row items-center gap-2 mb-1">
									<LiaShippingFastSolid size={24} />
									<span>Meios de Envio</span>
								</h2>
								<div className="flex flex-row gap-2 mb-2">
									<input
										type="text"
										placeholder="Seu CEP"
										className="input w-full max-w-[180px]"
										value={cepDestino} // Valor do input é controlado pelo estado cepDestino
										onChange={(e) =>
											setCepDestino(e.target.value)
										} // Atualizar o estado cepDestino quando o valor do input mudar
									/>
									<button
										type="button"
										className="btn btn-primary w-[120px]"
										onClick={handleButtonClick}
										disabled={isCalculating} // Desabilitar o botão enquanto o cálculo estiver em andamento
									>
										{isCalculating ? (
											<div className="btn btn-primary w-[120px]">
												<span className="loading loading-spinner loading-xs"></span>
											</div>
										) : (
											"Calcular"
										)}
									</button>
								</div>
							</div>
						)}

						{transportadoras.length > 0 ? (
							transportadoras.map((transportadora) => (
								<div
									key={transportadora.idSimulacao}
									onClick={() =>
										handleSelected(
											transportadora.idTransp,
											transportadora.transp_nome,
											transportadora.cnpjTransp,
											transportadora.url_logo,
											transportadora.vlrFrete,
											transportadora.prazoEntMin,
											transportadora.prazoEnt,
											transportadora.dtPrevEntMin,
											transportadora.dtPrevEnt
										)
									}
									className={`${
										selectedTransportadora[
											transportadora.idTransp
										]
											? `bg-sky-500`
											: ""
									} hover:bg-sky-500 transition-all ease-in duration-150 border border-solid p-2 rounded cursor-pointer mb-2`}>
									<div className="flex flex-row justify-between items-center gap-2 mb-1">
										<span>
											{transportadora.transp_nome}
										</span>
										<h2>
											{transportadora.tarifas.map(
												(tarifa, index) => (
													<h2 key={index}>
														{tarifa.valor.toLocaleString(
															"pt-BR",
															{
																style: "currency",
																currency: "BRL",
															}
														)}
													</h2>
												)
											)}
										</h2>
									</div>
									<div className="flex flex-row justify-between">
										<span className="text-sm">
											Prazo de entrega
										</span>
										<h2 className="text-sm">
											{product.daysShipping +
												transportadora.prazoEnt}{" "}
											dias
										</h2>
									</div>
								</div>
							))
						) : (
							<></>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export { SideComponent };
