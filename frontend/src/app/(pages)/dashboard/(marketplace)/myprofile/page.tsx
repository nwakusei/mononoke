"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Bliblioteca de Sanitização
import DOMPurify from "dompurify";

// React Hook Form e Zod
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Axios
import api from "@/utils/api";

// Components
import { Sidebar } from "@/components/Sidebar";
import { LoadingPage } from "@/components/LoadingPageComponent";

// Icons
import { AddPicture, Key } from "@icon-park/react";
import { FiInfo } from "react-icons/fi";

import crypto from "crypto";

const secretKey = "chaveSuperSecretaDe32charsdgklot";
// Função para Descriptografar dados sensíveis no Banco de Dados
function decrypt(encryptedBalance: string): number | null {
	let decrypted = "";

	try {
		// Divide o IV do texto criptografado
		const [ivHex, encryptedData] = encryptedBalance.split(":");
		if (!ivHex || !encryptedData) {
			throw new Error("Formato inválido do texto criptografado.");
		}

		const iv = Buffer.from(ivHex, "hex");

		const decipher = crypto.createDecipheriv(
			"aes-256-cbc",
			Buffer.from(secretKey, "utf-8"),
			iv
		);

		decipher.setAutoPadding(false);

		decrypted = decipher.update(encryptedData, "hex", "utf8");
		decrypted += decipher.final("utf8");

		const balanceNumber = parseFloat(decrypted.trim()); // Remove espaços em branco extras
		if (isNaN(balanceNumber)) {
			return null;
		}
		return parseFloat(balanceNumber.toFixed(2));
	} catch (error) {
		console.error("Erro ao descriptografar o saldo:", error);
		return null;
	}
}

// Zod Schema
const updateUserFormSchema = z
	.object({
		profileImage: z
			.instanceof(FileList)
			.transform((list) => list.item(0))
			.optional() // Torna a imagem opcional
			.refine(
				(file) => file === null || file!.size <= 2 * 1024 * 1024, // Verifica se é null ou se o tamanho está dentro do limite
				"※ O arquivo precisa ter no máximo 2Mb!"
			)
			.refine(
				(file) =>
					file === null || /\.(jpg|jpeg|png)$/i.test(file!.name), // Verifica se a extensão é JPG, JPEG ou PNG
				"※ O arquivo precisa ser do tipo JPG, JPEG ou PNG!"
			),
		logoImage: z
			.instanceof(FileList)
			.transform((list) => list.item(0))
			.optional()
			.refine(
				(file) => file === null || file!.size <= 2 * 1024 * 1024, // Verifica se é null ou se o tamanho está dentro do limite
				"※ O arquivo precisa ter no máximo 2Mb!"
			)
			.refine(
				(file) =>
					file === null || /\.(jpg|jpeg|png)$/i.test(file!.name), // Verifica se a extensão é JPG, JPEG ou PNG
				"※ O arquivo precisa ser do tipo JPG, JPEG ou PNG!"
			),
		name: z
			.string()
			.min(1, "※ Digite o nome!")
			.trim()
			.refine(
				(name) => {
					const sanitized = DOMPurify.sanitize(name);

					// Valida que o nome não contém caracteres não permitidos usando regex
					const isValid = /^[A-Za-zÀ-ÿ\s]+$/.test(sanitized);
					return isValid;
				},
				{
					message: "※ O nome deve conter apenas letras e espaços!",
				}
			)
			.transform((name) => {
				// Sanitiza a entrada
				const sanitized = DOMPurify.sanitize(name);

				// Formata o nome
				return sanitized
					.toLocaleLowerCase()
					.trim()
					.split(" ")
					.map((word) => {
						if (word && word.length > 0) {
							return (
								word[0].toLocaleUpperCase() + word.substring(1)
							);
						}
						return word; // ou return ""; para descartar
					})
					.join(" ");
			}),
		nickname: z
			.string()
			.min(1, "※ Digite o nickname!")
			.max(15, "※ O nickname deve ter no máximo 15 caracteres!")
			.toLowerCase()
			.trim()
			.refine(
				(name) => {
					const sanitized = DOMPurify.sanitize(name);

					// Valida que o nome não contém caracteres não permitidos usando regex
					const isValid = /^[A-Za-zÀ-ÿ\s.]+$/.test(sanitized); // Permite letras, acentos, espaços e pontos
					return isValid;
				},
				{
					message: "※ O nickname possui caractere não permitido!",
				}
			),
		email: z
			.string()
			.min(1, "※ Informe um email válido!")
			.email("※ Formato de email inválido!")
			.toLowerCase(),
		cpf: z
			.string()
			.trim()
			.optional()
			.refine(
				(val) => val === undefined || val === "" || !isNaN(Number(val)),
				{
					message: "※ O CPF deve ser um número válido!",
				}
			)
			.refine((val) => val === undefined || val.length === 11, {
				message: "※ O CPF deve ter 11 dígitos.",
			}),
		cpfCnpj: z
			.string()
			.trim()
			.optional()
			.refine(
				(val) => val === undefined || val === "" || !isNaN(Number(val)),
				{
					message: "※ O CNPJ/CPF deve ser um número válido!",
				}
			)
			.refine(
				(val) => {
					// Verifica se é null ou se o tamanho é 11 ou 14
					return (
						val === undefined ||
						val.length === 11 ||
						val.length === 14
					);
				},
				{
					message:
						"※ O CNPJ deve ter 14 dígitos | O CPF deve ter 11 dígitos.",
				}
			),
		description: z
			.string()
			.trim()
			.optional()
			.refine(
				(value) => {
					if (value === undefined || value === "") {
						return true;
					}

					return value.length >= 100 && value.length <= 150;
				},
				{
					message:
						"※ A descrição precisa ter entre 100 e 150 caracteres!",
				}
			),
		viewAdultContent: z.string().min(1, "※ item obrigatório!"),
		street: z
			.string()
			.min(1, "※ Digite o nome da rua e o número!")
			.trim()
			.refine(
				(st) => {
					const sanitized = DOMPurify.sanitize(st);

					// Expressão regular que permite Texto, números, ponto e traço
					const isValid = /^[A-Za-zÀ-ÿ\s.,\-0-9]+$/.test(sanitized);

					return isValid;
				},
				{
					message: "※ Endereço inválido!",
				}
			)
			.transform((st) => {
				return st.trim();
			}),
		complement: z
			.string()
			.trim()
			.optional()
			.refine(
				(comp) => {
					if (!comp) return true; // Se for undefined, considera como válido

					const sanitized = DOMPurify.sanitize(comp);

					// Expressão regular que permite Texto, números, ponto e traço
					const isValid = /^[A-Za-zÀ-ÿ\s.\-0-9]+$/.test(sanitized);

					return isValid;
				},
				{
					message: "※ Complemento inválido!",
				}
			)
			.transform((comp) => {
				return comp?.trim();
			}),
		neighborhood: z
			.string()
			.min(1, "※ Digite o nome do bairro!")
			.trim()
			.refine(
				(nbh) => {
					const sanitized = DOMPurify.sanitize(nbh);

					const isValid = /^[A-Za-zÀ-ÿ\s.\-0-9]+$/.test(sanitized);

					return isValid;
				},
				{
					message: "※ Bairro inválido!",
				}
			)
			.transform((nbh) => {
				return nbh.trim();
			}),
		city: z
			.string()
			.min(1, "※ Digite o nome da cidade!")
			.trim()
			.refine(
				(city) => {
					const sanitized = DOMPurify.sanitize(city);

					const isValid = /^[A-Za-zÀ-ÿ\s.\-0-9]+$/.test(sanitized);

					return isValid;
				},
				{
					message: "※ Cidade inválida!",
				}
			)
			.transform((city) => {
				return city.trim();
			}),
		state: z
			.string()
			.trim()
			.refine((val) => val !== "default" && val.trim() !== "", {
				message: "※ Informe o estado!",
			}),
		postalCode: z
			.string()
			.min(8, "※ Digite o número do CEP!")
			.max(8, "※ O CEP precisa ter 8 números!")
			.trim()
			.refine(
				(val) => val === undefined || val === "" || !isNaN(Number(val)),
				{
					message: "※ O CEP deve ser um número válido!",
				}
			),
		// shippingConfiguration: z.array(
		// 	z.object({
		// 		shippingOperator: z.enum(["MelhorEnvio", "Modico"]),
		// 		modalityOptions: z.array(z.string()).optional(),
		// 	})
		// ), // Garante que modalityOptions é um array de strings
		// credential: z.string(), // Torna opcional inicialmente
		cashback: z
			.string()
			.trim()
			.optional() // Mantém como opcional inicialmente
			.refine(
				(val) => val === undefined || val === "" || !isNaN(Number(val)),
				{
					message: "※ O Cashback deve ser um número válido!",
				}
			)
			.refine(
				(val) =>
					val === undefined ||
					val === "" ||
					Number.isInteger(Number(val)),
				{
					message: "※ O Cashback deve ser um número inteiro!",
				}
			)
			.refine(
				(val) => val === undefined || val === "" || Number(val) >= 1,
				{
					message: "※ O Cashback não pode ser menor do que 1%!",
				}
			)
			.transform((val) => (val ? Number(val) : undefined)), // Converte a string para número ou retorna undefined
		password: z
			.string()
			.trim()
			.optional()
			.refine(
				(value) => {
					if (value === undefined || value === "") {
						// Se o valor é undefined ou uma string vazia, a validação passa
						return true;
					}
					// Se o valor não for uma string vazia, deve ter pelo menos 6 caracteres
					return value.length >= 6;
				},
				{
					message: "※ A senha precisa ter no mínimo 6 caracteres!",
				}
			)
			.refine((password) => {
				if (!password) return true; // Se for undefined, considera como válido

				const sanitized = DOMPurify.sanitize(password);

				return sanitized;
			}),
		confirmPassword: z.string().trim().optional(),
	})
	.refine(
		(data) => {
			// Se password não for fornecida, não há necessidade de validar confirmPassword
			if (!data.password) {
				return true;
			}
			// Se password for fornecida, confirmPassword também deve ser fornecida e ser igual a password
			return data.password === data.confirmPassword;
		},
		{
			message: "※ As senhas precisam ser iguais!",
			path: ["confirmPassword"], // Define o caminho onde o erro será exibido
		}
	)
	.refine(
		(data) => {
			const hasCpf = !!data.cpf;
			const hasCnpj = !!data.cpfCnpj;

			return (hasCpf && !hasCnpj) || (!hasCpf && hasCnpj);
		},
		{
			message: "※ Preencha apenas um dos campos: CPF ou CNPJ.",
			path: ["cpf", "cpfCnpj"], // Onde o erro será associado
		}
	)
	// .refine(
	// 	(data) => {
	// 		const hasCpfCnpj = !!data.cpfCnpj;
	// 		return !hasCpfCnpj || !!data.credential; // Credencial deve ser preenchido se CPF/CNPJ estiver preenchido
	// 	},
	// 	{
	// 		message: "※ A Credencial Kangu é obrigatória!",
	// 		path: ["credential"], // Mensagem associada ao campo credential
	// 	}
	// )
	.refine(
		(data) => {
			const hasCpfCnpj = !!data.cpfCnpj;
			return !hasCpfCnpj || !!data.cashback; // Cashback deve ser preenchido se CPF/CNPJ estiver preenchido
		},
		{
			message: "※ O cashback é obrigatório!",
			path: ["cashback"], // Mensagem associada ao campo cashback
		}
	);

type TUpdateUserFormData = z.infer<typeof updateUserFormSchema>;

function MyProfilePage() {
	const [token] = useState(localStorage.getItem("token") || "");
	const [user, setUser] = useState({});
	const [selectedProfileImage, setSelectedProfileImage] = useState<
		string | null
	>(null);
	const [selectedLogoImage, setSelectedLogoImage] = useState<string | null>(
		null
	);
	const [loadingPage, setLoadingPage] = useState(true);
	const [loadingButton, setLoadingButton] = useState(false);

	const router = useRouter();

	const [output, setOutput] = useState("");

	const {
		register,
		handleSubmit,
		formState: { errors },
		control,
		watch,
		getValues,
		trigger,
	} = useForm<TUpdateUserFormData>({
		resolver: zodResolver(updateUserFormSchema),
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
					errors?.productVariations?.[variationIndex]?.options?.[
						optionIndex
					]?.[key];
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
		api.get("/mononoke/check-user", {
			headers: {
				Authorization: `Bearer ${JSON.parse(token)}`,
			},
		}).then((response) => {
			setUser(response.data);
			setLoadingPage(false);
		});
	}, [token]);

	useEffect(() => {
		if (user) {
			if (user.accountType === "partner") {
				setSelectedProfileImage(
					user?.profileImage
						? `http://localhost:5000/images/partners/${user.profileImage}`
						: ""
				);
				setSelectedLogoImage(
					user?.logoImage
						? `http://localhost:5000/images/partners/${user.logoImage}`
						: ""
				);
			} else {
				setSelectedProfileImage(
					user?.profileImage
						? `http://localhost:5000/images/customers/${user.profileImage}`
						: ""
				);
			}
		}
	}, [user]); // Atualiza a imagem quando o usuário muda

	const handleSelectedImage = (event, setImageFunction) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				setImageFunction(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	// Requisição anterior que funcionava antes das alterações
	async function updateUser(data: TUpdateUserFormData) {
		// Sanitiza os dados antes de usá-los
		const sanitizedData = Object.fromEntries(
			Object.entries(data).map(([key, value]) => {
				if (typeof value === "string") {
					return [key, DOMPurify.sanitize(value)];
				}
				return [key, value];
			})
		);

		setOutput(JSON.stringify(sanitizedData, null, 2));
		console.log("Dados sanitizados:", sanitizedData);

		// Cria um novo FormData
		const formData = new FormData();

		// Adiciona outros dados no FormData
		Object.entries(sanitizedData).forEach(([key, value]) => {
			// Ignora a propriedade 'modalityOptions' aqui, pois já tratamos dela
			if (key === "profileImage" && value instanceof File) {
				formData.append(key, value);
				console.log(
					`Adicionado ao FormData: ${key} - [Imagem de Perfil]`
				);
			} else if (key === "LogoImage" && value instanceof File) {
				formData.append(key, value);
				console.log(`Adicionado ao FormData: ${key} - [Logo]`);
			} else {
				formData.append(key, value);
				console.log(`Adicionado ao FormData: ${key} - ${value}`);
			}
		});

		try {
			setLoadingButton(true);

			if (user?.accountType === "partner") {
				const response = await api.patch("/partners/edit", formData);
				toast.success(response.data.message);
			} else if (user?.accountType === "customer") {
				const response = await api.patch("/customers/edit", formData);
				toast.success(response.data.message);
			}
			setLoadingButton(false);
		} catch (error: any) {
			toast.error(error.response.data.message);
			setLoadingButton(false);
		}
	}

	// async function updateUser(data: TUpdateUserFormData) {
	// 	console.log("Dados recebidos:", data);
	// 	// Certifique-se de que selectedOperators seja atribuído ao shippingConfiguration diretamente
	// 	const selectedOperatorsData = selectedOperators;

	// 	// Sanitiza os dados antes de usá-los
	// 	const sanitizedData = Object.fromEntries(
	// 		Object.entries(data).map(([key, value]) => {
	// 			if (
	// 				typeof value === "string" &&
	// 				key !== "shippingConfiguration"
	// 			) {
	// 				return [key, DOMPurify.sanitize(value)];
	// 			}
	// 			return [key, value];
	// 		})
	// 	);

	// 	// Adiciona selectedOperators diretamente ao campo shippingConfiguration
	// 	sanitizedData.shippingConfiguration = selectedOperatorsData;

	// 	// Verifique os dados após sanitização
	// 	setOutput(JSON.stringify(sanitizedData, null, 2));
	// 	console.log("Dados sanitizados:", sanitizedData);

	// 	// Cria um novo FormData
	// 	const formData = new FormData();

	// 	// Adiciona a configuração de envio (shippingConfiguration) como JSON stringificado
	// 	formData.append(
	// 		"shippingConfiguration",
	// 		JSON.stringify(sanitizedData.shippingConfiguration)
	// 	);
	// 	console.log(
	// 		`Adicionado ao FormData: shippingConfiguration - ${JSON.stringify(
	// 			sanitizedData.shippingConfiguration
	// 		)}`
	// 	);

	// 	// Adiciona os outros dados no FormData
	// 	Object.entries(sanitizedData).forEach(([key, value]) => {
	// 		if (key !== "shippingConfiguration" && key !== "modalityOptions") {
	// 			if (key === "profileImage" && value instanceof File) {
	// 				formData.append(key, value);
	// 				console.log(
	// 					`Adicionado ao FormData: ${key} - [Imagem de Perfil]`
	// 				);
	// 			} else if (key === "LogoImage" && value instanceof File) {
	// 				formData.append(key, value);
	// 				console.log(`Adicionado ao FormData: ${key} - [Logo]`);
	// 			} else {
	// 				formData.append(key, value);
	// 				console.log(`Adicionado ao FormData: ${key} - ${value}`);
	// 			}
	// 		}
	// 	});

	// 	try {
	// 		setLoadingButton(true);

	// 		console.log(user?.accountType);

	// 		// Envio para o servidor
	// 		if (user?.accountType === "partner") {
	// 			const response = await api.patch("/partners/edit", formData);
	// 			toast.success(response.data.message);
	// 		} else if (user?.accountType === "customer") {
	// 			const response = await api.patch("/customers/edit", formData);
	// 			toast.success(response.data.message);
	// 		}
	// 		setLoadingButton(false);
	// 	} catch (error: any) {
	// 		toast.error(error.response.data.message);
	// 		setLoadingButton(false);
	// 	}
	// }

	const handleCancelar = () => {
		// Redirecionar para outra página ao clicar em Cancelar
		router.push("/dashboard");
	};

	if (loadingPage) {
		return <LoadingPage />;
	}

	return (
		<section className="bg-gray-300 grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mt-4 mb-8">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							console.log("🔥 FORM SUBMETIDO!");
							handleSubmit(updateUser)(e);
						}}
						autoComplete="off">
						{/* Gadget 1 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									{user?.accountType === "customer"
										? "Dados de Usuário"
										: "Dados da Loja"}
								</h1>
								<div className="flex flex-row gap-4">
									{/* Nome Fantasia */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												{user?.accountType ===
												"customer"
													? "Nome"
													: "Nome Fantasia"}
											</span>
										</div>
										<input
											type="text"
											className={`input input-bordered ${getFieldClass(
												"name",
												"input"
											)} w-full max-w-3xl`}
											placeholder={`...`}
											defaultValue={user?.name}
											{...register("name", {
												onChange: () => trigger("name"),
											})}
											onFocus={() => handleFocus("name")}
											onBlur={() => handleBlur("name")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.name && (
													<span>
														{errors.name.message}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* CNPJ/CPF */}
									{user?.accountType === "partner" ? (
										<label className="form-control w-full max-w-3xl">
											<div className="label">
												<span className="label-text text-black">
													CNPJ/CPF
												</span>
											</div>
											<input
												type="text"
												className={`input input-bordered ${getFieldClass(
													"cpfCnpj",
													"input"
												)} w-full max-w-3xl`}
												placeholder={`...`}
												defaultValue={
													decrypt(user?.cpfCnpj) ?? ""
												}
												{...register("cpfCnpj", {
													onChange: () =>
														trigger("cpfCnpj"),
												})}
												onFocus={() =>
													handleFocus("cpfCnpj")
												}
												onBlur={() =>
													handleBlur("cpfCnpj")
												}
											/>
											<div className="label">
												<span className="label-text-alt text-red-500">
													{errors.cpfCnpj && (
														<span>
															{
																errors.cpfCnpj
																	.message
															}
														</span>
													)}
												</span>
											</div>
										</label>
									) : (
										<label className="form-control w-full max-w-3xl">
											<div className="label">
												<span className="label-text text-black">
													CPF
												</span>
											</div>
											<input
												type="text"
												className={`input input-bordered ${getFieldClass(
													"cpf",
													"input"
												)} w-full max-w-3xl`}
												placeholder={`...`}
												defaultValue={
													decrypt(user?.cpf) ?? ""
												}
												{...register("cpf", {
													onChange: () =>
														trigger("cpf"),
												})}
												onFocus={() =>
													handleFocus("cpf")
												}
												onBlur={() => handleBlur("cpf")}
											/>
											<div className="label">
												<span className="label-text-alt text-red-500">
													{errors.cpf && (
														<span>
															{errors.cpf.message}
														</span>
													)}
												</span>
											</div>
										</label>
									)}
								</div>
								<div className="flex flex-row gap-4">
									{/* Nickname */}
									<label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Nickname
											</span>
										</div>
										<input
											type="text"
											className={`input input-bordered ${getFieldClass(
												"nickname",
												"input"
											)} w-[300px]`}
											placeholder={`...`}
											defaultValue={user?.nickname}
											{...register("nickname", {
												onChange: () =>
													trigger("nickname"),
											})}
											onFocus={() =>
												handleFocus("nickname")
											}
											onBlur={() =>
												handleBlur("nickname")
											}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.nickname && (
													<span>
														{
															errors.nickname
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* Email */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Email
											</span>
										</div>
										<input
											type="email"
											className={`input input-bordered ${getFieldClass(
												"email",
												"input"
											)} w-[500px]`}
											placeholder={`...`}
											defaultValue={user?.email}
											{...register("email", {
												onChange: () =>
													trigger("email"),
											})}
											onFocus={() => handleFocus("email")}
											onBlur={() => handleBlur("email")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.email && (
													<span>
														{errors.email.message}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* Ver conteúdo adulto? */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Ver conteúdo adulto?
											</span>
										</div>

										<select
											className={`select select-bordered ${getFieldClass(
												"viewAdultContent",
												"select"
											)} w-full max-w-xs`}
											placeholder={`...`}
											defaultValue={
												user?.viewAdultContent !==
												undefined
													? String(
															user.viewAdultContent
													  )
													: ""
											}
											{...register("viewAdultContent", {
												onChange: () =>
													trigger("viewAdultContent"),
											})}
											onFocus={() =>
												handleFocus("viewAdultContent")
											}
											onBlur={() =>
												handleBlur("viewAdultContent")
											}>
											<option value="" disabled>
												Selecione uma opção
											</option>
											<option value="false">Não</option>
											<option value="true">Sim</option>
										</select>
										{errors.viewAdultContent && (
											<div className="label">
												<span className="label-text-alt text-red-500">
													{
														errors.viewAdultContent
															.message
													}
												</span>
											</div>
										)}
									</label>
								</div>

								{user && user?.accountType === "customer" ? (
									<></>
								) : (
									<>
										<div className="flex flex-row gap-4">
											{/* Descrição da Loja */}
											<label className="form-control w-full max-w-3xl">
												<div className="label">
													<span className="label-text text-black">
														Descrição da Loja
													</span>
												</div>
												<textarea
													className={`textarea textarea-bordered ${getFieldClass(
														"description",
														"textarea"
													)} h-[150px]`}
													placeholder={`...`}
													defaultValue={
														user?.description
													}
													{...register(
														"description",
														{
															onChange: () =>
																trigger(
																	"description"
																),
														}
													)}
													onFocus={() =>
														handleFocus(
															"description"
														)
													}
													onBlur={() =>
														handleBlur(
															"description"
														)
													}></textarea>
												<div className="label">
													<span className="label-text-alt text-red-500">
														{errors.description && (
															<span>
																{
																	errors
																		.description
																		.message
																}
															</span>
														)}
													</span>
												</div>
											</label>
										</div>
									</>
								)}
							</div>
						</div>

						{/* Gadget 2 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col ml-6 mb-6 gap-2">
								<h1 className="text-2xl font-semibold text-black">
									Imagens
								</h1>
								<div className="flex flex-row items-center gap-10">
									{/* Add Imagens */}
									<label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Imagem de Perfil
											</span>
										</div>
										<div
											className={`text-black hover:text-white flex flex-col justify-center items-center w-[150px] h-[150px] border-[1px] border-dashed border-primary hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
											{selectedProfileImage ? (
												<>
													<Image
														className="object-contain w-full h-full rounded"
														src={
															selectedProfileImage
														}
														alt="Imagem selecionada"
														width={150}
														height={150}
														unoptimized
													/>
													<button
														type="button"
														className="absolute top-1 right-1 bg-red-500 text-white p-1 w-8 h-8 rounded-md z-50"
														onClick={(e) => {
															e.preventDefault(); // Previne o comportamento padrão
															setSelectedProfileImage(
																null
															); // Limpa a imagem renderizada
														}}>
														X
													</button>
												</>
											) : (
												<div
													className="flex flex-col justify-center items-center"
													onChange={(event) =>
														handleSelectedImage(
															event,
															setSelectedProfileImage
														)
													}>
													<h2 className="text-xs mb-2">
														Add Imagem
													</h2>
													<AddPicture size={20} />
													<input
														className="hidden"
														type="file"
														accept="image/*"
														{...register(
															"profileImage"
														)}
													/>
												</div>
											)}
										</div>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.profileImage ? (
													<span>
														{
															errors.profileImage
																.message
														}
													</span>
												) : (
													<span className="text-black">
														T. máx. 450x450p
													</span>
												)}
											</span>
										</div>
									</label>

									{/* <label className="form-control">
										<div className="label">
											<span className="label-text text-black">
												Imagem de Perfil
											</span>
										</div>
										<div
											className={`text-black hover:text-white flex flex-col justify-center items-center w-[120px] h-[120px] border-[1px] border-dashed border-primary hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
											{selectedProfileImage ? (
												<div className="relative w-full h-full">
													<img
														src={
															selectedProfileImage
														}
														alt="Imagem selecionada"
														className="object-contain w-full h-full rounded"
													/>

													<button
														type="button"
														className="absolute top-1 right-1 bg-red-500 text-white p-1 w-8 h-8 rounded-md z-10"
														onClick={() =>
															setSelectedProfileImage(
																null
															)
														}>
														X
													</button>

													<input
														className="absolute inset-0 opacity-0 cursor-pointer z-0"
														type="file"
														accept="image/*"
														onChange={(event) =>
															handleSelectedImage(
																event,
																setSelectedProfileImage
															)
														}
													/>
												</div>
											) : (
												<div className="flex flex-col justify-center items-center">
													<h2 className="text-xs mb-2">
														Add Imagem
													</h2>
													<AddPicture size={20} />
													<input
														className="absolute inset-0 opacity-0 cursor-pointer"
														type="file"
														accept="image/*"
														onChange={(event) =>
															handleSelectedImage(
																event,
																setSelectedProfileImage
															)
														}
													/>
												</div>
											)}
										</div>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.profileImage ? (
													<span>
														{
															errors.profileImage
																.message
														}
													</span>
												) : (
													<span className="text-black">
														Tamanho recomendado:
														120x120p
													</span>
												)}
											</span>
										</div>
									</label> */}

									{user &&
									user?.accountType === "customer" ? (
										<>
											<label className="form-control hidden">
												<div className="label">
													<span className="label-text text-black">
														Logo da Loja
													</span>
												</div>
												<div
													className={`text-black hover:text-white flex flex-col justify-center items-center w-[300px] h-[150px] border-[1px] border-dashed border-primary hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
													{selectedLogoImage ? (
														<Image
															className="object-contain w-full h-full rounded"
															src={
																selectedLogoImage
															}
															alt="Imagem selecionada"
															width={300}
															height={150}
															unoptimized
														/>
													) : (
														<div
															className="flex flex-col justify-center items-center"
															onChange={(event) =>
																handleSelectedImage(
																	event,
																	setSelectedLogoImage
																)
															}>
															<h2 className="text-xs mb-2">
																Add Imagem
															</h2>
															<AddPicture
																size={20}
															/>
															<input
																className="hidden"
																type="file"
																accept="image/*"
																{...register(
																	"logoImage"
																)}
															/>
														</div>
													)}
												</div>
												<div className="label">
													<span className="label-text-alt text-red-500">
														{errors.logoImage ? (
															<span>
																{
																	errors
																		.logoImage
																		.message
																}
															</span>
														) : (
															<span className="text-black">
																T. máx. 900x450p
																(mantenha a
																proporção para
																não distorcer a
																imagem)
															</span>
														)}
													</span>
												</div>
											</label>
										</>
									) : (
										<>
											{/* Add Imagens */}
											<label className="form-control">
												<div className="label">
													<span className="label-text text-black">
														Logo da Loja
													</span>
												</div>
												<div
													className={`text-black hover:text-white flex flex-col justify-center items-center w-[300px] h-[150px] border-[1px] border-dashed border-primary hover:bg-[#8357e5] transition-all ease-in duration-150 rounded hover:shadow-md ml-1 cursor-pointer relative`}>
													{selectedLogoImage ? (
														<>
															<Image
																className="object-contain w-full h-full rounded"
																src={
																	selectedLogoImage
																}
																alt="Imagem selecionada"
																width={300}
																height={150}
																unoptimized
															/>
															<button
																type="button"
																className="absolute top-1 right-1 bg-red-500 text-white p-1 w-8 h-8 rounded-md z-50"
																onClick={(
																	e
																) => {
																	e.preventDefault(); // Previne o comportamento padrão
																	setSelectedLogoImage(
																		null
																	); // Limpa a imagem renderizada
																}}>
																X
															</button>
														</>
													) : (
														<div
															className="flex flex-col justify-center items-center"
															onChange={(event) =>
																handleSelectedImage(
																	event,
																	setSelectedLogoImage
																)
															}>
															<h2 className="text-xs mb-2">
																Add Imagem
															</h2>
															<AddPicture
																size={20}
															/>
															<input
																className="hidden"
																type="file"
																accept="image/*"
																{...register(
																	"logoImage"
																)}
															/>
														</div>
													)}
												</div>
												<div className="label">
													<span className="label-text-alt text-red-500">
														{errors.logoImage ? (
															<span>
																{
																	errors
																		.logoImage
																		.message
																}
															</span>
														) : (
															<span className="text-black">
																T. máx. 900x450p
																(mantenha a
																proporção para
																não distorcer a
																imagem)
															</span>
														)}
													</span>
												</div>
											</label>
										</>
									)}
								</div>
							</div>
						</div>

						{/* Gadget 3 */}
						<div className="bg-white w-[1200px] p-6 rounded-md mr-4 mb-4">
							{/* Endereço Partner / Customer */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									{user?.accountType === "customer"
										? "Endereço de Entrega"
										: "Configurações de Envio"}
								</h1>
								{/* Row 1 */}
								<div className="flex flex-row gap-4">
									{/* Logradouro */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Logradouro (Rua/Avenida)
											</span>
										</div>
										<input
											type="text"
											className={`input input-bordered ${getFieldClass(
												"street",
												"input"
											)} w-full max-w-3xl`}
											placeholder={`...`}
											defaultValue={
												user.address[0]?.street
											}
											{...register("street", {
												onChange: () =>
													trigger("street"),
											})}
											onFocus={() =>
												handleFocus("street")
											}
											onBlur={() => handleBlur("street")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.street && (
													<span>
														{errors.street.message}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* Complemento */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Complemento
											</span>
										</div>
										<input
											type="text"
											className={`input input-bordered ${getFieldClass(
												"complement",
												"input"
											)} w-full max-w-3xl`}
											placeholder={`...`}
											defaultValue={
												user.address[0]?.complement
											}
											{...register("complement", {
												onChange: () =>
													trigger("complement"),
											})}
											onFocus={() =>
												handleFocus("complement")
											}
											onBlur={() =>
												handleBlur("complement")
											}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.complement && (
													<span>
														{
															errors.complement
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* Bairro */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Bairro
											</span>
										</div>
										<input
											type="text"
											className={`input input-bordered ${getFieldClass(
												"neighborhood",
												"input"
											)} w-full max-w-3xl`}
											placeholder={`...`}
											defaultValue={
												user.address[0]?.neighborhood
											}
											{...register("neighborhood", {
												onChange: () =>
													trigger("neighborhood"),
											})}
											onFocus={() =>
												handleFocus("neighborhood")
											}
											onBlur={() =>
												handleBlur("neighborhood")
											}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.neighborhood && (
													<span>
														{
															errors.neighborhood
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>
								</div>

								<div className="flex flex-row gap-4">
									{/* Cidade */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Cidade
											</span>
										</div>
										<input
											type="text"
											className={`input input-bordered ${getFieldClass(
												"city",
												"input"
											)} w-full max-w-3xl`}
											placeholder={`...`}
											defaultValue={user.address[0]?.city}
											{...register("city", {
												onChange: () => trigger("city"),
											})}
											onFocus={() => handleFocus("city")}
											onBlur={() => handleBlur("city")}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.city && (
													<span>
														{errors.city.message}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* Estado */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												Estado
											</span>
										</div>
										<select
											className={`select select-bordered ${getFieldClass(
												"state",
												"select"
											)} w-full max-w-3xl`}
											value={
												user.address &&
												user.address[0]?.state
													? user.address[0]?.state
													: ""
											}
											{...register("state", {
												onChange: () =>
													trigger("state"),
											})}
											onFocus={() => handleFocus("state")}
											onBlur={() => handleBlur("state")}>
											<option disabled value="">
												Em qual estado sua loja está
												localizada?
											</option>
											<option value="SP">
												São Paulo (SP)
											</option>
											<option value="RJ">
												Rio de Janeiro (RJ)
											</option>
											<option value="PR">
												Paraná (PR)
											</option>
											<option value="MG">
												Minas Gerais (MG)
											</option>
											<option value="SC">
												Santa Catarina (SC)
											</option>
											<option value="RS">
												Rio Grande do Sul (RS)
											</option>
											<option value="ES">
												Espírito Santo (ES)
											</option>
											<option value="GO">
												Goiás (GO)
											</option>
											<option value="DF">
												Destrito Federal (DF)
											</option>
											<option value="MS">
												Mato Grosso do Sul (MS)
											</option>
											<option value="MT">
												Mato Grosso (MT)
											</option>
											<option value="BA">
												Bahia (BA)
											</option>
											<option value="PE">
												Pernambuco (PE)
											</option>
											<option value="CE">
												Ceará (CE)
											</option>
											<option value="MA">
												Maranhão (MA)
											</option>
											<option value="RN">
												Rio Grande do Norte (RN)
											</option>
											<option value="PB">
												Paraíba (PB)
											</option>
											<option value="PI">
												Piauí (PI)
											</option>
											<option value="SE">
												Sergipe (SE)
											</option>
											<option value="AL">
												Alagoas (AL)
											</option>
											<option value="PA">
												Pará (PA)
											</option>
											<option value="AM">
												Amazonas (AM)
											</option>
											<option value="TO">
												Tocantins (TO)
											</option>
											<option value="AP">
												Amapá (AP)
											</option>
											<option value="RR">
												Roraima (RR)
											</option>
											<option value="RO">
												Rondônia (RO)
											</option>
											<option value="AC">
												Acre (AC)
											</option>
											<option value="JP">
												Japão (JP)
											</option>
										</select>
										{/* <input
											type="text"
											// name="uf"
											placeholder="..."
											defaultValue={
												user?.address[0].state
											}
											className={`input input-bordered ${
												errors.state
													? `input-error`
													: `input-success`
											} w-full max-w-3xl`}
											{...register("state")}
										/> */}
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.state && (
													<span>
														{errors.state.message}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* CEP */}
									<label className="form-control w-full max-w-3xl">
										<div className="label">
											<span className="label-text text-black">
												CEP
											</span>
										</div>
										<input
											type="text"
											className={`input input-bordered ${getFieldClass(
												"postalCode",
												"input"
											)} w-full max-w-3xl`}
											placeholder="..."
											defaultValue={
												user.address[0]?.postalCode
											}
											{...register("postalCode", {
												onChange: () =>
													trigger("postalCode"),
											})}
											onFocus={() =>
												handleFocus("postalCode")
											}
											onBlur={() =>
												handleBlur("postalCode")
											}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.postalCode && (
													<span>
														{
															errors.postalCode
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>
								</div>
							</div>
						</div>

						{user && user?.accountType === "customer" ? (
							<></>
						) : (
							<>
								{/* Gadget 4 */}
								<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
									{/* Adicionar Porduto */}
									<div className="flex flex-col gap-2 ml-6 mb-6">
										<h1 className="text-2xl font-semibold text-black">
											Configurações de venda
										</h1>

										{/* Cashback */}
										<label className="form-control w-[250px]">
											<div className="label">
												<div className="flex flex-row items-center gap-2 label-text text-black">
													<span>
														Cashback oferecido
													</span>
													<div className="relative inline-block">
														<div className="group">
															{/* Icone Visível no Client Side  */}
															<FiInfo
																className="animate-pulse text-info cursor-pointer"
																size={18}
															/>

															{/* Tooltip */}
															<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-[880px] p-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition duration-300 border-[1px] border-black bg-white text-black text-sm rounded shadow-lg pointer-events-none">
																<p className="ml-2">
																	Ao realizar
																	uma venda
																	você pagará
																	1,5x o
																	Cashback
																	oferecido,
																	sendo valor
																	dividido
																	entre o
																	cliente (x1)
																	e a nossa
																	plataforma
																	(x0,5).
																	Exemplo:
																	Você oferece
																	2% de
																	Cashback,
																	portanto
																	pagará 3%
																	(2% para o
																	cliente e 1%
																	para nossa
																	plataforma).
																</p>
															</div>
														</div>
													</div>
												</div>
											</div>
											<input
												type="text"
												className={`input input-bordered ${getFieldClass(
													"cashback",
													"input"
												)} w-full max-w-3xl`}
												placeholder="..."
												defaultValue={decrypt(
													user?.cashback
												)}
												{...register("cashback", {
													onChange: () =>
														trigger("cashback"),
												})}
												onFocus={() =>
													handleFocus("cashback")
												}
												onBlur={() =>
													handleBlur("cashback")
												}
											/>
											<div className="label">
												<span className="label-text-alt text-red-500">
													{errors.cashback && (
														<span>
															{
																errors.cashback
																	.message
															}
														</span>
													)}
												</span>
											</div>
										</label>
									</div>
								</div>
							</>
						)}

						{/* Gadget 5 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4 mb-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold text-black">
									Alterar Senha
								</h1>

								<div className="flex flex-row gap-4">
									{/* Credential */}
									<label className="form-control w-[250px]">
										<div className="label">
											<span className="label-text text-black">
												Nova Senha
											</span>
										</div>
										<input
											type="password"
											className={`input input-bordered ${getFieldClass(
												"password",
												"input"
											)} w-full max-w-3xl`}
											placeholder="Digite a nova senha"
											// defaultValue={user?.password}
											{...register("password", {
												onChange: () =>
													trigger("password"),
											})}
											onFocus={() =>
												handleFocus("password")
											}
											onBlur={() =>
												handleBlur("password")
											}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.password && (
													<span>
														{
															errors.password
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>

									{/* Credential */}
									<label className="form-control w-[250px]">
										<div className="label">
											<span className="label-text text-black">
												Confirme a Senha
											</span>
										</div>
										<input
											type="password"
											className={`input input-bordered ${getFieldClass(
												"confirmPassword",
												"input"
											)} max-w-4xl`}
											placeholder="Confirme a senha"
											// defaultValue={user?.confirmPassword}
											{...register("confirmPassword", {
												onChange: () =>
													trigger("confirmPassword"),
											})}
											onFocus={() =>
												handleFocus("confirmPassword")
											}
											onBlur={() =>
												handleBlur("confirmPassword")
											}
										/>
										<div className="label">
											<span className="label-text-alt text-red-500">
												{errors.confirmPassword && (
													<span>
														{
															errors
																.confirmPassword
																.message
														}
													</span>
												)}
											</span>
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Gadget 6 */}
						<div className="bg-white w-[1200px] p-6 rounded-md shadow-md mr-4">
							{/* Adicionar Porduto */}
							<div className="flex flex-col gap-2 ml-6 mb-6">
								<h1 className="text-2xl font-semibold mb-4 text-black">
									Deseja atualizar as informações de perfil?
								</h1>
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
					<pre>{output}</pre>
					<br />
				</div>
			</div>
		</section>
	);
}

export default MyProfilePage;
