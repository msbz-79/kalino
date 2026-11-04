
import { useState } from "react";
import { Link } from "react-router";

import { IoIosMenu } from "react-icons/io";
import { CiMobile4 } from "react-icons/ci";
import { CiLaptop } from "react-icons/ci";
import { SlNotebook } from "react-icons/sl";
import { IoShirtOutline } from "react-icons/io5";
import { BsHeartPulse } from "react-icons/bs";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";

function Menu() {
    const [menu, setMenu] = useState("mobile");
    const [isClosed, setIsClosed] = useState(false);

    const closeMenu = () => setIsClosed(true);

    const mobileBrandLink = (brand: string) =>
        `/mobile?brand=${encodeURIComponent(brand)}`;

    const mobileMaxPriceLink = (price: number) =>
        `/mobile?max_price=${price}`;

    return (
        <div className="hidden px-10 lg:block lg:px-40">
            <div
                className="group relative mb-1 mt-2 inline-block text-lightTextColor dark:text-textColor"
                onMouseEnter={() => setIsClosed(false)}
            >
                <div className="flex cursor-pointer items-center">
                    <IoIosMenu className="ml-1 size-8" />
                    <span>دسته بندی کالاها</span>
                </div>

                {/* پس زمینه منو */}
                <div
                    className={`
                        pointer-events-none fixed inset-0
                        bg-black/10 backdrop-blur-sm
                        transition-all duration-300
                        ${
                            isClosed
                                ? "invisible opacity-0"
                                : "invisible opacity-0 group-hover:visible group-hover:opacity-100"
                        }
                    `}
                />

                {/* محتوای منو */}
                <div
                    className={`
                        absolute top-full flex h-[500px] w-200
                        overflow-hidden rounded-xl
                        bg-lightSurfaceColor shadow-lightBoxShadow
                        transition-all duration-200
                        dark:bg-surfaceColor dark:shadow-darkBoxShadow
                        ${
                            isClosed
                                ? "invisible opacity-0"
                                : "invisible opacity-0 group-hover:visible group-hover:opacity-100"
                        }
                    `}
                >
                    {/* دسته‌بندی اصلی */}
                    <div className="flex h-full w-[30%] shrink-0 flex-col bg-lightSurfaceColor px-5 pt-3 dark:bg-surfaceColor">
                        <div
                            onClick={() => setMenu("mobile")}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 ${
                                menu === "mobile"
                                    ? "bg-primaryColor text-white"
                                    : "hover:text-primaryColor"
                            }`}
                        >
                            <CiMobile4 className="size-5" />
                            موبایل
                        </div>

                        <div
                            onClick={() => setMenu("laptop")}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 ${
                                menu === "laptop"
                                    ? "bg-primaryColor text-white"
                                    : "hover:text-primaryColor"
                            }`}
                        >
                            <CiLaptop className="size-5" />
                            لپ تاپ
                        </div>

                        <div
                            onClick={() => setMenu("note")}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 ${
                                menu === "note"
                                    ? "bg-primaryColor text-white"
                                    : "hover:text-primaryColor"
                            }`}
                        >
                            <SlNotebook className="size-5" />
                            لوازم تحریر
                        </div>

                        <div
                            onClick={() => setMenu("cloth")}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 ${
                                menu === "cloth"
                                    ? "bg-primaryColor text-white"
                                    : "hover:text-primaryColor"
                            }`}
                        >
                            <IoShirtOutline className="size-5" />
                            پوشاک
                        </div>

                        <div
                            onClick={() => setMenu("heart")}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 ${
                                menu === "heart"
                                    ? "bg-primaryColor text-white"
                                    : "hover:text-primaryColor"
                            }`}
                        >
                            <BsHeartPulse className="size-5" />
                            آرایشی بهداشتی
                        </div>
                    </div>

                    {/* زیرمجموعه‌ها */}
                    <div className="h-full min-h-0 w-[70%] overflow-y-auto pt-3 [direction:ltr]">
                        <div dir="rtl">
                            {menu === "mobile" && (
                                <div>
                                    <h3>
                                        <Link
                                            to="/mobile"
                                            onClick={closeMenu}
                                            className="flex w-fit items-center px-5 py-2 text-sm font-DanaMedium text-lightTextColor transition-colors duration-200 hover:text-primaryColor dark:text-textColor"
                                        >
                                            همه محصولات موبایل
                                            <MdOutlineKeyboardArrowLeft className="size-5" />
                                        </Link>
                                    </h3>

                                    <div className="mt-3 grid grid-cols-2">
                                        {/* فیلتر برند */}
                                        <div className="relative before:absolute before:right-3 before:top-2.5 before:h-4 before:w-0.5 before:rounded-xl before:bg-primaryDarkColor before:content-['']">
                                            <h4>
                                                <Link
                                                    to="/mobile"
                                                    onClick={closeMenu}
                                                    className="flex w-fit items-center px-5 py-2 text-sm font-DanaBold text-lightTextColor transition-colors duration-200 hover:text-primaryColor dark:text-textColor"
                                                >
                                                    برند های مختلف موبایل
                                                    <MdOutlineKeyboardArrowLeft className="size-5" />
                                                </Link>
                                            </h4>

                                            <div className="flex flex-col gap-y-5 px-5 py-3 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                                <Link
                                                    to={mobileBrandLink("سامسونگ")}
                                                    onClick={closeMenu}
                                                    className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                >
                                                    گوشی سامسونگ
                                                </Link>

                                                <Link
                                                    to={mobileBrandLink("شیائومی")}
                                                    onClick={closeMenu}
                                                    className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                >
                                                    گوشی شیائومی
                                                </Link>

                                                <Link
                                                    to={mobileBrandLink("نوکیا")}
                                                    onClick={closeMenu}
                                                    className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                >
                                                    گوشی نوکیا
                                                </Link>

                                                <Link
                                                    to={mobileBrandLink("اپل")}
                                                    onClick={closeMenu}
                                                    className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                >
                                                    گوشی اپل
                                                </Link>

                                                <Link
                                                    to={mobileBrandLink("هواوی")}
                                                    onClick={closeMenu}
                                                    className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                >
                                                    گوشی هواوی
                                                </Link>

                                                <Link
                                                    to={mobileBrandLink("سایفر")}
                                                    onClick={closeMenu}
                                                    className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                >
                                                    گوشی سایفر
                                                </Link>

                                                <Link
                                                    to={mobileBrandLink("آنر")}
                                                    onClick={closeMenu}
                                                    className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                >
                                                    گوشی آنر
                                                </Link>

                                                <Link
                                                    to={mobileBrandLink("ریلمی")}
                                                    onClick={closeMenu}
                                                    className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                >
                                                    گوشی ریلمی
                                                </Link>

                                                <Link
                                                    to={mobileBrandLink("گوگل پیکسل")}
                                                    onClick={closeMenu}
                                                    className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                >
                                                    گوشی گوگل پیکسل
                                                </Link>
                                            </div>
                                        </div>

                                        {/* فیلتر قیمت */}
                                        <div className="relative before:absolute before:right-3 before:top-2.5 before:h-4 before:w-0.5 before:rounded-xl before:bg-primaryDarkColor before:content-['']">
                                            <h4>
                                                <Link
                                                    to="/mobile"
                                                    onClick={closeMenu}
                                                    className="flex w-fit items-center px-5 py-2 text-sm font-DanaBold text-lightTextColor transition-colors duration-200 hover:text-primaryColor dark:text-textColor"
                                                >
                                                    موبایل بر اساس قیمت
                                                    <MdOutlineKeyboardArrowLeft className="size-5" />
                                                </Link>
                                            </h4>

                                            <div className="flex flex-col gap-y-5 px-5 py-3 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                                {[30, 40, 50, 60, 70, 80, 90, 100, 150, 200].map(
                                                    (price) => (
                                                        <Link
                                                            key={price}
                                                            to={mobileMaxPriceLink(
                                                                price * 1000000
                                                            )}
                                                            onClick={closeMenu}
                                                            className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                        >
                                                            گوشی تا {price} میلیون تومان
                                                        </Link>
                                                    )
                                                )}

                                                <Link
                                                    to="/mobile?min_price=200000000"
                                                    onClick={closeMenu}
                                                    className="w-fit transition-all duration-200 hover:text-primaryColor"
                                                >
                                                    گوشی بالای 200 میلیون تومان
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Menu;
