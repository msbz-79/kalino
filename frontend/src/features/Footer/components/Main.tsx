
function Main() {
    return (
        <div className="grid grid-cols-1 justify-items-center sm:grid-cols-2 gap-6 mt-10 lg:flex lg:flex-row lg:items-center lg:justify-between lg:gap-0">
            <div className="flex items-center">
                <img src="/images/footer/image1.png" alt="" className="size-15" />
                <div className="flex flex-col">
                    <span className="text-lightTextColor dark:text-textColor mb-2">پشتیبانی<span className="text-primaryColor">24ساعته</span></span>
                    <span className="text-lightTextColorMuted dark:text-textColorMuted text-sm">تماس با12345678-021</span>
                </div>
            </div>
            <div className="flex items-center">
                <img src="/images/footer/image2.png" alt="" className="size-15" />
                <div className="flex flex-col">
                    <span className="text-lightTextColor dark:text-textColor mb-2">فرصت 7 روزه <span className="text-primaryColor">بازگشت کالا</span></span>
                    <span className="text-lightTextColorMuted dark:text-textColorMuted text-sm">ضمانت بازگشت کالا تا 7 روز</span>
                </div>
            </div>
            <div className="flex items-center">
                <img src="/images/footer/image3.png" alt="" className="size-15" />
                <div className="flex flex-col">
                    <span className="text-lightTextColor dark:text-textColor mb-2">تضمین  <span className="text-primaryColor">کیفیت کالا</span></span>
                    <span className="text-lightTextColorMuted dark:text-textColorMuted text-sm">خرید بهترین کالای موجود</span>
                </div>
            </div>
            <div className="flex items-center">
                <img src="/images/footer/image4.png" alt="" className="size-15" />
                <div className="flex flex-col">
                    <span className="text-lightTextColor dark:text-textColor mb-2">پرداخت امن از <span className="text-primaryColor">درگاه بانکی</span></span>
                    <span className="text-lightTextColorMuted dark:text-textColorMuted text-sm">امنیت در خرید های آنلاین</span>
                </div>
            </div>
        </div>
    )
}

export default Main