import "./globals.css";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Componentes
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Providers do Context
import { UserProvider } from "@/context/UserContext";
import { CheckoutProvider } from "@/context/CheckoutContext";

export const metadata: Metadata = {
	title: "Mononoke",
	description: "A loja de produtos otaku mais completa do Brasil",
	icons: {
		icon: "/favicon.ico",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="pt-BR" className={montserrat.className}>
			<head>
				{/* <link rel="icon" href="../../public/favicon.ico" /> */}
			</head>
			<body>
				<UserProvider>
					<CheckoutProvider>
						<Navbar />
						{children}
						<ToastContainer
							position="bottom-center"
							theme="colored"
							autoClose={3000}
						/>
						<Footer />
					</CheckoutProvider>
				</UserProvider>
			</body>
		</html>
	);
}
