import { IoIosMenu } from "react-icons/io";
import { CiMobile4 } from "react-icons/ci";
import { CiLaptop } from "react-icons/ci";
import { SlNotebook } from "react-icons/sl";
import { IoShirtOutline } from "react-icons/io5";
import { BsHeartPulse } from "react-icons/bs";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { Link } from "react-router";
import { useState } from "react";
function Menu() {
  const [menu, setMenu] = useState("mobile")
  const [isClosed, setIsClosed] = useState(false)
  return (
    <div className="hidden lg:block px-10 lg:px-40">
      <div className="relative group inline-block mt-2 mb-1 text-lightTextColor dark:text-textColor" onMouseEnter={() => setIsClosed(false)}>
        <div className="flex items-center cursor-pointer">
          <IoIosMenu className="size-8 ml-1" />
          <span>دسته بندی کالاها</span>
        </div>
        <div
          className={`
          fixed
          inset-0
          bg-black/10
          backdrop-blur-sm
          transition-all duration-300
          pointer-events-none
          ${isClosed ? "opacity-0 invisible" : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"}
        `}
        />
        <div className={`absolute flex top-full w-200 h-[500px] overflow-hidden bg-lightSurfaceColor dark:bg-surfaceColor rounded-xl shadow-lightBoxShadow dark:shadow-darkBoxShadow transition-all duration-200 ${isClosed ? "opacity-0 invisible" : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"}`}>
          <div className="flex h-full w-[30%] shrink-0 flex-col px-5 pt-3 bg-lightSurfaceColor dark:bg-surfaceColor">
            <div
              onClick={() => setMenu("mobile")}
              className={`flex items-center w-full gap-2 py-2 px-3 rounded-lg transition-colors duration-200 cursor-pointer ${menu === "mobile"
                ? "bg-primaryColor text-white"
                : "hover:text-primaryColor"
                }`}
            >
              <CiMobile4 className="size-5" />
              موبایل
            </div>

            <div
              onClick={() => setMenu("laptop")}
              className={`flex items-center w-full gap-2 py-2 px-3 rounded-lg transition-colors duration-200 cursor-pointer ${menu === "laptop"
                ? "bg-primaryColor text-white"
                : "hover:text-primaryColor"
                }`}
            >
              <CiLaptop className="size-5" />
              لپ تاپ
            </div>

            <div
              onClick={() => setMenu("note")}
              className={`flex items-center w-full gap-2 py-2 px-3 rounded-lg transition-colors duration-200 cursor-pointer ${menu === "note"
                ? "bg-primaryColor text-white"
                : "hover:text-primaryColor"
                }`}
            >
              <SlNotebook className="size-5" />
              لوازم تحریر
            </div>

            <div
              onClick={() => setMenu("cloth")}
              className={`flex items-center w-full gap-2 py-2 px-3 rounded-lg transition-colors duration-200 cursor-pointer ${menu === "cloth"
                ? "bg-primaryColor text-white"
                : "hover:text-primaryColor"
                }`}
            >
              <IoShirtOutline className="size-5" />
              پوشاک
            </div>

            <div
              onClick={() => setMenu("heart")}
              className={`flex items-center w-full gap-2 py-2 px-3 rounded-lg transition-colors duration-200 cursor-pointer ${menu === "heart"
                ? "bg-primaryColor text-white"
                : "hover:text-primaryColor"
                }`}
            >
              <BsHeartPulse className="size-5" />
              آرایشی بهداشتی
            </div>        </div>
          <div className="h-full min-h-0 w-[70%] overflow-y-auto pt-3 [direction:ltr]">
            <div dir="rtl">
              {
                menu === "mobile" &&
                <div>
                  <h3><Link to={"/mobile"} onClick={() => setIsClosed(true)} className="flex items-center w-fit font-DanaMedium text-lightTextColor dark:text-textColor text-sm px-5 py-2 hover:text-primaryColor transition-colors duration-200">همه محصولات موبایل<MdOutlineKeyboardArrowLeft className="size-5" /></Link></h3>
                  <div className="grid grid-cols-2 mt-3">
                    <div className="relative before:absolute before:top-2.5 before:right-3 before:content{''} before:rounded-xl before:w-0.5 before:h-4 before:bg-primaryDarkColor">
                      <h4><Link to={"/mobile"} onClick={() => setIsClosed(true)} className="flex items-center w-fit font-DanaBold text-lightTextColor dark:text-textColor text-sm px-5 py-2 hover:text-primaryColor transition-colors duration-200">برند های مختلف موبایل<MdOutlineKeyboardArrowLeft className="size-5" /></Link></h4>
                      <div className="flex flex-col text-lightTextColorMuted dark:text-textColorMuted text-sm px-5 gap-y-5 py-3">
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی سامسونگ</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی شیائومی</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی نوکیا</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی اپل</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی هواوی</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی سایفر</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی آنر</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی ریلمی</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی گوگل پیکسل</Link>
                      </div>
                    </div>
                    <div className="relative before:absolute before:top-2.5 before:right-3 before:content{''} before:rounded-xl before:w-0.5 before:h-4 before:bg-primaryDarkColor">
                      <h4><Link to={"/mobile"} onClick={() => setIsClosed(true)} className="flex items-center w-fit font-DanaBold text-lightTextColor dark:text-textColor text-sm px-5 py-2 hover:text-primaryColor transition-colors duration-200">موبایل بر اساس قیمت<MdOutlineKeyboardArrowLeft className="size-5" /></Link></h4>
                      <div className="flex flex-col text-lightTextColorMuted dark:text-textColorMuted text-sm px-5 gap-y-5 py-3">
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 2 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 5 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 7 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 10 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 12 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 15 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 20 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 25 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 30 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 40 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 50 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 60 میلیون تومان</Link>
                        <Link to={"/"} className="w-fit hover:text-primaryColor transition-all duration-200">گوشی تا 70 میلیون تومان</Link>
                      </div>
                    </div>
                  </div>
                </div>

              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Menu;
