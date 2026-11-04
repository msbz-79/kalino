import { FiDollarSign } from "react-icons/fi";
import { RiMoneyDollarCircleLine } from "react-icons/ri";

function Header() {
    return (
        <div
            className="
                flex flex-col justify-between gap-4
                rounded-3xl border border-lightBorderColor
                bg-lightSurfaceColor p-5
                shadow-lightBoxShadow
                dark:border-borderColor dark:bg-surfaceColor
                dark:shadow-darkBoxShadow
                sm:flex-row sm:items-center
            "
        >
            <div className="flex items-center gap-3">
                <div
                    className="
                        flex size-12 shrink-0 items-center
                        justify-center rounded-2xl
                        bg-primaryColor/10 text-primaryColor
                    "
                >
                    <RiMoneyDollarCircleLine size={27} />
                </div>

                <div>
                    <h1
                        className="
                            font-DanaBold text-xl
                            text-lightTextColor dark:text-textColor
                        "
                    >
                        مالی و درآمد
                    </h1>

                    <p
                        className="
                            mt-1 text-sm
                            text-lightTextColorMuted
                            dark:text-textColorMuted
                        "
                    >
                        گزارش درآمد فروش و تراکنش‌های کیف پول کاربران
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Header;