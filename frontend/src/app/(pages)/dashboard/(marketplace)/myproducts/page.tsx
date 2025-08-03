"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Axios
import api from "@/utils/api";

// Icons

function MyProductsPage() {
  const [token, setToken] = useState("");
  const [myproducts, setMyproducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingButtonId, setLoadingButtonId] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    api
      .get("/products/partner-products", {
        headers: {
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
      })
      .then((response) => {
        setMyproducts(response.data.products); // Ajuste para acessar a chave 'products'
        setIsLoading(false);
      });
  }, [token]);

  const handleClick = (orderId) => {
    setLoadingButtonId(orderId); // Define o ID do pedido que está carregando
    setTimeout(() => {
      router.push(`/dashboard/myproducts/${orderId}`);
    }, 2000); // O tempo pode ser ajustado conforme necessário
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  // Função para calcular o menor e maior preço, considerando o preço promocional
  const getPriceRange = (product) => {
    if (!product?.productVariations?.length)
      return {
        minPrice: 0,
        maxPrice: 0,
        originalPriceMin: 0,
        originalPriceMax: 0,
      };

    let minPrice = null;
    let maxPrice = null;
    let originalPriceMin = null;
    let originalPriceMax = null;
    let hasPromotion = false;

    // Percorre todas as variações para calcular o menor e maior preço promocional e original
    product.productVariations.forEach((variation) => {
      variation.options.forEach((option) => {
        const promoPrice =
          option.promotionalPrice > 0
            ? option.promotionalPrice
            : option.originalPrice;
        const original = option.originalPrice;

        // Verificando se existe promoção
        if (option.promotionalPrice > 0) {
          hasPromotion = true;
        }

        // Calculando o menor e maior preço promocional
        if (promoPrice > 0) {
          minPrice =
            minPrice === null ? promoPrice : Math.min(minPrice, promoPrice);
          maxPrice =
            maxPrice === null ? promoPrice : Math.max(maxPrice, promoPrice);
        }

        // Calculando o intervalo de preços originais
        originalPriceMin =
          originalPriceMin === null
            ? original
            : Math.min(originalPriceMin, original);
        originalPriceMax =
          originalPriceMax === null
            ? original
            : Math.max(originalPriceMax, original);
      });
    });

    return {
      minPrice: minPrice !== null ? minPrice : 0,
      maxPrice: maxPrice !== null ? maxPrice : 0,
      originalPriceMin: originalPriceMin !== null ? originalPriceMin : 0,
      originalPriceMax: originalPriceMax !== null ? originalPriceMax : 0,
      hasPromotion,
    };
  };

  return (
    <section className="min-h-screen bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
      <Sidebar />
      <div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
        <div className="flex flex-col gap-4 mb-8">
          {/* Gadget 1 */}
          <div className="bg-white w-[1200px] p-6 rounded-md mt-4 mr-4">
            {/* Adicionar Porduto */}
            <div className="flex flex-col gap-2 ml-6 mb-6">
              <h1 className="text-2xl font-semibold text-black">
                Produtos em Catálogo
              </h1>

              {/* Produtos em Catálogo */}
              <div className="overflow-y-auto flex-1">
                <table className="table">
                  {/* head */}
                  <thead>
                    <tr>
                      <th className="text-sm text-black">Nome do Produto</th>
                      <th className="text-sm text-black">Preço</th>
                      <th className="text-sm text-black">Estoque</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* row 1 */}
                    {myproducts.length > 0 &&
                      myproducts.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="mask mask-squircle w-12 h-12">
                                  <Image
                                    src={`https://mononokebucket.s3.us-east-1.amazonaws.com/${product.productImages[0]}`}
                                    alt="Avatar Tailwind CSS Component"
                                    width={12}
                                    height={12}
                                    unoptimized
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="font-bold text-black">
                                  {product.productTitle}
                                </div>
                                <div className="text-sm text-black opacity-50">
                                  {product.category}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-black">
                            {/* Verifica se o produto tem variações com preço promocional */}
                            {product.productVariations &&
                            product.productVariations.length > 0 ? (
                              <div className="flex flex-col">
                                {/* Exibe o intervalo de preços promocionais */}
                                <div className="flex flex-row items-center gap-2">
                                  <span>
                                    {Number(
                                      getPriceRange(product).minPrice
                                    ).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })}{" "}
                                    ~{" "}
                                    {Number(
                                      getPriceRange(product).maxPrice
                                    ).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })}
                                  </span>
                                </div>

                                {/* Exibe o intervalo de preços originais riscado apenas se houver promoção */}
                                {getPriceRange(product).hasPromotion && (
                                  <div className="flex flex-row items-center gap-2 mb-2">
                                    <span className="line-through text-xs">
                                      {Number(
                                        getPriceRange(product).originalPriceMin
                                      ).toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })}{" "}
                                      ~{" "}
                                      {Number(
                                        getPriceRange(product).originalPriceMax
                                      ).toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })}
                                    </span>
                                  </div>
                                )}

                                {/* Badge de promoção */}
                                {getPriceRange(product).hasPromotion && (
                                  <span className="badge badge-accent badge-sm shadow-md">
                                    Em Promoção
                                  </span>
                                )}
                              </div>
                            ) : (
                              // Caso não tenha variações, exibe o preço promocional ou o preço original
                              <div className="flex flex-col">
                                <div className="flex flex-row items-center gap-2">
                                  {/* Exibe o preço promocional se existir e for maior que zero, senão exibe o preço original */}
                                  {product.promotionalPrice > 0 ? (
                                    <span>
                                      {Number(
                                        product.promotionalPrice
                                      ).toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })}
                                    </span>
                                  ) : (
                                    <span>
                                      {Number(
                                        product.originalPrice
                                      ).toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })}
                                    </span>
                                  )}
                                </div>

                                {/* Exibe o preço original riscado apenas se o preço promocional for maior que zero */}
                                {product.promotionalPrice > 0 && (
                                  <>
                                    <div className="flex flex-row items-center gap-2">
                                      <span className="line-through text-xs">
                                        {Number(
                                          product.originalPrice
                                        ).toLocaleString("pt-BR", {
                                          style: "currency",
                                          currency: "BRL",
                                        })}
                                      </span>
                                    </div>
                                    <span className="badge badge-error badge-sm shadow-md mt-1">
                                      Em Promoção
                                    </span>
                                  </>
                                )}
                              </div>
                            )}

                            {/* <br /> */}
                          </td>

                          <td className="text-black">
                            {`${
                              product.productVariations &&
                              product.productVariations.length > 0
                                ? product.productVariations.reduce(
                                    (total, variation) => {
                                      // Somando o estoque das variações
                                      return (
                                        total +
                                        variation.options.reduce(
                                          (subTotal, option) =>
                                            subTotal + option.stock,
                                          0
                                        )
                                      );
                                    },
                                    0
                                  )
                                : product.stock
                            } un`}
                          </td>
                          <th>
                            {loadingButtonId === product._id ? (
                              <button className="flex items-center btn btn-primary btn-xs shadow-md w-[100px]">
                                <span className="loading loading-dots loading-sm"></span>
                              </button>
                            ) : (
                              <button
                                disabled
                                onClick={() => handleClick(product._id)} // Passa o ID do pedido
                                className="flex items-center btn btn-primary btn-xs shadow-md w-[100px]"
                              >
                                + Detalhes
                              </button>
                            )}
                          </th>
                        </tr>
                      ))}
                  </tbody>
                  {/* Table footer */}
                  {/* <tfoot>
										<tr>
											<th></th>
											<th>Name</th>
											<th>Job</th>
											<th>Favorite Color</th>
											<th></th>
										</tr>
									</tfoot> */}
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MyProductsPage;
