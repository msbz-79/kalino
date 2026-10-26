import { Link } from "react-router"

function Baners() {
    return (
        <div className="grid grid-cols-2 lg:flex gap-5 mt-10">
            <Link to={"/"}><img src="/images/baners/baner1.png" alt="" className="w-full lg:w-100 h-50 rounded-lg shadow-lightBoxShadow dark:shadow-darkBoxShadow transform lg:hover:-translate-y-2.5 transition-all duration-200" /></Link>
            <Link to={"/"}><img src="/images/baners/baner2.png" alt="" className="w-full lg:w-100 h-50 rounded-lg shadow-lightBoxShadow dark:shadow-darkBoxShadow transform lg:hover:-translate-y-2.5 transition-all duration-200" /></Link>
            <Link to={"/"}><img src="/images/baners/baner3.png" alt="" className="w-full lg:w-100 h-50 rounded-lg shadow-lightBoxShadow dark:shadow-darkBoxShadow transform lg:hover:-translate-y-2.5 transition-all duration-200" /></Link>
            <Link to={"/"}><img src="/images/baners/baner4.png" alt="" className="w-full lg:w-100 h-50 rounded-lg shadow-lightBoxShadow dark:shadow-darkBoxShadow transform lg:hover:-translate-y-2.5 transition-all duration-200" /></Link>
        </div>
    )
}

export default Baners