"use client";

import "./globals.css";
import { useEffect } from "react";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Componentes
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UserProvider } from "@/context/UserContext";

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// useEffect(() => {
	// 	// Inicialize o ToastProvider apenas no cliente
	// 	const { ToastProvider } = require("react-toast-notifications");
	// }, []);

	return (
		<html lang="pt-BR">
			<body>
				<UserProvider>
					<Navbar />
					{children}
					<ToastContainer position="bottom-center" theme="colored" />
					<Footer />
				</UserProvider>
			</body>
		</html>
	);
}
