"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode"; // Importe a biblioteca QRCode
import { toast } from "react-toastify";

// Axios
import api from "@/utils/api";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// Components
import { Sidebar } from "@/components/Sidebar";

// Icons
import { LuQrCode } from "react-icons/lu";
import { LoadingPage } from "@/components/LoadingPageComponent";
import { FaPix } from "react-icons/fa6";

// React Hook Form, Zod e ZodResolver
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createPixCodeFormSchema = z.object({
  inputValue: z
    .string()
    .min(1, "※ O valor é obrigatório!")
    .trim()
    .refine((value) => /^\d+,\d{2}$/.test(value), {
      message: "※ Insira um valor válido no formato 0,00!",
    })
    .transform((value) => parseFloat(value.replace(",", "."))),
});

type TCreatePixCodeFormSchema = z.infer<typeof createPixCodeFormSchema>;

function AddBalance() {
  const [user, setUser] = useState({});
  // const [userOtakupay, setUserOtakupay] = useState({});
  const [token] = useState(localStorage.getItem("token") || "");
  const [pix, setPix] = useState({});
  const [qrCodeUrl, setQrCodeUrl] = useState(""); // Estado para armazenar a URL do QR Code
  const [btnLoading, setBtnLoading] = useState(false);
  // Estado para armazenar o código do Pix copia e cola
  const [pixCode, setPixCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingButtonId, setLoadingButtonId] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TCreatePixCodeFormSchema>({
    resolver: zodResolver(createPixCodeFormSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    api
      .get("/mononoke/check-user", {
        headers: {
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
      })
      .then((response) => {
        setUser(response.data);
        setIsLoading(false);
      });
  }, [token]);

  const handleInputChange = (evt) => {
    setValue("inputValue", evt.target.value);
  };

  async function handleQRCode(data) {
    let originalValue = data.inputValue;

    try {
      setBtnLoading(true);
      const response = await api.post(
        "/interapi/createPixInter",
        { originalValue },
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(token)}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data && response.data.newInterPix) {
        setPix(response.data.newInterPix);
        setPixCode(response.data.newInterPix.pixCopiaECola);

        // Gerar o QR Code
        QRCode.toDataURL(
          response.data.newInterPix.pixCopiaECola,
          (err, url) => {
            if (err) {
              console.error(err);
              return;
            }
            setQrCodeUrl(url);
          }
        );
        setBtnLoading(false);
      }
    } catch (error) {
      setBtnLoading(false);
      toast.error("Ocorreu um erro. Por favor, tente novamente.");
    }
  }

  // Função para copiar o código do Pix copia e cola para a área de transferência
  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success("Código Pix copiado para a área de transferência!");
  };

  const handleClick = () => {
    setLoadingButtonId(true);
    setTimeout(() => {
      router.push(`/dashboard/wallet`);
    }, 2000); // O tempo pode ser ajustado conforme necessário
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
      <Sidebar />
      <div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mt-4">
        {/* Gadget 1 */}
        <div className="flex flex-row gap-4 mb-4">
          <div className="bg-white w-[1200px] p-6 rounded-md shadow-md">
            {/* Avatar e Boas vindas */}
            <div className="flex flex-row items-center gap-4 text-lg font-semibold ml-6 mb-6">
              <div className="flex flex-row items-center gap-2 text-black">
                <h1 className="text-2xl">Adicionar Saldo via PIX</h1>
                <FaPix size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Gadget 2 */}
        <div className="flex flex-row justify-center items-center bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-8 gap-10">
          {/* Tabela de Transações */}
          <div className="flex flex-col w-[250px] gap-2">
            <form onSubmit={handleSubmit(handleQRCode)}>
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text text-black">Digite o valor</span>
                </div>
                <div className="join">
                  <div className="indicator">
                    <span className="btn join-item">R$</span>
                  </div>
                  <input
                    type="text"
                    placeholder="0,00"
                    className={`input input-bordered ${
                      errors.inputValue ? `input-error` : `input-success`
                    } w-full max-w-xs rounded-l-none`}
                    {...register("inputValue")}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="label mb-2">
                  {errors.inputValue ? (
                    <span className="label-text-alt text-red-500">
                      {errors.inputValue.message}
                    </span>
                  ) : (
                    <span className="label-text-alt text-black">Ex.: 1,00</span>
                  )}
                </div>
                {btnLoading ? (
                  <button className="btn btn-primary">
                    <span className="loading loading-spinner loading-sm"></span>
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary shadow-md">
                    <LuQrCode size={18} /> Gerar QR Code
                  </button>
                )}
              </label>
              {/* <button type="submit" className="btn btn-primary">
								{btnLoading ? "Gerando..." : "Gerar QR Code"}
							</button> */}
            </form>
          </div>
          {/* Exibir o QR Code */}
          {qrCodeUrl ? (
            <div className="flex flex-row justify-center items-center gap-8">
              <div>
                <h2 className="mb-2 text-black">Escaneie o QR Code</h2>
                <div className="flex flex-col justify-center items-center bg-primary w-[210px] h-[210px] rounded-md shadow-md">
                  <Image
                    className="p-2 pointer-events-none"
                    src={qrCodeUrl}
                    alt="QR Code"
                    width={200}
                    height={200}
                    unoptimized
                  />
                </div>
              </div>
              <div className="divider divider-horizontal before:bg-gray-900 after:bg-gray-900 text-black">
                OU
              </div>
              <div className="relative">
                <h1 className="mb-2 text-black">Pix Copia e Cola</h1>
                <div
                  onClick={copyPixCode}
                  className="bg-primary w-[480px] h-[120px] overflow-hidden break-words select-none p-2 rounded-md shadow-md cursor-pointer transition-all ease-in duration-200 active:scale-[.97]"
                >
                  {pixCode}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-row justify-center items-center gap-8">
              <div>
                <h2 className="mb-2 text-black">Escaneie o QR Code</h2>
                <div className="flex justify-center items-center border border-1 border-dashed border-primary w-[210px] h-[210px] rounded-md">
                  <h2 className="mb-2 text-black">Nenhum QR Code gerado</h2>
                </div>
              </div>
              <div className="divider divider-horizontal before:bg-gray-900 after:bg-gray-900 text-black">
                OU
              </div>
              <div className="relative">
                <h1 className="mb-2 text-black">Pix Copia e Cola</h1>
                <div className="flex justify-center items-center border border-1 border-dashed border-primary w-[480px] h-[120px] overflow-hidden break-words p-2 rounded-md">
                  <h2 className="mb-2 text-black">Nenhum código Pix gerado</h2>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row justify-center bg-gray-300 h-screen">
          {loadingButtonId ? (
            <button className="flex flex-row items-center btn btn-primary shadow-md w-[200px]">
              <span className="loading loading-dots loading-md"></span>
            </button>
          ) : (
            <button
              onClick={handleClick}
              className="flex flex-row items-center btn btn-primary w-[200px] shadow-md"
            >
              Realizei o Pagamento
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default AddBalance;
