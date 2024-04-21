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
	const [output, setOutput] = useState("");

	const router = useRouter();

	useEffect(() => {
		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setUser(response.data);
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

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mt-4 mb-8">
					<form>
						{/* Gadget 1 */}
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold">
									Dados da Loja
								</h1>
								{/* Nome Fantasia */}
								<label className="form-control w-full max-w-3xl">
									<div className="label">
										<span className="label-text">
											Nome Fantasia
										</span>
									</div>
									<input
										type="text"
										placeholder={`${user.name}`}
										className={`${
											errors.productName && `input-error`
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
								<div className="flex flex-row gap-4">
									{/* CNPJ/CPF */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
												CNPJ/CPF
											</span>
										</div>
										<input
											type="text"
											placeholder={`${user.cnpj}`}
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

									{/* Email */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
												Email
											</span>
										</div>
										<input
											type="text"
											placeholder={`${user.email}`}
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
									{/* Descrição da Loja */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
												Descrição da Loja
											</span>
										</div>
										<textarea
											className={`${
												errors.description &&
												`textarea-error`
											} textarea textarea-success`}
											placeholder={`${user.description}`}
											{...register(
												"description"
											)}></textarea>
										<div className="label">
											{errors.description && (
												<span className="label-text-alt text-red-500">
													{errors.description.message}
												</span>
											)}
										</div>
									</label>

									{/* Site */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
												Site Oficial da Loja
											</span>
										</div>
										<input
											type="text"
											placeholder={`${user.site}`}
											className={`${
												errors.productName &&
												`input-error`
											} input input-bordered input-success w-fullmax-w-3xl`}
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
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold">
									Imagens
								</h1>
								<div className="flex flex-row justify-center items-center">
									{/* Add Imagens */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
												Imagem de Perfil
											</span>
										</div>
										<div
											className={`${
												errors.imagesProduct &&
												`border-error`
											} flex flex-col justify-center items-center w-24 h-24 border-[1px] border-dashed border-sky-500 hover:bg-sky-800 transition-all ease-in duration-150 rounded-sm ml-1 cursor-pointer relative`}>
											{imagemSelecionadaProfile ? (
												<img
													src={
														imagemSelecionadaProfile
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

									{/* Add Imagens */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
												Logo da Loja
											</span>
										</div>
										<div
											className={`${
												errors.imagesProduct &&
												`border-error`
											} flex flex-col justify-center items-center w-[200px] h-[80px] border-[1px] border-dashed border-sky-500 hover:bg-sky-800 transition-all ease-in duration-150 rounded-sm ml-1 cursor-pointer relative`}>
											{imagemSelecionadaLogo ? (
												<img
													src={imagemSelecionadaLogo}
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
													<AddPicture size={20} />
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
														errors.imagesProduct
															.message
													}
												</span>
											)}
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold">
									Configurações de Envio
								</h1>
								{/* Row 1 */}
								<div className="flex flex-row gap-4">
									{/* Logradouro */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
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
											<span className="label-text-alt">
												Ex.: Rua X, 128
											</span>
										</div>
									</label>

									{/* Complemento */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
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
											<span className="label-text-alt">
												Ex.: Apto. 240
											</span>
										</div>
									</label>

									{/* Bairro */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
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
											<span className="label-text-alt">
												Ex.: Centro
											</span>
										</div>
									</label>
								</div>

								<div className="flex flex-row gap-4">
									{/* Cidade */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
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
											<span className="label-text-alt">
												Ex.: São Paulo
											</span>
										</div>
									</label>

									{/* Estado */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
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
											<span className="label-text-alt">
												Ex.: SP
											</span>
										</div>
									</label>

									{/* CEP */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text">
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
											<span className="label-text-alt">
												Ex.: 04850213
											</span>
										</div>
									</label>
								</div>
								{/* Credential */}
								<label className="form-control w-full max-w-3xl">
									<div className="label">
										<span className="label-text">
											Credencial Kangu
										</span>
									</div>
									<input
										type="text"
										placeholder={`${
											user.kanguCredential === ""
												? "Digite a credencial a Kangu"
												: user.kanguCredential
										}`}
										className={`${
											errors.productName && `input-error`
										} input input-bordered input-success w-full max-w-3xl`}
										{...register("productName")}
									/>
									<div className="label">
										<span className="label-text-alt">
											Obs.: A credencial da Kangu é
											obrigatória para que seja possível
											calcular o frete dos pedidos.
											Indicado para envio dentro do
											Brasil!
										</span>
									</div>
								</label>
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold">
									Configurações de venda
								</h1>

								{/* Cashback */}
								<label className="form-control w-full max-w-3xl">
									<div className="label">
										<span className="label-text">
											Cashback oferecido
										</span>
									</div>
									<input
										type="text"
										placeholder={`${
											user.cashback === ""
												? "Digite a credencial a Kangu"
												: user.cashback
										}`}
										className={`${
											errors.productName && `input-error`
										} input input-bordered input-success w-full max-w-3xl`}
										{...register("productName")}
									/>
									<div className="label">
										<span className="label-text-alt">
											Obs.: Ao fazer uma venda você paga
											sempre o dobro de Cashback, sendo
											valor divivido para o cliente e a
											nossa plataforma!
										</span>
									</div>
								</label>
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold">
									Alterar Senha
								</h1>

								<div className="flex flex-row gap-4">
									{/* Credential */}
									<label className="form-control max-w-3xl">
										<div className="label">
											<span className="label-text">
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
											<span className="label-text-alt">
												Obs.:
											</span>
										</div>
									</label>

									{/* Credential */}
									<label className="form-control w-3xl">
										<div className="label">
											<span className="label-text">
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
											<span className="label-text-alt">
												Obs.:
											</span>
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-purple-400 w-[1200px] p-6 rounded-md mr-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold mb-4">
									Deseja publicar o Produto?
								</h1>
								{/* Nome e Descrição */}

								<div className="flex flex-row gap-4">
									<button
										type="button"
										onClick={handleCancelar}
										className="btn btn-outline btn-error">
										Cancelar
									</button>
									<button
										type="submit"
										className="btn btn-success">
										Atualizar Perfil
									</button>
								</div>
							</div>
						</div>
					</form>
					<br />
					<pre className="flex justify-center">{output}</pre>
				</div>
			</div>
		</section>
	);
}

export default MyProfilePage;
