import { FaArrowUp } from "react-icons/fa";
import { Link } from "react-router";

function Header() {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <div className="w-full py-5">
            <div className="flex w-full flex-col items-center justify-center gap-5 text-center lg:flex-row lg:items-center lg:justify-between lg:text-right">
                <div className="flex w-full flex-col items-center lg:w-auto lg:items-start">
                    <Link to="/" className="flex justify-center lg:justify-start">
                        <img src="./public/images/logo.png" alt="logo" className="block w-30 h-10 lg:w-40 lg:h-20 dark:hidden" />
                        <img src="./public/images/darklogo.png" alt="logo" className="hidden w-30 h-10 lg:w-40 lg:h-20 dark:block" />
                    </Link>
                    <div className="w-full text-center text-lightTextColorMuted dark:text-textColorMuted text-sm mt-3 leading-7 lg:w-auto lg:text-right">
                        <span>تلفن پشتیبانی 12345678-021 <span className="mx-5">|</span></span><span>12345678-021<span className="mx-5">|</span></span><span>7 روز هفته، 24 ساعته پاسخگوی شما هستیم.</span>
                    </div>
                </div>
                <div className="flex w-full justify-center lg:w-auto">
                    <button onClick={scrollToTop} className="flex items-center border border-lightBorderColor dark:border-borderColor text-lightTextColor dark:text-textColor rounded-lg py-2 px-4 shadow-lightButtonShadow dark:shadow-darkButtonShadow hover:bg-surfaceHoverColor hover:text-textColor transition-all duration-200 cursor-pointer">بازگشت به بالا<FaArrowUp className="size-5 mr-1" /></button>
                </div>
            </div>
        </div>
    )
}

export default Header