"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Style Sheet CSS
import "./Navbar.css";

// Skeleton
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Icons
import { MdOutlineStore } from "react-icons/md";
import { Currency, Dashboard, Blockchain, PokeballOne } from "@icon-park/react";
import {
	LuTags,
	LuLayoutDashboard,
	LuSettings,
	LuLogIn,
	LuLogOut,
} from "react-icons/lu";
import { PiGraphBold } from "react-icons/pi";
import {
	RiAccountPinCircleLine,
	RiAccountBoxLine,
	RiAccountPinBoxLine,
} from "react-icons/ri";
import { GiMushroomHouse } from "react-icons/gi";
import { RiAuctionLine, RiCopperCoinLine } from "react-icons/ri";
import { RxHamburgerMenu } from "react-icons/rx";
import { FiUserPlus } from "react-icons/fi";
import { ImMakeGroup } from "react-icons/im";
import { HiOutlineGiftTop } from "react-icons/hi2";
import { MdOutlineLocalActivity, MdOutlineDeleteOutline } from "react-icons/md";
import { TbPokeball } from "react-icons/tb";

// Axios
import api from "@/utils/api";

// Imagens
import Logo from "../../public/logo.png";
import imageProfile from "../../public/kon.jpg";

// Context
import { Context } from "@/context/UserContext";
import { CheckoutContext } from "@/context/CheckoutContext";

import CryptoJS from "crypto-js";

function encryptData(data) {
	return CryptoJS.AES.encrypt(
		JSON.stringify(data), // Converte o objeto inteiro para string
		"chave-secreta"
	).toString();
}

function decryptData(encryptedData) {
	try {
		const bytes = CryptoJS.AES.decrypt(encryptedData, "chave-secreta");
		const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

		// Garantir que o dado retornado seja uma string JSON válida
		if (decryptedString) {
			return decryptedString; // Retorna como uma string
		} else {
			console.error("Falha ao descriptografar: Dado inválido.");
			return null;
		}
	} catch (error) {
		console.error("Erro ao descriptografar:", error);
		return null;
	}
}

function Navbar() {
	const { userAuthenticated, logout } = useContext(Context);
	const { cart, setCart, subtotal, setSubtotal } =
		useContext(CheckoutContext);

	const [token, setToken] = useState(""); // Inicializa o token como uma string vazia

	const [user, setUser] = useState({});
	const [isImageLoaded, setIsImageLoaded] = useState(false);

	// Verifica e recupera o token do localStorage apenas no cliente
	useEffect(() => {
		const savedToken = localStorage.getItem("token");
		if (savedToken) {
			setToken(savedToken); // Atualiza o estado com o token salvo
		}
	}, []); // Esse efeito será executado apenas uma vez, no cliente

	// Carrega dados do usuário quando o token é definido
	useEffect(() => {
		if (!token) return; // Se não houver token, não faz a requisição

		const timer = setTimeout(() => {
			api.get("/mononoke/check-user", {
				headers: {
					Authorization: `Bearer ${JSON.parse(token)}`, // Usa o token para a requisição
				},
			})
				.then((response) => {
					setUser(response.data);
					setIsImageLoaded(false);
				})
				.catch((error) => {
					console.error("Error fetching user data:", error);
					setIsImageLoaded(false);
				});
		}, 2000); // Atraso de 2 segundos

		return () => clearTimeout(timer); // Limpar o timer ao desmontar o componente
	}, [token]); // Esse efeito depende do token

	useEffect(() => {
		// Recupera os produtos do carrinho do localStorage
		const encryptedProducts = localStorage.getItem("productsInCart");

		console.log("Encrypted Products:", encryptedProducts);

		if (!encryptedProducts) {
			console.log(
				"Nenhum dado criptografado encontrado no localStorage."
			);
			return;
		}

		try {
			// Tenta descriptografar os produtos
			const decryptedString = decryptData(encryptedProducts);

			// Verifica se a descriptografia retornou uma string válida e a converte de volta para um objeto
			if (decryptedString) {
				const productsInCart = JSON.parse(decryptedString);

				// Verifica se a estrutura é um array
				if (Array.isArray(productsInCart)) {
					console.log(
						"Produtos no carrinho após descriptografar:",
						productsInCart
					);

					// Calcula a quantidade total de produtos no carrinho
					const totalQuantityProducts = productsInCart.reduce(
						(total, product) =>
							total + (product.quantityThisProduct || 0),
						0
					);
					setCart(totalQuantityProducts);

					// Calcula o valor total do carrinho
					const totalCartValue = productsInCart.reduce(
						(total, product) =>
							total + (product.productPriceTotal || 0),
						0
					);

					// Define o subtotal do carrinho
					const subtotalValue =
						totalCartValue > 0 ? totalCartValue : 0;
					setSubtotal(subtotalValue);
				} else {
					console.error(
						"Erro: produtos descriptografados não são um array válido"
					);
				}
			} else {
				console.error("Falha na descriptografia dos dados");
			}
		} catch (error) {
			// Erro de descriptografia
			console.error(
				"Erro ao descriptografar os dados do carrinho:",
				error
			);
		}
	}, []);

	// Função para remover itens do carrinho de compra
	const handleRemoveFromCart = () => {
		try {
			localStorage.removeItem("productsInCart");
			localStorage.removeItem("transportadoraInfo");
			localStorage.removeItem("coupons");
			localStorage.removeItem("selectedVariations");
			setCart(0);
			setSubtotal(0);
		} catch (error) {
			console.log("Erro ao remover itens do carrinho", error);
		}
	};

	return (
		<header className="w-full">
			{userAuthenticated ? (
				<nav>
					<div className="navbar bg-primary shadow-md">
						<div className="flex-1 ml-10 select-none pointer-events-none mr-12">
							<Image
								src={Logo}
								width={200}
								height={50}
								alt="Logo Image"
								unoptimized
								priority
							/>
						</div>
						<div className="flex-auto hidden md:flex">
							{/* Mostrar em tamanhos md e maiores */}
							<ul className="flex flex-row gap-4">
								<li>
									<Link
										href="/"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										Home
									</Link>
								</li>

								<li>
									<Link
										href="/otamart"
										className="btn btn-ghost normal-case flex flex-row items-center justify-center text-white">
										<MdOutlineStore size={18} />
										OtaMart
									</Link>
								</li>

								<li>
									<Link
										href="/cashback"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<Currency size={18} />
										Cashback
									</Link>
								</li>

								<li>
									<Link
										href="/otaclub"
										className="btn btn-ghost normal-case flex flex-row items-center justify-center text-white">
										<ImMakeGroup size={15} />
										OtaClub
									</Link>
								</li>

								{/* <li>
									<Link
										href="/auction"
										className="btn btn-ghost normal-case flex flex-row items-center justify-center text-white">
										<RiAuctionLine size={18} />
										Auction
									</Link>
								</li> */}

								{/* <li className="indicator">
									<Link
										href="/otakrowdfunding"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<PiGraphBold size={18} />
										<span className="indicator-item badge badge-error">
											new
										</span>
										Otakrowdfunding
									</Link>
								</li> */}

								<li>
									<Link
										href="/coupons"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<LuTags size={18} />
										Cupons
									</Link>
								</li>

								{/* <li>
									<Link
										href="/cupons"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<BiBuildingHouse size={18} />
										OtaHome
									</Link>
								</li> */}

								<li>
									<Link
										href="/dashboard"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<LuLayoutDashboard size={18} />
										Dashboard
									</Link>
								</li>

								<div className="mr-8">
									<div className="dropdown">
										<div
											tabIndex={0}
											role="button"
											className="btn btn-ghost btn-circle">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M4 6h16M4 12h16M4 18h7"
												/>
											</svg>
										</div>
										<ul
											tabIndex={0}
											className="menu menu-sm dropdown-content mt-[23px] z-[99] p-2 shadow-md bg-primary rounded-box w-52">
											<li>
												<a className="flex flex-row items-center justify-between text-white">
													<span className="flex flex-row items-center gap-2">
														<RiCopperCoinLine
															size={18}
														/>
														OtaClub
													</span>
													<span className="badge badge-secondary border text-white border-white">
														New
													</span>
												</a>
											</li>
											<li>
												<a className="flex flex-row items-center justify-between text-white">
													<span className="flex flex-row items-center gap-2">
														<Blockchain size={18} />
														OtaCrypto
													</span>
													<span className="badge badge-secondary text-white border border-white">
														New
													</span>
												</a>
											</li>
											<li>
												<a className="flex flex-row items-center justify-between text-white">
													<span className="flex flex-row items-center gap-2">
														<HiOutlineGiftTop
															size={20}
														/>
														Gift Card
													</span>
													<span className="badge badge-secondary text-white border border-white">
														New
													</span>
												</a>
											</li>
											<li>
												<Link
													href="/raffles"
													className="flex flex-row justify-between items-center text-white active:!bg-secondary">
													<span className="flex items-center gap-2">
														<MdOutlineLocalActivity
															size={20}
														/>
														<span>Sorteio</span>
													</span>
													<span className="badge badge-secondary text-white border border-white">
														New
													</span>
												</Link>
											</li>
											<li>
												<a className="flex flex-row items-center justify-between text-white">
													<span className="flex flex-row items-center gap-2">
														<PokeballOne
															size={20}
														/>
														Gashapon
													</span>
													<span className="badge badge-secondary text-white border border-white">
														New
													</span>
												</a>
											</li>
										</ul>
									</div>
								</div>
							</ul>
						</div>
						{/* <div className="md:hidden">
						<div className="flex-none">
							<button className="btn btn-square btn-ghost">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									className="inline-block w-5 h-5 stroke-current">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M4 6h16M4 12h16M4 18h16"></path>
								</svg>
							</button>
						</div>
					</div> */}
						<div className="flex-none gap-2 mr-10">
							<div className="dropdown dropdown-end mt-1">
								<div
									tabIndex={0}
									role="button"
									className="btn btn-ghost btn-circle">
									<div className="indicator">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
											/>
										</svg>
										<span className="badge badge-sm indicator-item">
											{cart}
										</span>
									</div>
								</div>
								<div
									tabIndex={0}
									className="mt-[21px] z-[2] card card-compact dropdown-content w-52 bg-primary shadow-md">
									<div className="card-body">
										<span className="font-bold text-lg">
											{cart === 0
												? "Carrinho Vazio"
												: cart === 1
												? `${cart} item`
												: `${cart} itens`}
										</span>
										<span className="text-gray-200">
											{`	Subtotal: ${subtotal.toLocaleString(
												"pt-BR",
												{
													style: "currency",
													currency: "BRL",
												}
											)}`}
										</span>

										<div
											className="flex flex-row items-center text-gray-200 transition-all ease-in duration-250 hover:text-white hover:underline cursor-pointer"
											onClick={handleRemoveFromCart}>
											<MdOutlineDeleteOutline size={17} />
											Excluir
										</div>
										<div className="card-actions">
											<button className="btn btn-secondary text-white shadow-md btn-block">
												<Link href="/checkout/cart">
													Ver Carrinho
												</Link>
											</button>
										</div>
									</div>
								</div>
							</div>
							<div className="dropdown dropdown-end mt-1">
								<label
									tabIndex={0}
									className="btn btn-ghost btn-circle avatar ring ring-success ring-offset-base-100">
									<div className="w-[40px] rounded-full">
										{user && (
											<>
												{!isImageLoaded && (
													<SkeletonTheme
														baseColor="#202020"
														highlightColor="#444">
														<Skeleton
															circle={true}
															height={40}
															width={40}
														/>
													</SkeletonTheme>
												)}
												{user.accountType ===
												"partner" ? (
													<Image
														src={`http://localhost:5000/images/partners/${user.profileImage}`}
														width={450}
														height={450}
														alt="Profile Image"
														unoptimized
														priority
														onLoadingComplete={() =>
															setIsImageLoaded(
																true
															)
														} // Atualiza o estado quando a imagem é carregada
														style={{
															display:
																isImageLoaded
																	? "block"
																	: "none",
														}} // Esconde a imagem até ser carregada
													/>
												) : (
													<Image
														src={`http://localhost:5000/images/customers/${user.profileImage}`}
														width={450}
														height={450}
														alt="Profile Image"
														unoptimized
														priority
														onLoadingComplete={() =>
															setIsImageLoaded(
																true
															)
														} // Atualiza o estado quando a imagem é carregada
														style={{
															display:
																isImageLoaded
																	? "block"
																	: "none",
														}} // Esconde a imagem até ser carregada
													/>
												)}
											</>
										)}
									</div>
								</label>
								<ul
									tabIndex={0}
									className="mt-[20px] z-[1] p-2 shadow-md menu menu-sm dropdown-content bg-primary text-white rounded-box w-52">
									{/* <li>
										<Link
											className="flex flex-row items-center justify-between text-white"
											href="/dashboard/myprofile">
											<span className="flex flex-row items-center gap-2">
												<RiAccountPinBoxLine
													size={18}
												/>
												Perfil
											</span>

											<span className="badge border border-white">
												New
											</span>
										</Link>
									</li> */}

									<li>
										<Link
											className="flex flex-row items-center justify-between "
											href="/dashboard/myprofile">
											<span className="flex flex-row items-center gap-2">
												<LuSettings size={18} />
												Configurações
											</span>

											<span className="badge badge-secondary text-white border-[1px] border-white">
												New
											</span>
										</Link>
									</li>

									<li>
										<a className="flex flex-row items-center justify-between text-white">
											<span
												className="flex flex-row items-center gap-2"
												onClick={logout}>
												<LuLogOut size={18} />
												Logout
											</span>
										</a>
									</li>
								</ul>
							</div>
							<div className="navbar-end mt-1">
								<button className="btn btn-ghost btn-circle">
									<div className="indicator">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
											/>
										</svg>
										<span className="badge badge-xs badge-secondary indicator-item"></span>
									</div>
								</button>
							</div>
						</div>
					</div>
				</nav>
			) : (
				<nav>
					<div className="navbar bg-primary shadow-md">
						<div className="flex-1 ml-10">
							<Image
								src={Logo}
								width={200}
								height={50}
								alt="Logo Image"
								unoptimized
								priority
							/>
						</div>
						<div className="flex-auto hidden md:flex">
							{/* Mostrar em tamanhos md e maiores */}
							<ul className="flex flex-row gap-4">
								<li>
									<Link
										href="/"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										Home
									</Link>
								</li>

								<li>
									<Link
										href="/otamart"
										className="btn btn-ghost normal-case flex flex-row items-center justify-center text-white">
										<MdOutlineStore size={18} />
										OtaMart
									</Link>
								</li>

								<li>
									<Link
										href="/cashback"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<Currency size={18} />
										Cashback
									</Link>
								</li>

								<li>
									<Link
										href="/otaclub"
										className="btn btn-ghost normal-case flex flex-row items-center justify-center text-white">
										<ImMakeGroup size={15} />
										OtaClub
									</Link>
								</li>

								{/* <li>
									<Link
										href="/auction"
										className="btn btn-ghost normal-case flex flex-row items-center justify-center text-white">
										<RiAuctionLine size={18} />
										Auction
									</Link>
								</li> */}

								{/* <li className="indicator">
									<Link
										href="/otakrowdfunding"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<PiGraphBold size={18} />
										<span className="indicator-item badge badge-error">
											new
										</span>
										Otakrowdfunding
									</Link>
								</li> */}

								<li>
									<Link
										href="/coupons"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<LuTags size={18} />
										Cupons
									</Link>
								</li>

								{/* <li>
									<Link
										href="/cupons"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<BiBuildingHouse size={18} />
										OtaHome
									</Link>
								</li> */}

								<div className="mr-8">
									<div className="dropdown">
										<div
											tabIndex={0}
											role="button"
											className="btn btn-ghost btn-circle">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M4 6h16M4 12h16M4 18h7"
												/>
											</svg>
										</div>
										<ul
											tabIndex={0}
											className="menu menu-sm dropdown-content mt-[23px] z-[99] p-2 text-white shadow-md bg-primary rounded-box w-52">
											<li>
												<a className="flex flex-row items-center justify-between text-white">
													<span className="flex flex-row items-center gap-2">
														<RiCopperCoinLine
															size={18}
														/>
														OtaClub
													</span>
													<span className="badge badge-secondary text-white border border-white">
														New
													</span>
												</a>
											</li>
											<li>
												<a className="flex flex-row items-center justify-between text-white">
													<span className="flex flex-row items-center gap-2">
														<Blockchain size={18} />
														OtaCrypto
													</span>
													<span className="badge badge-secondary border border-white">
														New
													</span>
												</a>
											</li>
											<li>
												<Link
													href="/raffles"
													className="flex flex-row justify-between items-center text-white active:!bg-secondary">
													<span className="flex items-center gap-2">
														<MdOutlineLocalActivity
															size={20}
														/>
														<span>Sorteio</span>
													</span>
													<span className="badge badge-secondary border border-white">
														New
													</span>
												</Link>
											</li>
										</ul>
									</div>
								</div>

								{/* <li>
									<Link
										href="/cupons"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<BiBuildingHouse size={18} />
										OtaHome
									</Link>
								</li> */}

								<li>
									<Link
										href="/login"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<LuLogIn size={18} />
										Login
									</Link>
								</li>
								<li>
									<Link
										href="/register"
										className="btn btn-ghost normal-case flex flex-row items-center text-white">
										<FiUserPlus size={18} />
										Cadastre-se
									</Link>
								</li>
							</ul>
						</div>
						{/* <div className="md:hidden">
						<div className="flex-none">
							<button className="btn btn-square btn-ghost">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									className="inline-block w-5 h-5 stroke-current">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M4 6h16M4 12h16M4 18h16"></path>
								</svg>
							</button>
						</div>
					</div> */}
					</div>
				</nav>
			)}
		</header>
	);
}

export { Navbar };
