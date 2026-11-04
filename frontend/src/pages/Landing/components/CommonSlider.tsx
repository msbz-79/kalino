
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";

import ProductCard from "./ProductCard";

type Product = {
    id: number;
    name: string;
    image: string | null;
    slug: string;
    price: number;
    discount_percentage?: number | null;
    original_price?: number | null;
};

type CommonSliderProps = {
    products?: Product[];
};

function CommonSlider({ products = [] }: CommonSliderProps) {
    return (
        <Swiper
            dir="rtl"
            slidesPerView="auto"
            spaceBetween={10}
            grabCursor={true}
            slidesOffsetBefore={5}
            slidesOffsetAfter={5}
            pagination={{
                clickable: true,
            }}
            className="mySwiper h-auto! mt-7 group relative"
        >
            {products.map((product) => (
                <SwiperSlide
                    key={product.id}
                    className="h-auto! w-50!"
                >
                    <ProductCard product={product} />
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

export default CommonSlider;
