"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import Image from "next/image";

import api from "@/utils/api";

// imagens estáticas
import Lycoris from "../../../../../public/lycoris.jpg";

// Context
import { CheckoutContext } from "@/context/CheckoutContext";

// Icons
import { Coupon, IdCardH, ShoppingCartOne } from "@icon-park/react";
import {
	MdOutlineDeleteOutline,
	MdArrowBackIos,
	MdArrowForwardIos,
} from "react-icons/md";
import { GrLocation } from "react-icons/gr";
import { HiOutlineCreditCard } from "react-icons/hi";
import { PiCreditCardBold } from "react-icons/pi";
import { BiIdCard } from "react-icons/bi";
import { LiaShippingFastSolid } from "react-icons/lia";
import { FiInfo } from "react-icons/fi";
import { CiStickyNote } from "react-icons/ci";
import { PiNoteBold } from "react-icons/pi";

import CryptoJS from "crypto-js";

// function encryptData(data) {
//     return CryptoJS.AES.encrypt(
//         JSON.stringify(data), // Converte o objeto inteiro para string
//         "chave-secreta"
//     ).toString();
// }

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

// Components
import { YourOrderComp } from "@/components/YourOrderComp";
import { RiSwap2Line } from "react-icons/ri";
import Swal from "sweetalert2";
import { title } from "process";

function CheckoutOtaclubPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState({});
	const [product, setProduct] = useState({});
	const [loadingButton, setLoadingButton] = useState(false);

	console.log("PRODUTO", product);

	const customerAddress = {
		street: user?.address?.[0]?.street || "",
		complement: user?.address?.[0]?.complement || "",
		neighborhood: user?.address?.[0]?.neighborhood || "",
		city: user?.address?.[0]?.city || "",
		state: user?.address?.[0]?.state || "",
		postalCode: user?.address?.[0]?.postalCode || "",
	};

	useEffect(() => {
		const decryptedProduct = localStorage.getItem("otaclubProduct");
		if (decryptedProduct) {
			try {
				const decrypted = decryptData(decryptedProduct);
				console.log("Produto carregado:", decrypted);
				if (decrypted) {
					setProduct(JSON.parse(decrypted));
				}
			} catch (err) {
				console.error("Erro ao descriptografar produto:", err);
			}
		}

		api.get("/mononoke/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setUser(response.data);
		});
	}, [token]);

	async function swapOtaclubProcess(product, customerAddress) {
		setLoadingButton(true);

		try {
			const response = await api.post("/otakupay/swap-otaclub", {
				product,
				customerAddress,
			});

			if (response.status === 200) {
				localStorage.removeItem("otaclubProduct");
			}

			Swal.fire({
				title: response.data.message,
				icon: "success",
				width: 900,
				customClass: {
					confirmButton: "swal2-custom-confirm",
				},
			});
		} catch (error: any) {
			Swal.fire({
				title: error?.response?.data.message,
				text: "Qualquer coisa",
				icon: "error",
				width: 700,
			});
		} finally {
			setLoadingButton(false);
		}
	}

	return (
		<div className="bg-gray-300 h-screen flex flex-col">
			<section className="grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
				<div className="flex flex-row gap-4 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-8 mb-8">
					<div className="flex flex-col">
						{/* <div className="w-[750px] flex flex-row justify-between bg-white col-start-2 col-span-4 md:col-start-2 md:col-span-6 rounded-md shadow-md mb-4 p-4">
							<div className="flex flex-col w-[718px]">
								<div className="text-black flex flex-row justify-between gap-4 border-[1px] border-black border-opacity-20 bg-white w-full min-h-[100px] p-4 rounded-md shadow-md">
									<div className="flex flex-row gap-4">
										<div className="flex flex-row gap-4">
											<div>
												<Image
													src={`http://backend:5000/images/products/${product.imageProduct}`}
													alt="Product Image Miniature"
													width={60}
													height={10}
												/>
											</div>
											<div>
												<div>
													{product.productTitle}
												</div>
												<div>
													{product?.productPrice !==
														undefined && (
														<div>
															{`Custo da Troca: ${Number(
																product.productPrice
															).toLocaleString(
																"pt-BR",
																{
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																}
															)} OP`}
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div> */}

						<div className="w-[750px] h-[150px] flex flex-row justify-between bg-white col-start-2 col-span-4 md:col-start-2 md:col-span-6 rounded-md shadow-md mb-4 p-4 gap-4">
							<div className="flex flex-col gap-4 w-[718px]">
								<div className="text-black flex flex-row justify-between gap-4 border-[1px] border-black border-opacity-20 bg-white w-full min-h-[100px] p-4 rounded-md shadow-md">
									<div className="flex flex-row gap-4">
										<BiIdCard size={25} />
										<div>
											<div>{user.name}</div>
											<div>{`CPF: ${user.cpf}`}</div>
											<div>{`Email: ${user.email}`}</div>
											<div>{`Tel.: --`}</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="w-[750px] h-[200px] flex flex-row justify-between bg-white col-start-2 col-span-4 rounded-md shadow-md mb-8 p-4 gap-4">
							<div className="text-black flex flex-row justify-between gap-4 border-[1px] border-black border-opacity-20 bg-white w-full min-h-[100px] p-4 rounded-md shadow-md">
								{user.address && user.address.length > 0 ? (
									user.address.map((end, index) => (
										<div
											key={end.id || index} // Garantindo que a chave seja única (usando 'index' como fallback)
											className="flex flex-row gap-4">
											<GrLocation size={25} />
											<div>
												<h1 className="text-base font-semibold mb-2">
													Endereço de Entrega:
												</h1>
												<h1 className="text-base">
													{end.street}
												</h1>
												<h2>{end.complement}</h2>
												<h2>{end.neighborhood}</h2>
												<h2>
													{end.city}/{end.state}
												</h2>
												<h2>{end.postalCode}</h2>
											</div>
										</div>
									))
								) : (
									<div>
										<h1 className="text-base font-semibold mb-2">
											Nenhum endereço disponível
										</h1>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="w-[400px] h-[366px] flex flex-row justify-between bg-white col-start-2 col-span-4 md:col-start-2 md:col-span-6 rounded-md shadow-md mb-4 p-4">
						<div className="text-black flex flex-row justify-between gap-4 border-[1px] border-black border-opacity-20 bg-white w-full min-h-[100px] p-4 rounded-md shadow-md">
							<div className="flex flex-row gap-4">
								<div className="flex flex-row gap-4">
									<div>
										<Image
											src={`https://mononokebucket.s3.us-east-1.amazonaws.com/${product.productImage}`}
											alt="Product Image Miniature"
											width={60}
											height={10}
										/>
									</div>
									<div>
										<div>{product.productTitle}</div>
										<div>
											{product?.productPrice !==
												undefined && (
												<div>
													{`Custo da Troca: ${Number(
														product.productPrice
													).toLocaleString("pt-BR", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})} OP`}
												</div>
											)}
										</div>
									</div>
								</div>
								<hr className="bg-black" />
							</div>
						</div>
					</div>
				</div>
			</section>
			<div className="flex justify-center">
				{loadingButton ? (
					<button
						type="submit"
						className="btn btn-primary w-[200px] text-white">
						<span className="loading loading-spinner loading-md"></span>
					</button>
				) : (
					<button
						onClick={() =>
							swapOtaclubProcess(product, customerAddress)
						}
						className="flex flex-row items-center btn btn-primary w-[200px]">
						<RiSwap2Line size={20} />
						<span>Processar Troca</span>
					</button>
				)}
			</div>
		</div>
	);
}

export default CheckoutOtaclubPage;
