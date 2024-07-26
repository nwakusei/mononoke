"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos
import Otakuyasan from "../../../../../public/otakuyasan.png";
import Otakuyasan2 from "../../../../../public/otakuyasan2.png";
import Amora from "../../../../../public/amora.jpg";
import MundosInfinitos from "../../../../../public/mundos-infinitos.png";

// Icons
import {
	ShoppingCartOne,
	ShoppingBag,
	Coupon,
	PaymentMethod,
	Currency,
	Credit,
	Deposit,
	Expenses,
	Send,
} from "@icon-park/react";
import { GrChat } from "react-icons/gr";
import { LuSettings, LuQrCode } from "react-icons/lu";
import { RiAccountPinBoxLine } from "react-icons/ri";
import { MdOutlineWarehouse } from "react-icons/md";
import { BsShopWindow, BsChatSquareText } from "react-icons/bs";
import { GoArrowUpRight } from "react-icons/go";
import { PiHandHeartDuotone, PiChatCenteredText } from "react-icons/pi";
import { IoIosSearch } from "react-icons/io";
import { BsCheck2All, BsCheck2 } from "react-icons/bs";
import { IoImageOutline } from "react-icons/io5";
import { IoIosArrowDown } from "react-icons/io";
import { HiOutlineEllipsisVertical } from "react-icons/hi2";

function ChatPage() {
	const inputFileRef = useRef(null);
	const [message, setMessage] = useState("");
	const [selectedImage, setSelectedImage] = useState(null);
	const [isTyping, setIsTyping] = useState(false);

	const handleUseClientButtonClick = () => {
		inputFileRef.current.click();
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setSelectedImage(reader.result);
				setIsTyping(true);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleImageRemove = () => {
		setSelectedImage(null);
		setIsTyping(false);
	};

	const handleSendMessage = () => {
		// Implementar lógica para enviar a mensagem
	};
	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-row gap-4 mt-4 mb-4">
					{/* Gadget 2 */}
					<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4">
						{/* Outro Saldos */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold text-black">
								Chat App
							</h1>
							<h2 className="text-sm text-black">Messenger</h2>
						</div>
					</div>
				</div>
				<div className="flex flex-row">
					<div className="bg-white border border-gray-900 border-t-0 border-r-1 border-b-0 border-l-0 w-[330px] rounded-tl-md rounded-tr-none rounded-br-none rounded-bl-md">
						<div className="px-4 mt-4">
							<div className="relative mb-4">
								<input
									type="text"
									placeholder="Type here"
									className="input input-bordered input-success w-full max-w-xs"
								/>
								<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
									<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
										<IoIosSearch
											size={22}
											style={{ cursor: "pointer" }}
										/>
									</div>
								</div>
							</div>
						</div>
						<div className="flex flex-row items-center text-black gap-1 px-4 mb-2">
							<h1>Chats Recentes</h1>
							<IoIosArrowDown size={20} />
						</div>
						<div className="flex flex-row items-center text-black hover:text-white hover:bg-[#8357e5] transition-all ease-in duration-200 cursor-pointer px-4 py-2 gap-3">
							<div className="avatar online">
								<div className="w-12 rounded-full">
									<img
										alt="Tailwind CSS chat bubble component"
										src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
									/>
								</div>
							</div>
							<div className="flex flex-row justify-between items-center">
								<div>
									<h1 className="text-sm font-semibold">
										Reinaldo Guedes do Nascimento
									</h1>
									<h2 className="text-xs">17 minutos</h2>
								</div>
								<div>
									<HiOutlineEllipsisVertical size={25} />
								</div>
							</div>
						</div>
						<div className="flex flex-row items-center text-black hover:text-white hover:bg-[#8357e5] transition-all ease-in duration-200 cursor-pointer px-4 py-2 gap-3">
							<div className="avatar online">
								<div className="w-12 rounded-full">
									<img
										alt="Tailwind CSS chat bubble component"
										src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
									/>
								</div>
							</div>
							<div className="flex flex-row justify-between items-center">
								<div>
									<h1 className="text-sm font-semibold">
										Reinaldo Guedes do Nascimento
									</h1>
									<h2 className="text-xs">17 minutos</h2>
								</div>
								<div>
									<HiOutlineEllipsisVertical size={25} />
								</div>
							</div>
						</div>
						<div className="flex flex-row items-center text-black hover:text-white hover:bg-[#8357e5] transition-all ease-in duration-200 cursor-pointer px-4 py-2 gap-3">
							<div className="avatar online">
								<div className="w-12 rounded-full">
									<img
										alt="Tailwind CSS chat bubble component"
										src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
									/>
								</div>
							</div>
							<div className="flex flex-row justify-between items-center">
								<div>
									<h1 className="text-sm font-semibold">
										Reinaldo Guedes do Nascimento
									</h1>
									<h2 className="text-xs">17 minutos</h2>
								</div>
								<div>
									<HiOutlineEllipsisVertical size={25} />
								</div>
							</div>
						</div>
					</div>
					<div>
						<div className="bg-white w-[900px] border border-gray-900 border-t-0 border-r-0 border-b-1 border-l-0 mr-4 p-6 rounded-tr-md">
							<div className="flex flex-row">
								<div className="flex flex-row items-center gap-2">
									<div className="avatar online">
										<div className="w-12 rounded-full">
											<img
												alt="Tailwind CSS chat bubble component"
												src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
											/>
										</div>
									</div>
									<div>
										<div className="font-semibold text-black">
											Nome do Cliente
										</div>
										<div className="text-xs text-black">
											Online
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="bg-white w-[900px] rounded-b-nome rounded-t-none p-6 mr-4">
							<div className="chat chat-start">
								<div className="chat-image avatar">
									<div className="w-10 rounded-full">
										<img
											alt="Tailwind CSS chat bubble component"
											src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
										/>
									</div>
								</div>
								<div className="chat-header mb-1 text-black">
									Obi-Wan Kenobi
									<time className="ml-1 text-xs opacity-50">
										12:45 hs
									</time>
								</div>
								<div className="chat-bubble">
									You were the Chosen One!
								</div>
								<div className="chat-footer opacity-50 text-xs text-black flex flex-row items-center gap-1">
									Entregue <BsCheck2 size={16} />
								</div>
							</div>
							<div className="chat chat-end">
								<div className="chat-image avatar">
									<div className="w-10 rounded-full">
										<img
											alt="Tailwind CSS chat bubble component"
											src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
										/>
									</div>
								</div>
								<div className="chat-header mb-1 text-black">
									Anakin
									<time className="ml-1 text-xs opacity-50">
										12:46 hs
									</time>
								</div>
								<div className="chat-bubble">I hate you!</div>
								<div className="chat-footer opacity-50 text-xs text-black flex flex-row items-center gap-1">
									Visto às 12:46 hs <BsCheck2All size={16} />
								</div>
							</div>

							<div className="chat chat-end">
								<div className="chat-image avatar">
									<div className="w-10 rounded-full">
										<img
											alt="Tailwind CSS chat bubble component"
											src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
										/>
									</div>
								</div>
								<div className="chat-header mb-1 text-black">
									Anakin
									<time className="ml-1 text-xs opacity-50 text-black">
										12:46 hs
									</time>
								</div>
								<img
									className="w-[120px] rounded shadow-md "
									alt="Tailwind CSS chat bubble component"
									src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
								/>
								<div className="chat-footer opacity-50 text-xs text-black flex flex-row items-center gap-1">
									Visto às 12:46 hs <BsCheck2All size={16} />
								</div>
							</div>
						</div>
						<div
							className="bg-white w-[900px] border border-gray-900 border-t-1 border-r-0 border-b-0 border-l-0 mr-4 p-6 relative overflow-auto rounded-br-md"
							style={{
								// Defina a altura máxima desejada para ativar a barra de rolagem
								scrollbarWidth: "thin", // Tamanho da barra de rolagem (pode ser "auto" ou "thin")
								scrollbarColor: "dark", // Cor da barra de rolagem (pode ser "auto", "dark" ou "light")
							}}>
							{/* Área de edição de mensagem */}
							<div className="relative">
								<textarea
									className="w-full h-[155px] textarea textarea-bordered"
									placeholder={
										selectedImage || isTyping
											? ""
											: "Digite sua mensagem aqui..."
									}
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									disabled={
										!isTyping && !!selectedImage
									}></textarea>

								{/* Miniatura da imagem selecionada */}
								{selectedImage && (
									<div className="absolute inset-y-0 left-2 flex items-center">
										<div className="w-20 h-auto bg-white border border-gray-300 rounded overflow-hidden mr-2">
											<Image
												className="w-full h-full object-cover"
												src={selectedImage}
												alt="Selected Image"
												width={10}
												height={10}
											/>
										</div>
										<button
											onClick={handleImageRemove}
											className="text-red-500">
											&times;
										</button>
									</div>
								)}
							</div>
							{/* Botões de envio e anexo */}
							<div className="flex flex-row gap-2 mt-2">
								<button
									onClick={handleSendMessage}
									className="btn btn-primary flex justify-center items-center">
									<Send
										className="cursor-pointer"
										size={25}
									/>
								</button>
								{/* Botão "use client" */}
								<button
									onClick={handleUseClientButtonClick}
									className="btn btn-primary">
									<IoImageOutline size={25} />
								</button>
								{/* Input file oculto */}
								<input
									ref={inputFileRef}
									type="file"
									style={{ display: "none" }}
									onChange={handleImageChange}
								/>
							</div>
						</div>
					</div>
					{/* <div className="bg-purple-400 w-[300px] p-6 rounded-md mr-4">
						Lateral
					</div> */}
				</div>
			</div>
		</section>
	);
}

export default ChatPage;
