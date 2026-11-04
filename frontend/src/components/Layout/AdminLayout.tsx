import { Outlet } from "react-router";
import { useEffect, useState } from "react";

import Topbar from "../../features/Topbar/Topbar";
import Sidebar from "../../pages/Panel/AdminPanel/components/Sidebar";

function AdminLayout() {
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
        <div className="min-h-screen overflow-hidden bg-lightBackgroundColor dark:bg-backgroundColor">
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
                    fixed inset-x-3 top-28 bottom-3
                    flex min-h-0 flex-col gap-3 overflow-hidden
                    sm:inset-x-5 sm:top-32 sm:bottom-4 sm:gap-4
                    lg:left-8 lg:right-8 lg:top-36
                    lg:flex-row
                    xl:left-20 xl:right-20
                "
            >
                <Sidebar />

                <main
                    className="
                        admin-content-scroll
                        min-h-0 min-w-0 flex-1
                        overflow-x-hidden overflow-y-auto
                        overscroll-contain pb-4
                    "
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
