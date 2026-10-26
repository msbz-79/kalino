import { IoSearchOutline } from "react-icons/io5";
function SearchInput() {
  return (
    <div className="relative font-DanaMedium text-lightTextColor dark:text-textColor">
        <input type="text" placeholder="جستجو کنید..." className="sm:w-130 lg:w-55 xl:w-100 py-2 px-7 outline-0 border-0 bg-lightSurfaceColor dark:bg-surfaceColor rounded-xl shadow-lightBoxShadow dark:shadow-darkBoxShadow focus:shadow-lightButtonShadow dark:focus:shadow-darkButtonShadow" />
        <IoSearchOutline className="absolute top-0 bottom-0 left-0 my-auto size-5 ml-2" />
    </div>
  )
}

export default SearchInput