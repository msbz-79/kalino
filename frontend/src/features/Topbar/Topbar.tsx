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
};

function Topbar({dark, changeTheme}: TopbarProps) {
    
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
            <div className="flex items-center justify-between px-5 sm:px-10 py-5 lg:py-0 lg:px-40">
                <div className="flex items-center">
                    {/* Logo */}
                    <div>
                        <Link to="/">
                            {/* Light Logo */}
                            <img
                                src="./public/images/logo.png"
                                alt="logo"
                                className="
                  block
                  w-30 h-10
                  lg:w-40 lg:h-20
                  dark:hidden
                "
                            />

                            {/* Dark Logo */}
                            <img
                                src="./public/images/darklogo.png"
                                alt="logo"
                                className="
                  hidden
                  w-30 h-10
                  lg:w-40 lg:h-20
                  dark:block
                "
                            />
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="mr-5">
                        <SearchInput />
                    </div>
                </div>

                <div className="flex items-center">
                    {/* Theme */}
                    <div className="hidden lg:flex ml-2 h-10 w-10
        items-center justify-center
        rounded-full
        border border-slate-200
        bg-white
        text-slate-700
        shadow-lightButtonShadow
        dark:shadow-darkButtonShadow
        transition-all duration-300
        hover:bg-slate-100
        hover:shadow-md
        active:scale-95
        cursor-pointer
        dark:border-slate-700
        dark:bg-slate-900
        dark:text-slate-200
        dark:hover:bg-slate-800 " onClick={changeTheme}>
                        {dark ? (
                            <MdOutlineWbSunny className="size-5" />
                        ) : (
                            <FaRegMoon className="size-5" />
                        )}
                    </div>

                    {/* Notification */}
                    <div className="hidden lg:block ml-5">
                        <Notifcation />
                    </div>

                    {/* Register */}
                    <Register />

                    <div className="hidden lg:block w-0.5 h-8 bg-borderColor dark:bg-slate-700" />

                    {/* Basket */}
                    <div className="hidden lg:block mr-5">
                        <Basket />
                    </div>
                </div>
            </div>

            <Menu />
        </div>
    );
}

export default Topbar;