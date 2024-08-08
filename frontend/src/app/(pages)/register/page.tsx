"use client";

import { useState, useContext } from "react";
import Image from "next/image";

// Zod Hook Form
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Imagens
import Logo from "../../../../public/logo.png";

// Components
import { InputUserForm } from "@/components/InputUserForm";

// Context
import { Context } from "@/context/UserContext";

// Função que obriga as senhas serem iguais
function validatePasswordConfirmation(
	password: string,
	confirmPassword: string
) {
	return password === confirmPassword;
}

const createUserFormSchema = z
	.object({
		accountType: z
			.string()
			.min(1, "O tipo de conta é obrigatório!")
			.refine((value) => value !== "", {
				message: "Escolha uma opção",
				path: ["accountType"],
			}),
		name: z
			.string()
			.min(1, "O nome é obrigatório!")
			.transform((name) => {
				// Remover caracteres especiais
				return name.trim().replace(/[$.]/g, ""); // Por exemplo, remover os caracteres $ e .
			})
			.transform((name) => {
				return name
					.trim()
					.split(" ")
					.map((word) => {
						return (
							word.charAt(0).toUpperCase() +
							word.slice(1).toLowerCase()
						);
					})
					.join(" ");
			}),
		cpf: z
			.string()
			.min(1, { message: "O CPF é obrigatório!" })
			.refine((value) => /^\d+$/.test(value), {
				message: "O CPF deve conter apenas números!",
			})
			.refine((value) => value.length === 11, {
				message: "O CPF precisa ter 11 números!",
			}),
		email: z
			.string()
			.min(1, "O email é obrigatório!")
			.email("O formato do email é inválido!")
			.toLowerCase(),
		password: z.string().min(1, "A senha é obrigatória!").max(34, {
			message: "A senha precisa ter no máximo 34 caracteres!",
		}),
		confirmPassword: z
			.string()
			.min(1, "A confirmação de senha é obrigatória!"),
	})
	.refine(
		(data) =>
			validatePasswordConfirmation(data.password, data.confirmPassword),
		{
			message: "As senhas precisam ser iguais!",
			path: ["confirmPassword"], // Indica o campo específico onde o erro deve ser mostrado
		}
	);

type TCreateUserFormData = z.infer<typeof createUserFormSchema>;

function RegisterPage() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TCreateUserFormData>({
		resolver: zodResolver(createUserFormSchema),
	});
	const { registerCustomer, registerPartner } = useContext(Context);

	function createUser(data: TCreateUserFormData) {
		if (data.accountType === "customer") {
			registerCustomer(data);
		} else {
			registerPartner(data);
		}
	}

	return (
		<section className="bg-gray-300 flex min-h-screen flex-col items-center justify-center p-24">
			<div className="flex flex-col items-center justify-center bg-primary w-[500px] h-[960px] rounded-md shadow-md m-4">
				<Image src={Logo} width={200} alt="logo" unoptimized />
				<h1 className="text-center text-2xl mt-2 mb-4">Cadastre-se</h1>
				<form onSubmit={handleSubmit(createUser)}>
					<div className="mb-2">
						<div>
							<div className="label">
								<span className="label-text">
									Que tipo de conta deseja criar?
								</span>
							</div>
							<div className="flex flex-row items-center">
								<select
									className="select select-success w-full max-w-xs"
									{...register("accountType")}>
									<option value="">Escolha uma opção</option>
									<option value="customer">
										Conta Cliente
									</option>
									<option value="partner">
										Conta Parceiro
									</option>
								</select>
							</div>
						</div>
						<div className="label">
							{errors.accountType && (
								<span className="label-text-alt text-red-400">
									{errors.accountType.message}
								</span>
							)}
						</div>
					</div>

					<InputUserForm
						htmlFor="name"
						labelTitle="Nome"
						type="text"
						inputName="name"
						register={register}
						errors={errors}
					/>
					<InputUserForm
						htmlFor="cpf"
						labelTitle="CPF ou CNPJ"
						type="text"
						inputName="cpf"
						register={register}
						errors={errors}
					/>
					<InputUserForm
						htmlFor="email"
						labelTitle="Email"
						type="email"
						inputName="email"
						register={register}
						errors={errors}
					/>
					<InputUserForm
						htmlFor="password"
						labelTitle="Senha"
						type="password"
						inputName="password"
						register={register}
						errors={errors}
					/>

					<InputUserForm
						htmlFor="confirmPassword"
						labelTitle="Confirme a Senha"
						type="password"
						inputName="confirmPassword"
						register={register}
						errors={errors}
					/>
					<button
						type="submit"
						className="btn btn-secondary w-[320px] mt-4 shadow-md">
						Cadastrar
					</button>
				</form>
			</div>
		</section>
	);
}

export default RegisterPage;
