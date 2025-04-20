import multer from "multer";
import multerS3 from "multer-s3";
import aws from "@aws-sdk/client-s3";
import path from "path";

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
	// Storage S3
	S3: multerS3({
		s3: new aws.S3(),
		bucket: "bucket-name",
		contentType: multerS3.AUTO_CONTENT_TYPE,
		acl: "public-read",
		key: (req, file, cb) => {
			cb(
				null,
				Date.now() +
					String(Math.floor(Math.random() * 1000)) +
					path.extname(file.originalname)
			);
		},
	}),
};

// `${process.env.STORAGE_TYPE}`;

const imageUpload = multer({
	storage: storageTypes["local"],
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
