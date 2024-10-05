import React, { useRef, useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import "./Carousel.css"; // Certifique-se de que o CSS personalizado está correto

const ThumbnailCarousel = () => {
	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Monitora a troca de slides no Embla
	const onSelect = () => {
		if (!emblaApi) return;
		setSelectedIndex(emblaApi.selectedScrollSnap());
	};

	// Liga o evento onSelect no emblaApi
	useEffect(() => {
		if (!emblaApi) return;
		emblaApi.on("select", onSelect);
	}, [emblaApi]);

	const slides = [
		"https://pm1.aminoapps.com/8607/207d3a1d5d87c8f11d627c8d3eef530baf7d2713r1-1000-1000v2_uhq.jpg",
		"imagem2.jpg",
		"imagem3.jpg",
		"imagem4.jpg",
	];

	const goToSlide = (index) => {
		if (emblaApi) emblaApi.scrollTo(index);
	};

	return (
		<div>
			<div className="embla" ref={emblaRef}>
				<div className="embla__container">
					{slides.map((slide, index) => (
						<div className="embla__slide" key={index}>
							<img src={slide} alt={`Slide ${index}`} />
						</div>
					))}
				</div>
			</div>
			{/* Thumbnails que servem como botões */}
			<div className="thumbnails">
				{slides.map((slide, index) => (
					<button
						key={index}
						className={`thumbnail ${
							selectedIndex === index ? "is-selected" : ""
						}`} // Adiciona uma classe se estiver selecionada
						onClick={() => goToSlide(index)}>
						<img src={slide} alt={`Thumbnail ${index}`} />
					</button>
				))}
			</div>
		</div>
	);
};

export { ThumbnailCarousel };
