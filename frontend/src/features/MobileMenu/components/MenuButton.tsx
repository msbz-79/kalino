import { IoMdMenu } from "react-icons/io";
function MenuButton() {
  return (
    <div className="flex h-10 w-10
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
        dark:hover:bg-slate-800">
        <IoMdMenu className="size-5" />
    </div>
  )
}

export default MenuButton