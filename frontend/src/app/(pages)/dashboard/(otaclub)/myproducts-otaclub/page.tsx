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

function MyProductsOtaclubPage() {
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
      .get("/products/partner-otaclub-products", {
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
                            <div className="flex flex-col">
                              <div className="flex flex-row items-center gap-2">
                                <span>
                                  {Number(product.productPrice).toLocaleString(
                                    "pt-BR",
                                    {
                                      style: "currency",
                                      currency: "BRL",
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                            <br />
                          </td>
                          {/* <td className="text-black">
														{`${
															product.productVariations &&
															product
																.productVariations
																.length > 0
																? product.productVariations.reduce(
																		(
																			total,
																			variation
																		) => {
																			// Somando o estoque das variações
																			return (
																				total +
																				variation.options.reduce(
																					(
																						subTotal,
																						option
																					) =>
																						subTotal +
																						option.stock,
																					0
																				)
																			);
																		},
																		0
																  )
																: product.stock
														} un`}
													</td> */}
                          <th>
                            {/* <button className="flex items-center btn btn-primary btn-xs shadow-md">
                                                            <Link
                                                                href={`/dashboard/myproducts/${product._id}`}>
                                                                + Detalhes
                                                            </Link>
                                                        </button> */}

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

export default MyProductsOtaclubPage;
