import { Outlet } from "react-router";
import Topbar from "../../features/Topbar/Topbar";
import Footer from "../../features/Footer/Footer";
import MobileMenu from "../../features/MobileMenu/MobileMenu";
import { useEffect, useState } from "react";
import MenuContent from "../../features/MobileMenu/components/MenuContent";

function HomeLayout() {
    const [dark, setDark] = useState(() => {
        return localStorage.getItem("theme") === "dark";
    });

    const [isOpen, setIsOpen] = useState(false);

    // وضعیت باز بودن پنل جستجو
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const changeTheme = () => {
        setDark((prev) => !prev);
    };

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [dark]);

    return (
        <div className="relative flex flex-col">
            <header>
                <Topbar
                    dark={dark}
                    changeTheme={changeTheme}
                    isSearchOpen={isSearchOpen}
                    setIsSearchOpen={setIsSearchOpen}
                />
            </header>

            <main
                className={`flex-1 pt-20 transition-all duration-200 lg:pt-31 ${
                    isSearchOpen ? "blur-sm" : ""
                }`}
            >
                <Outlet />
            </main>

            <footer
                className={`pb-27.5 transition-all duration-200 lg:pb-0 ${
                    isSearchOpen ? "blur-sm" : ""
                }`}
            >
                <Footer />
            </footer>

            {isOpen && (
                <div className="fixed inset-x-0 top-20 z-30 bottom-27 min-h-0 overflow-hidden overflow-y-auto bg-lightSurfaceColor dark:bg-surfaceColor lg:hidden">
                    <MenuContent />
                </div>
            )}

            <MobileMenu
                dark={dark}
                changeTheme={changeTheme}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />
        </div>
    );
}

export default HomeLayout;
