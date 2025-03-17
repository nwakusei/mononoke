import React from "react";
import { FiInfo } from "react-icons/fi";

function MiniTicketCard({ TicketNumber, winningTicket }) {
	return (
		<div className="flex flex-row bg-primary w-[253px] h-[100px] gap-2 rounded-md relative">
			<div className="flex flex-col items-center justify-center mt-1 ml-[30px] gap-2">
				<span className="text-xl text-white">
					{`Ticket #${TicketNumber}`}
				</span>
				{winningTicket && (
					<div className="relative flex flex-row items-center justify-center gap-2">
						<span className="bg-violet-950 py-1 px-2 rounded-md">
							Sorteado
						</span>
						<div
							className="relative tooltip cursor-pointer text-black overflow-visible"
							data-tip="Entre em contato com o organizador para combinar sobre o envio do prêmio!">
							<FiInfo
								className="animate-pulse text-violet-950"
								size={20}
							/>
						</div>
					</div>
				)}
			</div>
			{/* Linha vertical */}
			<div
				className="relative h-full w-[1px] ml-[20px] my-[2px]"
				style={{
					background:
						"repeating-linear-gradient(to bottom, white 0, white 5px, transparent 5px, transparent 10px)",
				}}></div>
			{/* Corte côncavo esquerdo */}
			<div
				className="absolute top-1/2 left-0 w-[20px] h-[40px] bg-white"
				style={{
					borderRadius: "0 50% 50% 0",
					transform: "translate(-50%, -50%)",
				}}></div>
			{/* Corte côncavo direito */}
			<div
				className="absolute top-1/2 right-0 w-[20px] h-[40px] bg-white"
				style={{
					borderRadius: "50% 0 0 50%",
					transform: "translate(50%, -50%)",
				}}></div>
		</div>
	);
}

export { MiniTicketCard };

// import React, { useState } from "react";
// import { FiInfo } from "react-icons/fi";

// function MiniTicketCard({ TicketNumber, winningTicket }) {
// 	return (
// 		<div className="flex flex-row bg-primary w-[253px] h-[100px] gap-2 rounded-md relative overflow-hidden">
// 			<div className="flex flex-col items-center justify-center mt-1 ml-[30px] gap-2">
// 				<span className="text-xl text-white">
// 					{`Ticket #${TicketNumber}`}
// 				</span>
// 				<span>
// 					{winningTicket ? (
// 						<div className="flex flex-row items-center justify-center gap-2">
// 							<span className="bg-violet-950 py-1 px-2 rounded-md">
// 								Sorteado
// 							</span>
// 						</div>
// 					) : (
// 						<></>
// 					)}
// 				</span>
// 			</div>
// 			{/* Linha vertical */}
// 			<div
// 				className="relative h-full w-[1px] ml-[20px] my-[2px]"
// 				style={{
// 					background:
// 						"repeating-linear-gradient(to bottom, white 0, white 5px, transparent 5px, transparent 10px)",
// 				}}></div>
// 			{/* Corte côncavo esquerdo */}
// 			<div
// 				className="absolute top-1/2 left-0 w-[20px] h-[40px] bg-white"
// 				style={{
// 					borderRadius: "0 50% 50% 0",
// 					transform: "translate(-50%, -50%)",
// 				}}></div>
// 			{/* Corte côncavo direito */}
// 			<div
// 				className="absolute top-1/2 right-0 w-[20px] h-[40px] bg-white"
// 				style={{
// 					borderRadius: "50% 0 0 50%",
// 					transform: "translate(50%, -50%)",
// 				}}></div>
// 		</div>
// 	);
// }

// export { MiniTicketCard };
