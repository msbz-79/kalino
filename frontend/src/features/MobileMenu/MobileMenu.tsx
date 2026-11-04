import Basket from "../Topbar/components/Basket"
import Notifcation from "../Topbar/components/Notifcation"
import MenuButton from "./components/MenuButton"
import User from "./components/User"
import { MdOutlineWbSunny } from "react-icons/md"
import { FaRegMoon } from "react-icons/fa"
import { useNavigate } from "react-router"
import { useAuth } from "../../context/AuthContext"

type MobileMenuProps = {
    dark: boolean;
    changeTheme: () => void;
    isOpen: boolean;
    setIsOpen: (value: boolean) => void
};

function MobileMenu({ dark, changeTheme, isOpen, setIsOpen }: MobileMenuProps) {
    const navigate = useNavigate()
    const { user, isAuthenticated, isLoading } = useAuth()

    const showMobileMenu = () => {
        setIsOpen(!isOpen)
    }

    const handleUserClick = () => {
        if (isLoading) return

        if (!isAuthenticated) {
            navigate("/login")
            return
        }

        navigate(user?.role === "admin" ? "/admin" : "/panel")
    }

    return (
        <div className="lg:hidden fixed bottom-0 z-20 bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow w-full z-999">
            <div className="flex items-center justify-between px-5 sm:px-10 py-5">
                <div className="flex flex-col items-center">
                    <div onClick={showMobileMenu}>
                        <MenuButton />
                    </div>
                    <span className="block text-lightTextColor dark:text-textColor text-sm mt-2 flex-wrap">
                        دسته بندی
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <Notifcation />
                    <span className="block text-lightTextColor dark:text-textColor text-sm mt-2 flex-wrap">
                        اعلانات
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <Basket />
                    <span className="block text-lightTextColor dark:text-textColor text-sm mt-2 flex-wrap">
                        سبد خرید
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lightButtonShadow dark:shadow-darkButtonShadow transition-all duration-300 hover:bg-slate-100 hover:shadow-md active:scale-95 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={changeTheme}
                    >
                        {dark ? (
                            <MdOutlineWbSunny className="size-5" />
                        ) : (
                            <FaRegMoon className="size-5" />
                        )}
                    </div>

                    <span className="block text-lightTextColor dark:text-textColor text-sm mt-2 flex-wrap">
                        تغییر تم
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <div
                        onClick={handleUserClick}
                        className={`flex flex-col items-center ${isLoading ? "cursor-wait" : "cursor-pointer"}`}
                    >
                        <User />

                        <span className="block text-lightTextColor dark:text-textColor text-sm mt-2 max-w-20 truncate">
                            {isLoading
                                ? "..."
                                : isAuthenticated
                                    ? user?.name
                                    : "ورود | ثبت نام"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MobileMenu
