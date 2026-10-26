import { useState } from "react"
import { BsHeartPulse } from "react-icons/bs"
import { CiLaptop, CiMobile4 } from "react-icons/ci"
import { IoShirtOutline } from "react-icons/io5"
import { MdOutlineKeyboardArrowLeft } from "react-icons/md"
import { SlNotebook } from "react-icons/sl"
import { Link } from "react-router"

function MenuContent() {
    const [menu, setMenu] = useState("mobile")
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null)

    const handleMenuChange = (menuName: string) => {
        setMenu(menuName)
        setActiveSubMenu(null)
    }

    const handleSubMenuChange = (subMenuName: string) => {
        setActiveSubMenu((prev) =>
            prev === subMenuName ? null : subMenuName
        )
    }
    return (
        <div className="flex h-full min-h-0 w-full border-b border-lightBorderColor dark:border-borderColor">
            <div className="min-h-0 overflow-y-auto">
                <aside className="h-full w-22.5 shrink-0 overflow-y-auto border-l border-lightBorderColor bg-lightSurfaceColor dark:border-borderColor dark:bg-surfaceColor">

                    <div className="min-h-20 border-b border-lightBorderColor dark:border-borderColor" onClick={() => handleMenuChange("mobile")}>

                        <Link
                            to="/mobile"
                            className={`flex h-20 w-full flex-col items-center justify-center gap-1.5 px-1 text-center text-[11px] transition-colors duration-200
    ${menu === "mobile"
                                    ? "bg-primaryColor text-white"
                                    : "text-lightTextColor dark:text-textColor hover:text-primaryColor"
                                }`}                      >
                            <CiMobile4 className="size-5 shrink-0" />
                            <span className="leading-4">موبایل</span>
                        </Link>
                    </div>

                    <div className="min-h-20 border-b border-lightBorderColor dark:border-borderColor" onClick={() => handleMenuChange("laptop")}>
                        <Link
                            to="/laptop"
                            className={`flex h-20 w-full flex-col items-center justify-center gap-1.5 px-1 text-center text-[11px] transition-colors duration-200
    ${menu === "laptop"
                                    ? "bg-primaryColor text-white"
                                    : "text-lightTextColor dark:text-textColor hover:text-primaryColor"
                                }`}>
                            <CiLaptop className="size-5 shrink-0" />
                            <span className="leading-4">لپ تاپ</span>
                        </Link>
                    </div>

                    <div className="min-h-20 border-b border-lightBorderColor dark:border-borderColor" onClick={() => handleMenuChange("note")}>
                        <Link
                            to="/"
                            className={`flex h-20 w-full flex-col items-center justify-center gap-1.5 px-1 text-center text-[11px] transition-colors duration-200
    ${menu === "note"
                                    ? "bg-primaryColor text-white"
                                    : "text-lightTextColor dark:text-textColor hover:text-primaryColor"
                                }`}                        >
                            <SlNotebook className="size-5 shrink-0" />
                            <span className="leading-4">لوازم تحریر</span>
                        </Link>
                    </div>

                    <div className="min-h-20 border-b border-lightBorderColor dark:border-borderColor" onClick={() => handleMenuChange("cloth")}>
                        <Link
                            to="/"
                            className={`flex h-20 w-full flex-col items-center justify-center gap-1.5 px-1 text-center text-[11px] transition-colors duration-200
    ${menu === "cloth"
                                    ? "bg-primaryColor text-white"
                                    : "text-lightTextColor dark:text-textColor hover:text-primaryColor"
                                }`}                        >
                            <IoShirtOutline className="size-5 shrink-0" />
                            <span className="leading-4">پوشاک</span>
                        </Link>
                    </div>

                    <div className="min-h-20 border-b border-lightBorderColor dark:border-borderColor" onClick={() => handleMenuChange("heart")}>
                        <Link
                            to="/"
                            className={`flex h-20 w-full flex-col items-center justify-center gap-1.5 px-1 text-center text-[11px] transition-colors duration-200
    ${menu === "heart"
                                    ? "bg-primaryColor text-white"
                                    : "text-lightTextColor dark:text-textColor hover:text-primaryColor"
                                }`}                        >
                            <BsHeartPulse className="size-5 shrink-0" />
                            <span className="leading-4">آرایشی بهداشتی</span>
                        </Link>
                    </div>
                </aside>
            </div>
            <div className="h-full min-h-0 flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
                <div className="pt-3">
                    {
                        menu === "mobile" &&
                        <div>
                            <h3><Link to={"/"} className="flex items-center w-fit font-DanaMedium text-lightTextColor dark:text-textColor text-sm px-5 py-2 hover:text-primaryColor transition-colors duration-200">همه محصولات موبایل<MdOutlineKeyboardArrowLeft className="size-5" /></Link></h3>
                            <div className="flex flex-col">
                                <div className="py-2">
                                    <h4>
                                        <button
                                            type="button"
                                            onClick={() => handleSubMenuChange("mobile-brands")}
                                            className="flex items-center justify-between cursor-pointer w-full font-DanaBold text-lightTextColor dark:text-textColor text-sm px-5 py-2 hover:text-primaryColor transition-colors duration-200"
                                        >
                                            برند های مختلف موبایل

                                            <MdOutlineKeyboardArrowLeft
                                                className={`size-5 transition-transform duration-200 ${activeSubMenu === "mobile-brands"
                                                    ? "-rotate-90"
                                                    : ""
                                                    }`}
                                            />
                                        </button>
                                    </h4>

                                    {activeSubMenu === "mobile-brands" && (
                                        <div className="flex flex-col text-lightTextColorMuted dark:text-textColorMuted text-sm px-5 gap-y-5 py-3">
                                            <Link
                                                to="/"
                                                className="w-fit hover:text-primaryColor transition-all duration-200"
                                            >
                                                گوشی سامسونگ
                                            </Link>

                                            <Link
                                                to="/"
                                                className="w-fit hover:text-primaryColor transition-all duration-200"
                                            >
                                                گوشی شیائومی
                                            </Link>

                                            <Link
                                                to="/"
                                                className="w-fit hover:text-primaryColor transition-all duration-200"
                                            >
                                                گوشی نوکیا
                                            </Link>

                                            <Link
                                                to="/"
                                                className="w-fit hover:text-primaryColor transition-all duration-200"
                                            >
                                                گوشی اپل
                                            </Link>

                                            <Link
                                                to="/"
                                                className="w-fit hover:text-primaryColor transition-all duration-200"
                                            >
                                                گوشی هواوی
                                            </Link>

                                            <Link
                                                to="/"
                                                className="w-fit hover:text-primaryColor transition-all duration-200"
                                            >
                                                گوشی سایفر
                                            </Link>

                                            <Link
                                                to="/"
                                                className="w-fit hover:text-primaryColor transition-all duration-200"
                                            >
                                                گوشی آنر
                                            </Link>

                                            <Link
                                                to="/"
                                                className="w-fit hover:text-primaryColor transition-all duration-200"
                                            >
                                                گوشی ریلمی
                                            </Link>

                                            <Link
                                                to="/"
                                                className="w-fit hover:text-primaryColor transition-all duration-200"
                                            >
                                                گوشی گوگل پیکسل
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                <div className="border-b border-lightBorderColor dark:border-borderColor mx-5 "></div>
                                <div className="py-2">
                                    <h4>
                                        <button
                                            type="button"
                                            onClick={() => handleSubMenuChange("mobile-price")}
                                            className="flex items-center cursor-pointer justify-between w-full font-DanaBold text-lightTextColor dark:text-textColor text-sm px-5 py-2 hover:text-primaryColor transition-colors duration-200"
                                        >
                                            موبایل بر اساس قیمت

                                            <MdOutlineKeyboardArrowLeft
                                                className={`size-5 transition-transform duration-200 ${activeSubMenu === "mobile-price"
                                                    ? "-rotate-90"
                                                    : ""
                                                    }`}
                                            />
                                        </button>
                                    </h4>

                                    {activeSubMenu === "mobile-price" && (
                                        <div className="flex flex-col text-lightTextColorMuted dark:text-textColorMuted text-sm px-5 gap-y-5 py-3">

                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 2 میلیون تومان
                                            </Link>

                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 5 میلیون تومان
                                            </Link>

                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 7 میلیون تومان
                                            </Link>

                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 10 میلیون تومان
                                            </Link>

                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 12 میلیون تومان
                                            </Link>
                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 15 میلیون تومان
                                            </Link>
                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 20 میلیون تومان
                                            </Link>
                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 25 میلیون تومان
                                            </Link>
                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 30 میلیون تومان
                                            </Link>
                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 40 میلیون تومان
                                            </Link>
                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 50 میلیون تومان
                                            </Link>
                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 60 میلیون تومان
                                            </Link>
                                            <Link to="/" className="w-fit hover:text-primaryColor transition-all duration-200">
                                                گوشی تا 70 میلیون تومان
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                <div className="border-b border-lightBorderColor dark:border-borderColor mx-5 "></div>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default MenuContent