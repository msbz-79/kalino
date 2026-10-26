import { MdChevronLeft, MdChevronRight } from "react-icons/md"
import { useSwiper } from "swiper/react"

function SliderButtons() {
    const swiper = useSwiper()

    return (
        <>
            <button
                type="button"
                onClick={() => swiper.slidePrev()}
                className="
                    group/prev
                    absolute right-4 top-1/2 z-20
                    flex size-11 -translate-y-1/2
                    cursor-pointer items-center justify-center
                    rounded-full
                    border border-white/30
                    bg-black/25
                    text-white
                    shadow-lg
                    backdrop-blur-md
                    transition-all duration-300

                    opacity-0
                    group-hover:opacity-100

                    hover:scale-110
                    hover:bg-black/50
                    active:scale-95

                    max-md:opacity-100
                    max-md:size-10
                    max-md:right-2
                "
            >
                <MdChevronRight
                    className="
                        size-6
                        transition-transform duration-300
                        group-hover/prev:translate-x-0.5
                    "
                />
            </button>

            <button
                type="button"
                onClick={() => swiper.slideNext()}
                className="
                    group/next
                    absolute left-4 top-1/2 z-20
                    flex size-11 -translate-y-1/2
                    cursor-pointer items-center justify-center
                    rounded-full
                    border border-white/30
                    bg-black/25
                    text-white
                    shadow-lg
                    backdrop-blur-md
                    transition-all duration-300

                    opacity-0
                    group-hover:opacity-100

                    hover:scale-110
                    hover:bg-black/50
                    active:scale-95

                    max-md:opacity-100
                    max-md:size-10
                    max-md:left-2
                "
            >
                <MdChevronLeft
                    className="
                        size-6
                        transition-transform duration-300
                        group-hover/next:-translate-x-0.5
                    "
                />
            </button>
        </>
    )
}

export default SliderButtons