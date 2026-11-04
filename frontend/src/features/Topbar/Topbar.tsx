import { Link } from "react-router";
import SearchInput from "../../components/Common/SearchInput";
import Basket from "./components/Basket";
import Register from "./components/Register";
import Notifcation from "./components/Notifcation";
import Menu from "./components/Menu";
import { MdOutlineWbSunny } from "react-icons/md";
import { FaRegMoon } from "react-icons/fa";

type TopbarProps = {
    dark: boolean;
    changeTheme: () => void;
    isSearchOpen: boolean;
    setIsSearchOpen: (value: boolean) => void;
};

function Topbar({
    dark,
    changeTheme,
    isSearchOpen,
    setIsSearchOpen,
}: TopbarProps) {
    return (
        <div
            className="
                fixed top-0
                z-50
                w-full
                bg-lightSurfaceColor
                dark:bg-surfaceColor
                shadow-lightBoxShadow
                dark:shadow-darkBoxShadow
                transition-colors duration-300
            "
        >
            <div className="flex items-center justify-between px-5 py-5 sm:px-10 lg:px-40 lg:py-0">
                <div className="flex items-center">
                    {/* Logo */}
                    <div>
                        <Link to="/">
                            <img
                                src="/images/logo.png"
                                alt="logo"
                                className="
                                    block
                                    h-10 w-30
                                    lg:h-20 lg:w-40
                                    dark:hidden
                                "
                            />

                            <img
                                src="/images/darklogo.png"
                                alt="logo"
                                className="
                                    hidden
                                    h-10 w-30
                                    lg:h-20 lg:w-40
                                    dark:block
                                "
                            />
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="mr-5">
                        <SearchInput
                            isSearchOpen={isSearchOpen}
                            setIsSearchOpen={setIsSearchOpen}
                        />
                    </div>
                </div>

                <div className="flex items-center">
                    {/* Theme */}
                    <div
                        className="
                            ml-2 hidden h-10 w-10 cursor-pointer
                            items-center justify-center rounded-full
                            border border-slate-200 bg-white
                            text-slate-700 shadow-lightButtonShadow
                            transition-all duration-300 hover:bg-slate-100
                            hover:shadow-md active:scale-95
                            dark:border-slate-700 dark:bg-slate-900
                            dark:text-slate-200 dark:shadow-darkButtonShadow
                            dark:hover:bg-slate-800
                            lg:flex
                        "
                        onClick={changeTheme}
                    >
                        {dark ? (
                            <MdOutlineWbSunny className="size-5" />
                        ) : (
                            <FaRegMoon className="size-5" />
                        )}
                    </div>

                    {/* Notification */}
                    <div className="ml-5 hidden lg:block">
                        <Notifcation />
                    </div>

                    {/* Register */}
                    <Register />

                    <div className="hidden h-8 w-0.5 bg-borderColor dark:bg-slate-700 lg:block" />

                    {/* Basket */}
                    <div className="mr-5 hidden lg:block">
                        <Basket />
                    </div>
                </div>
            </div>

            <Menu />
        </div>
    );
}

export default Topbar;
