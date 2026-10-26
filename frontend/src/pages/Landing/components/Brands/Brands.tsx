import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
function Brands() {
    return (
        <div className='mt-10'>
            <div className="flex items-center justify-between mb-10">
                <h5 className="relative font-DanaBold text-lightTextColor dark:text-textColor text-2xl before:content[''] before:absolute before:w-45 before:h-1 before:bg-primaryColor before:top-10 before:rounded-xl">برندهای فروشگاه</h5>
            </div>
            <div>

                <Swiper
                    slidesPerView="auto"
                    spaceBetween={10}
                    pagination={{
                        clickable: true,
                    }}
                    className="mySwiper"
                >
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 font-DanaBold text-lightTextColor dark:text-textColor rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/brands/brand1.png" alt="" className="object-cover size-full mb-2" />
                            <span>شیائومی</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 font-DanaBold text-lightTextColor dark:text-textColor rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/brands/brand2.png" alt="" className="object-cover size-full mb-2" />
                            <span>سامسونگ</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 font-DanaBold text-lightTextColor dark:text-textColor rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/brands/brand3.png" alt="" className="object-cover size-full mb-2" />
                            <span>اپل</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 font-DanaBold text-lightTextColor dark:text-textColor rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/brands/brand4.png" alt="" className="object-cover size-full mb-2" />
                            <span>لنوو</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 font-DanaBold text-lightTextColor dark:text-textColor rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadowshadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/brands/brand5.png" alt="" className="object-cover size-full mb-2" />
                            <span>الجی</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 font-DanaBold text-lightTextColor dark:text-textColor rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/brands/brand6.png" alt="" className="object-cover size-full mb-2" />
                            <span>کنون</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 font-DanaBold text-lightTextColor dark:text-textColor rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/brands/brand1.png" alt="" className="object-cover size-full mb-2" />
                            <span>شیائومی</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 font-DanaBold text-lightTextColor dark:text-textColor rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/brands/brand2.png" alt="" className="object-cover size-full mb-2" />
                            <span>سامسونگ</span>
                        </div>
                    </SwiperSlide>

                </Swiper>
            </div>
        </div>
    )
}

export default Brands