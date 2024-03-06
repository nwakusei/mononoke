import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const otakupayDB: Connection = mongoose.createConnection(
	process.env.DATABASE_OTAKUPAY as string,
	{
		dbName: "OtakuPayDB",
	}
);

otakupayDB.on("connected", () => {
	console.log("Conectado ao OtakuPayDB");
});

otakupayDB.on("error", (err) => {
	console.error("Erro na conexão ao OtakuPayDB:", err);
});

export default otakupayDB;
