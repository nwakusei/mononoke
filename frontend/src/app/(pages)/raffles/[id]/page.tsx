"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Axios
import api from "@/utils/api";

// Components
import { LoadingPage } from "@/components/LoadingPageComponent";
import { MainImageRaffleComponent } from "@/components/MainImageRaffleComponent";
import { ImageCarouselRaffleComponent } from "@/components/ImageCarouselRaffleComponent";

// Icons
import { LuCalendarRange } from "react-icons/lu";
import { MdOutlineLocalActivity, MdOutlineStore } from "react-icons/md";
import { Peoples } from "@icon-park/react";
import { Coupon } from "@icon-park/react";
import Link from "next/link";

function RafflePage() {
	const [token] = useState(() => localStorage.getItem("token") || "");
	const [user, setUser] = useState(null); // Inicializa como null
	const { id } = useParams();
	const [raffle, setRaffle] = useState({});
	const [maximizedImageProduct, setMaximizedImageProduct] = useState(null);
	const [maximizedImage, setMaximizedImage] = useState(null);
	const [loadingBtn, setLoadingBtn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const router = useRouter();

	const [showAgeModal, setShowAgeModal] = useState(true); // Controle inicial do modal

	const [selectedImage, setSelectedImage] = useState({
		type: "raffle", // 'product' ou 'variation'
		variationIndex: 0, // Índice da variação (por exemplo, cor ou tamanho)
		index: 0, // Índice da opção dentro da variação
	});

	// Função para alterar a imagem ao clicar em uma miniatura
	const handleThumbnailClick = (index) => {
		setSelectedImage({ type: "carousel", index });
	};

	useEffect(() => {
		if (!id) return;

		const fetchData = async () => {
			try {
				// // Faz o lookup para obter o ID correspondente à slug
				// const response = await api.get(`/products/convert/${slug}`);
				// const id = response.data.id;

				// Busca os dados do produto
				const rafflePromise = api.get(`/raffles/get-raffle/${id}`);

				// Busca os dados do usuário, se o token estiver presente
				const userPromise = token
					? api.get("/mononoke/check-user", {
							headers: {
								Authorization: `Bearer ${JSON.parse(token)}`,
							},
					  })
					: Promise.resolve({ data: null }); // Se não estiver logado, retorna uma resposta "vazia" para o usuário

				// Aguarda todas as promessas
				const [raffleResponse, userResponse] = await Promise.all([
					rafflePromise,
					userPromise,
				]);

				// Atualiza os estados com os dados obtidos
				setRaffle(raffleResponse.data.raffle);
				// Se o usuário estiver logado, atualiza os dados do usuário
				if (userResponse.data) {
					setUser(userResponse.data);
				}

				// Verifica se o produto é adulto e se o usuário pode ou não visualizar o conteúdo
				const shouldShowModal =
					raffleResponse.data.raffle.adultRaffle === true &&
					(!userResponse.data ||
						userResponse.data.viewAdultContent === false);

				setShowAgeModal(shouldShowModal);
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setIsLoading(false); // Encerra o estado de carregamento
			}
		};

		setIsLoading(true); // Ativa o estado de carregamento antes de iniciar a busca
		fetchData();
	}, [token, id]);

	useEffect(() => {
		const fetchRaffle = async () => {
			try {
				const response = await api.get(`/raffles/get-raffle/${id}`);
				setRaffle(response.data.raffle);
				setIsLoading(false);
			} catch (error) {
				console.error("Error fetching product:", error);
			}
		};

		fetchRaffle();
	}, [id]);

	const handleOpenImagesProduct = (image) => {
		setMaximizedImageProduct(image);
	};

	const handleCloseImagesProduct = () => {
		setMaximizedImageProduct(null);
	};

	async function handleSubmit() {
		setLoadingBtn(true);
		try {
			await api
				.post(`/raffles/subscription/${id}`, {
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				})
				.then((responser) => {
					Swal.fire({
						title: responser.data.message,
						width: 800,
						icon: "success",
					});
				});
		} catch (error: any) {
			console.log(error);
			Swal.fire({
				title: error.response.data.message,
				width: 800,
				icon: "error",
			});
		}
		setLoadingBtn(false);
	}

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<>
			{/* Modal de aviso +18 */}
			{showAgeModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-lg">
						<h2 className="text-black text-xl font-semibold mb-4">
							Conteúdo +18
						</h2>
						<p className="text-gray-600 mb-6">
							Este conteúdo é destinado apenas para maiores de 18
							anos. Você confirma que possui mais de 18 anos?
						</p>
						<div className="flex gap-4 justify-center">
							<button
								onClick={() => setShowAgeModal(false)} // Atualiza estado para fechar modal
								className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary transition">
								Sim, tenho mais de 18
							</button>
							<button
								onClick={() => router.push("/raffles")}
								className="px-4 py-2 bg-error text-white rounded hover:bg-red-600 transition">
								Não
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Conteúdo da página */}
			<section
				className={`min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4 ${
					showAgeModal ? "blur-sm pointer-events-none" : "blur-none"
				}`}>
				<div className="bg-white rounded-md shadow-md p-4 flex flex-col gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mt-8">
					<div className="flex flex-row gap-8">
						{/* Componente de Imagem Principal */}

						<div className="flex flex-col">
							<MainImageRaffleComponent
								selectedImage={selectedImage}
								raffle={raffle}
							/>

							{/* Pequenas imagens */}
							<ImageCarouselRaffleComponent
								raffle={raffle}
								handleThumbnailClick={handleThumbnailClick}
								selectedImage={selectedImage}
							/>
						</div>

						{/* Componente intermediário */}
						<div className="flex flex-col w-[650px] text-black">
							<div className="text-white w-full bg-primary text-center text-lg py-1 mb-4 rounded-md select-none">
								Detalhes do Sorteio
							</div>
							<div className="flex flex-col">
								<h1 className="text-xl font-semibold mb-4">
									{raffle?.rafflePrize}
								</h1>
								<div className="flex flex-row items-center gap-2">
									{/* <MdOutlineLocalActivity
								className="mt-[1px]"
								size={19}
							/> */}
									<Coupon size={17} />
									<span>
										{`Custo do Ticket: ${raffle?.raffleCost.toLocaleString(
											"pt-BR",
											{
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											}
										)} OP`}
									</span>
								</div>
								<div className="flex flex-row items-center gap-2">
									<Peoples size={17} />
									<span>
										{`Mínimo de Participantes: ${raffle?.minNumberParticipants}`}
									</span>
								</div>
								<div className="flex flex-row items-center gap-2">
									<LuCalendarRange size={16} />

									<span>
										{`Data do Sorteio: ${
											raffle?.raffleDate
												? format(
														new Date(
															raffle?.raffleDate
														),
														"dd/MM/yyy"
												  )
												: ""
										}`}
									</span>
								</div>

								<div className="flex flex-row items-center gap-2">
									{/* <BsPeopleFill size={17} /> */}
									<MdOutlineLocalActivity size={19} />
									<span>
										{`Tickets Registrados: ${raffle?.registeredTickets.length}`}
									</span>
								</div>

								<div className="flex flex-row items-center gap-2 mb-4">
									<MdOutlineStore size={18} />
									<div className="flex flex-row gap-1">
										<span>Organizado por:</span>
										<Link
											className="text-primary transition-all ease-in duration-200 hover:text-secondary active:scale-[.97] cursor-pointer"
											href={`/otamart/store/${raffle?.raffleOrganizerNickname}`}>
											{raffle?.raffleOrganizer}
										</Link>
									</div>
								</div>
								<div className="">
									<p className="whitespace-pre-wrap break-words mb-2">
										<span className="font-semibold">
											Descrição:
										</span>{" "}
										{raffle?.raffleDescription}
									</p>
								</div>
								<div className="divider divider-primary">E</div>
								<div className="">
									<p className="whitespace-pre-wrap break-words">
										<span className="font-semibold">
											Regras:
										</span>{" "}
										{raffle?.raffleRules}
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="flex flex-row justify-center">
						{loadingBtn ? (
							<button className="flex flex-row justify-center items-center w-[250px] btn btn-primary shadow-md">
								<span className="loading loading-spinner loading-md"></span>
							</button>
						) : (
							<button
								onClick={handleSubmit}
								className="w-[250px] btn btn-primary shadow-md disabled:bg-gray-400 disabled:text-gray-500"
								disabled={
									raffle.winner &&
									Object.keys(raffle.winner).length > 0
								}>
								Inscrever-se
							</button>
						)}
					</div>
				</div>

				{/* Descrição do produto*/}
				<div className="bg-white rounded-md shadow-md gap-8 col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-8">
					{/* Descrição e Detalhes*/}
					<div className="flex flex-col">
						<div className="w-full bg-primary text-center text-xl py-2 rounded-t-md shadow-md select-none">
							Vencedor do Sorteio
						</div>
						{raffle?.winner ? (
							<>
								<div className="flex flex-row justify-center my-4 mx-4 gap-2">
									<div className="border-[1px] border-black border-opacity-20 bg-white flex flex-row justify-center p-2 rounded-md shadow-md gap-2">
										<div className="w-[100px] h-[100px]">
											<Image
												className="object-contain w-full h-full pointer-events-none rounded-md shadow-md"
												src={`http://localhost:5000/images/customers/${raffle.winner.customerProfileImage}`}
												alt="Vencedor"
												width={260}
												height={130}
												unoptimized
											/>
										</div>
										<div className="flex flex-col">
											<h1 className="text-black font-semibold">
												{`Nome: ${raffle?.winner.customerName}`}
											</h1>
											<h2 className="text-black">
												{`Ticket Sorteado: ${raffle?.winner.ticketNumber}`}
											</h2>
										</div>
									</div>
								</div>
							</>
						) : (
							<>
								<p className="my-2 text-black text-center mb-4">
									Este sorteio ainda não foi realizado!
								</p>
							</>
						)}
					</div>
				</div>
			</section>
		</>
	);
}

export default RafflePage;
