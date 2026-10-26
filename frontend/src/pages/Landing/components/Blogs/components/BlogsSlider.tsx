import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import BlogCard from './BlogCard';

function BlogsSlider() {
    return (
        <Swiper
            dir="rtl"
            slidesPerView="auto"
            spaceBetween={100}
            grabCursor={true}
            slidesOffsetBefore={5}
            slidesOffsetAfter={5}
            pagination={{
                clickable: true,
            }}
            className="mySwiper h-auto! mt-7 group relative"
        >
            <SwiperSlide className="w-50! h-auto!"><BlogCard /></SwiperSlide>
            <SwiperSlide className="w-50! h-auto!"><BlogCard /></SwiperSlide>
            <SwiperSlide className="w-50! h-auto!"><BlogCard /></SwiperSlide>
            <SwiperSlide className="w-50! h-auto!"><BlogCard /></SwiperSlide>
            <SwiperSlide className="w-50! h-auto!"><BlogCard /></SwiperSlide>
            <SwiperSlide className="w-50! h-auto!"><BlogCard /></SwiperSlide>
            <SwiperSlide className="w-50! h-auto!"><BlogCard /></SwiperSlide>
            <SwiperSlide className="w-50! h-auto!"><BlogCard /></SwiperSlide>

        </Swiper>
    )
}

export default BlogsSlider