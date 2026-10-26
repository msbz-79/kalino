import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/pagination"
import { Autoplay, Pagination } from "swiper/modules"
import SliderButtons from "./components/SliderButtons"
import { Link } from "react-router"

export default function Slider() {
    return (
        <div className="w-full h-35 sm:h-50 lg:h-100">
            <Swiper
                loop={true}
                pagination={{
                    dynamicBullets: true,
                }}
                modules={[Pagination, Autoplay]}
                autoplay={{
                    delay: 2000,
                    disableOnInteraction: false,
                }}
                className="mySwiper group relative h-full w-full"
            >

                {/* موبایل */}
                <SwiperSlide>
                    <Link to={"/"}>
                        <div className="h-full w-full">
                            <img
                                src="/images/sliderbaners/mobilebaner.png"
                                alt="بنر موبایل"
                                className="block h-full w-full object-cover"
                            />
                        </div>
                    </Link>
                </SwiperSlide>


                {/* لپ تاپ */}
                <SwiperSlide>
                    <Link to={"/"}>
                        <div className="h-full w-full">
                            <img
                                src="/images/sliderbaners/laptopbaner.png"
                                alt="بنر لپ تاپ"
                                className="block h-full w-full object-cover"
                            />
                        </div>
                    </Link>
                </SwiperSlide>


                {/* لوازم تحریر */}
                <SwiperSlide>
                    <Link to={"/"}>
                        <div className="h-full w-full">
                            <img
                                src="/images/sliderbaners/notebaner.png"
                                alt="بنر لوازم تحریر"
                                className="block h-full w-full object-cover"
                            />
                        </div>
                    </Link>
                </SwiperSlide>


                {/* پوشاک */}
                <SwiperSlide>
                    <Link to={"/"}>
                        <div className="h-full w-full">
                            <img
                                src="/images/sliderbaners/clothbaner.png"
                                alt="بنر پوشاک"
                                className="block h-full w-full object-cover"
                            />
                        </div>
                    </Link>
                </SwiperSlide>


                {/* آرایشی و بهداشتی */}
                <SwiperSlide>
                    <Link to={"/"}>
                        <div className="h-full w-full">
                            <img
                                src="/images/sliderbaners/heartbaner.png"
                                alt="بنر آرایشی و بهداشتی"
                                className="block h-full w-full object-cover"
                            />
                        </div>
                    </Link>
                </SwiperSlide>


                {/* دکمه های قبلی و بعدی */}
                <SliderButtons />

            </Swiper>
        </div>
    )
}