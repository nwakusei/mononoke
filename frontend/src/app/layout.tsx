"use client";

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
import { CartProvider } from "@/context/CartContext";

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="pt-BR">
			<body>
				<UserProvider>
					<CartProvider>
						<Navbar />
						{children}
						<ToastContainer
							position="bottom-center"
							theme="colored"
						/>
						<Footer />
					</CartProvider>
				</UserProvider>
			</body>
		</html>
	);
}
