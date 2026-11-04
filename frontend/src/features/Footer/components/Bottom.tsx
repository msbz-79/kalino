import { Link } from "react-router"
import { FaInstagram } from "react-icons/fa6";
import { FiTwitter } from "react-icons/fi";
import { FaLinkedin } from "react-icons/fa";
import { FaTelegram } from "react-icons/fa";

function Bottom() {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 mt-15 text-lightTextColor dark:text-textColor pb-5 lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-0">
                <div className="text-center lg:text-right">
                    <h5 className="font-DanaBold text-[18px]">با کالینو</h5>
                    <div className="flex flex-col mt-3 gap-y-3">
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">فروش در کالینو</Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">گزارش تخلف در کالینو</Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">تماس با کالینو</Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">درباره کالینو</Link>
                    </div>
                </div>
                <div className="text-center lg:text-right mt-5 sm:mt-0">
                    <h5 className="font-DanaBold text-[18px]">خدمات مشتریان</h5>
                    <div className="flex flex-col mt-3 gap-y-3">
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">معرفی تخفیف ها</Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">پرسش های متداول</Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">چگونگی بازگشت کالا</Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">حریم خصوصی</Link>
                    </div>
                </div>
                <div className="text-center lg:text-right mt-5 lg:mt-0">
                    <h5 className="font-DanaBold text-[18px]">راهنمای خرید از کالینو</h5>
                    <div className="flex flex-col mt-3 gap-y-3">
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">نحوه ثبت سفارش</Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">چگونگی ارسال کالا</Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200">چگونگی پرداخت</Link>
                    </div>
                </div>
                <div className="text-center lg:text-right mt-5 lg:mt-0">
                    <h5 className="font-DanaBold text-[18px]">همراه ما باشید!</h5>
                    <div className="flex items-center justify-center gap-5 mt-3 lg:justify-between lg:gap-0">
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200 transform hover:scale-110"><FaInstagram className="size-10" /></Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200 transform hover:scale-110"><FiTwitter className="size-10" /></Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200 transform hover:scale-110"><FaLinkedin className="size-10" /></Link>
                        <Link to={"/"} className="hover:text-primaryColor transition-all duration-200 transform hover:scale-110"><FaTelegram className="size-10" /></Link>
                    </div>
                    <div className="flex flex-col items-center mt-10">
                        <label className="text-center lg:text-right">با ثبت ایمیل، از جدیدترین تخفیف ها باخبر شوید.</label>
                        <div className="flex items-center justify-center mt-5">
                            <input type="text" placeholder="ایمیل شما" className="w-full sm:w-70 lg:w-55 xl:w-100 py-2 px-7 outline-0 border-0 bg-lightSurfaceColor dark:bg-surfaceColor rounded-xl shadow-lightBoxShadow dark:shadow-darkBoxShadow focus:shadow-lightButtonShadow dark:focus:shadow-darkButtonShadow" />
                            <button className="px-5 py-2 border border-lightBorderColor dark:border-borderColor shadow-lightButtonShadow dark:shadow-darkButtonShadow rounded-xl mr-3 hover:bg-surfaceHoverColor transition-all duration-200 hover:text-textColor cursor-pointer ">ثبت</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mx-auto text-center text-lightTextColor dark:text-textColor text-sm mt-5 pb-5">{new Date().getFullYear()} © - تمامی حقوق مادی و معنوی برای فروشگاه اینترنتی <span className="text-primaryColor">کالینو</span> محفوظ می‌باشد.</div>

        </>
    )
}

export default Bottom