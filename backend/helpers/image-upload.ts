import { Request } from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";

const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

// Destino do Storage Image
const storageTypes: {
	[key: string]: multer.StorageEngine;
} = {
	// Storage Local
	local: multer.diskStorage({
		destination: (req, file, cb) => {
			let folder = "";

			if (req.baseUrl.includes("customers")) {
				folder = "customers";
			} else if (req.baseUrl.includes("partners")) {
				folder = "partners";
			} else if (req.baseUrl.includes("products")) {
				folder = "products";
			} else if (req.baseUrl.includes("reviews")) {
				folder = "reviews";
			} else if (req.baseUrl.includes("raffles")) {
				folder = "raffles";
			} else if (req.baseUrl.includes("chats")) {
				folder = "chats";
			}

			cb(null, `public/images/${folder}`);
		},
		filename: (req, file, cb) => {
			cb(
				null,
				Date.now() +
					String(Math.floor(Math.random() * 1000)) +
					path.extname(file.originalname)
			);
		},
	}),

	// Storage S3 sem Diretórios (mais simples, porém não organiza os arquivos em pastas)
	S3: multerS3({
		s3: s3Client,
		bucket: process.env.AWS_BUCKET!,
		contentType: multerS3.AUTO_CONTENT_TYPE,
		key: (req, file, cb) => {
			cb(
				null,
				Date.now() +
					String(Math.floor(Math.random() * 1000)) +
					path.extname(file.originalname)
			);
		},
	}),

	// // Storage S3 com Diretórios (O problema é que salva o nome do diretório no banco, ao invés apenas do nome do arquivo)
	// S3: multerS3({
	// 	s3: s3Client,
	// 	bucket: process.env.AWS_BUCKET!,
	// 	contentType: multerS3.AUTO_CONTENT_TYPE,
	// 	key: (req: Request, file, cb) => {
	// 		let folder = "";

	// 		if (req.baseUrl.includes("customers")) {
	// 			folder = "customers";
	// 		} else if (req.baseUrl.includes("partners")) {
	// 			folder = "partners";
	// 		} else if (req.baseUrl.includes("products")) {
	// 			folder = "products";
	// 		} else if (req.baseUrl.includes("reviews")) {
	// 			folder = "reviews";
	// 		} else if (req.baseUrl.includes("raffles")) {
	// 			folder = "raffles";
	// 		} else if (req.baseUrl.includes("chats")) {
	// 			folder = "chats";
	// 		}

	// 		const filename =
	// 			Date.now() +
	// 			String(Math.floor(Math.random() * 1000)) +
	// 			path.extname(file.originalname);

	// 		cb(null, `${folder}/${filename}`);
	// 	},
	// }),
};

const imageUpload = multer({
	storage: storageTypes[process.env.IMAGE_STORAGE_TYPE as string],
	limits: {
		fileSize: 2 * 1024 * 1024,
	},
	fileFilter: (req, file, cb) => {
		console.log("File received:", file);
		if (!file.originalname.match(/\.(png|jpg)$/)) {
			return cb(
				new Error("Por favor envie somente imagens em jpg ou png!")
			);
		}
		cb(null, true);
	},
});

export { imageUpload };
