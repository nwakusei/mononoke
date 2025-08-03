// Imports Essenciais
import Image from "next/image";
import { useRouter } from "next/navigation";

// Icons
import { Currency } from "@icon-park/react";
import { BsStar, BsStarHalf, BsStarFill } from "react-icons/bs";
import { LiaShippingFastSolid } from "react-icons/lia";

// Imagens
import AdultProductCover from "../../public/adult-content-cover.png";
import { RiCopperCoinLine, RiSwap2Line } from "react-icons/ri";

import CryptoJS from "crypto-js";

const secretKey = process.env.NEXT_PUBLIC_AES_SECRET_KEY as string;

function encryptData(data: unknown): string {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const iv = CryptoJS.lib.WordArray.random(16);

  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Retorna o IV + ":" + texto cifrado, para decodificação posterior
  return iv.toString() + ":" + encrypted.toString();
}

function ProductAdCardOtaclub({
  viewAdultContent,
  product,
  productImage,
  title,
  price,
}) {
  // LÓGICA DE EXIBIÇÃO DE CONTEÚDO ADULTO
  const isContentAllowed =
    product.adultProduct === true &&
    (viewAdultContent === false || viewAdultContent === undefined)
      ? false // Se o produto for adulto e o usuário não pode ver ou está deslogado, não exibe
      : true; // Exibe o produto se for não adulto ou o usuário pode ver conteúdo adulto

  const router = useRouter();

  const addOtaclubCheckout = async () => {
    localStorage.removeItem("otaclubProduct");

    console.log("DADOS DO PRODUTO", product);

    if (product && product._id) {
      const newProductOtaclub = {
        partnerID: product.partnerID,
        productID: product._id,
        productTitle: product.productTitle,
        productImage: product.productImages?.[0],
        productPrice: product.productPrice,
        weight: product.weight,
        length: product.length,
        width: product.width,
        height: product.height,
      };

      try {
        const encryptProductOtaclub = encryptData(newProductOtaclub); // Supondo que retorna string

        localStorage.setItem("otaclubProduct", encryptProductOtaclub);

        router.push(`/checkout-otaclub`);
      } catch (error) {
        console.error("Erro ao salvar no localStorage:", error);
      }
    } else {
      console.warn("Produto inválido");
    }
  };

  return (
    <div className="bg-white w-[254px] flex flex-col rounded-md relative pb-2 shadow-md select-none">
      <div className="flex flex-col items-center justify-center h-[220px] mx-3 mt-2 -mb-3">
        <div className="flex flex-col object-contain w-full h-full select-none pointer-events-none">
          <Image
            className="object-contain w-full h-full"
            src={isContentAllowed ? productImage : AdultProductCover}
            alt="Product Image"
            width={10}
            height={10}
            unoptimized
          />
        </div>
      </div>
      <div className="divider before:border-t-[1px] after:border-t-[1px] before:bg-black after:bg-black text-sm text-black mx-2">
        Detalhes
      </div>
      <div className="flex flex-col justify-center mx-4">
        <div className="-mt-2">
          <h1 className="font-semibold text-base text-black line-clamp-2 whitespace-normal min-h-[46px] mb-1">
            {title}
          </h1>
        </div>
        <div className="mb-3">
          <div className="flex flex-row items-center text-base text-black gap-2">
            <RiCopperCoinLine className="mt-[1px]" size={18} />
            <span>
              {`${price.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} OP`}
            </span>
          </div>
        </div>
        <button
          onClick={addOtaclubCheckout}
          className="flex flex-row items-center btn btn-primary w-full mb-2 shadow-md"
        >
          <RiSwap2Line size={20} />
          <span>Trocar</span>
        </button>
      </div>
    </div>
  );
}

export { ProductAdCardOtaclub };
