import { useState } from "react"
import { BsHeartPulse } from "react-icons/bs"
import { CiLaptop, CiMobile4 } from "react-icons/ci"
import { IoShirtOutline } from "react-icons/io5"
import { MdOutlineKeyboardArrowLeft } from "react-icons/md"
import { SlNotebook } from "react-icons/sl"
import { Link, useLocation, useSearchParams } from "react-router"

function MenuContent() {
    const [menu, setMenu] = useState("mobile")
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null)

    const location = useLocation()
    const [searchParams] = useSearchParams()

    const handleMenuChange = (menuName: string) => {
        setMenu(menuName)
        setActiveSubMenu(null)
    }

    const handleSubMenuChange = (subMenuName: string) => {
        setActiveSubMenu((prev) =>
            prev === subMenuName ? null : subMenuName
        )
    }

    // ساخت لینک فیلتر موبایل با حفظ فیلترهای قبلی
    const mobileFilterLink = (key: string, value: string | number) => {
        const params =
            location.pathname === "/mobile"
                ? new URLSearchParams(searchParams)
                : new URLSearchParams()

        params.set(key, String(value))

        const minPrice = Number(params.get("min_price"))
        const maxPrice = Number(params.get("max_price"))

        // جلوگیری از ایجاد بازه قیمت نامعتبر
        if (
            params.has("min_price") &&
            params.has("max_price") &&
            maxPrice < minPrice
        ) {
            if (key === "max_price") {
                params.delete("min_price")
            } else if (key === "min_price") {
                params.delete("max_price")
            }
        }

        return `/mobile?${params.toString()}`
    }

    const mobileBrands = [
        "سامسونگ",
        "شیائومی",
        "نوکیا",
        "اپل",
        "هواوی",
        "سایفر",
        "آنر",
        "ریلمی",
        "گوگل پیکسل",
    ]

    const mobilePrices = [30, 40, 50, 60, 70, 80, 90, 100, 150, 200]

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
                                }`}
                        >
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
                                }`}
                        >
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
                                }`}
                        >
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
                                }`}
                        >
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
                                }`}
                        >
                            <BsHeartPulse className="size-5 shrink-0" />
                            <span className="leading-4">آرایشی بهداشتی</span>
                        </Link>
                    </div>
                </aside>
            </div>

            <div className="h-full min-h-0 flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
                <div className="pt-3">
                    {menu === "mobile" && (
                        <div>
                            <h3>
                                <Link
                                    to="/mobile"
                                    className="flex items-center w-fit font-DanaMedium text-lightTextColor dark:text-textColor text-sm px-5 py-2 hover:text-primaryColor transition-colors duration-200"
                                >
                                    همه محصولات موبایل
                                    <MdOutlineKeyboardArrowLeft className="size-5" />
                                </Link>
                            </h3>

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
                                            {mobileBrands.map((brand) => (
                                                <Link
                                                    key={brand}
                                                    to={mobileFilterLink("brand", brand)}
                                                    className="w-fit hover:text-primaryColor transition-all duration-200"
                                                >
                                                    گوشی {brand}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border-b border-lightBorderColor dark:border-borderColor mx-5"></div>

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
                                            {mobilePrices.map((price) => (
                                                <Link
                                                    key={price}
                                                    to={mobileFilterLink("max_price", price * 1000000)}
                                                    className="w-fit hover:text-primaryColor transition-all duration-200"
                                                >
                                                    گوشی تا {price} میلیون تومان
                                                </Link>
                                            ))}

                                            <Link
                                                to={mobileFilterLink("min_price", 200000000)}
                                                className="w-fit hover:text-primaryColor transition-all duration-200"
                                            >
                                                گوشی بالای ۲۰۰ میلیون تومان
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="border-b border-lightBorderColor dark:border-borderColor mx-5"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MenuContent
