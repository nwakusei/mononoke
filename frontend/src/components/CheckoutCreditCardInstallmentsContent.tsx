import { useEffect, useState } from "react";
import api from "@/utils/api";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid"; // Importe o pacote uuid
import { CardPayment } from "@mercadopago/sdk-react";
import { initMercadoPago } from "@mercadopago/sdk-react";

// Inicialize o Mercado Pago com sua chave pública
initMercadoPago("TEST-d1327b33-b651-48cf-a372-1407ef47bad7");

// Icons
import { PiCreditCardBold } from "react-icons/pi";

function CheckoutCreditCardInstallmentsContent() {
	const [paymentBrickController, setPaymentBrickController] = useState(null);

	// Função de inicialização fora do useEffect
	const initialization = {
		amount: 100,
	};

	const customization = {
		visual: {
			style: {
				theme: "dark", // | 'dark' | 'bootstrap' | 'flat'
				customVariables: {
					baseColor: "#3C1A7D",
					buttonTextColor: "#fff",
				},
			},
			texts: {
				formTitle: "Bandeiras aceitas",
				emailSectionTitle: "",
				installmentsSectionTitle: "",
				cardholderName: {
					label: "",
					placeholder: "Nome e Sobrenome",
				},
				email: {
					label: "",
					placeholder: "",
				},
				cardholderIdentification: {
					label: "",
				},
				cardNumber: {
					label: "",
				},
				expirationDate: {
					label: "",
				},
				securityCode: {
					label: "",
				},
				selectInstallments: "",
				selectIssuerBank: "",
				formSubmit: "",
			},
		},
	};

	// Função de envio de dados fora do useEffect

	const onSubmit = async (formData) => {
		try {
			const response = await api.post(
				"/otakupay/payment-credit-card-MP",
				JSON.stringify(formData),
				{
					headers: {
						"Content-Type": "application/json",
						"X-Idempotency-Key": uuidv4(),
					},
				}
			);

			if (response.status === 200) {
				// Se o pagamento foi criado com sucesso, exibe a mensagem para o usuário
				toast.success(response.data.message);
			}
		} catch (error) {
			toast.error("Pagamento não aprovado!");
			// Aqui você pode tratar erros de criação de pagamento, se necessário
		}
	};

	// Função de tratamento de erro fora do useEffect
	const onError = async (error) => {
		console.error(error);
	};

	// Função chamada quando o Brick está pronto fora do useEffect
	const onReady = async () => {
		// Aqui você pode ocultar carregamentos do seu site, por exemplo
	};

	useEffect(() => {
		initMercadoPago("TEST-d1327b33-b651-48cf-a372-1407ef47bad7");

		// Renderize o Brick de pagamento
		const renderPaymentBrick = async (bricksBuilder) => {
			const settings = {
				initialization,
				callbacks: { onSubmit, onError, onReady },
			};

			try {
				const controller = await bricksBuilder.create(
					"payment",
					"paymentBrick_container",
					settings
				);
				console.log(controller);
				setPaymentBrickController(controller);
			} catch (error) {
				console.log("Erro ao criar o Brick de pagamento:", error);
			}
		};

		// Chame a função para renderizar o Brick de pagamento
		renderPaymentBrick();

		// Certifique-se de destruir a instância atual do Brick quando o componente for desmontado
		return () => {
			if (paymentBrickController) {
				paymentBrickController.unmount();
			}
		};
	}, []); // Certifique-se de executar este efeito apenas uma vez

	return (
		<div id="paymentBrick_container">
			<div className="flex flex-row justify-center items-center w-[650px] bg-primary px-2 py-1 gap-1 rounded shadow-md mt-4 mb-8">
				<h1 className="select-none">
					Pague com Cartão de Crédito Parcelado
				</h1>
				<PiCreditCardBold size={17} />
			</div>
			<CardPayment
				initialization={initialization}
				onSubmit={onSubmit}
				onReady={onReady}
				onError={onError}
				customization={customization}
			/>
		</div>
	);
}

export { CheckoutCreditCardInstallmentsContent };

// import { useEffect } from "react";
// import { loadMercadoPago } from "@mercadopago/sdk-js";
// import api from "@/utils/api";
// import { toast } from "react-toastify";
// import { v4 as uuidv4 } from "uuid"; // Importe o pacote uuid
// import "./CheckoutCreditCardInstallmentsContent.css";

// function CheckoutCreditCardInstallmentsContent() {
// 	useEffect(() => {
// 		const initializeMercadoPago = async () => {
// 			try {
// 				await loadMercadoPago();
// 				const mp = new (window as any).MercadoPago(
// 					"TEST-d1327b33-b651-48cf-a372-1407ef47bad7"
// 				);
// 				// Coloque aqui o código para inicializar o Mercado Pago e qualquer outra lógica assíncrona

// 				const cardForm = mp.cardForm({
// 					amount: "100",
// 					iframe: true,
// 					form: {
// 						id: "form-checkout",
// 						cardNumber: {
// 							id: "form-checkout__cardNumber",
// 							placeholder: "Número do cartão",
// 						},
// 						expirationDate: {
// 							id: "form-checkout__expirationDate",
// 							placeholder: "MM/YY",
// 						},
// 						securityCode: {
// 							id: "form-checkout__securityCode",
// 							placeholder: "Código de segurança",
// 						},
// 						cardholderName: {
// 							id: "form-checkout__cardholderName",
// 							placeholder: "Titular do cartão",
// 						},
// 						issuer: {
// 							id: "form-checkout__issuer",
// 							placeholder: "Banco emissor",
// 						},
// 						installments: {
// 							id: "form-checkout__installments",
// 							placeholder: "Parcelas",
// 						},
// 						identificationType: {
// 							id: "form-checkout__identificationType",
// 							placeholder: "Tipo de documento",
// 						},
// 						identificationNumber: {
// 							id: "form-checkout__identificationNumber",
// 							placeholder: "Número do documento",
// 						},
// 						cardholderEmail: {
// 							id: "form-checkout__cardholderEmail",
// 							placeholder: "E-mail",
// 						},
// 					},
// 					callbacks: {
// 						onFormMounted: (error) => {
// 							if (error)
// 								return console.warn(
// 									"Form Mounted handling error: ",
// 									error
// 								);
// 							console.log("Form mounted");
// 						},
// 						onSubmit: (event) => {
// 							event.preventDefault();

// 							const {
// 								paymentMethodId: payment_method_id,
// 								issuerId: issuer_id,
// 								cardholderEmail: email,
// 								amount,
// 								token,
// 								installments,
// 								identificationNumber,
// 								identificationType,
// 							} = cardForm.getCardFormData();

// 							fetch(
// 								"http://localhost:5000/otakupay/payment-credit-card-MP",
// 								{
// 									method: "POST",
// 									headers: {
// 										"Content-Type": "application/json",
// 										"X-Idempotency-Key": uuidv4(),
// 									},
// 									body: JSON.stringify({
// 										token,
// 										issuer_id,
// 										payment_method_id,
// 										transaction_amount: Number(amount),
// 										installments: Number(installments),
// 										description: "Descrição do produto",
// 										payer: {
// 											email,
// 											identification: {
// 												type: identificationType,
// 												number: identificationNumber,
// 											},
// 										},
// 									}),
// 								}
// 							);
// 						},
// 						onFetching: (resource) => {
// 							console.log("Fetching resource: ", resource);

// 							// Animate progress bar
// 							const progressBar =
// 								document.querySelector(".progress-bar");
// 							progressBar.removeAttribute("value");

// 							return () => {
// 								progressBar.setAttribute("value", "0");
// 							};
// 						},
// 					},
// 				});
// 			} catch (error) {
// 				console.error("Erro ao carregar o Mercado Pago:", error);
// 			}
// 		};

// 		initializeMercadoPago();
// 	}, []);

// 	return (
// 		<div>
// 			<form
// 				id="form-checkout"
// 				className="flex flex-col gap-2 progress-bar">
// 				<div className="flex flex-row gap-2">
// 					<div
// 						id="form-checkout__cardNumber"
// 						placeholder="Type here"
// 						className="input input-bordered input-primary w-[300px]"></div>
// 					<div
// 						id="form-checkout__expirationDate"
// 						placeholder="Type here"
// 						className="input input-bordered input-primary w-[150px]"></div>
// 					<div
// 						id="form-checkout__securityCode"
// 						placeholder="Type here"
// 						className="input input-bordered input-primary w-[200px]"></div>
// 				</div>

// 				<div className="flex flex-row gap-2">
// 					<input
// 						type="text"
// 						id="form-checkout__cardholderName"
// 						placeholder="Títular do Cartão"
// 						className="input input-bordered input-primary w-[300px]"
// 					/>
// 					<select
// 						id="form-checkout__identificationType"
// 						className="select select-primary w-[150px]"></select>
// 					<input
// 						type="text"
// 						id="form-checkout__identificationNumber"
// 						placeholder="Número do documento"
// 						className="input input-bordered input-primary w-[200px]"
// 					/>
// 				</div>

// 				<select
// 					id="form-checkout__issuer"
// 					className="select select-primary w-full max-w-xs"></select>
// 				<select
// 					id="form-checkout__installments"
// 					className="select select-primary w-full max-w-xs"></select>

// 				<input
// 					type="email"
// 					id="form-checkout__cardholderEmail"
// 					placeholder="E-mail"
// 					className="input input-bordered input-primary w-full max-w-xs"
// 				/>

// 				<button
// 					type="submit"
// 					id="form-checkout__submit"
// 					className="btn btn-primary">
// 					Pagar
// 				</button>
// 				{/* <progress className="progress-bar"></progress> */}
// 			</form>
// 		</div>
// 	);
// }

// export { CheckoutCreditCardInstallmentsContent };
