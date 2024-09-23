"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// React Hook Form e Zod
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const updateUserFormSchema = z
	.object({
		profileImage: z
			.instanceof(FileList)
			.transform((list) => list.item(0))
			.optional() // Torna a imagem opcional
			.refine(
				(file) => file === null || file!.size <= 2 * 1024 * 1024, // Verifica se é null ou se o tamanho está dentro do limite
				"O arquivo precisa ter no máximo 2Mb!"
			),
		// logoImage: z
		// 	.instanceof(FileList)
		// 	.transform((list) => list.item(0))
		// 	.optional()
		// 	.refine(
		// 		(file) => file === null || file!.size <= 2 * 1024 * 1024,
		// 		"O arquivo precisa ter no máximo 2Mb!"
		// 	),
		name: z
			.string()
			.min(1, "Digite o nome!")
			.transform((name) => {
				return name
					.toLocaleLowerCase()
					.trim()
					.split(" ")
					.map((word) => {
						return word[0]
							.toLocaleUpperCase()
							.concat(word.substring(1));
					})
					.join(" ");
			}),
		email: z
			.string()
			.min(1, "Informe um email válido!")
			.email("Formato de email inválido!")
			.toLowerCase(),
		cpfCnpj: z
			.string()
			.min(11, "Digite um documento válido!")
			.max(14, "CNPJ possui no máximo 14 digitos!"),
		// cpf: z
		// 	.string()
		// 	.min(11, "Digite um documento válido!")
		// 	.max(11, "CPF possui no máximo 11 digitos!"),
		description: z
			.string()
			.optional()
			.refine(
				(value) => {
					if (value === undefined || value === "") {
						return true;
					}

					return value.length >= 100 && value.length <= 150;
				},
				{
					message:
						"A descrição precisa ter entre 100 e 150 caracteres!",
				}
			),
		street: z.string().min(1, "Digite o nome da rua e o número!"),
		complement: z.string().optional(),
		neighborhood: z.string().min(1, "Digite o nome do bairro!"),
		city: z.string().min(1, "Digite o nome da cidade!"),
		state: z.string().min(1, "Informe o estado!"),
		postalCode: z.string().min(1, "Digite o número do CEP!"),
		credential: z.string().min(1, "Insira a credencial Kangu!"),
		cashback: z
			.string()
			.min(1, "O Cashback não pode ser vazio!")
			.refine((val) => !isNaN(Number(val)), {
				message: "O Cashback deve ser um número válido!",
			})
			.refine((val) => Number.isInteger(Number(val)), {
				message: "O Cashback deve ser um número inteiro!",
			})
			.refine((val) => Number(val) >= 1, {
				message: "O Cashback não pode ser menor do que 1%!",
			})
			.transform((val) => Number(val)), // Converte a string para número
		// description: z.string(),
		password: z
			.string()
			.optional()
			.refine(
				(value) => {
					if (value === undefined || value === "") {
						// Se o valor é undefined ou uma string vazia, a validação passa
						return true;
					}
					// Se o valor não for uma string vazia, deve ter pelo menos 6 caracteres
					return value.length >= 6;
				},
				{
					message: "A senha precisa ter no mínimo 6 caracteres!",
				}
			),
		confirmPassword: z.string().optional(),
	})
	.refine(
		(data) => {
			// Se password não for fornecida, não há necessidade de validar confirmPassword
			if (!data.password) {
				return true;
			}
			// Se password for fornecida, confirmPassword também deve ser fornecida e ser igual a password
			return data.password === data.confirmPassword;
		},
		{
			message: "As senhas precisam ser iguais!",
			path: ["confirmPassword"], // Define o caminho onde o erro será exibido
		}
	);

type TUpdateUserFormData = z.infer<typeof updateUserFormSchema>;

// Axios
import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Icons
import { AddPicture, Key } from "@icon-park/react";
import { FiInfo } from "react-icons/fi";

function MyProfilePage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState({});
	const [imagemSelecionadaProfile, setImagemSelecionadaProfile] =
		useState(null);
	const [imagemSelecionadaLogo, setImagemSelecionadaLogo] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [loadingButton, setLoadingButton] = useState(false);
	const router = useRouter();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TUpdateUserFormData>({
		resolver: zodResolver(updateUserFormSchema),
	});

	const [output, setOutput] = useState("");

	useEffect(() => {
		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setUser(response.data);
			setIsLoading(false);
		});
	}, [token]);

	const handleImagemSelecionada = (event, setImageFunction) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				setImageFunction(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	// async function updateUser(data: TUpdateUserFormData) {
	// 	console.log(data.profileImage);

	// 	setOutput(JSON.stringify(data, null, 2));

	// 	try {
	// 		if (user?.accountType === "partner") {
	// 			const name = e.target.name.value;
	// 			const cashback = e.target.cashback.value;
	// 			const email = e.target.email.value;
	// 			const cpfCnpj = e.target.cpfCnpj.value;

	// 			const logradouro = e.target.logradouro.value;
	// 			const complemento = e.target.complemento.value;
	// 			const bairro = e.target.bairro.value;
	// 			const cidade = e.target.cidade.value;
	// 			const uf = e.target.uf.value;
	// 			const cep = e.target.cep.value;

	// 			const address = {
	// 				logradouro: logradouro,
	// 				complemento: complemento,
	// 				bairro: bairro,
	// 				cidade: cidade,
	// 				uf: uf,
	// 				cep: cep,
	// 			};

	// 			const password = e.target.password.value;
	// 			const confirmPassword = e.target.confirmPassword.value;

	// 			const response = await api.patch("/partners/edit", {
	// 				name: name,
	// 				cashback: cashback,
	// 				email: email,
	// 				cpfCnpj: cpfCnpj,
	// 				address: address,
	// 				password: password,
	// 				confirmPassword: confirmPassword,
	// 			});

	// 			Swal.fire({
	// 				title: response.data.message,
	// 				width: 900,
	// 				icon: "success",
	// 			});

	// 			console.log(response.data);
	// 		} else if (user?.accountType === "customer") {
	// 			const name = e.target.name.value;
	// 			const email = e.target.email.value;
	// 			const cpf = e.target.cpf.value;

	// 			const logradouro = e.target.logradouro.value;
	// 			const complemento = e.target.complemento.value;
	// 			const bairro = e.target.bairro.value;
	// 			const cidade = e.target.cidade.value;
	// 			const uf = e.target.uf.value;
	// 			const cep = e.target.cep.value;

	// 			const address = {
	// 				logradouro: logradouro,
	// 				complemento: complemento,
	// 				bairro: bairro,
	// 				cidade: cidade,
	// 				uf: uf,
	// 				cep: cep,
	// 			};

	// 			const password = e.target.password.value;
	// 			const confirmPassword = e.target.confirmPassword.value;

	// 			const response = await api.patch("/customers/edit", {
	// 				name: name,
	// 				email: email,
	// 				cpf: cpf,
	// 				address: address,
	// 				password: password,
	// 				confirmPassword: confirmPassword,
	// 			});

	// 			Swal.fire({
	// 				title: response.data.message,
	// 				width: 900,
	// 				icon: "success",
	// 			});
	// 		}
	// 	} catch (error: any) {
	// 		console.log(error);

	// 		Swal.fire({
	// 			title: error.response.data.message,
	// 			width: 900,
	// 			icon: "error",
	// 		});
	// 	}
	// }

	async function updateUser(data: TUpdateUserFormData) {
		setOutput(JSON.stringify(data, null, 2));

		console.log("Dados recebidos:", data);

		// Cria um novo FormData
		const formData = new FormData();

		// Itera sobre os campos do objeto 'data' e adiciona ao FormData
		Object.entries(data).forEach(([key, value]) => {
			if (key === "profileImage" && value instanceof File) {
				formData.append(key, value);
				console.log(`Adicionado ao FormData: ${key} - [Imagem]`);
			} else {
				formData.append(key, value);
				console.log(`Adicionado ao FormData: ${key} - ${value}`);
			}
		});

		try {
			setLoadingButton(true);

			if (user?.accountType === "partner") {
				const response = await api.patch("/partners/edit", formData);

				toast.success(response.data.message);
			} else if (user?.accountType === "customer") {
				const response = await api.patch("/customers/edit", formData);
				toast.success(response.data.message);
			}
			setLoadingButton(false);
		} catch (error: any) {
			toast.error(error.response.data.message);
		}
	}

	const handleCancelar = () => {
		// Redirecionar para outra página ao clicar em Cancelar
		router.push("/dashboard");
	};

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mt-4 mb-8">
					<form onSubmit={handleSubmit(updateUser)}>
						{/* Gadget 1 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									{user?.accountType === "customer"
										? "Dados de Usuário"
										: "Dados da Loja"}
								</h1>
								<div className="flex flex-row gap-4">
									{/* Nome Fantasia */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												{user?.accountType ===
												"customer"
													? "Nome"
													: "Nome Fantasia"}
											</span>
										</div>
										<input
											type="text"
											// name="name"
											placeholder={`...`}
											defaultValue={user?.name}
											className={`input input-bordered ${
												errors.name
													? `input-error`
													: `input-success`
											} w-full max-w-3xl`}
											{...register("name")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.name && (
													<span>
														{errors.name.message}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* CNPJ/CPF */}
									{user?.accountType === "partner" ? (
										<label className="form-control w-full max-w-3xl">
											<div className="label">
												<span className="label-text text-black">
													CNPJ/CPF
												</span>
											</div>
											<input
												type="text"
												// name="cpfCnpj"
												placeholder={`...`}
												defaultValue={user?.cpfCnpj}
												className={`input input-bordered ${
													errors.cpfCnpj
														? `input-error`
														: `input-success`
												} w-full max-w-3xl`}
												{...register("cpfCnpj")}
											/>
											<div className="label">
												<span className="label-text-alt text-red-500">
													{errors.cpfCnpj && (
														<span>
															{
																errors.cpfCnpj
																	.message
															}
														</span>
													)}
												</span>
											</div>
										</label>
									) : (
										<label className="form-control w-full max-w-3xl">
											<div className="label">
												<span className="label-text text-black">
													CPF
												</span>
											</div>
											<input
												type="text"
												// name="cpfCnpj"
												placeholder={`...`}
												defaultValue={user?.cpf}
												className={`input input-bordered ${
													errors.cpf
														? `input-error`
														: `input-success`
												} w-full max-w-3xl`}
												{...register("cpf")}
											/>
											<div className="label">
												<span className="label-text-alt text-red-500">
													{errors.cpf && (
														<span>
															{errors.cpf.message}
														</span>
													)}
												</span>
											</div>
										</label>
									)}
								</div>
								<div className="flex flex-row gap-4">
									{/* Email */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Email
											</span>
										</div>
										<input
											type="email"
											// name="email"
											placeholder={`...`}
											defaultValue={user?.email}
											className={`input input-bordered ${
												errors.email
													? `input-error`
													: `input-success`
											} w-full max-w-3xl`}
											{...register("email")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.email && (
													<span>
														{errors.email.message}
													</span>
												)}
											</span>
										</div>
									</label>
								</div>

								{user && user?.accountType === "customer" ? (
									<></>
								) : (
									<>
										{/* <div className="flex flex-row gap-4">
											<label className="form-control w-full max-w-3xl">
												<div className="label">
													<span className="label-text text-black">
														Site Oficial da Loja
													</span>
												</div>
												<input
													type="text"
													placeholder={`...`}
													className={`input input-bordered input-success w-fullmax-w-3xl`}
												/>
												<div className="label">
													<span className="label-text-alt text-red-500">
														Erro
													</span>
												</div>
											</label>
										</div> */}

										<div className="flex flex-row gap-4">
											{/* Descrição da Loja */}
											<label className="form-control w-full max-w-3xl">
												<div className="label">
													<span className="label-text text-black">
														Descrição da Loja
													</span>
												</div>
												<textarea
													className={`textarea ${
														errors.description
															? `textarea-error`
															: `textarea-success`
													}`}
													placeholder={`...`}
													defaultValue={
														user?.description
													}
													{...register(
														"description"
													)}></textarea>
												<div className="label">
													<span className="label-text-alt text-red-500">
														{errors.description && (
															<span>
																{
																	errors
																		.description
																		.message
																}
															</span>
														)}
													</span>
												</div>
											</label>
										</div>
									</>
								)}
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col ml-6 mb-6 gap-2">
								<h1 className="text-2xl font-semibold text-black">
									Imagens
								</h1>
								<div className="flex flex-row items-center gap-10">
									{/* Add Imagens */}
									<label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Imagem de Perfil
											</span>
										</div>
										<div
											className={`text-black hover:text-white flex flex-col justify-center items-center w-[120px] h-[120px] border-[1px] border-dashed border-primary hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
											{imagemSelecionadaProfile ? (
												<img
													src={
														imagemSelecionadaProfile
													}
													alt="Imagem selecionada"
													className="object-contain w-full h-full rounded"
												/>
											) : (
												<div
													className="flex flex-col justify-center items-center"
													onChange={(event) =>
														handleImagemSelecionada(
															event,
															setImagemSelecionadaProfile
														)
													}>
													<h2 className="text-xs mb-2">
														Add Imagem
													</h2>
													<AddPicture size={20} />
													<input
														className="hidden"
														type="file"
														accept="image/*"
														{...register(
															"profileImage"
														)}
													/>
												</div>
											)}
										</div>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.profileImage ? (
													<span>
														{
															errors.profileImage
																.message
														}
													</span>
												) : (
													<span className="text-black">
														Tamanho
													</span>
												)}
											</span>
										</div>
									</label>

									{/* <label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Imagem de Perfil
											</span>
										</div>
										<div
											className={`text-black hover:text-white flex flex-col justify-center items-center w-[120px] h-[120px] border-[1px] border-dashed border-primary hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
											{imagemSelecionadaProfile ? (
												<div className="relative w-full h-full">
													<img
														src={
															imagemSelecionadaProfile
														}
														alt="Imagem selecionada"
														className="object-contain w-full h-full rounded"
													/>

													<button
														type="button"
														className="absolute top-1 right-1 bg-red-500 text-white p-1 w-8 h-8 rounded-md z-10"
														onClick={() =>
															setImagemSelecionadaProfile(
																null
															)
														}>
														X
													</button>

													<input
														className="absolute inset-0 opacity-0 cursor-pointer z-0"
														type="file"
														accept="image/*"
														onChange={(event) =>
															handleImagemSelecionada(
																event,
																setImagemSelecionadaProfile
															)
														}
													/>
												</div>
											) : (
												<div className="flex flex-col justify-center items-center">
													<h2 className="text-xs mb-2">
														Add Imagem
													</h2>
													<AddPicture size={20} />
													<input
														className="absolute inset-0 opacity-0 cursor-pointer"
														type="file"
														accept="image/*"
														onChange={(event) =>
															handleImagemSelecionada(
																event,
																setImagemSelecionadaProfile
															)
														}
													/>
												</div>
											)}
										</div>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.profileImage ? (
													<span>
														{
															errors.profileImage
																.message
														}
													</span>
												) : (
													<span className="text-black">
														Tamanho recomendado:
														120x120p
													</span>
												)}
											</span>
										</div>
									</label> */}

									{user &&
									user?.accountType === "customer" ? (
										<></>
									) : (
										<>
											{/* Add Imagens */}
											<label className="form-control">
												<div className="label">
													<span className="label-text text-black">
														Logo da Loja
													</span>
												</div>
												<div
													className={`text-black hover:text-white flex flex-col justify-center items-center w-[200px] h-[120px] border-[1px] border-dashed border-primary hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
													{imagemSelecionadaLogo ? (
														<img
															src={
																imagemSelecionadaLogo
															}
															alt="Imagem selecionada"
															className="object-contain w-full h-full rounded-sm"
														/>
													) : (
														<div
															className="flex flex-col justify-center items-center"
															onChange={(event) =>
																handleImagemSelecionada(
																	event,
																	setImagemSelecionadaLogo
																)
															}>
															<h2 className="text-xs mb-2">
																Add Imagem
															</h2>
															<AddPicture
																size={20}
															/>
															<input
																className="hidden"
																type="file"
																accept="image/*"
																{...register(
																	"logoImage"
																)}
															/>
														</div>
													)}
												</div>
												<div className="label">
													<span className="label-text-alt text-red-500">
														{errors.logoImage ? (
															<span>
																{
																	errors
																		.logoImage
																		.message
																}
															</span>
														) : (
															<span className="text-black">
																Tamanho
															</span>
														)}
													</span>
												</div>
											</label>
										</>
									)}
								</div>
							</div>
						</div>

						{/* Gadget 3 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Endereço Partner / Customer */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									{user?.accountType === "customer"
										? "Endereço de Entrega"
										: "Configurações de Envio"}
								</h1>
								{/* Row 1 */}
								<div className="flex flex-row gap-4">
									{/* Logradouro */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Logradouro (Rua/Avenida)
											</span>
										</div>
										<input
											type="text"
											placeholder="..."
											defaultValue={
												user?.address[0].street
											}
											className={`input input-bordered ${
												errors.street
													? `input-error`
													: `input-success`
											} w-fullmax-w-3xl`}
											{...register("street")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.street && (
													<span>
														{errors.street.message}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* Complemento */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Complemento
											</span>
										</div>
										<input
											type="text"
											// name="complemento"
											placeholder="..."
											defaultValue={
												user?.address[0].complement
											}
											className={`input input-bordered ${
												errors.complement
													? `input-error`
													: `input-success`
											} w-fullmax-w-3xl`}
											{...register("complement")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.complement && (
													<span>
														{
															errors.complement
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* Bairro */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Bairro
											</span>
										</div>
										<input
											type="text"
											// name="bairro"
											placeholder="..."
											defaultValue={
												user?.address[0].neighborhood
											}
											className={`input input-bordered ${
												errors.neighborhood
													? `input-error`
													: `input-success`
											} w-fullmax-w-3xl`}
											{...register("neighborhood")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.neighborhood && (
													<span>
														{
															errors.neighborhood
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>
								</div>

								<div className="flex flex-row gap-4">
									{/* Cidade */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Cidade
											</span>
										</div>
										<input
											type="text"
											// name="cidade"
											placeholder="..."
											defaultValue={user?.address[0].city}
											className={`input input-bordered ${
												errors.city
													? `input-error`
													: `input-success`
											} w-fullmax-w-3xl`}
											{...register("city")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.city && (
													<span>
														{errors.city.message}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* Estado */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Estado
											</span>
										</div>
										<select
											className={`select ${
												errors.state
													? `select-error`
													: `select-success`
											} w-full max-w-3xl`}
											defaultValue={
												user?.address[0].state || ""
											}
											{...register("state")}>
											<option disabled selected>
												Em qual estado sua loja está
												localizada?
											</option>
											<option value="SP">
												São Paulo (SP)
											</option>
											<option value="RJ">
												Rio de Janeiro (RJ)
											</option>
											<option value="PR">
												Paraná (PR)
											</option>
											<option value="MG">
												Minas Gerais (MG)
											</option>
											<option value="SC">
												Santa Catarina (SC)
											</option>
											<option value="RS">
												Rio Grande do Sul (RS)
											</option>
											<option value="ES">
												Espírito Santo (ES)
											</option>
											<option value="GO">
												Goiás (GO)
											</option>
											<option value="DF">
												Destrito Federal (DF)
											</option>
											<option value="MS">
												Mato Grosso do Sul (MS)
											</option>
											<option value="MT">
												Mato Grosso (MT)
											</option>
											<option value="BA">
												Bahia (BA)
											</option>
											<option value="PE">
												Pernambuco (PE)
											</option>
											<option value="CE">
												Ceará (CE)
											</option>
											<option value="MA">
												Maranhão (MA)
											</option>
											<option value="RN">
												Rio Grande do Norte (RN)
											</option>
											<option value="PB">
												Paraíba (PB)
											</option>
											<option value="PI">
												Piauí (PI)
											</option>
											<option value="SE">
												Sergipe (SE)
											</option>
											<option value="AL">
												Alagoas (AL)
											</option>
											<option value="PA">
												Pará (PA)
											</option>
											<option value="AM">
												Amazonas (AM)
											</option>
											<option value="TO">
												Tocantins (TO)
											</option>
											<option value="AP">
												Amapá (AP)
											</option>
											<option value="RR">
												Roraima (RR)
											</option>
											<option value="RO">
												Rondônia (RO)
											</option>
											<option value="AC">
												Acre (AC)
											</option>
										</select>
										{/* <input
											type="text"
											// name="uf"
											placeholder="..."
											defaultValue={
												user?.address[0].state
											}
											className={`input input-bordered ${
												errors.state
													? `input-error`
													: `input-success`
											} w-full max-w-3xl`}
											{...register("state")}
										/> */}
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.state && (
													<span>
														{errors.state.message}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* CEP */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												CEP
											</span>
										</div>
										<input
											type="text"
											// name="cep"
											placeholder="..."
											defaultValue={
												user?.address[0].postalCode
											}
											className={`input input-bordered ${
												errors.postalCode
													? `input-error`
													: `input-success`
											} w-full max-w-3xl`}
											{...register("postalCode")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.postalCode && (
													<span>
														{
															errors.postalCode
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>
								</div>
								{user?.accountType === "customer" ? (
									<></>
								) : (
									<>
										{/* Credential */}
										<label className="form-control w-full max-w-3xl">
											<div className="label">
												<span className="label-text text-black">
													Credencial Kangu
												</span>
											</div>
											<input
												type="text"
												placeholder={`...`}
												defaultValue={
													user
														?.shippingConfiguration[0]
														.credential
												}
												className={`input input-bordered ${
													errors.credential
														? `input-error`
														: `input-success`
												} w-full max-w-3xl`}
												{...register("credential")}
											/>
											<div className="label">
												<span className="label-text-alt text-red-500">
													{errors.credential ? (
														<span>
															{
																errors
																	.credential
																	.message
															}
														</span>
													) : (
														<span className="text-black">
															Obs.: A credencial
															da Kangu é
															obrigatória para que
															seja possível
															calcular o frete dos
															pedidos. Indicado
															para envio dentro do
															Brasil!
														</span>
													)}
												</span>
											</div>
										</label>
									</>
								)}
							</div>
						</div>

						{user && user?.accountType === "customer" ? (
							<></>
						) : (
							<>
								{/* Gadget 4 */}
								<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
									{/* Adicionar Porduto */}
									<div className="flex flex-col gap-2 ml-6 mb-6">
										<h1 className="text-2xl font-semibold text-black">
											Configurações de venda
										</h1>

										{/* Cashback */}
										<label className="form-control w-[250px]">
											<div className="label">
												<div className="flex flex-row items-center gap-2 label-text text-black">
													<span>
														Cashback oferecido
													</span>
													<div className="relative inline-block">
														<div className="group">
															{/* Icone Visível no Client Side  */}
															<FiInfo
																className="animate-pulse text-info cursor-pointer"
																size={18}
															/>

															{/* Tooltip */}
															<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-[880px] p-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition duration-300 border-[1px] border-black bg-white text-black text-sm rounded shadow-lg pointer-events-none">
																<p className="ml-2">
																	Ao realizar
																	uma venda
																	você pagará
																	1,5x o
																	Cashback
																	oferecido,
																	sendo valor
																	dividido
																	entre o
																	cliente (x1)
																	e a nossa
																	plataforma
																	(x0,5).
																	Exemplo:
																	Você oferece
																	2% de
																	Cashback,
																	portanto
																	pagará 3%
																	(2% para o
																	cliente e 1%
																	para nossa
																	plataforma).
																</p>
															</div>
														</div>
													</div>
												</div>
											</div>
											<input
												type="text"
												placeholder={`...`}
												defaultValue={user?.cashback}
												className={`input input-bordered ${
													errors.cashback
														? `input-error`
														: `input-success`
												} w-full max-w-3xl`}
												{...register("cashback")}
											/>
											<div className="label">
												<span className="label-text-alt text-red-500">
													{errors.cashback && (
														<span>
															{
																errors.cashback
																	.message
															}
														</span>
													)}
												</span>
											</div>
										</label>
									</div>
								</div>
							</>
						)}

						{/* Gadget 5 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Alterar Senha
								</h1>

								<div className="flex flex-row gap-4">
									{/* Credential */}
									<label className="form-control w-[250px]">
										<div className="label">
											<span className="label-text text-black">
												Nova Senha
											</span>
										</div>
										<input
											type="password"
											// name="password"
											placeholder="Digite a nova senha"
											className={`input input-bordered ${
												errors.password
													? `input-error`
													: `input-success`
											} w-full max-w-3xl`}
											{...register("password")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.password && (
													<span>
														{
															errors.password
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* Credential */}
									<label className="form-control w-[250px]">
										<div className="label">
											<span className="label-text text-black">
												Confirme a Senha
											</span>
										</div>
										<input
											type="password"
											// name="confirmPassword"
											placeholder="Confirme a senha"
											className={`input input-bordered ${
												errors.confirmPassword
													? `input-error`
													: `input-success`
											} max-w-4xl`}
											{...register("confirmPassword")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.confirmPassword && (
													<span>
														{
															errors
																.confirmPassword
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Gadget 6 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold mb-4 text-black">
									Deseja publicar o Produto?
								</h1>
								{/* Nome e Descrição */}

								<div className="flex flex-row gap-4">
									<button
										type="button"
										onClick={handleCancelar}
										className="btn btn-outline btn-error hover:shadow-md">
										Cancelar
									</button>
									{loadingButton ? (
										<button className="btn btn-primary shadow-md w-[200px]">
											<span className="loading loading-spinner loading-md"></span>
										</button>
									) : (
										<button
											type="submit"
											className="btn btn-primary shadow-md w-[200px]">
											Atualizar Perfil
										</button>
									)}
								</div>
							</div>
						</div>
					</form>
					<pre>{output}</pre>
					<br />
				</div>
			</div>
		</section>
	);
}

export default MyProfilePage;
