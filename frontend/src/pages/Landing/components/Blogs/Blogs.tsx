import Allbutton from '../Allbutton'
import BlogsSlider from './components/BlogsSlider'

function Blogs() {
    return (
        <div className='mt-10'>
            <div className="flex items-center justify-between mb-10">
                <h5 className="relative font-DanaBold text-lightTextColor dark:text-textColor text-2xl before:content[''] before:absolute before:w-55 before:h-1 before:bg-primaryColor before:top-10 before:rounded-xl">آخرین مقالات وبلاگ</h5>
                <Allbutton />
            </div>
            <div className="bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow rounded-xl p-5">
                <div>
                    <BlogsSlider />
                </div>
            </div>
        </div>
    )
}

export default Blogs