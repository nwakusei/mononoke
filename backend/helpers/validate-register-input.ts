import { body } from "express-validator";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const validateRegisterInput = [
	body("name")
		.trim()
		.notEmpty()
		.withMessage("O nome precisa ser preenchido")
		.bail()
		.custom((value) => {
			// Use uma expressão regular para permitir apenas letras e espaços
			if (!/^[a-zA-Z\s-]+$/.test(value)) {
				throw new Error(
					"O nome não pode conter caracteres especiais ou números."
				);
			}
			return true;
		}),
	body("email")
		.isEmail()
		.trim()
		.notEmpty()
		.withMessage("O email precisa ser preenchido"),
	body("password")
		.isLength({ min: 6 })
		.trim()
		.notEmpty()
		.customSanitizer((value) => {
			// Use DOMPurify para evitar injeção HTML
			return DOMPurify.sanitize(value);
		})
		.withMessage("A senha precisa ter no mínimo 6 caracteres"),
	body("confirmPassword")
		.isLength({ min: 6 })
		.trim()
		.notEmpty()
		.customSanitizer((value) => {
			// Use DOMPurify para evitar injeção HTML
			return DOMPurify.sanitize(value);
		})
		.withMessage("Confirme a senha")
		.custom((value, { req }) => {
			if (value !== req.body.password) {
				throw new Error("As senhas digitadas precisam ser iguais!");
			}
			return true;
		}),
];

export { validateRegisterInput };
