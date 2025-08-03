"use client";

import React, { useState } from "react";
import Image from "next/image";
import api from "@/utils/api";
import DOMPurify from "dompurify";

// Component
import { InputUserForm } from "@/components/InputUserForm";
import Logo from "../../../../public/logo.png";

// Zod Hook Form
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";

const createNewUserPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(1, "※A senha é obrigatória!")
      .trim()
      .refine(
        (value) => {
          if (value === undefined || value === "") return true;
          return value.length >= 6;
        },
        { message: "※ A senha precisa ter no mínimo 6 caracteres!" }
      )
      .refine((password) => {
        if (!password) return true;
        const sanitized = DOMPurify.sanitize(password);
        return sanitized;
      }),
    confirmPassword: z.string().trim(),
  })
  .refine(
    (data) => {
      if (!data.password) return true;
      return data.password === data.confirmPassword;
    },
    {
      message: "※ As senhas precisam ser iguais!",
      path: ["confirmPassword"],
    }
  );

type TCreateNewUserPasswordFormData = z.infer<
  typeof createNewUserPasswordFormSchema
>;

// 🔧 Recebe o token diretamente via searchParams do App Router
export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const [loadingButton, setLoadingButton] = useState(false);
  const token = searchParams.token;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TCreateNewUserPasswordFormData>({
    resolver: zodResolver(createNewUserPasswordFormSchema),
  });

  const resetPassword = async (data: TCreateNewUserPasswordFormData) => {
    setLoadingButton(true);

    try {
      const response = await api.post("/resetpassword/reset-password", {
        token: token,
        newPassword: data.password,
      });

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Sucesso",
          text: "Senha redefinida com sucesso!",
          showConfirmButton: true,
        });
      }
    } catch (error) {
      console.error("Erro ao redefinir a senha:", error);
    }

    setLoadingButton(false);
  };

  return (
    <section className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center justify-center bg-primary w-[500px] h-[520px] rounded-md shadow-md m-4">
        <Image
          className="pointer-events-none select-none"
          src={Logo}
          width={200}
          height={200}
          alt="logo"
        />

        <h1 className="text-center text-2xl mt-2 mb-4">Resetar Senha</h1>

        <form onSubmit={handleSubmit(resetPassword)} autoComplete="off">
          <InputUserForm
            htmlFor="password"
            labelTitle="Nova Senha"
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

          {loadingButton ? (
            <button className="flex flex-row justify-center items-center btn btn-secondary w-[320px] mt-4 select-none shadow-md mb-2">
              <span className="loading loading-spinner loading-md"></span>
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-secondary w-[320px] mt-4 select-none shadow-md mb-2"
            >
              Resetar
            </button>
          )}
        </form>
      </div>
    </section>
  );
}
