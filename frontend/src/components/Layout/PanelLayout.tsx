import { Outlet } from "react-router";
import { useEffect, useState } from "react";
import Topbar from "../../features/Topbar/Topbar";
import Sidebar from "../../pages/Panel/UserPanel/components/Sidebar/Sidebar";

function PanelLayout() {
    const [dark, setDark] = useState(() => {
        return localStorage.getItem("theme") === "dark";
    });

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
        <div className="min-h-screen">
            <Topbar
                dark={dark}
                changeTheme={changeTheme}
                isSearchOpen={isSearchOpen}
                setIsSearchOpen={setIsSearchOpen}
            />

            {isSearchOpen && (
                <div
                    className="
                        fixed inset-0 z-40
                        bg-black/10
                        backdrop-blur-sm
                    "
                    onClick={() => setIsSearchOpen(false)}
                />
            )}

            <div
                className="
                    fixed inset-x-3 top-24 bottom-3
                    flex flex-col gap-3
                    sm:inset-x-6 sm:top-28 sm:bottom-4 sm:gap-4
                    lg:inset-x-20 lg:top-36 lg:flex-row
                "
            >
                <div className="w-full min-h-0 shrink-0 lg:h-full lg:w-64 xl:w-72">
                    <Sidebar />
                </div>

                <main
                    className="
                        min-h-0 min-w-0 flex-1
                        overflow-x-hidden overflow-y-auto
                        [scrollbar-width:none]
                        [&::-webkit-scrollbar]:hidden
                    "
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default PanelLayout;
