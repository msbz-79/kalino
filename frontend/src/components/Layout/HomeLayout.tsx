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

  const changeTheme = () => {
    setDark(prev => !prev);
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

  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative flex flex-col">
      <header>
        <Topbar dark={dark} changeTheme={changeTheme} />
      </header>
      <main className="pt-20 lg:pt-31 flex-1">
        <Outlet />
      </main>
      <footer className="pb-27.5 lg:pb-0">
        <Footer />
      </footer>
      {isOpen && 
        <div className="fixed inset-x-0 top-20 overflow-y-auto bg-lightSurfaceColor dark:bg-surfaceColor lg:hidden bottom-27 z-10 min-h-0 overflow-hidden">
          <MenuContent />
        </div>
      }
      <MobileMenu dark={dark} changeTheme={changeTheme} isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}

export default HomeLayout;
