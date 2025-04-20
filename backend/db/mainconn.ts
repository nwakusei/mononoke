import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const mainDB: Connection = mongoose.createConnection(
	process.env.DATABASE_MAIN as string,
	{
		dbName: "OtakuPrimeDB",
	}
);

mainDB.on("connected", () => {
	console.log("Conectado ao OtakuPrimeDB");
});

mainDB.on("error", (err) => {
	console.error("Erro na conexão ao OtakuPrimeDB:", err);
});

export default mainDB;
