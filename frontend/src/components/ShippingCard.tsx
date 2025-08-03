import Link from "next/link";
import Image from "next/image";

// Logos Transportadoras
import MelhorEnvioLogo from "../../public/melhorenvio-logo.png";
import CorreiosLogo from "../../public/correios-logo.png";
import LoggiLogo from "../../public/loggi-logo.png";
import JadLogLogo from "../../public/jadlog-logo.png";
import JeT from "../../public/jet-logo.png";
import Buslog from "../../public/buslog-logo.png";
import LatamCargo from "../../public/latamcargo-logo.png";
import AzulCargoLogo from "../../public/azulcargo-logo.png";
import ModicoLogo from "../../public/modico-logo.png";
import JapanPostLogo from "../../public/japanpost-logo.png";

// Icons
import { FiInfo } from "react-icons/fi";
import { PiMapPinLine, PiMapPinLineBold } from "react-icons/pi";

function ShippingCard({
  selectedOperators,
  handleAddOperator,
  handleModalityChange,
  modalityMapping,
}) {
  const operatorImages = {
    Correios: CorreiosLogo,
    Loggi: LoggiLogo,
    Jadlog: JadLogLogo,
    JeT: JeT,
    Buslog: Buslog,
    LatamCargo: LatamCargo,
    AzulCargo: AzulCargoLogo,
    RegistroModico: ModicoLogo,
    JapanPost: JapanPostLogo,
  };

  return (
    <>
      {[
        "Correios",
        "Loggi",
        "Jadlog",
        "JeT",
        "Buslog",
        "LatamCargo",
        "AzulCargo",
        "RegistroModico",
        "JapanPost",
      ].map((operator) => (
        <div
          key={operator}
          className="bg-white text-black w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4"
        >
          <div className="mb-4">
            <label className="flex justify-between mb-4">
              <div className="flex flex-row items-center gap-4">
                <input
                  type="checkbox"
                  onChange={() => handleAddOperator(operator)}
                  checked={selectedOperators.some(
                    (o) => o.shippingOperator === operator
                  )}
                  className="checkbox bg-slate-200"
                />
                {/* <span className="ml-2">{operator}</span> */}

                <Image
                  className="object-contain w-[100px]"
                  src={operatorImages[operator]}
                  alt="Tranportadora Logo"
                  width={100}
                  height={100}
                  unoptimized
                />
              </div>

              {operator === "RegistroModico" || operator === "JapanPost" ? (
                <></>
              ) : (
                <Image
                  className="object-contain w-[80px]"
                  src={MelhorEnvioLogo}
                  alt="Melhor Envio Logo"
                  width={150}
                  height={150}
                  unoptimized
                />
              )}
            </label>

            {selectedOperators.some((o) => o.shippingOperator === operator) && (
              <div className="flex flex-row gap-4 ml-6 mb-6">
                {modalityMapping[operator]?.map((modality) => (
                  <label key={modality} className="flex items-center">
                    <input
                      type="checkbox"
                      onChange={() => handleModalityChange(operator, modality)}
                      checked={
                        selectedOperators
                          .find((o) => o.shippingOperator === operator)
                          ?.modalityOptions.includes(modality) || false
                      }
                      className="checkbox bg-slate-200"
                    />

                    <span className="ml-2">{modality}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-row items-center gap-2">
              <FiInfo size={18} />
              <span className="mb-[2px]">
                Informações gerais: Esse tipo de frete é exclusivo do Melhor
                Envio, portanto leia todas as regras no site antes de
                configurar. ⇒{" "}
                <Link
                  className="text-secondary transition-all ease-in duration-200 hover:text-primary"
                  href={`https://centraldeajuda.melhorenvio.com.br/hc/pt-br/articles/31220401377556-Como-funciona-a-Loggi-pelo-Melhor-Envio`}
                  target="_blank"
                >
                  Regras
                </Link>{" "}
                ⇐
              </span>
            </div>
            <div className="flex flex-row items-center gap-2 -ml-[2px]">
              <PiMapPinLine size={22} />
              <span>
                Pontos de Postagem: Confira os pontos de postagem mais próximos
                à você, no mapa do Melhor Envio. ⇒{" "}
                <Link
                  className="text-secondary transition-all ease-in duration-200 hover:text-primary"
                  href={`https://melhorenvio.com.br/mapa`}
                  target="_blank"
                >
                  Mapa
                </Link>{" "}
                ⇐
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export { ShippingCard };
