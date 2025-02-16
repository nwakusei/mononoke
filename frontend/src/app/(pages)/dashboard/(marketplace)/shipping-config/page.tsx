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

// Zod Schema
const updateShippingFormSchema = z.object({
	shippingConfiguration: z.array(
		z.object({
			shippingOperator: z.enum(["MelhorEnvio", "Modico"]),
			modalityOptions: z.array(z.string()).optional(),
		})
	),
});

type TUpdateShippingFormData = z.infer<typeof updateShippingFormSchema>;

function ShippingConfigPage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState<any>({});
	const [isLoading, setIsLoading] = useState(true);
	const [loadingButton, setLoadingButton] = useState(false);
	const router = useRouter();

	const [selectedOperators, setSelectedOperators] = useState<
		TUpdateShippingFormData["shippingConfiguration"]
	>([]);

	console.log("Operators", selectedOperators);

	const modalityMapping = {
		MelhorEnvio: ["2", "31"],
		Loggi: ["Loggi (Ponto)"],
		JapanPost: ["Small Packet"],
		AzulCargo: ["Loggi (Ponto)"],
	};

	const {
		register,
		handleSubmit,
		formState: { errors },
		control,
		watch,
	} = useForm<TUpdateShippingFormData>({
		resolver: zodResolver(updateShippingFormSchema),
		defaultValues: {
			shippingConfiguration: [],
		},
	});

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: "shippingConfiguration",
	});

	useEffect(() => {
		api.get("/otakuprime/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setUser(response.data);
			if (response.data.shippingConfiguration) {
				setSelectedOperators(response.data.shippingConfiguration);
			}
			setIsLoading(false);
		});
	}, [token]);

	// Função para adicionar ou remover operador
	const handleAddOperator = (operator) => {
		setSelectedOperators((prev) => {
			const exists = prev.some((o) => o.shippingOperator === operator);
			if (exists) {
				return prev.filter((o) => o.shippingOperator !== operator);
			} else {
				return [
					...prev,
					{ shippingOperator: operator, modalityOptions: [] },
				];
			}
		});
	};

	// Função para adicionar ou remover modalidade de um operador
	const handleModalityChange = (operator, modality) => {
		setSelectedOperators((prev) =>
			prev.map((o) =>
				o.shippingOperator === operator
					? {
							...o,
							modalityOptions: o.modalityOptions.includes(
								modality
							)
								? o.modalityOptions.filter(
										(m) => m !== modality
								  )
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
		alert("Funcionou");

		console.log(data);

		// // Certifique-se de que selectedOperators seja atribuído ao shippingConfiguration diretamente
		// const selectedOperatorsData = selectedOperators;

		// // Sanitiza os dados antes de usá-los
		// const sanitizedData = Object.fromEntries(
		// 	Object.entries(data).map(([key, value]) => {
		// 		if (
		// 			typeof value === "string" &&
		// 			key !== "shippingConfiguration"
		// 		) {
		// 			return [key, DOMPurify.sanitize(value)];
		// 		}
		// 		return [key, value];
		// 	})
		// );

		// // Adiciona selectedOperators diretamente ao campo shippingConfiguration
		// sanitizedData.shippingConfiguration = selectedOperatorsData;

		// // Verifique os dados após sanitização
		// setOutput(JSON.stringify(sanitizedData, null, 2));
		// console.log("Dados sanitizados:", sanitizedData);

		// // Cria um novo FormData
		// const formData = new FormData();

		// // Adiciona a configuração de envio (shippingConfiguration) como JSON stringificado
		// formData.append(
		// 	"shippingConfiguration",
		// 	JSON.stringify(sanitizedData.shippingConfiguration)
		// );
		// console.log(
		// 	`Adicionado ao FormData: shippingConfiguration - ${JSON.stringify(
		// 		sanitizedData.shippingConfiguration
		// 	)}`
		// );

		// // Adiciona os outros dados no FormData
		// Object.entries(sanitizedData).forEach(([key, value]) => {
		// 	if (key !== "shippingConfiguration" && key !== "modalityOptions") {
		// 		if (key === "profileImage" && value instanceof File) {
		// 			formData.append(key, value);
		// 			console.log(
		// 				`Adicionado ao FormData: ${key} - [Imagem de Perfil]`
		// 			);
		// 		} else if (key === "LogoImage" && value instanceof File) {
		// 			formData.append(key, value);
		// 			console.log(`Adicionado ao FormData: ${key} - [Logo]`);
		// 		} else {
		// 			formData.append(key, value);
		// 			console.log(`Adicionado ao FormData: ${key} - ${value}`);
		// 		}
		// 	}
		// });

		// try {
		// 	setLoadingButton(true);

		// 	// Envio para o servidor
		// 	if (user?.accountType === "partner") {
		// 		const response = await api.patch("/partners/edit", formData);
		// 		toast.success(response.data.message);
		// 	} else if (user?.accountType === "customer") {
		// 		const response = await api.patch("/customers/edit", formData);
		// 		toast.success(response.data.message);
		// 	}
		// 	setLoadingButton(false);
		// } catch (error: any) {
		// 	toast.error(error.response.data.message);
		// 	setLoadingButton(false);
		// }
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
					{/* Formulário */}
					<form onSubmit={handleSubmit(updateShipping)}>
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
										className="btn btn-outline btn-error hover:shadow-md">
										Cancelar
									</button>
									{loadingButton ? (
										<button className="btn btn-primary shadow-md w-[200px]">
											<span className="loading loading-spinner loading-md"></span>
										</button>
									) : (
										<button
											type="submit"
											className="btn btn-primary shadow-md w-[200px]">
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
