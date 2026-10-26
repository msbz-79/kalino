import CommonSlider from '../CommonSlider'
import Allbutton from '../Allbutton'

function BestSeller() {
    return (
        <div className="mt-10">
            <div className="flex items-center justify-between mb-10">
                <h5 className="relative font-DanaBold text-lightTextColor dark:text-textColor text-2xl before:content[''] before:absolute before:w-62 before:h-1 before:bg-primaryColor before:top-10 before:rounded-xl">پرفروش ترین محصولات</h5>
                <Allbutton />
            </div>
            <div className="bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow rounded-xl p-5">
                <div>
                    <CommonSlider />
                </div>
            </div>
        </div>
    )
}

export default BestSeller