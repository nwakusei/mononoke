"use client";

import { useContext, useEffect, useState } from "react";
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

const createUserFormSchema = z.object({
	email: z
		.string()
		.min(1, "O email é obrigatório!")
		.email("O formato do email é inválido!")
		.toLowerCase(),
	password: z.string().min(1, "A senha é obrigatória!").max(34, {
		message: "A senha precisa ter no máximo 34 caracteres!",
	}),
});

type TCreateUserFormData = z.infer<typeof createUserFormSchema>;

function LoginPage() {
	const [output, setOutput] = useState("");
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TCreateUserFormData>({
		resolver: zodResolver(createUserFormSchema),
	});

	const { loginUser } = useContext(Context);

	function signinUser(data: TCreateUserFormData) {
		loginUser(data);
		setOutput(JSON.stringify(data, null, 2));
	}

	return (
		<section className="flex min-h-screen flex-col items-center justify-center p-24">
			<div className="flex flex-col items-center justify-center bg-gray-500 w-[500px] h-[550px] rounded-md m-4">
				<Image src={Logo} width={60} alt="logo" unoptimized />
				<h1 className="text-center text-2xl mt-2 mb-4">Login</h1>
				<form onSubmit={handleSubmit(signinUser)}>
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

					<button
						type="submit"
						className="btn btn-primary w-[320px] mt-4">
						Entrar
					</button>
				</form>
				<br />
				<pre>{output}</pre>
			</div>
		</section>
	);
}

export default LoginPage;
