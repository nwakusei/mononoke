import Link from "next/link";
import Image from "next/image";

// Imaagens
import Banner from "../../public/banner.png";

function HomePage() {
	return (
		<section className="text-center grid grid-cols-8 grid-rows-4 gap-4 mx-8 my-8">
			<div className=" col-start-2 col-span-6">
				<Image
					className="rounded-xl shadow-lg w-full"
					src={Banner}
					alt=""
					width={1280}
					unoptimized
					priority
				/>
			</div>
			<div className="bg-yellow-500 col-start-2 col-span-6">
				<h1 className="text-2xl font-semibold mb-2">
					O que é o "Otaku Prime"?!!
				</h1>
				<p>
					Somos o primeiro programa de benefícios totalmente voltado
					para Otakus.
				</p>
			</div>

			<div className="bg-yellow-500 col-start-2 col-span-6">
				<h1 className="text-2xl font-semibold mb-2">
					O que oferecemos?
				</h1>
				<p>
					O Otaku Prime oferece diversos benefícios, pra você ou pra
					sua loja: <br />
					◉ Cashbacks* exclusivos em lojas parceiras <br />
					◉ Cupons de desconto exclusivos em lojas parceiras
					<br />◉ Temos um Market Place voltados para itens
					promocionais
				</p>
			</div>

			<div className="bg-yellow-500 col-start-2 col-span-6">
				<h2 className="text-2xl font-semibold mb-2">
					Que tal aproveitar todos os nossos Benefícios?
				</h2>
				<p>Cadastre-se agora mesmo e explore o Otaku Prime</p>
			</div>

			<div className="bg-yellow-500 col-start-2 col-span-6">
				<h3 className="text-2xl font-semibold mb-2">
					Ainda possui dúvidas?
				</h3>
				<p>Acesse nossa FAQ</p>
			</div>

			<div className="bg-yellow-500">
				<p>COLUNA 5</p>
			</div>

			<div className="bg-yellow-500">
				<p>COLUNA 6</p>
			</div>

			<div className="bg-yellow-500">
				<p>COLUNA 7</p>
			</div>

			<div className="bg-yellow-500">
				<p>COLUNA 8</p>
			</div>
		</section>
	);
}

export default HomePage;
