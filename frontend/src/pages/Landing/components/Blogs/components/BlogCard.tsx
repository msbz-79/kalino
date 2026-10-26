import { Link } from "react-router"
import { TiArrowLeft } from "react-icons/ti";

function BlogCard() {
    return (
        <div className="flex flex-col w-70 bg-lightSurfaceColor dark:bg-surfaceColor text-lightTextColor dark:text-textColor rounded-lg shadow-lightBoxShadow dark:shadow-darkBoxShadow mb-2 transform hover:scale-105 transition-all duration-200">
            <img src="images/stories/story2.png" alt="" className="size-full object-cover" />
            <div className="p-5">
                <p className="font-DanaMedium text-xl mb-5">آخرین پرچمدار سامسونگ</p>
                <div className="flex items-center justify-between text-lightTextColor dark:text-textColorMuted">
                    <p>شهریور1405</p>
                    <Link to={"/"}><button className="flex items-center justify-center hover:bg-surfaceHoverColor hover:text-textColor shadow-lightButtonShadow dark:shadow-darkButtonShadow cursor-pointer transition-all duration-200 border border-textColorMuted px-3 py-1 rounded-lg">ادامه مطالب<TiArrowLeft className="size-5" /></button></Link>
                </div>
            </div>
        </div>
    )
}

export default BlogCard