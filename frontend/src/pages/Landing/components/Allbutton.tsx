import { TiArrowLeft } from "react-icons/ti";
function Allbutton() {
  return (
    <div className="flex items-center border border-lightBorderColor dark:border-borderColor text-lightTextColor dark:text-textColor rounded-lg py-2 px-4 shadow-lightButtonShadow dark:shadow-darkButtonShadow hover:bg-surfaceHoverColor hover:text-textColor transition-all duration-200 cursor-pointer">مشاهده همه<TiArrowLeft className="size-5 mr-1" /></div>
  )
}

export default Allbutton