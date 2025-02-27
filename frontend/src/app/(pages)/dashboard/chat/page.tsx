"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";

import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale"; // Localização para Português

// Axios
import api from "@/utils/api";

// Style Sheet
import "./chat.css";

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos

// Icons
import { NewPicture, SendOne } from "@icon-park/react";
import { IoIosSearch } from "react-icons/io";
import { BsCheck2All, BsCheck2, BsChatSquareText } from "react-icons/bs";
import { IoIosArrowDown } from "react-icons/io";
import { HiOutlineEllipsisVertical } from "react-icons/hi2";
import { LoadingPage } from "@/components/LoadingPageComponent";

function ChatPage() {
	const inputFileRef = useRef(null);
	const [message, setMessage] = useState("");
	const [selectedImage, setSelectedImage] = useState(null);
	const [isTyping, setIsTyping] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState({});
	const [chats, setChats] = useState([]);
	const [chat, setChat] = useState({});
	const [imageMessage, setImageMessage] = useState<File | null>(null);
	const [sendButtonLoading, setSendButtonLoading] = useState(false);
	const isImage = (msg) => {
		// Verifica se o sufixo da mensagem corresponde a uma imagem
		return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(msg);
	};

	useEffect(() => {
		if (chat) {
			// Garante que o scroll vá para o final quando o chat for aberto
			const chatMessagesContainer =
				document.querySelector(".chat-messages");
			if (chatMessagesContainer) {
				// Move o scroll para o final, sem inverter as mensagens
				chatMessagesContainer.scrollTop =
					chatMessagesContainer.scrollHeight;
			}
		}
	}, [chat?.messages]);

	const [searchName, setSearchName] = useState("");
	const [returnedChat, setReturnedChat] = useState({});

	function formatTime(updatedAt: string): string {
		const updatedDate = new Date(updatedAt);
		const now = new Date();

		const differenceInHoursValue = differenceInHours(now, updatedDate);

		if (differenceInHoursValue < 24) {
			// Mostrar diferença em tempo relativo (ex: "15 minutos atrás")
			return formatDistanceToNow(updatedDate, {
				addSuffix: true,
				locale: ptBR,
			});
		} else {
			// Mostrar a data no formato "dd/MM/yyyy"
			return format(updatedDate, "dd/MM", { locale: ptBR });
		}
	}

	useEffect(() => {
		if (!token) return;

		const fetchData = async () => {
			try {
				// Verifica o usuário
				const userResponse = await api.get("/otakuprime/check-user", {
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				});

				const userData = userResponse.data;
				setUser(userData);

				// Busca os chats do usuário
				const responseChats = await api.get(`/chats/get-chats-by-user`);
				setChats(responseChats.data.chats);
			} catch (error) {
				console.log(error);
			} finally {
				// Garante que o loading será atualizado independentemente do sucesso
				setIsLoading(false);
			}
		};

		fetchData();
	}, [token]);

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

	const handleGetChat = async (chatID) => {
		if (!chatID) return;

		try {
			const response = await api.get(`/chats/get-chat/${chatID}`);

			setChat(response.data.chat);
		} catch (error) {
			console.log(error);
		}
	};

	console.log("CHAT INDIVIDUAL:", chat);

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
			setChat(response.data.chatFromClientToStore); // Atualiza o chat
		} catch (error: any) {
			toast.error(error.response.data.message);
			console.error("Erro ao enviar a mensagem:", error);
		} finally {
			setSendButtonLoading(false);
		}
	}

	const handleSearchChat = async (searchName) => {
		if (!searchName.trim()) return;

		try {
			const response = await api.post(`/chats/search-chat`, {
				searchName,
			});

			setReturnedChat(response.data.chat);
		} catch (error) {
			console.error("Erro ao enviar a mensagem:", error);
		}
	};

	console.log("QUE PORRA É ESSA?:", returnedChat.updatedAt);

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-row gap-4 mt-4 mb-4">
					{/* Gadget 2 */}
					<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4">
						{/* Outro Saldos */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<div className="flex flex-row items-center gap-4">
								<BsChatSquareText className="mt-1" size={18} />
								<h1 className="text-2xl font-semibold text-black">
									Chat App
								</h1>
							</div>
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
									placeholder="Pesquisar"
									className="input input-bordered input-success w-full max-w-xs"
									value={searchName}
									onChange={(e) =>
										setSearchName(e.target.value)
									}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											console.log(
												"Valor de searchName ao pressionar Enter:",
												searchName
											);
											handleSearchChat(searchName);
										}
									}}
								/>
								<div
									className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer transition-all ease-in duration-200 active:scale-[.97]"
									onClick={() => {
										console.log(
											"Valor de searchName ao clicar no ícone:",
											searchName
										);
										handleSearchChat(searchName);
									}}>
									<IoIosSearch size={22} />
								</div>
							</div>
						</div>
						<div className="flex flex-row items-center text-black gap-1 px-4 mb-2">
							<h1>Chats Recentes</h1>
							<IoIosArrowDown size={20} />
						</div>

						{returnedChat && returnedChat._id ? (
							<div
								onClick={() => handleGetChat(returnedChat._id)}
								key={returnedChat._id}
								className="flex flex-row justify-between items-center text-black hover:text-white hover:bg-[#8357e5] transition-all ease-in duration-200 cursor-pointer px-4 py-2 gap-3">
								<div className="flex flex-row items-center gap-2">
									<div className="avatar online">
										<div className="w-12 rounded-full">
											{returnedChat.userTwoAccountType ===
											"customer" ? (
												<Image
													className="object-contain w-[120px] pointer-events-none rounded shadow-md"
													src={`http://localhost:5000/images/customers/${returnedChat.userTwoProfileImage}`}
													alt="Chat Image"
													width={300}
													height={150}
													unoptimized
												/>
											) : (
												<Image
													className="object-contain w-[120px] pointer-events-none rounded shadow-md"
													src={`http://localhost:5000/images/partners/${returnedChat.userTwoProfileImage}`}
													alt="Chat Image"
													width={300}
													height={150}
													unoptimized
												/>
											)}
										</div>
									</div>
									<div>
										<h1 className="text-sm font-semibold">
											{returnedChat.userTwoNickname}
										</h1>
										<time className="text-xs">
											{formatTime(returnedChat.updatedAt)}
										</time>
									</div>
								</div>
								<div>
									<HiOutlineEllipsisVertical size={25} />
								</div>
							</div>
						) : (
							chats &&
							chats.length > 0 &&
							chats.map((chat) => (
								<div
									onClick={() => handleGetChat(chat._id)}
									key={chat._id}
									className="flex flex-row justify-between items-center text-black hover:text-white hover:bg-[#8357e5] transition-all ease-in duration-200 cursor-pointer px-4 py-2 gap-3">
									<div className="flex flex-row items-center gap-2">
										<div className="avatar online">
											<div className="w-12 rounded-full">
												{chat.userTwoAccountType ===
												"customer" ? (
													<Image
														className="object-contain w-[120px] pointer-events-none rounded shadow-md"
														src={`http://localhost:5000/images/customers/${chat.userTwoProfileImage}`}
														alt="Chat Image"
														width={300}
														height={150}
														unoptimized
													/>
												) : (
													<Image
														className="object-contain w-[120px] pointer-events-none rounded shadow-md"
														src={`http://localhost:5000/images/partners/${chat.userTwoProfileImage}`}
														alt="Chat Image"
														width={300}
														height={150}
														unoptimized
													/>
												)}
											</div>
										</div>
										<div>
											<h1 className="text-sm font-semibold">
												{chat.userTwoNickname}
											</h1>
											<time className="text-xs">
												{formatTime(chat.updatedAt)}
											</time>
										</div>
									</div>
									<div>
										<HiOutlineEllipsisVertical size={25} />
									</div>
								</div>
							))
						)}
					</div>
					<div>
						<div className="bg-white w-[900px] h-[95px] border border-gray-900 border-t-0 border-r-0 border-b-1 border-l-0 mr-4 p-6 rounded-tr-md">
							<div className="flex flex-row">
								<div className="flex flex-row items-center gap-2">
									<div className="avatar online">
										{chat.userTwoAccountType ===
										"customer" ? (
											<div className="w-12 rounded-full">
												<Image
													className="object-contain w-[120px] pointer-events-none rounded shadow-md"
													src={`http://localhost:5000/images/customers/${chat.userTwoProfileImage}`}
													alt="Chat Image"
													width={300}
													height={150}
													unoptimized
												/>
											</div>
										) : chat.userTwoAccountType ===
										  "partner" ? (
											<div className="w-12 rounded-full">
												<Image
													className="object-contain w-[120px] pointer-events-none rounded shadow-md"
													src={`http://localhost:5000/images/partners/${chat.userTwoProfileImage}`}
													alt="Chat Image"
													width={300}
													height={150}
													unoptimized
												/>
											</div>
										) : (
											<div />
										)}
									</div>
									<div>
										<div className="font-semibold text-black mb-1">
											{chat.userTwoNickname
												? chat.userTwoNickname
												: "Selecione um chat"}
										</div>
										{/* <div className="text-xs text-black">
											Online
										</div> */}
									</div>
								</div>
							</div>
						</div>
						<div className="chat-messages bg-white w-[900px] min-h-[300px] rounded-b-nome rounded-t-none p-6 mr-4">
							{chat && Array.isArray(chat.messages) ? (
								chat.messages.map((message, index) => (
									<div
										key={index}
										className={`chat ${
											chat.userOneID === message.senderID
												? "chat-start"
												: "chat-end"
										}`}>
										<div className="chat-image avatar">
											<div className="w-10 rounded-full">
												{chat.userOneID ===
												message.senderID ? (
													<Image
														className="object-contain w-[120px] pointer-events-none rounded shadow-md"
														src={`http://localhost:5000/images/${
															user.accountType ===
															"customer"
																? "customers"
																: "partners"
														}/${user.profileImage}`}
														alt="User Profile Image"
														width={300}
														height={150}
														unoptimized
													/>
												) : (
													<Image
														className="object-contain w-[120px] pointer-events-none rounded shadow-md"
														src={`http://localhost:5000/images/${
															chat.userTwoAccountType ===
															"customer"
																? "customers"
																: "partners"
														}/${
															chat.userTwoProfileImage
														}`}
														alt="Chat User Profile Image"
														width={300}
														height={150}
														unoptimized
													/>
												)}
											</div>
										</div>
										<div className="chat-header mb-1 text-black">
											{chat.userOneID === message.senderID
												? user.nickname
												: chat.userTwoNickname}
											<time className="ml-1 text-xs opacity-50">
												<time className="text-xs opacity-50 mt-1 mb-1">
													{`${new Intl.DateTimeFormat(
														"pt-BR",
														{
															hour: "2-digit",
															minute: "2-digit",
														}
													).format(
														new Date(
															message.timestamp
														)
													)} hs`}
												</time>
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
											<div className="chat-bubble bg-primary text-white break-words whitespace-pre-wrap">
												{message.message}
											</div>
										)}
										<div className="chat-footer opacity-50 text-xs text-black flex flex-row items-center gap-1">
											Entregue <BsCheck2 size={16} />
										</div>
									</div>
								))
							) : (
								<div>Nenhuma mensagem a ser exibida...</div>
							)}
						</div>
						<div
							className="bg-white w-[900px] border border-gray-900 border-t-1 border-r-0 border-b-0 border-l-0 mr-4 pt-1 pb-6 px-6 relative overflow-auto rounded-br-md"
							style={{
								// Defina a altura máxima desejada para ativar a barra de rolagem
								scrollbarWidth: "thin", // Tamanho da barra de rolagem (pode ser "auto" ou "thin")
								scrollbarColor: "dark", // Cor da barra de rolagem (pode ser "auto", "dark" ou "light")
							}}>
							{/* Área de edição de mensagem */}
							<form
								onSubmit={(e) => {
									e.preventDefault();
									handleSendMessage(
										chat.userTwoID,
										message,
										imageMessage
									);
								}}
								className="px-[16px] pb-[16px]">
								{imageMessage && (
									<>
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
									className="textarea w-full h-[100px] mt-2"
									placeholder="Digite a mensagem..."
									value={message}
									onChange={(e) =>
										setMessage(e.target.value)
									}></textarea>

								<div className="flex flex-row items-center gap-2">
									<label className="bg-blue-500 flex flex-col justify-center items-center w-[40px] h-[40px] transition-all ease-in duration-100 active:scale-[.97] rounded shadow-md mt-2 relative cursor-pointer">
										<NewPicture size={20} />
										<input
											type="file"
											accept="image/*"
											onChange={(e) =>
												setImageMessage(
													e.target.files[0]
												)
											}
											className="hidden"
										/>
									</label>

									{sendButtonLoading ? (
										<button
											disabled
											className="bg-blue-500 w-[100px] h-[40px] hover:active:scale-[.97] rounded shadow-md mt-2">
											<span className="loading loading-dots loading-sm"></span>
										</button>
									) : (
										<button className="flex flex-row justify-center items-center gap-2 bg-blue-500 w-[100px] h-[40px] transition-all ease-in duration-100 active:scale-[.97] rounded-md shadow-md mt-2">
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
