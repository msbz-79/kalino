import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Link } from "react-router";
import ProductCard from "./ProductCard";

function CommonSlider({ products = [] }) {
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
                    className="w-50! h-auto!"
                >
                    <Link to={`/products/${product.id}`}>
                        <ProductCard product={product} />
                    </Link>
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

export default CommonSlider;
