import { MdOutlineDashboard } from "react-icons/md";
import { LuUsersRound } from "react-icons/lu";
import { TiShoppingCart, TiMessages } from "react-icons/ti";
import { IoNewspaperOutline, IoLogOutOutline } from "react-icons/io5";
import { RiMessage2Line, RiMoneyDollarCircleLine } from "react-icons/ri";
import { FaRegUser } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router";
import clsx from "clsx";
import toast from "react-hot-toast";

import { useAuth } from "../../../../context/AuthContext";

function Sidebar() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();

        toast.success("با موفقیت از حساب کاربری خارج شدید.");

        navigate("/login", { replace: true });
    };

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        clsx(
            "relative mb-2 flex min-w-0 items-center gap-2 rounded-xl p-3 pr-4 transition-all duration-300",
            "text-sm lg:text-base",
            isActive
                ? "bg-secondaryLightColor text-lightTextColor dark:text-textColor before:absolute before:-right-5 before:top-2 before:bottom-2 before:w-1 before:rounded-lg before:bg-secondaryColor"
                : "hover:bg-lightSurfaceHoverColor hover:text-secondaryDarkColor dark:hover:bg-surfaceHoverColor dark:hover:text-secondaryLightColor"
        );

    const iconClass = "size-5 shrink-0 sm:size-6 lg:size-7";

    return (
        <aside
            className="
                w-full min-w-0 shrink-0
                max-h-[38%] overflow-x-hidden overflow-y-auto
                rounded-2xl border
                border-lightBorderColor/60 dark:border-borderColor/60
                bg-lightSurfaceColor/80 dark:bg-surfaceColor/80
                shadow-lightCardShadow dark:shadow-darkCardShadow
                backdrop-blur-2xl backdrop-saturate-150
                transition-all duration-300
                sm:rounded-3xl
                lg:max-h-none lg:w-64 lg:overflow-y-auto
                xl:w-72
            "
        >
            <div className="p-3 sm:p-4 lg:p-5">
                <nav className="font-DanaMedium text-lightTextColor dark:text-textColor">
                    <NavLink to="/admin" end className={navLinkClass}>
                        <MdOutlineDashboard className={iconClass} />
                        <span>داشبورد</span>
                    </NavLink>

                    <NavLink to="/admin/users" className={navLinkClass}>
                        <LuUsersRound className={iconClass} />
                        <span>مدیریت کاربران</span>
                    </NavLink>

                    <NavLink to="/admin/products" className={navLinkClass}>
                        <IoNewspaperOutline className={iconClass} />
                        <span>مدیریت محصولات</span>
                    </NavLink>

                    <NavLink to="/admin/userorders" className={navLinkClass}>
                        <TiShoppingCart className={iconClass} />
                        <span>سفارش‌ها</span>
                    </NavLink>

                    <NavLink to="/admin/financial" className={navLinkClass}>
                        <RiMoneyDollarCircleLine className={iconClass} />
                        <span>مالی و درآمد</span>
                    </NavLink>

                    <NavLink to="/admin/usercomments" className={navLinkClass}>
                        <RiMessage2Line className={iconClass} />
                        <span>نظرات کاربران</span>
                    </NavLink>

                    <NavLink to="/admin/usertickets" className={navLinkClass}>
                        <TiMessages className={iconClass} />
                        <span>تیکت‌های کاربران</span>
                    </NavLink>
                </nav>

                <div className="my-4 border-t border-lightBorderColor dark:border-borderColor sm:my-5" />

                <div className="font-DanaMedium text-lightTextColor dark:text-textColor">
                    <NavLink to="/admin/information"
                        className="
                            mb-2 flex min-w-0 cursor-pointer items-center gap-2
                            rounded-xl p-3 text-sm transition-all duration-300
                            hover:bg-lightSurfaceHoverColor hover:text-secondaryDarkColor
                            dark:hover:bg-surfaceHoverColor dark:hover:text-secondaryLightColor
                            lg:text-base
                        "
                    >
                        <FaRegUser className={iconClass} />
                        <span>اطلاعات حساب کاربری</span>
                    </NavLink >

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="
                            flex w-full min-w-0 cursor-pointer items-center gap-2
                            rounded-xl p-3 text-sm text-red-600
                            transition-all duration-300 hover:bg-red-500/10
                            lg:text-base
                        "
                    >
                        <IoLogOutOutline className={iconClass} />
                        <span>خروج</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
