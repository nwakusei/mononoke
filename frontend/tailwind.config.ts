import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
				"gradient-conic":
					"conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
			},
		},
	},
	daisyui: {
		themes: [
			{
				mytheme: {
					primary: "#3e1d88",

					secondary: "#8357e5",

					accent: "#f471b5",

					neutral: "#1d283a",

					"base-100": "#0f1729",

					info: "#0ca6e9",

					success: "#2bd4bd",

					warning: "#f4c152",

					error: "#fb6f84",
				},
			},
		],
	},
	plugins: [require("daisyui")],
};
export default config;
