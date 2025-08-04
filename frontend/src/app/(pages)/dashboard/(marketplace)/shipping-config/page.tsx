"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";
import { ShippingCard } from "@/components/ShippingCard";
import { LiaShippingFastSolid } from "react-icons/lia";

// React Hook Form e Zod
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Zod Schema Shipping Configuration
const updateShippingFormSchema = z
  .object({
    tokenMelhorEnvio: z.string().optional(),
    shippingConfiguration: z.array(
      z.object({
        shippingOperator: z.enum([
          "Correios",
          "Loggi",
          "Jadlog",
          "JeT",
          "Buslog",
          "LatamCargo",
          "AzulCargo",
          "RegistroModico",
          "JapanPost",
        ]),
        modalityOptions: z.array(z.string()).optional(),
      })
    ),
  })
  .superRefine((data, ctx) => {
    const exigeToken = data.shippingConfiguration.some(
      (op) =>
        op.shippingOperator !== "RegistroModico" &&
        op.shippingOperator !== "JapanPost"
    );

    if (exigeToken) {
      if (!data.tokenMelhorEnvio || data.tokenMelhorEnvio.length < 500) {
        ctx.addIssue({
          path: ["tokenMelhorEnvio"],
          code: z.ZodIssueCode.custom,
          message:
            "※ O token do Melhor Envio é obrigatório e deve conter no mínimo 500 caracteres.",
        });
      }
    }
  });

type TUpdateShippingFormData = z.infer<typeof updateShippingFormSchema>;

function ShippingConfigPage() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingButton, setLoadingButton] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const [selectedOperators, setSelectedOperators] = useState<
    TUpdateShippingFormData["shippingConfiguration"]
  >([]);

  const modalityMapping = {
    Correios: ["Mini Envios", "PAC", "SEDEX"],
    Loggi: ["Ponto", "Express", "Coleta"],
    Jadlog: [".Package", ".Com", ".Package Centralizado"],
    JeT: ["Standard"],
    Buslog: ["Rodoviário"],
    LatamCargo: ["éFácil"],
    AzulCargo: ["Expresso", "e-commerce"],
    RegistroModico: ["Registro Módico"],
    JapanPost: ["Airmail (Registred)", "EMS"],
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    getValues,
    trigger,
  } = useForm<TUpdateShippingFormData>({
    resolver: zodResolver(updateShippingFormSchema),
    defaultValues: {
      // shippingConfiguration: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "shippingConfiguration",
  });

  const [focusStates, setFocusStates] = useState({});

  // Função que altera o foco de cada campo individualmente
  const handleFocus = (fieldName: string) => {
    setFocusStates((prevState) => ({
      ...prevState,
      [fieldName]: true,
    }));
  };

  // Função que remove o foco de cada campo individualmente
  const handleBlur = (fieldName: string) => {
    setFocusStates((prevState) => ({
      ...prevState,
      [fieldName]: false,
    }));
  };

  const getFieldClass = (fieldName: string, fieldType: string) => {
    // Obtém o valor do campo com o fieldName dinâmico
    const value = getValues(fieldName);
    const isFocused = focusStates[fieldName];

    // Acessando o erro de acordo com o padrão do fieldName
    let error;

    // Verifica se o fieldName pertence a um campo de variação
    if (fieldName.startsWith("productVariations")) {
      const fieldPath = fieldName.split(".");

      if (fieldPath.length === 3) {
        // Acesso ao título da variação: productVariations.${variationIndex}.title
        const variationIndex = fieldPath[1];
        const key = fieldPath[2];
        error = errors?.productVariations?.[variationIndex]?.[key];
      } else if (fieldPath.length === 5) {
        // Acesso à opção de variação: productVariations.${variationIndex}.options.${optionIndex}.name
        const variationIndex = fieldPath[1];
        const optionIndex = fieldPath[3];
        const key = fieldPath[4];
        error =
          errors?.productVariations?.[variationIndex]?.options?.[optionIndex]?.[
            key
          ];
      }
    } else {
      // Para campos simples (não relacionados a variações)
      error = errors?.[fieldName];
    }

    // Lógica para determinar a classe do campo com base no foco e erro
    if (isFocused) {
      if (!value && !error) {
        return `${fieldType}-success`; // Foco verde se vazio e sem erro
      }
      return error ? `${fieldType}-error` : `${fieldType}-success`; // Foco vermelho se erro, verde se válido
    }

    // Quando o campo perde o foco:
    if (!value && error) {
      return `${fieldType}-error`; // Foco vermelho se vazio e erro
    }

    if (value && error) {
      return `${fieldType}-error`; // Foco vermelho se preenchido e erro
    }

    if (value && !error) {
      return `${fieldType}-success`; // Foco verde se estiver preenchido corretamente e sem erro
    }

    return ""; // Sem cor se não há erro e o campo estiver vazio
  };

  useEffect(() => {
    api
      .get("/mononoke/check-user", {
        headers: {
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
      })
      .then((response) => {
        setUser(response.data);
        if (response.data.shippingConfiguration) {
          setSelectedOperators(response.data.shippingConfiguration);
        }
        setIsLoading(false);
      });
  }, [token]);

  // Função para adicionar ou remover operador
  const handleAddOperator = (operator) => {
    setSelectedOperators((prev = []) => {
      const exists = prev.some((o) => o.shippingOperator === operator);
      if (exists) {
        return prev.filter((o) => o.shippingOperator !== operator);
      } else {
        return [...prev, { shippingOperator: operator, modalityOptions: [] }];
      }
    });
  };

  // Função para adicionar ou remover modalidade de um operador
  const handleModalityChange = (operator, modality) => {
    setSelectedOperators((prev = []) =>
      prev.map((o) =>
        o.shippingOperator === operator
          ? {
              ...o,
              modalityOptions: o.modalityOptions.includes(modality)
                ? o.modalityOptions.filter((m) => m !== modality)
                : [...o.modalityOptions, modality],
            }
          : o
      )
    );
  };

  const handleCancelar = () => {
    // Redirecionar para outra página ao clicar em Cancelar
    router.push("/dashboard");
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  async function updateShipping(data: TUpdateShippingFormData) {
    if (!selectedOperators || selectedOperators.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Nenhuma transportadora e/ou modalidade de envio selecionada(o).",
        confirmButtonText: "OK",
        confirmButtonColor: "#8b0000",
      });
      return;
    }

    const exigeToken = selectedOperators.some(
      (op) =>
        op.shippingOperator !== "RegistroModico" &&
        op.shippingOperator !== "JapanPost"
    );

    if (exigeToken) {
      if (!data.tokenMelhorEnvio || data.tokenMelhorEnvio.length < 500) {
        Swal.fire({
          icon: "error",
          title: "Token obrigatório",
          text: "※ O token do Melhor Envio é obrigatório e deve conter no mínimo 500 caracteres.",
          confirmButtonText: "OK",
          confirmButtonColor: "#8b0000",
        });
        return;
      }
    }

    const payload = {
      tokenMelhorEnvio: data.tokenMelhorEnvio,
      shippingConfiguration: selectedOperators,
    };

    try {
      setLoadingButton(true);

      const response = await api.patch("/shippings/edit-shipping", payload);

      toast.success(response.data.message);
      setLoadingButton(false);
    } catch (error: any) {
      console.error("Erro na requisição:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Erro ao atualizar o envio");
      setLoadingButton(false);
    }
  }

  return (
    <section className="min-h-screen bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
      {/* Seu sidebar ou outros componentes */}
      <Sidebar />
      <div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
        <div className="flex flex-col gap-4 mt-4 mb-8">
          <div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4">
            <div className="flex flex-row items-center gap-4">
              <LiaShippingFastSolid size={35} />
              <h1 className="text-2xl font-semibold text-black">
                Configurações de Envio
              </h1>
            </div>
          </div>

          <div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4">
            <div className="flex flex-row items-center gap-4">
              <p className="text-base text-black">
                Atenção: O frete é pago pelo cliente na compra, portanto o envio
                é responssabilidade da Loja (atualmente o Mononoke não oferece
                um sistema interno de logística). Após a compra ser feita pelo
                cliente, verifique corretamente o frete escolhido e prossiga de
                acordo com o operador logístico responsável (Caso seja Melhor
                Envio, acesse a sua conta, simule o frete, selecione a opção
                escolhida pelo cliente e compre a etiqueta).
              </p>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(updateShipping)} autoComplete="off">
            <div className="bg-white text-black w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
              <div className="mb-4">
                Info: Caso utilize o Melhor Envio como operador logístico,
                informe o token no campo abaixo. Para localizar o token, acesse
                seu painel Melhor Envio » Integrações » Permissões de Acesso »
                Gerar Novo Token » Avançar » selecione shipping-calculate
                (Cotação de fretes) » Gerar Token » Copie o código gerado.
              </div>
              <label className="form-control">
                <div className="label">
                  <span className="label-text text-black">
                    Token Melhor Envio
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="..."
                    className={`input input-bordered ${getFieldClass(
                      "tokenMelhorEnvio",
                      "input"
                    )} bg-slate-200 text-slate-900 w-full`}
                    defaultValue={user?.tokenMelhorEnvio}
                    {...register("tokenMelhorEnvio", {
                      onChange: () => trigger("tokenMelhorEnvio"),
                    })}
                    onFocus={() => handleFocus("tokenMelhorEnvio")}
                    onBlur={() => handleBlur("tokenMelhorEnvio")}
                  />
                </div>

                <div className="label">
                  {errors.tokenMelhorEnvio ? (
                    <span className="text-red-500 label-text-alt">
                      {errors.tokenMelhorEnvio?.message}
                    </span>
                  ) : (
                    <span className="label-text-alt text-black">
                      ※ Só é obrigatório caso utilize o Melhor Envio como
                      operador logístico
                    </span>
                  )}
                </div>
              </label>
            </div>
            <ShippingCard
              selectedOperators={selectedOperators}
              handleAddOperator={handleAddOperator}
              handleModalityChange={handleModalityChange}
              modalityMapping={modalityMapping}
            />
            {/* Gadget 6 */}
            <div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4">
              {/* Adicionar Porduto */}
              <div className="flex flex-col gap-2 ml-6 mb-6">
                <h1 className="text-2xl font-semibold mb-4 text-black">
                  Deseja salvar as configurações de envio?
                </h1>
                {/* Nome e Descrição */}

                <div className="flex flex-row gap-4">
                  <button
                    type="button"
                    onClick={handleCancelar}
                    className="btn btn-outline btn-error hover:shadow-md"
                  >
                    Cancelar
                  </button>
                  {loadingButton ? (
                    <button className="btn btn-primary shadow-md w-[200px]">
                      <span className="loading loading-spinner loading-md"></span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-primary shadow-md w-[200px]"
                    >
                      Atualizar
                    </button>
                  )}
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

export default ShippingConfigPage;
