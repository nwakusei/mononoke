"use client";

// Imports Essenciais
import { useState, useEffect, useContext } from "react";

// Axios
import api from "@/utils/api";

// Context
import { Context } from "@/context/UserContext";

// Components
import { ProductAdCardOtaclub } from "@/components/ProductAdCardOtaclub";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Icons
import { FiInfo } from "react-icons/fi";

// // Imagens

function OtaclubPage() {
  const [products, setProducts] = useState<
    { category: string; [key: string]: any }[]
  >([]);
  const { partners } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [searchedText, setSearchedText] = useState("");
  const [returnedProducts, setReturnedProducts] = useState([]);
  const [rCategory, setRcategory] = useState([]);
  const [noResults, setNoResults] = useState(false); // Nova variável de estado

  const [user, setUser] = useState(null); // Inicializa como null
  const [token] = useState(() => localStorage.getItem("token") || "");

  const categories = [...new Set(products.map((product) => product.category))];

  console.log(products);

  const formatHighValues = (count: number) => {
    if (count >= 1000000) {
      // Formata números acima de 1 milhão
      const formattedCount = (count / 1000000).toFixed(1).replace(/\.0$/, ""); // Converte para milhões com uma casa decimal
      return `${formattedCount} milh${formattedCount !== "1" ? "ões" : "ão"}`; // Singular ou plural
    } else if (count >= 1000) {
      // Formata números a partir de 1000
      const formattedCount = (count / 1000).toFixed(1).replace(/\.0$/, ""); // Converte para milhar com uma casa decimal
      return `${formattedCount} mil`;
    }
    return count?.toString();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Faz o lookup para obter o ID correspondente à slug
        const productPromise = await api.get(
          `/products/get-allproducts-otaclub`
        );

        // Busca os dados do usuário, se o token estiver presente
        const userPromise = token
          ? api.get("/mononoke/check-user", {
              headers: {
                Authorization: `Bearer ${JSON.parse(token)}`,
              },
            })
          : Promise.resolve({ data: null }); // Se não estiver logado, retorna uma resposta "vazia" para o usuário

        // Aguarda todas as promessas
        const [productResponse, userResponse] = await Promise.all([
          productPromise,
          userPromise,
        ]);

        // Atualiza os estados com os dados obtidos
        setProducts(productResponse.data.products);

        // Se o usuário estiver logado, atualiza os dados do usuário
        if (userResponse.data) {
          setUser(userResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false); // Encerra o estado de carregamento
      }
    };

    setIsLoading(true); // Ativa o estado de carregamento antes de iniciar a busca
    fetchData();
  }, [token]); // A dependência de `token` garante que a lógica seja reavaliada se o token mudar

  const handleSearch = async () => {
    // Verifica se há texto na pesquisa antes de fazer a requisição
    if (!searchText.trim()) {
      return; // Se não houver texto, não faz a requisição
    }

    setSearchedText(searchText); // Atualiza o texto da pesquisa
    setRcategory([]); // Limpa o estado de categoria
    setIsLoading(true);
    setNoResults(false);

    const fetchReturnedProduct = async () => {
      try {
        const response = await api.post(`/searches/search-otamart`, {
          productTitle: searchText, // Envia o searchText no corpo da requisição
        });
        if (response.data.products.length > 0) {
          setReturnedProducts(response.data.products);
        } else {
          setNoResults(true);
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          setNoResults(true); // Define como true se o status for 404
        } else {
          console.error("Erro ao buscar o produto:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReturnedProduct();
  };

  const handleSearchCategory = async (category: string) => {
    if (!category || typeof category !== "string") {
      return;
    }

    setReturnedProducts([]); // Limpa os resultados da pesquisa
    setIsLoading(true);
    setNoResults(false);

    try {
      const response = await api.post(`/searches/search-category`, {
        category,
      });

      if (response.data.products.length > 0) {
        setRcategory(response.data.products);
      } else {
        setNoResults(true);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setNoResults(true); // Define como true se o status for 404
      } else {
        console.error("Erro ao buscar o produto:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para lidar com o pressionamento da tecla Enter
  const handleKeyDown = (evt) => {
    if (evt.key === "Enter") {
      handleSearch();
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <section className="min-h-screen bg-gray-100 grid grid-cols-6 md:grid-cols-8 grid-rows-1 gap-4">
      {/* <div className="flex flex-col items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="w-[1100px] md:text-2xl py-2 mt-8 select-none">
					<Image
						className="rounded-md"
						src={Banner}
						width={1100}
						height={50}
						alt="Banner Principal"
						unoptimized
					/>
				</div>
			</div> */}
      {/* <div className="flex flex-col items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6">
				<div className="bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold py-2 mt-8 mb-2 rounded-md shadow-md select-none">
					Categorias
				</div>
				<div className="flex flex-row justify-center gap-4 mt-3">
					<CategoryButton
						onCategoryClick={(category: string) =>
							handleSearchCategory(category)
						}
						categoriesDB={categories}
					/>
				</div>
			</div> */}
      <div className="flex flex-col items-center col-start-2 col-span-4 md:col-start-2 md:col-span-6 mb-16">
        {returnedProducts?.length === 0 && rCategory.length === 0 ? (
          <div className="flex flex-row justify-center gap-3 bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold overflow-hidden text-ellipsis whitespace-nowrap py-2 mt-8 mb-4 rounded-md shadow-md select-none">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[800px]">
              Produtos disponíveis para troca
            </span>
          </div>
        ) : rCategory.length > 0 ? (
          <div className="flex flex-row items-center justify-center gap-3 bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold overflow-hidden text-ellipsis whitespace-nowrap py-2 mt-8 mb-4 rounded-md shadow-md select-none">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[800px]">
              Resultado filtrado pela categoria
            </span>
          </div>
        ) : (
          <div className="flex flex-row items-center justify-center gap-3 bg-primary w-[1100px] text-center text-xl md:text-2xl font-semibold overflow-hidden text-ellipsis whitespace-nowrap py-2 mt-8 mb-4 rounded-md shadow-md select-none">
            <FiInfo className="mt-[2px]" size={20} />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[800px]">
              Resultado da pesquisa para '{searchedText}'
            </span>
          </div>
        )}

        {/* <div className="flex flex-row justify-center">
					<label className="input input-bordered input-primary flex items-center w-[1072px] gap-2 mb-8">
						<input
							type="text"
							className="grow bg-base-100"
							placeholder="Pesquisar no OtaClub"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							onKeyDown={handleKeyDown}
						/>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							fill="currentColor"
							className="h-4 w-4 opacity-70 cursor-pointer active:scale-[.97]"
							onClick={(e) => handleSearch(e)}>
							<path
								fillRule="evenodd"
								d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
								clipRule="evenodd"
							/>
						</svg>
					</label>
				</div> */}

        <div className="flex flex-row flex-wrap gap-4 justify-center">
          {noResults ? (
            <div className="min-h-screen">
              <p className="text-black text-center bg-white p-4 w-[500px] rounded-md shadow-md">
                Produto não encontrado!
              </p>
            </div>
          ) : rCategory.length > 0 ? (
            // Exibe os produtos filtrados pela categoria
            rCategory.map((categoryProduct) => {
              const partner = partners.find(
                (partner) => partner._id === categoryProduct.partnerID
              );

              return (
                <ProductAdCardOtaclub
                  key={categoryProduct._id}
                  viewAdultContent={user?.viewAdultContent}
                  product={categoryProduct}
                  productImage={`https://mononokebucket.s3.us-east-1.amazonaws.com/${categoryProduct.productImages[0]}`}
                  title={categoryProduct.productTitle}
                  price={Number(categoryProduct.productPrice)}
                />
              );
            })
          ) : returnedProducts.length > 0 ? (
            // Exibe os produtos filtrados pela pesquisa de texto
            returnedProducts.map((returnedProduct) => {
              const partner = partners.find(
                (partner) => partner._id === returnedProduct.partnerID
              );
              const cashback = partner ? partner.cashback : 0;

              return (
                <ProductAdCardOtaclub
                  key={`returned-${returnedProduct._id}`}
                  viewAdultContent={user?.viewAdultContent}
                  product={returnedProduct}
                  productImage={`https://mononokebucket.s3.us-east-1.amazonaws.com/${returnedProduct.productImages[0]}`}
                  title={returnedProduct.productTitle}
                  price={Number(returnedProduct.productPrice)}
                />
              );
            })
          ) : (
            // Exibe todos os produtos padrão
            products.map((product) => {
              const partner = partners.find(
                (partner) => partner._id === product.partnerID
              );
              const cashback = partner ? partner.cashback : 0;

              return (
                <ProductAdCardOtaclub
                  key={`product-${product._id}`}
                  viewAdultContent={user?.viewAdultContent}
                  product={product}
                  productImage={`https://mononokebucket.s3.us-east-1.amazonaws.com/${product.productImages[0]}`}
                  title={product.productTitle}
                  price={Number(product.productPrice)}
                />
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default OtaclubPage;
