
import { Link } from "react-router";

function NotFound() {
    return (
        <main
            dir="rtl"
            className="flex min-h-screen items-center justify-center bg-lightBackgroundColor px-5 py-12 text-lightTextColor dark:bg-backgroundColor dark:text-textColor"
        >
            <div className="w-full max-w-2xl text-center">

                {/* Illustration */}
                <div className="relative mx-auto mb-8 flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">

                    {/* Background circles */}
                    <div className="absolute inset-0 rounded-full bg-primaryColor/5" />

                    <div className="absolute inset-5 rounded-full border border-dashed border-primaryColor/30" />

                    {/* Glass effect */}
                    <div className="absolute inset-10 rotate-12 rounded-[2.5rem] border border-white/60 bg-white/30 shadow-[0_8px_32px_rgba(20,184,166,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]" />

                    {/* 404 Number */}
                    <span className="relative z-10 select-none text-[130px] font-black tracking-tighter text-primaryColor sm:text-[180px]">
                        404
                    </span>

                    {/* Decorative dots */}
                    <span className="absolute right-5 top-8 h-3 w-3 rounded-full bg-secondaryColor/70" />

                    <span className="absolute bottom-10 left-5 h-4 w-4 rounded-full bg-primaryColor/30" />

                    <span className="absolute right-10 bottom-5 h-2 w-2 rounded-full bg-secondaryColor" />

                    <span className="absolute left-8 top-12 h-2 w-2 rounded-full bg-primaryColor/50" />

                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="font-DanaBold text-2xl sm:text-4xl">
                        اینجا چیزی پیدا نشد!
                    </h1>

                    <p className="mx-auto max-w-md text-sm leading-8 text-lightTextColorMuted dark:text-textColorMuted sm:text-base">
                        به نظر می‌رسه صفحه‌ای که دنبالش هستی وجود نداره،
                        حذف شده یا آدرس اون رو اشتباه وارد کردی.
                    </p>

                </div>

                {/* Actions */}
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">

                    <Link
                        to="/"
                        className="flex w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-xl bg-primaryColor px-8 py-3.5 font-DanaBold text-sm text-white shadow-lightButtonShadow transition-all duration-200 hover:bg-primaryDarkColor active:scale-95 dark:shadow-darkButtonShadow"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-5 w-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m3 10 9-7 9 7" />
                            <path d="M5 9v11h14V9" />
                            <path d="M9 20v-7h6v7" />
                        </svg>

                        بازگشت به صفحه اصلی
                    </Link>

                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="w-full max-w-xs cursor-pointer rounded-xl border border-lightBorderColor px-8 py-3.5 font-DanaBold text-sm text-lightTextColor transition-all duration-200 hover:border-primaryColor hover:text-primaryColor active:scale-95 dark:border-borderColor dark:text-textColor"
                    >
                        بازگشت به صفحه قبل
                    </button>

                </div>

                {/* Footer */}
                <p className="mt-12 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                    Kalino | تجربه‌ای متفاوت از خرید آنلاین
                </p>

            </div>
        </main>
    );
}

export default NotFound;
