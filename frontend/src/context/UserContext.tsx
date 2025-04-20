"use client";

import { createContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePartners } from "@/hooks/usePartners";

const Context = createContext();

interface IChildrenProps {
	children: React.ReactNode;
}

function UserProvider({ children }: IChildrenProps) {
	const {
		registerCustomer,
		registerPartner,
		loginUser,
		userAuthenticated,
		logout,
	} = useAuth();

	const { partners } = usePartners();

	return (
		<Context.Provider
			value={{
				registerCustomer,
				registerPartner,
				loginUser,
				userAuthenticated,
				logout,
				partners,
			}}>
			{children}
		</Context.Provider>
	);
}

export { Context, UserProvider };
