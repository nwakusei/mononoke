"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";

// Icons
import { AddPicture } from "@icon-park/react";
import { FiInfo } from "react-icons/fi";
import { LoadingPage } from "@/components/LoadingPageComponent";

const createProductFormSchema = z.object({
	imagesProduct: z.instanceof(FileList).transform((list) => {
		const files = [];
		for (let i = 0; i < list.length; i++) {
			files.push(list.item(i));
		}
		return files;
	}),
	productName: z.string().min(1, "※ O nome do Produto é obrigatório!"),
});

function MyProfilePage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState({});
	const [imagemSelecionadaProfile, setImagemSelecionadaProfile] =
		useState(null);
	const [imagemSelecionadaLogo, setImagemSelecionadaLogo] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	const router = useRouter();

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

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({ resolver: zodResolver(createProductFormSchema) });

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
					<form>
						{/* Gadget 1 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									{`${
										user?.accountType === "customer"
											? "Dados de Usuário"
											: "Dados da Loja"
									}`}
								</h1>
								<div className="flex flex-row gap-4">
									{/* Nome Fantasia */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												{`${
													user?.accountType ===
													"customer"
														? "Nome"
														: "Nome Fantasia"
												}`}
											</span>
										</div>
										<input
											type="text"
											placeholder={`${user?.name}`}
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-full max-w-3xl`}
											{...register("productName")}
										/>
										<div className="label">
											{errors.productName && (
												<span className="label-text-alt text-red-500">
													{errors.productName.message}
												</span>
											)}
										</div>
									</label>
									{/* CNPJ/CPF */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												CNPJ/CPF
											</span>
										</div>
										<input
											type="text"
											placeholder={`${user?.cpf}`}
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-full max-w-3xl`}
											{...register("productName")}
										/>
										<div className="label">
											{errors.productName && (
												<span className="label-text-alt text-red-500">
													{errors.productName.message}
												</span>
											)}
										</div>
									</label>
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
											placeholder={`${user?.email}`}
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-full max-w-3xl`}
											{...register("productName")}
										/>
										<div className="label">
											{errors.productName && (
												<span className="label-text-alt text-red-500">
													{errors.productName.message}
												</span>
											)}
										</div>
									</label>
								</div>

								{user && user?.accountType === "customer" ? (
									<></>
								) : (
									<>
										<div className="flex flex-row gap-4">
											{/* Site */}
											<label className="form-control w-full max-w-3xl">
												<div className="label">
													<span className="label-text text-black">
														Site Oficial da Loja
													</span>
												</div>
												<input
													type="text"
													placeholder={`${user?.site}`}
													className={`${
														errors.productName &&
														`input-error`
													} input input-bordered input-success w-fullmax-w-3xl`}
													{...register("productName")}
												/>
												<div className="label">
													{errors.productName && (
														<span className="label-text-alt text-red-500">
															{
																errors
																	.productName
																	.message
															}
														</span>
													)}
												</div>
											</label>
										</div>

										<div className="flex flex-row gap-4">
											{/* Descrição da Loja */}
											<label className="form-control w-full max-w-3xl">
												<div className="label">
													<span className="label-text text-black">
														Descrição da Loja
													</span>
												</div>
												<textarea
													className={`${
														errors.description &&
														`textarea-error`
													} textarea textarea-success`}
													placeholder={`${user?.description}`}
													{...register(
														"description"
													)}></textarea>
												<div className="label">
													{errors.description && (
														<span className="label-text-alt text-red-500">
															{
																errors
																	.description
																	.message
															}
														</span>
													)}
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
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Imagens
								</h1>
								<div className="flex flex-row justify-center items-center">
									{/* Add Imagens */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Imagem de Perfil
											</span>
										</div>
										<div
											className={`${
												errors.imagesProduct &&
												`border-error`
											} text-black hover:text-white flex flex-col justify-center items-center w-24 h-24 border-[1px] border-dashed border-primary hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
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
														multiple
														{...register(
															"imageProfile"
														)}
													/>
												</div>
											)}
										</div>
										<div className="label">
											{errors.imagesProduct && (
												<span className="label-text-alt text-red-500">
													{
														errors.imagesProduct
															.message
													}
												</span>
											)}
										</div>
									</label>

									{user &&
									user?.accountType === "customer" ? (
										<></>
									) : (
										<>
											{/* Add Imagens */}
											<label className="form-control w-full max-w-3xl">
												<div className="label">
													<span className="label-text text-black">
														Logo da Loja
													</span>
												</div>
												<div
													className={`${
														errors.imagesProduct &&
														`border-error`
													} text-black hover:text-white flex flex-col justify-center items-center w-[200px] h-[80px] border-[1px] border-dashed border-primary hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
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
																multiple
																{...register(
																	"imageLogo"
																)}
															/>
														</div>
													)}
												</div>
												<div className="label">
													{errors.imagesProduct && (
														<span className="label-text-alt text-red-500">
															{
																errors
																	.imagesProduct
																	.message
															}
														</span>
													)}
												</div>
											</label>
										</>
									)}
								</div>
							</div>
						</div>

						{/* Gadget 3 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									{`${
										user?.accountType === "customer"
											? "Endereço de Entrega"
											: "Configurações de Envio"
									}`}
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
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-fullmax-w-3xl`}
											{...register("productName")}
										/>
										<div className="label">
											<span className="label-text-alt text-black">
												Ex.: Rua X, 128
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
											placeholder="..."
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-fullmax-w-3xl`}
											{...register("productName")}
										/>
										<div className="label">
											<span className="label-text-alt text-black">
												Ex.: Apto. 240
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
											placeholder="..."
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-fullmax-w-3xl`}
											{...register("productName")}
										/>
										<div className="label">
											<span className="label-text-alt text-black">
												Ex.: Centro
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
											placeholder="..."
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-fullmax-w-3xl`}
											{...register("productName")}
										/>
										<div className="label">
											<span className="label-text-alt text-black">
												Ex.: São Paulo
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
										<input
											type="text"
											placeholder="..."
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-fullmax-w-3xl`}
											{...register("productName")}
										/>
										<div className="label">
											<span className="label-text-alt text-black">
												Ex.: SP
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
											placeholder="..."
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-full max-w-3xl`}
											{...register("productName")}
										/>
										<div className="label">
											<span className="label-text-alt text-black">
												Ex.: 04850213
											</span>
										</div>
									</label>
								</div>
								{`${
									user?.accountType === "customer" ? (
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
													placeholder={`${
														user?.kanguCredential ===
														""
															? "Digite a credencial a Kangu"
															: user?.kanguCredential
													}`}
													className={`${
														errors.productName &&
														`input-error`
													} input input-bordered input-success w-full max-w-3xl`}
													{...register("productName")}
												/>
												<div className="label">
													<span className="label-text-alt text-black">
														Obs.: A credencial da
														Kangu é obrigatória para
														que seja possível
														calcular o frete dos
														pedidos. Indicado para
														envio dentro do Brasil!
													</span>
												</div>
											</label>
										</>
									)
								}`}
							</div>
						</div>

						{user && user?.accountType === "customer" ? (
							<></>
						) : (
							<>
								{/* Gadget 4 */}
								<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
									{`${
										user?.accountType === "customer"
											? "Endereço de Entrega"
											: "Configurações de Envio"
									}`}
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
												placeholder={`${
													user.cashback === ""
														? "Digite a credencial a Kangu"
														: user.cashback
												}`}
												className={`${
													errors.productName &&
													`input-error`
												} input input-bordered input-success w-full max-w-3xl`}
												{...register("productName")}
											/>
											<div className="label">
												<span className="label-text-alt text-black">
													Ex.: 5%
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
									<label className="form-control max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Nova Senha
											</span>
										</div>
										<input
											type="password"
											placeholder="Digite a nova senha"
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-full max-w-3xl`}
											{...register("productName")}
										/>
										<div className="label">
											<span className="label-text-alt text-black">
												Obs.:
											</span>
										</div>
									</label>

									{/* Credential */}
									<label className="form-control w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Confirme a Senha
											</span>
										</div>
										<input
											type="password"
											placeholder="Confirme a senha"
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success max-w-4xl`}
											{...register("productName")}
										/>
										<div className="label">
											<span className="label-text-alt text-black">
												Obs.:
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
									<button
										type="submit"
										className="btn btn-primary shadow-md">
										Atualizar Perfil
									</button>
								</div>
							</div>
						</div>
					</form>
					<br />
				</div>
			</div>
		</section>
	);
}

export default MyProfilePage;
