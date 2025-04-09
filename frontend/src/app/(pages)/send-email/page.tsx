"use client";

import React, { useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";

// Axios
import api from "@/utils/api";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// Component
import { InputUserForm } from "@/components/InputUserForm";

// Imagens
import Logo from "../../../../public/logo.png";

// Zod Hook Form
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const sendEmailForResetPasswordFormSchema = z.object({
	email: z
		.string()
		.min(1, "※ Informe um email válido!")
		.email("※ Formato de email inválido!")
		.toLowerCase(),
});

type TSendEmailForResetPasswordFromData = z.infer<
	typeof sendEmailForResetPasswordFormSchema
>;

function SendEmail() {
	const [loadingButton, setLoadingButton] = useState(false);
	const [emailSent, setEmailSent] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TSendEmailForResetPasswordFromData>({
		resolver: zodResolver(sendEmailForResetPasswordFormSchema),
	});

	const sendEmail = async (data: TSendEmailForResetPasswordFromData) => {
		setLoadingButton(true);

		try {
			const sanitizedEmail = DOMPurify.sanitize(data.email); // Sanitiza o email
			const response = await api.post("/resetpassword/send-email", {
				email: sanitizedEmail,
			});

			if (response.status === 200) {
				setEmailSent(true); // ativa o email enviado
			}
		} catch (error: any) {
			console.error("Erro ao enviar email:", error);

			Swal.fire({
				icon: "error",
				title: "Erro ao enviar email",
				text:
					error?.response?.data?.message ||
					error?.message ||
					"Ocorreu um erro inesperado.",
				showConfirmButton: true,
			});
		} finally {
			setLoadingButton(false);
		}
	};

	return (
		<section className="bg-gray-100 flex min-h-screen flex-col items-center justify-center p-24">
			<div className="flex flex-col items-center justify-center bg-primary w-[500px] h-[520px] rounded-md shadow-md m-4">
				<Image
					className="pointer-events-none select-none"
					src={Logo}
					width={200}
					height={200}
					alt="logo"
				/>

				{emailSent ? (
					<div className="text-center text-white">
						<h2 className="text-2xl font-bold mb-4">
							Verifique seu email
						</h2>
						<p className="text-base">
							Email enviado com sucesso!
							{/* Enviamos um link de redefinição de senha para o seu
							endereço de email. Clique no link para continuar o
							processo. */}
						</p>
					</div>
				) : (
					<form
						onSubmit={handleSubmit(sendEmail)}
						autoComplete="off"
						className="w-full flex flex-col items-center">
						<InputUserForm
							htmlFor="email"
							labelTitle="Digite seu email"
							type="email"
							inputName="email"
							register={register}
							errors={errors}
						/>

						{loadingButton ? (
							<button className="btn btn-secondary w-[320px] mt-4 shadow-md mb-2 cursor-not-allowed">
								<span className="loading loading-spinner loading-md"></span>
							</button>
						) : (
							<button
								type="submit"
								className="btn btn-secondary w-[320px] mt-4 shadow-md mb-2">
								Enviar
							</button>
						)}
					</form>
				)}
			</div>
		</section>
	);
}

export default SendEmail;
