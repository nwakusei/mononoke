"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import Swal from "sweetalert2";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// Axios
import api from "@/utils/api";

// Icons
import { Coupon } from "@icon-park/react";
import { BsPersonFill } from "react-icons/bs";
import { LuCalendarRange, LuPackage, LuPackageCheck } from "react-icons/lu";
import { MdOutlineLocalActivity, MdOutlineStore } from "react-icons/md";
import { toast } from "react-toastify";
import { GrMapLocation } from "react-icons/gr";

// React Hook Form, Zod e ZodResolver
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const updateTrackingForm = z.object({
	logisticOperator: z
		.string()
		.min(1, "※ O operador logístico é obrigatório!")
		.trim()
		.refine((value) => value !== "", {
			message: "※ Item obrigatório!",
		}),
	trackingCode: z
		.string()
		.min(1, "※ O código de rastreio é obrigatório!")
		.trim()
		.toUpperCase()
		.refine(
			(tCode) => {
				const sanitized = DOMPurify.sanitize(tCode);

				const isValid = /^[A-Za-z0-9]+$/.test(sanitized); // Verificar se é alfanumérico

				return isValid;
			},
			{
				message: "※ O código possui caracteres inválidos!",
			}
		),
});

type TUpdateTrackingForm = z.infer<typeof updateTrackingForm>;

function MyRafflesByID() {
	const [myraffle, setMyraffle] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");
	const { id } = useParams();
	const [loadingBtn, setLoadingBtn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [packedLoading, setPackedLoading] = useState(false);
	const [trackingLoading, setTrackingLoading] = useState(false);

	const [counter, setCounter] = useState(5);
	const [raffleStatus, setRaffleStatus] = useState("not_started");

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TUpdateTrackingForm>({
		resolver: zodResolver(updateTrackingForm),
	});

	// Fetch inicial dos dados do sorteio
	useEffect(() => {
		fetchRaffleData();
	}, [id, token]);

	// Atualiza o estado de myraffle
	const fetchRaffleData = async () => {
		try {
			const response = await api.get(`/raffles/partner-raffle/${id}`, {
				headers: {
					Authorization: `Bearer ${JSON.parse(token)}`,
				},
			});

			const raffleData = response.data.raffle;
			setMyraffle(raffleData);
			setIsLoading(false);

			// Determinar status com base em winner
			if (raffleData.winner) {
				setRaffleStatus("completed");
			}
		} catch (error) {
			console.error("Erro ao buscar dados do sorteio:", error);
		}
	};

	// Controlar contador e atualização de status
	useEffect(() => {
		if (raffleStatus === "countdown" && counter > 0) {
			const intervalId = setInterval(() => {
				setCounter((prevCounter) => prevCounter - 1);
			}, 1000);

			return () => clearInterval(intervalId);
		} else if (raffleStatus === "countdown" && counter === 0) {
			fetchRaffleData(); // Atualiza os dados do sorteio
			setRaffleStatus("completed"); // Define o status como concluído

			// Exibir alerta após o sorteio ser realizado
			Swal.fire({
				title: "Sorteio realizado com sucesso!",
				text: `O vencedor foi: ${
					myraffle?.winner?.customerName || "Desconhecido"
				}`,
				width: 900,
				icon: "success",
				customClass: {
					confirmButton: "swal2-custom-confirm",
				},
			});
		}
	}, [counter, raffleStatus]);

	// Handler para realizar o sorteio
	async function handleDraw() {
		if (raffleStatus === "completed") {
			Swal.fire({
				title: "Este sorteio já foi realizado!",
				icon: "info",
				width: 800,
			});
			return;
		}

		setLoadingBtn(true);
		try {
			const response = await api.post(`raffles/sorteio/${id}`, {
				headers: {
					Authorization: `Bearer ${JSON.parse(token)}`,
				},
			});

			setCounter(5);
			setRaffleStatus("countdown");

			// Swal.fire({
			// 	title: response.data.message,
			// 	width: 800,
			// 	icon: "success",
			// });
		} catch (error: any) {
			console.error(error);
			Swal.fire({
				title:
					error.response?.data?.message || "Erro ao realizar sorteio",
				width: 800,
				icon: "error",
			});
		}
		setLoadingBtn(false);
	}

	async function handlePacked() {
		setPackedLoading(true);
		try {
			const response = await api.patch(`/raffles/mark-packed/${id}`);

			// Atualizar o estado localmente para refletir a mudança no status
			setMyraffle((prevMysale) => ({
				...prevMysale,
				statusShipping: "Embalado", // Alteração do status local
			}));

			toast.success(response.data.message);
		} catch (error: any) {
			console.log(error);
			toast.error(error.response.data.message);
		}
		setPackedLoading(false);
	}

	async function handleTracking(data) {
		const logisticOperator = data.logisticOperator;
		const trackingCode = data.trackingCode;

		setTrackingLoading(true);
		try {
			const response = await api.patch(
				`/raffles/raffle-update-trackingcode/${id}`,
				{ logisticOperator, trackingCode },
				{ headers: { Authorization: `Bearer ${JSON.parse(token)}` } }
			);

			// Atualiza o estado local do pedido
			setMyraffle((prevMysale) => ({
				...prevMysale,
				statusShipping: "Enviado",
				trackingCode: trackingCode, // Certifique-se de que está sendo atualizado corretamente
			}));

			toast.success(response.data.message);
		} catch (error) {
			toast.error(error.response.data.message);
			console.error("Erro ao atualizar o código de rastreamento:", error);
		}
		setTrackingLoading(false);
	}

	async function handleDelivered() {
		setPackedLoading(true);
		try {
			const response = await api.patch(
				`/raffles/raffle-mark-delivered/${id}`
			);

			// Atualizar o estado localmente para refletir a mudança no status
			setMyraffle((prevMysale) => ({
				...prevMysale,
				statusShipping: "Entregue", // Alteração do status local
			}));

			toast.success(response.data.message);
		} catch (error: any) {
			console.log(error);
			toast.error(error.response.data.message);
		}
		setPackedLoading(false);
	}

	// const handleInfo = () => {
	// 	Swal.fire({
	// 		title: "Prazo de resolução expirado",
	// 		text: "O prazo de 3 dias para resolver o problema expirou. Cancele o pedido e reembolse os participantes do sorteio, do contrário faremos isso por você!",
	// 		icon: "warning",
	// 		width: 700,
	// 		confirmButtonText: "Cancelar Pedido",
	// 		confirmButtonColor: "#b81414", // vermelho padrão
	// 	}).then((result) => {
	// 		if (result.isConfirmed) {
	// 			handleCancelOrder(myraffle?._id);
	// 		}
	// 	});
	// };

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4 mb-4">
				<div className="flex flex-row gap-8 bg-white ml-4 mr-8 rounded-md shadow-md">
					{/* Dados do Sorteio */}
					<div className="flex flex-col py-4 pl-4">
						<div className="border-[1px] border-black border-opacity-20 bg-white w-[402px] rounded-md relative shadow-lg">
							<div className="h-[402px] flex items-center justify-center mx-3 my-2">
								{myraffle?.imagesRaffle?.length > 0 && (
									<Image
										className="object-contain h-full pointer-events-none"
										src={`http://localhost:5000/images/raffles/${myraffle.imagesRaffle[0]}`}
										alt={
											myraffle?.productTitle ||
											"Imagem Principal do Sorteio!"
										}
										width={280}
										height={10}
										unoptimized
									/>
								)}
							</div>
						</div>
					</div>

					<div className="flex flex-col w-[640px] text-black py-4 pr-4">
						<div className="text-white w-full bg-primary text-center text-lg py-1 mb-4 rounded-md select-none">
							Detalhes do Sorteio
						</div>
						<h1 className="text-xl font-semibold mb-4">
							{myraffle?.rafflePrize}
						</h1>
						<div className="flex flex-row items-center gap-2">
							<Coupon size={17} />
							<span>
								{`Valor do Ticket: ${myraffle?.raffleCost?.toLocaleString(
									"pt-BR",
									{
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									}
								)} OP`}
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<BsPersonFill size={17} />
							<span>
								{`Mínimo de Participantes: ${myraffle?.minNumberParticipants}`}
							</span>
						</div>
						<div className="flex flex-row items-center gap-2">
							<LuCalendarRange size={16} />
							<span>
								{`Data do Sorteio: ${
									myraffle?.raffleDate
										? format(
												new Date(myraffle.raffleDate),
												"dd/MM/yyy"
										  )
										: ""
								}`}
							</span>
						</div>

						<div className="flex flex-row items-center gap-2 mb-4">
							{/* <BsPeopleFill size={17} /> */}
							<MdOutlineLocalActivity size={19} />
							<span>
								{`Tickets Registrados: ${myraffle?.registeredTickets.length}`}
							</span>
						</div>

						<div className="">
							<p className="whitespace-pre-wrap break-words mb-2">
								<span className="font-semibold"></span>
								{`Descrição: ${myraffle?.raffleDescription}`}
							</p>
						</div>
						<div className="divider">E</div>
						<div className="">
							<p className="whitespace-pre-wrap break-words mb-2">
								<span className="font-semibold"></span>
								{`Regras: ${myraffle?.raffleRules}`}
							</p>
						</div>
					</div>
				</div>

				{/* Vencedor */}
				<div className="flex flex-col bg-white rounded-md shadow-md mt-4 ml-4 mr-8">
					<div className="w-full bg-primary text-center text-xl py-2 rounded-t-md shadow-md select-none">
						Vencedor do Sorteio
					</div>
					{raffleStatus === "completed" &&
					myraffle?.winner &&
					myraffle?.winner.address ? (
						<div className="flex flex-row">
							<div className="my-4 mx-4 gap-2">
								<div className="flex flex-row w-[400px] h-[120px] border-[1px] border-black border-opacity-20 bg-white py-2 px-4 rounded-md shadow-md gap-2">
									<div className="w-[100px] h-[100px]">
										<Image
											className="object-contain w-full h-full pointer-events-none rounded shadow-md"
											src={`http://localhost:5000/images/customers/${myraffle.winner.customerProfileImage}`}
											alt="Vencedor"
											width={260}
											height={130}
											unoptimized
										/>
									</div>
									<div className="flex flex-col">
										<div className="text-black">{`Nickname: ${myraffle?.winner.customerNickname}`}</div>
										<h1 className="text-black">
											{`Nome: ${myraffle?.winner.customerName}`}
										</h1>
										<h2 className="text-black">
											{`Ticket Sorteado: ${myraffle?.winner.ticketNumber}`}
										</h2>
									</div>
								</div>
							</div>

							<div className="my-4 mx-4 gap-2">
								<div className="w-[400px] min-h-[170px] flex flex-col border-[1px] border-black border-opacity-20 bg-white text-black py-2 px-4 rounded-md shadow-md gap-2">
									<div className="font-semibold">
										Endereço de Entrega
									</div>

									<div className="flex flex-col text-black">
										<h1>{`Rua/Avenida: ${myraffle.winner.address.street}`}</h1>
										<h2>{`Complemento: ${myraffle.winner.address.complement}`}</h2>
										<h2>{`Bairro: ${myraffle.winner.address.neighborhood}`}</h2>
										<h2>{`Cidade/Estado: ${myraffle.winner.address.city}/${myraffle.winner.address.state}`}</h2>
										<h2>{`CEP: ${myraffle.winner.address.postalCode}`}</h2>
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-row justify-center text-black">
							<div className="flex flex-col items-center gap-2">
								<p className="my-2 text-black text-center">
									{raffleStatus === "countdown"
										? "Realizando o sorteio..."
										: "Este sorteio ainda não foi realizado!"}
								</p>
								{raffleStatus === "countdown" && (
									<span className="countdown font-mono text-6xl mb-4">
										<span
											style={{
												["--value" as any]: counter,
											}}></span>
									</span>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Detalhamento dos valores */}
				<div className="flex flex-col bg-white rounded-md shadow-md mt-4 ml-4 mr-8">
					{raffleStatus === "completed" &&
						myraffle?.winner &&
						myraffle?.winner.address && (
							<>
								<div className="w-full bg-primary text-center text-xl py-2 rounded-t-md shadow-md select-none">
									Detalhamento
								</div>
								<div className="overflow-x-auto text-black">
									<table className="table mb-8">
										{/* head */}
										<thead>
											<tr>
												<th className="text-sm text-black">
													Prêmio do Cliente
												</th>
												<th className="text-sm text-black">
													Custo por Ticket
												</th>
												<th className="text-sm text-black">
													Quantidade
												</th>

												{/* <th className="text-sm text-black">
												Total
											</th> */}
											</tr>
										</thead>
										<tbody>
											{/* row 1 */}
											<tr key={myraffle._id}>
												<td>
													<div className="flex items-center gap-3 mb-2">
														<div>
															<div className="w-[60px] pointer-events-none">
																<Image
																	src={`http://localhost:5000/images/raffles/${myraffle.imagesRaffle[0]}`}
																	alt={
																		myraffle.rafflePrize
																	}
																	width={280}
																	height={10}
																	unoptimized
																/>
															</div>
														</div>
														<div>
															<div className="font-bold">
																<h2 className="w-[230px] overflow-x-hidden mb-2">
																	{
																		myraffle.rafflePrize
																	}
																</h2>
															</div>
														</div>
													</div>
												</td>

												<td>
													<div>
														{`${myraffle.raffleCost.toLocaleString(
															"pt-BR",
															{
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															}
														)} OP`}
													</div>
												</td>
												<td>
													<div>1 un</div>
												</td>
												{/* <td className="w-[200px] overflow-x-auto">
												{`${myraffle.raffleCost.toLocaleString(
													"pt-BR",
													{
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													}
												)} OP`}
											</td> */}
											</tr>
										</tbody>
									</table>

									{/* Valores totais */}
									<table className="table mb-8">
										{/* head */}
										<thead>
											<tr>
												<th className="text-sm text-black">
													Subtotal do Pedido (Total
													Acumulado)
												</th>
												<th className="text-sm text-black">
													Total do Frete
												</th>
												{/* <th className="text-sm text-black">
												Total do Pedido
											</th> */}
											</tr>
										</thead>
										<tbody>
											{/* row 1 */}

											<tr>
												<td>
													{`${myraffle.raffleAccumulatedValue.toLocaleString(
														"pt-BR",
														{
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														}
													)} OP`}
												</td>
												<td>
													<div>Por sua conta</div>
												</td>

												{/* <td>
												<div>Outro Valor</div>
											</td> */}
											</tr>
										</tbody>
									</table>

									{/* A RECEBER */}
									<table className="table">
										{/* head */}
										<thead>
											<tr>
												<th className="text-sm text-black">
													Comissão a ser Paga
												</th>
												<th className="text-sm text-black">
													A receber pelo Sorteio
												</th>
											</tr>
										</thead>
										<tbody>
											{/* row 1 */}
											<tr>
												<td>
													<div>
														{`${myraffle.rafflePartnerCommission.toLocaleString(
															"pt-BR",
															{
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															}
														)} OP`}
													</div>
												</td>

												<td>
													{`${(
														myraffle.raffleAccumulatedValue -
														myraffle.rafflePartnerCommission
													).toLocaleString("pt-BR", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})} OP`}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</>
						)}
				</div>

				<div className="flex flex-col bg-white rounded-md shadow-md mt-4 ml-4 mr-8">
					<div className="w-full bg-primary text-center text-xl py-2 rounded-t-md shadow-md select-none mb-6">
						Logística
					</div>

					<div className="ml-4 text-black">{`Status de Envio: ${
						myraffle?.statusShipping !== ""
							? myraffle?.statusShipping
							: "A definir"
					}`}</div>

					<div className="ml-4 text-black">
						{`Transportadora: ${
							myraffle?.logisticOperator !== undefined
								? myraffle?.logisticOperator
								: "A definir"
						}`}
					</div>

					{myraffle?.statusShipping === "Pending" &&
					myraffle?.trackingCode === "" ? (
						<div className="ml-4 mb-4">
							{packedLoading ? (
								<button className="btn btn-primary w-[300px]">
									<span className="loading loading-spinner loading-sm"></span>
								</button>
							) : (
								<button
									onClick={handlePacked}
									className="btn btn-primary w-[300px]">
									<LuPackage size={20} />
									<span>Marcar como embalado</span>
								</button>
							)}
						</div>
					) : (
						<></>
					)}

					{myraffle?.trackingCode !== "" && (
						<div className="flex flex-row items-center ml-4 mb-4 gap-2">
							<div className="text-black">Cod. de Rastreio:</div>
							<div className="bg-primary text-sm cursor-pointer transition-all ease-in duration-150 active:scale-[.95] rounded shadow-md px-2">
								{myraffle?.trackingCode}
							</div>
						</div>
					)}

					{myraffle?.statusShipping === "Packed" &&
						myraffle?.trackingCode === "" && (
							<form onSubmit={handleSubmit(handleTracking)}>
								<label className="form-control w-full max-w-xs mb-1">
									<select
										className={`select ${
											errors.logisticOperator
												? `select-error`
												: `select-success`
										} bg-slate-200 text-slate-900 w-full max-w-xs`}
										defaultValue=""
										{...register("logisticOperator")} // Registrar o select
									>
										<option value="" disabled>
											Qual é a transportadora?
										</option>
										<option value="Correios">
											Correios
										</option>
										<option value="Loggi">Loggi</option>
										<option value="Jadlog">Jadlog</option>
										<option value="J&T">J&T Express</option>
										<option value="Buslog">Buslog</option>
										<option value="Latam">
											Latam Cargo
										</option>
										<option value="Azul">
											Azul Cargo Express
										</option>
										<option value="Japan Post">
											Japan Post
										</option>
										<option value="DHL">DHL</option>
										<option value="FedEx">FedEx</option>
									</select>
									<div className="label">
										{errors.trackingCode && (
											<span className="label-text-alt text-error">
												{errors.trackingCode.message}
											</span>
										)}
									</div>
								</label>

								<label className="form-control w-full max-w-xs mb-2">
									{/* Input para código de rastreamento */}
									<input
										className={`input input-bordered ${
											errors.trackingCode
												? `input-error`
												: `input-success`
										} bg-slate-200 text-slate-900 w-full`}
										type="text"
										placeholder="Insira o código de Rastreio"
										{...register("trackingCode")} // Registrar o input
									/>

									{/* Exibir erro de validação do código de rastreamento */}
									<div className="label">
										{errors.trackingCode && (
											<span className="label-text-alt text-error">
												{errors.trackingCode.message}
											</span>
										)}
									</div>
								</label>

								<div>
									{trackingLoading ? (
										<button className="btn btn-primary w-[300px]">
											<span className="loading loading-spinner loading-sm"></span>
										</button>
									) : (
										<button
											type="submit"
											className="btn btn-primary w-[300px] shadow-md">
											Enviar Código de Rastreio
											<GrMapLocation size={20} />
										</button>
									)}
								</div>
							</form>
						)}

					{myraffle?.statusShipping === "Shipped" && (
						<div className="mt-4 mb-2">
							{packedLoading ? (
								<button className="btn btn-primary w-[300px]">
									<span className="loading loading-spinner loading-sm"></span>
								</button>
							) : (
								<button
									onClick={handleDelivered}
									className="btn btn-primary w-[300px]">
									<LuPackageCheck size={20} />
									<span>Marcar como entregue</span>
								</button>
							)}
						</div>
					)}

					{myraffle?.statusShipping === "Not Delivered" && (
						<div className="bg-white w-[325px] p-6 border-2 border-dashed border-violet-900 rounded-md shadow-md mt-4 flex flex-col gap-2 mb-4">
							<p className="text-base font-semibold text-black mb-2">
								Pedido marcado como não entregue, verifique
								junto a transportadora o que ocorreu. Em caso de
								extravio, cancele o pedido e reembolse o
								comprador. Você tem 3 dias para resolver o
								problema.
							</p>

							{/* <button className="bg-primary py-1 rounded shadow-md cursor-pointer transition-all ease-in duration-200 active:scale-[.97] mb-2">
                                        Pedido encontrado e entregue
                                      </button> */}

							{(() => {
								const updatedAt = new Date(myraffle.updatedAt);
								const now = new Date();
								const diffInMs =
									now.getTime() - updatedAt.getTime();
								const diffInDays =
									diffInMs / (1000 * 60 * 60 * 24);

								if (diffInDays >= 3) {
									return (
										<button
											onClick={handleInfo}
											className="bg-primary py-1 rounded shadow-md cursor-pointer transition-all ease-in duration-200 active:scale-[.97]">
											Prazo de resolução expirado
										</button>
									);
								}

								return null;
							})()}
						</div>
					)}
				</div>

				{/* Botão */}
				<div className="flex flex-row justify-center mt-8">
					{loadingBtn ? (
						<button className="flex flex-row justify-center items-center w-[250px] btn btn-primary shadow-md">
							<span className="loading loading-spinner loading-md"></span>
						</button>
					) : (
						<button
							onClick={handleDraw}
							className="w-[250px] btn btn-primary shadow-md disabled:bg-gray-400 disabled:text-gray-500"
							disabled={raffleStatus === "completed"}>
							Sortear
						</button>
					)}
				</div>
			</div>
		</section>
	);
}

export default MyRafflesByID;
