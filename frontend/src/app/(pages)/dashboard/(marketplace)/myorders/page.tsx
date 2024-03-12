"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

// Components
import { Sidebar } from "@/components/Sidebar";

// Imagens e Logos
import Otakuyasan from "../../../../../public/otakuyasan.png";
import Otakuyasan2 from "../../../../../public/otakuyasan2.png";
import Amora from "../../../../../public/amora.jpg";
import MundosInfinitos from "../../../../../public/mundos-infinitos.png";

// Icons
import {
	ShoppingCartOne,
	ShoppingBag,
	Coupon,
	PaymentMethod,
	Currency,
	Credit,
	Deposit,
	Expenses,
	Send,
	AddPicture,
} from "@icon-park/react";
import { GrChat } from "react-icons/gr";
import { LuSettings, LuQrCode } from "react-icons/lu";
import { RiAccountPinBoxLine } from "react-icons/ri";
import { MdOutlineWarehouse } from "react-icons/md";
import {
	BsShopWindow,
	BsChatSquareText,
	BsCurrencyDollar,
	BsCheck2All,
	BsCheck2,
} from "react-icons/bs";
import { GoArrowUpRight, GoLinkExternal } from "react-icons/go";
import { PiHandHeartDuotone, PiChatCenteredText } from "react-icons/pi";
import { IoIosSearch } from "react-icons/io";
import { IoImageOutline } from "react-icons/io5";
import { IoIosArrowDown } from "react-icons/io";
import { HiOutlineEllipsisVertical } from "react-icons/hi2";
import { TbCurrencyReal } from "react-icons/tb";
import { CiWarning } from "react-icons/ci";
import { FaPlus } from "react-icons/fa6";

// Axios
import api from "@/utils/api";

function MyOrdersPage() {
	const [myorders, setMyorders] = useState([]);
	const [token] = useState(localStorage.getItem("token") || "");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await api.get("/orders/partner-orders", {
					headers: {
						Authorization: `Bearer ${JSON.parse(token)}`,
					},
				});
				if (response.data && response.data.orders) {
					setMyorders(response.data.orders);
				} else {
					console.error("Dados de pedidos inválidos:", response.data);
				}
			} catch (error) {
				console.error("Erro ao obter dados do usuário:", error);
			}
		};
		fetchData();
	}, [token]);

	return (
		<section className="grid grid-cols-6 md:grid-cols-10 grid-rows-1 gap-4">
			<Sidebar />
			<div className="bg-gray-500 col-start-3 col-span-4 md:col-start-3 md:col-span-10 mb-4">
				<div className="flex flex-col gap-4 mb-8">
					{/* Gadget 1 */}
					<div className="bg-purple-400 w-[1200px] p-6 rounded-md mt-4 mr-4">
						{/* Adicionar Porduto */}
						<div className="flex flex-col gap-2 ml-6 mb-6">
							<h1 className="text-2xl font-semibold">
								Meus Pedidos
							</h1>

							{/* Produtos em Catálogo */}
							<div className="overflow-x-auto">
								<table className="table">
									{/* head */}
									<thead>
										<tr>
											<th>
												<label>
													<input
														type="checkbox"
														className="checkbox"
													/>
												</label>
											</th>
											<th className="text-sm">
												Produtos
											</th>
											<th className="text-sm">
												Total do Pedido
											</th>
											<th className="text-sm">
												Status | Prazo
											</th>
											<th className="text-sm">
												Comprador
											</th>
											<th className="text-sm">
												ID do Pedido
											</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{/* row 1 */}
										{myorders.length > 0 &&
											myorders.map((myorder) => (
												<tr key={myorder._id}>
													<th>
														<label>
															<input
																type="checkbox"
																className="checkbox"
															/>
														</label>
													</th>
													<td>
														<div className="flex items-center gap-3 mb-2">
															<div className="avatar">
																<div className="mask mask-squircle w-12 h-12">
																	<img
																		src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
																		alt="Avatar Tailwind CSS Component"
																	/>
																</div>
															</div>
															<div>
																<div className="font-bold">
																	{myorder.itemsList.map(
																		(
																			item
																		) => (
																			<h2 className="w-[230px] overflow-x-auto mb-2">
																				{
																					item
																				}
																			</h2>
																		)
																	)}
																</div>
															</div>
														</div>
													</td>
													<td>
														{myorder.orderCostTotal.toLocaleString(
															"pt-BR",
															{
																style: "currency",
																currency: "BRL",
															}
														)}
														<br />
														<span className="badge badge-success badge-sm">
															{
																myorder.paymentMethod
															}
														</span>
													</td>
													<td>
														<div>
															{
																myorder.statusOrder
															}
														</div>
														<div className="text-xs opacity-50">
															{
																myorder.daysShipping
															}{" "}
															dias
														</div>
													</td>
													<td className="w-[200px] overflow-x-auto">
														{myorder.customerName}
													</td>
													<td className="text-xs">
														{myorder.orderNumber}
													</td>
													<th>
														<button className="flex items-center btn btn-ghost btn-xs">
															+ Detalhes
														</button>
													</th>
												</tr>
											))}
									</tbody>

									{/* foot */}
									<tfoot>
										<tr>
											<th></th>
											<th>Name</th>
											<th>Job</th>
											<th>Favorite Color</th>
											<th></th>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default MyOrdersPage;
