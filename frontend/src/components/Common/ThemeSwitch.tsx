import React, { useEffect, useState } from 'react'

function ThemeSwitch() {
  const [dark, setDark] = useState(false);
  
    const changeTheme = () => {
      if (dark) {
        setDark(false);
        localStorage.setItem("theme", "light");
      } else {
        setDark(true);
        localStorage.setItem("theme", "dark");
      }
    };
  useEffect(() => {
      const mainTheme = localStorage.getItem("theme");
  
      if (mainTheme === "dark") {
        setDark(true);
        document.documentElement.classList.add("dark");
      } else {
        setDark(false);
        document.documentElement.classList.remove("dark");
      }
    }, [dark]);
  return (
    <div>ThemeSwitch</div>
  )
}

export default ThemeSwitch