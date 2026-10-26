import { Outlet } from "react-router";
import { useEffect, useState } from "react";
import Topbar from "../../features/Topbar/Topbar";
import Sidebar from "../../pages/Panel/UserPanel/components/Sidebar/Sidebar";

function PanelLayout() {
    const [dark, setDark] = useState(() => {
        return localStorage.getItem("theme") === "dark";
    });

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
            <Topbar dark={dark} changeTheme={changeTheme} />

            <div className="fixed inset-x-20 top-36 bottom-4 flex gap-4">
                <Sidebar />

                <main
                    className="
                        min-w-0
                        flex-1
                        overflow-y-auto
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
