import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const mainDB: Connection = mongoose.createConnection(
	process.env.DATABASE_MAIN as string,
	{
		// ALTERAR NOME DO BANCO DE DADOS ANTES DE SUBIR PARA PRODUÇÃO
		dbName: "MononokeDB",
	}
);

mainDB.on("connected", () => {
	console.log("Conectado ao MononokeDB");
});

mainDB.on("error", (err) => {
	console.error("Erro na conexão ao MononokeDB:", err);
});

export default mainDB;
