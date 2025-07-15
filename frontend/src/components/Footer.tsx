// Icons
import { AiFillTikTok } from "react-icons/ai";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import { FaBluesky, FaSquareFacebook, FaXTwitter } from "react-icons/fa6";
import { IoLogoYoutube } from "react-icons/io5";
import { LiaFacebookSquare } from "react-icons/lia";
import { RiYoutubeLine } from "react-icons/ri";
import { TbBrandBluesky } from "react-icons/tb";

function Footer() {
	return (
		<footer className="flex flex-row justify-center bg-primary py-10 gap-10 text-center">
			{/* <div>
				<h1>[ Imagens ]</h1>
			</div>
			<div>
				<h1>Sobre a Amazon</h1>
			</div>
			<div>
				<h1>Negócios na Amazon</h1>
			</div>
			<div>
				<h1>Pagamento na Amazon</h1>
			</div>
			<div>
				<h1>Ajuda e Guia</h1>
			</div>
			<div>
				<h1>[ Imagens ]</h1>
			</div> */}

			<div className="flex flex-col items-center justify-center gap-8">
				<div>
					<div className="mb-2">Siga-nos nas Redes Sociais:</div>
					<div className="flex flex-row justify-center items-center gap-2">
						<div>
							<FaInstagram size={22} />
						</div>
						<div>
							<FaXTwitter size={20} />
						</div>

						<div>
							<LiaFacebookSquare size={28} />
						</div>

						<div>
							<FaTiktok size={18} />
						</div>

						<div>
							<RiYoutubeLine size={28} />
						</div>

						<div>
							<TbBrandBluesky size={22} />
						</div>
					</div>
				</div>
				<div>
					<div>© Mononoke • 2025 | Todos os direitos reservados.</div>
					<div className="mb-2">Versão: 1.0.0</div>
				</div>
			</div>
		</footer>
	);
}

export { Footer };
