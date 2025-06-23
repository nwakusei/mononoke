"use client";

import { useState, useContext } from "react";
import Image from "next/image";

// Context
import { Context } from "@/context/UserContext";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// Imagens
import Logo from "../../../../public/logo.png";

// Components
import { InputUserForm } from "@/components/InputUserForm";

// Zod Hook Form
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

const createUserFormSchema = z
	.object({
		accountType: z
			.string()
			.min(1, "※ O tipo de conta é obrigatório!")
			.refine((value) => value !== "", {
				message: "※ Escolha uma opção",
				path: ["accountType"],
			}),
		name: z
			.string()
			.min(1, "※ O nome é obrigatório!")
			.trim()
			.refine(
				(name) => {
					const sanitized = DOMPurify.sanitize(name);

					// Valida que o nome não contém caracteres não permitidos usando regex
					const isValid = /^[A-Za-zÀ-ÿ\s]+$/.test(sanitized);
					return isValid;
				},
				{
					message: "※ O nome deve conter apenas letras e espaços!",
				}
			)
			.transform((name) => {
				// Sanitiza a entrada
				const sanitized = DOMPurify.sanitize(name);

				// Formata o nome
				return sanitized
					.toLocaleLowerCase()
					.trim()
					.split(" ")
					.map((word) => {
						if (word && word.length > 0) {
							return (
								word[0].toLocaleUpperCase() + word.substring(1)
							);
						}
						return word; // ou return ""; para descartar
					})
					.join(" ");
			}),
		// cpf: z
		// 	.string()
		// 	.min(1, { message: "※ O CPF é obrigatório!" })
		// 	.trim()
		// 	.refine(
		// 		(val) => val === undefined || val === "" || !isNaN(Number(val)),
		// 		{
		// 			message: "※ O CPF deve ser um número válido!",
		// 		}
		// 	)
		// 	.refine((val) => val === undefined || val.length === 11, {
		// 		message: "※ O CPF deve ter 11 dígitos.",
		// 	}),
		email: z
			.string()
			.min(1, "※ Informe um email válido!")
			.email("※ Formato de email inválido!")
			.toLowerCase(),
		password: z
			.string()
			.min(1, "※A senha é obrigatória!")
			.trim()
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
					message: "※ A senha precisa ter no mínimo 6 caracteres!",
				}
			)
			.refine((password) => {
				if (!password) return true; // Se for undefined, considera como válido

				const sanitized = DOMPurify.sanitize(password);

				return sanitized;
			}),
		confirmPassword: z.string().trim(),
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
			message: "※ As senhas precisam ser iguais!",
			path: ["confirmPassword"], // Define o caminho onde o erro será exibido
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
		defaultValues: {
			accountType: "",
		},
	});
	const { registerCustomer, registerPartner } = useContext(Context);

	const [btnLoading, setBtnLoading] = useState(false);

	const createUser = async (data: TCreateUserFormData) => {
		setBtnLoading(true); // Define o estado como true quando o login é iniciado
		try {
			if (data.accountType === "customer") {
				await registerCustomer(data);
			} else {
				await registerPartner(data);
			}
		} catch (error) {
			console.error("Erro no login:", error);
		} finally {
			setBtnLoading(false); // Define o estado como false após o login, independentemente do sucesso ou falha
		}
	};

	// function createUser(data: TCreateUserFormData) {
	// 	if (data.accountType === "customer") {
	// 		registerCustomer(data);
	// 	} else {
	// 		registerPartner(data);
	// 	}
	// }

	return (
		<section className="bg-gray-300 flex min-h-screen flex-col items-center justify-center p-24">
			<div className="flex flex-col items-center justify-center bg-primary w-[500px] h-[820px] rounded-md shadow-md m-4">
				<Image src={Logo} width={200} alt="logo" unoptimized />
				<h1 className="text-center text-2xl mt-2 mb-4">Cadastre-se</h1>
				<form onSubmit={handleSubmit(createUser)} autoComplete="off">
					<div className="mb-2">
						<div>
							<div className="label">
								<span className="label-text">
									Que tipo de conta deseja criar?
								</span>
							</div>
							<div className="flex flex-row items-center">
								<select
									className={`select ${
										errors.accountType
											? "focus:outline-none focus:ring focus:ring-red-500"
											: "focus:outline-none focus:ring focus:ring-green-500"
									} w-full max-w-xs`}
									{...register("accountType")}>
									<option value="" disabled>
										Escolha uma opção
									</option>
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
					{/* <InputUserForm
						htmlFor="cpf"
						labelTitle="CPF ou CNPJ"
						type="text"
						inputName="cpf"
						register={register}
						errors={errors}
					/> */}
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
					{btnLoading ? (
						<button className="flex flex-row justify-center items-center btn btn-secondary text-white  w-[320px] mt-4 select-none shadow-md mb-2">
							<span className="loading loading-spinner loading-md"></span>
						</button>
					) : (
						<button
							type="submit"
							className="btn btn-secondary text-white w-[320px] mt-4 shadow-md mb-2">
							Cadastrar
						</button>
					)}
				</form>
				<div className="flex flex-row gap-1">
					<span>Já possui uma conta?</span>

					<Link
						className="text-purple-900 hover:underline active:scale-[.97]"
						href="/login">
						Faça login
					</Link>
				</div>
			</div>
		</section>
	);
}

export default RegisterPage;
