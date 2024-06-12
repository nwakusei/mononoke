import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { v4 as uuidv4 } from "uuid"; // Importe o pacote uuid
import { CardPayment } from "@mercadopago/sdk-react";
import { initMercadoPago } from "@mercadopago/sdk-react";

// Inicialize o Mercado Pago com sua chave pública
initMercadoPago("TEST-27513d0a-03f4-46b9-ab38-7dae67d7da3f");

// Context
import { CheckoutContext } from "@/context/CheckoutContext";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import { PiCreditCardBold } from "react-icons/pi";

function CheckoutCreditCardInstallmentsContent({
	orderTotalCost,
	products,
	shippingCost,
	coupons,
}) {
	const { setSubtotal, setCart } = useContext(CheckoutContext);
	const router = useRouter();
	const [paymentBrickController, setPaymentBrickController] = useState(null);

	// Função de inicialização fora do useEffect
	const initialization = {
		amount: orderTotalCost,
	};

	const customization = {
		visual: {
			style: {
				theme: "dark", // | 'dark' | 'bootstrap' | 'flat'
				customVariables: {
					baseColor: "#3C1A7D",
					buttonTextColor: "#fff",
					borderRadiusSmall: "4px", // Border Radius das Bandeiras
					borderRadiusMedium: "8px", // Border Radius dos Inputs/Campos e do Button
					borderRadiusLarge: "10px", // Border Radius do Container Card Payment Bricks
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
		paymentMethods: {
			minInstallments: 1,
			maxInstallments: 3,
			// types: {
			//  excluded: ["debit_card"],
			// },
		},
	};

	// Função de envio de dados fora do useEffect
	const onSubmit = async (formData) => {
		try {
			const response = await api.post(
				"/otakupay/payment-creditcard-MP",
				JSON.stringify(formData),
				{
					headers: {
						"Content-Type": "application/json",
						"X-Idempotency-Key": uuidv4(),
					},
				}
			);

			if (response.status === 201) {
				// Se o pagamento foi criado com sucesso, exibe a mensagem para o usuário
				const webhookResponse = await api.post(
					"/otakupay/finish-payment-creditcard-MP",
					JSON.stringify({ products, shippingCost, coupons }),
					{
						headers: {
							"Content-Type": "application/json",
						},
					}
				);

				// Limpar o localStorage após o pagamento ser aprovado
				localStorage.removeItem("productsInCart");
				localStorage.removeItem("transportadoraInfo");
				localStorage.removeItem("coupons");

				setCart(0);
				setSubtotal(0);

				Swal.fire({
					title: "Pagamento Realizado com Sucesso!",
					width: 700,
					icon: "success",
				});

				router.push("/otamart");
			} else if (response.status === 202) {
				// Limpar o localStorage após o pagamento ser aprovado
				localStorage.removeItem("productsInCart");
				localStorage.removeItem("transportadoraInfo");
				localStorage.removeItem("coupons");

				setCart(0);
				setSubtotal(0);

				Swal.fire({
					title: "Pagamento em processamento!",
					width: 700,
					icon: "info",
				});
			}
		} catch (error) {
			Swal.fire({
				title: "Pagamento não aprovado!",
				width: 700,
				icon: "error",
			});
		}
	};

	// Função de tratamento de erro fora do useEffect
	const onError = async (error: any) => {
		console.error(error);
	};

	// Função chamada quando o Brick está pronto fora do useEffect
	const onReady = async () => {
		// Aqui você pode ocultar carregamentos do seu site, por exemplo
	};

	useEffect(() => {
		initMercadoPago("TEST-27513d0a-03f4-46b9-ab38-7dae67d7da3f");

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
