import { Request, Response } from "express";
import crypto from "crypto";

// Models
import { OtakupayModel } from "../models/OtakupayModel";
import { CryptcurrencyModel } from "../models/CryptocurrencyModel";

// Middlewares
import getToken from "../helpers/get-token";
import getUserByToken from "../helpers/get-user-by-token";

class CryptocurrencyController {
	static async createCryptocurrency(req: Request, res: Response) {
		const {
			cryptocurrencyImage,
			cryptocurrencyName,
			cryptocurrencySymbol,
			maxSupply,
		} = req.body;

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		// Verifique se o usuário é uma instância de CustomerModel
		if (!customer) {
			return res.status(422).json({
				message: "Usuário não encontrado ou não é um cliente válido!",
			});
		}

		// Verifique o tipo de conta
		if (customer.accountType !== "customer") {
			return res.status(422).json({
				message:
					"Usuário sem permissão para realizar este tipo de transação!",
			});
		}

		const customerOtakupay = await OtakupayModel.findOne({
			_id: customer.otakupayID,
		});

		try {
			const cryptocurrency = new CryptcurrencyModel({
				devID: customerOtakupay?._id.toString(),
				cryptocurrencyImage: cryptocurrencyImage,
				cryptocurrencyName: cryptocurrencyName,
				cryptocurrencySymbol: cryptocurrencySymbol,
				cryptocurrencyValueInUSD: 0,
				maxSupply: maxSupply,
				mintedCryptocurrency: 0,
				burnedCryptocurrency: 0,
				totalSupply: 0,
				circulatingSupply: 0,
				marketCap: 0,
				volume: 0,
				volMktCap: 0,
				liquidityPool: {
					USD: 0,
					CRYPTOCURRENCY: 0,
				},
			});

			const newCryptocurrency = await cryptocurrency.save();

			res.status(200).json({
				message: "Criptomoeda criada com sucesso!",
				newCryptocurrency,
			});
		} catch (error) {
			console.log("Erro ao criar Criptomoeda!", error);
		}
	}

	static async buyCryptocurrency(req: Request, res: Response) {
		const { id } = req.params;
		const { amountOfCryptocurrencyToBePurchased } = req.body;

		if (!amountOfCryptocurrencyToBePurchased) {
			res.status(404).json({
				message: "A quantidade de Cryptomoeda é obrigatória!",
			});
			return;
		}

		const token: any = getToken(req);
		const customer = await getUserByToken(token);

		// Verifique se o usuário é uma instância de CustomerModel
		if (!customer) {
			return res.status(422).json({
				message: "Usuário não encontrado ou não é um cliente válido!",
			});
		}

		// Verifique o tipo de conta
		if (customer.accountType !== "customer") {
			return res.status(422).json({
				message:
					"Usuário sem permissão para realizar este tipo de transação!",
			});
		}

		const DBCryptoCurrency = await CryptcurrencyModel.findById({
			_id: id,
		});

		if (!DBCryptoCurrency) {
			res.status(404).json({ message: "Criptomoeda não encontrada!" });
			return;
		}

		try {
			const currentDollar = 5; // Cotação do Dolar no Dia da transação

			const customerOtakuPointAvailable = 500; // Quantidade de Otaku Point que o cliente possui disponível para transacionar

			console.log(
				"Customer Otaku Point Disponpivel",
				customerOtakuPointAvailable
			);

			const customerDollarAvailable =
				customerOtakuPointAvailable / currentDollar; // Dollar obtido atrás da conversão de Otaku Point em USD

			console.log("Customer Dollar Disponível", customerDollarAvailable);

			// const swapOPtoDollar = valueInOtakuPoint / currentDollar; // O resultado será a quantidade de Dollar para transacionar

			const transactionCostInDollar =
				DBCryptoCurrency.cryptocurrencyValueInUSD *
				amountOfCryptocurrencyToBePurchased; // Custo da Transação é o valor que custará para o cliente comprar a quantidade desejada de Otakoin

			console.log(
				"Quantidade de Otakoin a ser comprada",
				amountOfCryptocurrencyToBePurchased
			);
			console.log("Custo da Transação", transactionCostInDollar + " USD");

			if (customerDollarAvailable >= transactionCostInDollar) {
				console.log("PODE COMPRAR OTAKOIN");

				let newCurrencyValueInUSD =
					DBCryptoCurrency.cryptocurrencyValueInUSD;

				let mintedCryptocurrency =
					DBCryptoCurrency.mintedCryptocurrency;

				let newLiquidityPool = {
					USD: DBCryptoCurrency.liquidityPool.USD,
					CRYPTOCURRENCY:
						DBCryptoCurrency.liquidityPool.CRYPTOCURRENCY,
				};

				if (
					DBCryptoCurrency.mintedCryptocurrency +
						transactionCostInDollar <
					DBCryptoCurrency.maxSupply
				) {
					console.log(
						"TOTAL SUPPLY MAIOR QUE A QUANTIDADE MINTADA, MINT PERMITIDO"
					);
					mintedCryptocurrency =
						DBCryptoCurrency.mintedCryptocurrency +
						amountOfCryptocurrencyToBePurchased;
				} else if (
					DBCryptoCurrency.mintedCryptocurrency +
						transactionCostInDollar >=
					DBCryptoCurrency.maxSupply
				) {
					console.log("TOTAL SUPPLY ATINGIDO, MINT NÃO PERMITIDO");

					if (
						DBCryptoCurrency.liquidityPool.CRYPTOCURRENCY -
							amountOfCryptocurrencyToBePurchased >
						0
					) {
						newLiquidityPool = {
							USD: parseFloat(
								(
									DBCryptoCurrency.liquidityPool.USD +
									transactionCostInDollar
								).toFixed(2)
							),
							CRYPTOCURRENCY: parseFloat(
								(
									DBCryptoCurrency.liquidityPool
										.CRYPTOCURRENCY -
									amountOfCryptocurrencyToBePurchased
								).toFixed(2)
							),
						};

						console.log("Nova Pool de Liquidez", newLiquidityPool);

						newCurrencyValueInUSD =
							newLiquidityPool.USD /
							newLiquidityPool.CRYPTOCURRENCY;

						console.log(
							"Novo valor de Otakoin em Dollar",
							newCurrencyValueInUSD
						);
					} else {
						console.log(
							"ERROR: OTAKOIN NÃO PODE SER MENOR QUE 0 NA POOL DE LIQUIDEZ"
						);
					}
				} else {
					console.log("POOL DE LIQUIDEZ INALTERADA!");
				}

				const newMintedCryptocurrency = mintedCryptocurrency;

				console.log(
					"Nova quantidade de Moedas Mintadas",
					newMintedCryptocurrency
				);

				const newTotalSupply =
					newMintedCryptocurrency -
					DBCryptoCurrency.burnedCryptocurrency;

				console.log("Novo Total Supply", newTotalSupply);

				const newCirculatingSupply =
					newTotalSupply - newLiquidityPool.CRYPTOCURRENCY;

				console.log(
					"Nova quantidade de Otakoin em Posse dos investidores",
					newCirculatingSupply
				);

				const newMarketCap =
					newCurrencyValueInUSD * newCirculatingSupply;

				// const newVolume;

				// const newVolMktCap;

				const updatedCryptoCurrency =
					await CryptcurrencyModel.findByIdAndUpdate(
						id,
						{
							cryptocurrencyValueInUSD:
								newCurrencyValueInUSD.toFixed(2),
							mintedCryptocurrency: newMintedCryptocurrency,
							totalSupply: newTotalSupply,
							circulatingSupply: newCirculatingSupply,
							marketCap: newMarketCap.toFixed(2),
							liquidityPool: newLiquidityPool,
						},
						{ new: true } // Retorna o documento atualizado
					);

				if (!updatedCryptoCurrency) {
					return res
						.status(404)
						.json({ message: "Erro ao atualizar a criptomoeda!" });
				}

				res.status(200).json({
					message: "TRANSAÇÃO EFETUADA COM SUCESSO",
					updatedCryptoCurrency,
				});
			} else {
				console.log(
					"Quantidade de Otaku Point insuficiente para realizar esta transação!"
				);
				return;
			}
		} catch (error) {
			console.log(error);
		}
	}
}

export default CryptocurrencyController;
