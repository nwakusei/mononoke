import { useEffect, useState } from "react";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { CardPayment } from "@mercadopago/sdk-react";

import api from "@/utils/api";

import { toast } from "react-toastify";

initMercadoPago("TEST-29e2cf05-c112-48fe-802d-6562b8dfac15");

function CheckoutCreditCardParcelContent() {
	const [paymentBrickController, setPaymentBrickController] = useState(null);

	// Função de inicialização fora do useEffect
	const initialization = {
		amount: 100,
	};

	// Função de envio de dados fora do useEffect
	const onSubmit = async (formData) => {
		try {
			const response = await api.post(
				"/otakupay/payment-credit-card-MP",
				formData,
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
			if (response.status === 200) {
				// Se o pagamento foi criado com sucesso, exibe a mensagem para o usuário
				toast.success(response.data.message);
			}
		} catch (error) {
			console.error("Erro ao criar pagamento: ", error);
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
		// Inicialize o Mercado Pago com sua chave pública
		initMercadoPago("TEST-b720dec1-61e8-4868-9406-d9b3646f4069");

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
				console.error("Erro ao criar o Brick de pagamento:", error);
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
			<CardPayment
				initialization={initialization}
				onSubmit={onSubmit}
				onReady={onReady}
				onError={onError}
			/>
		</div>
	);
}

export { CheckoutCreditCardParcelContent };
