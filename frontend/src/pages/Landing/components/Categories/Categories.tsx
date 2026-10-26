import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';

function Categories() {
    return (
        <div className="text-lightTextColor dark:text-textColor mt-10">
            <h5 className="relative font-DanaBold text-3xl mb-10 before:content[''] before:absolute before:w-45 before:h-1 before:bg-primaryColor before:top-10 before:rounded-xl">دسته بندی ها</h5>
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
                        <div className="flex flex-col p-3 w-45 rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/categories/category1.png" alt="" className="size-20 mb-2" />
                            <span>موبایل</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/categories/category2.png" alt="" className="size-20 mb-2" />
                            <span>لپ تاپ</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/categories/category3.png" alt="" className="size-20 mb-2" />
                            <span>لوازم تحریر</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/categories/category4.png" alt="" className="size-20 mb-2" />
                            <span>پوشاک</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadowshadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/categories/category1.png" alt="" className="size-20 mb-2" />
                            <span>آرایشی بهداشتی</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/categories/category2.png" alt="" className="size-20 mb-2" />
                            <span>ابزار</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/categories/category3.png" alt="" className="size-20 mb-2" />
                            <span>پزشکی</span>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className='w-45!'>
                        <div className="flex flex-col p-3 w-45 rounded-xl items-center justify-center bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow cursor-pointer transform lg:hover:scale-105 transition-all duration-200">
                            <img src="/images/categories/category4.png" alt="" className="size-20 mb-2" />
                            <span>مهندسی</span>
                        </div>
                    </SwiperSlide>

                </Swiper>
            </div>
        </div>
    )
}

export default Categories