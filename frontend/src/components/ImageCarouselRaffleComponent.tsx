import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

// React Icons
import { MdOutlineArrowBackIosNew } from "react-icons/md";
import { MdOutlineArrowForwardIos } from "react-icons/md";

const ImageCarouselRaffleComponent = ({
	raffle,
	handleThumbnailClick,
	selectedImage,
}) => {
	const [emblaRef, emblaApi] = useEmblaCarousel({
		loop: false, // O carrossel não irá voltar automaticamente ao início
		containScroll: "trimSnaps", // Mantém as imagens centralizadas e ajustadas
		align: "start", // Alinha o conteúdo no início
		slidesToScroll: 1, // Rola uma imagem de cada vez
		dragFree: false, // Usuário não pode arrastar livremente
	});
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	const onSelect = useCallback(() => {
		if (!emblaApi) return;
		setCanScrollPrev(emblaApi.canScrollPrev());
		setCanScrollNext(emblaApi.canScrollNext());
	}, [emblaApi]);

	useEffect(() => {
		if (!emblaApi) return;
		emblaApi.on("select", onSelect);
		onSelect(); // Atualiza o estado das setas no início
	}, [emblaApi, onSelect]);

	return (
		<div className="relative w-[402px]">
			{/* Contêiner de miniaturas */}
			<div
				className="embla w-full overflow-hidden relative"
				ref={emblaRef}>
				<div className="embla__container flex gap-2">
					{raffle?.imagesRaffle?.map((image, index) => (
						<div
							key={index}
							className={`embla__slide flex-none bg-white border-black border-solid border-[1px] w-[74px] rounded relative shadow-md cursor-pointer ${
								selectedImage === index
									? "border-primary"
									: "border-opacity-20"
							}`}
							onClick={() => handleThumbnailClick(index)}>
							<div className="h-[74px] flex items-center justify-center">
								<Image
									className="object-contain h-full cursor-pointer"
									src={`https://mononokebucket.s3.us-east-1.amazonaws.com/${image}`}
									alt={`Thumbnail ${index}`}
									width={50}
									height={10}
								/>
							</div>
						</div>
					))}
				</div>

				{/* Botão de navegação anterior */}
				<button
					onClick={() => emblaApi && emblaApi.scrollPrev()}
					disabled={!canScrollPrev}
					className={`flex flex-row items-center justify-center w-[30px] h-[60px] absolute left-0 top-1/2 transform -translate-y-1/2 z-10 text-black px-2 py-1 bg-primary rounded ${
						!canScrollPrev ? "opacity-50" : ""
					}`}>
					<MdOutlineArrowBackIosNew size={20} />
				</button>

				{/* Botão de navegação próximo */}
				<button
					onClick={() => emblaApi && emblaApi.scrollNext()}
					disabled={!canScrollNext}
					className={`flex flex-row items-center justify-center w-[30px] h-[60px] absolute right-0 top-1/2 transform -translate-y-1/2 z-10 text-black px-2 py-1 bg-primary rounded ${
						!canScrollNext ? "opacity-50" : ""
					}`}>
					<MdOutlineArrowForwardIos size={20} />
				</button>
			</div>
		</div>
	);
};

export { ImageCarouselRaffleComponent };
