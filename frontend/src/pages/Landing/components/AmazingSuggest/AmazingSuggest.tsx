
import { Link } from "react-router";
import { useEffect, useState } from "react";
import Allbutton from "../Allbutton";
import CommonSlider from "../CommonSlider";
import Timer from "./components/Timer";

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud";

function AmazingSuggest() {
    const [products, setProducts] = useState([]);
    const [discountEndDate, setDiscountEndDate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSpecialOffers = async () => {
            setIsLoading(true);
            setError("");

            try {
                // دریافت تنظیمات کمپین
                const settingsResponse = await fetch(
                    `${API_URL}/api/special-offer-settings`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                        },
                        cache: "no-store",
                    }
                );

                if (!settingsResponse.ok) {
                    throw new Error(
                        `دریافت تنظیمات کمپین ناموفق بود: ${settingsResponse.status}`
                    );
                }

                const settingsResult = await settingsResponse.json();
                const settings = settingsResult.data;

                // بررسی وجود و فعال بودن کمپین
                if (
                    !settings ||
                    settings.is_active !== true ||
                    !settings.start_at ||
                    !settings.end_at
                ) {
                    setProducts([]);
                    setDiscountEndDate(null);
                    return;
                }

                const now = Date.now();
                const startTime = new Date(settings.start_at).getTime();
                const endTime = new Date(settings.end_at).getTime();

                // بررسی بازه زمانی کمپین
                if (
                    now < startTime ||
                    now > endTime
                ) {
                    setProducts([]);
                    setDiscountEndDate(null);
                    return;
                }

                setDiscountEndDate(settings.end_at);

                // دریافت محصولات شگفت‌انگیز
                const productsResponse = await fetch(
                    `${API_URL}/api/products/special-offers`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                        },
                        cache: "no-store",
                    }
                );

                if (!productsResponse.ok) {
                    throw new Error(
                        `دریافت محصولات شگفت‌انگیز ناموفق بود: ${productsResponse.status}`
                    );
                }

                const productsResult = await productsResponse.json();

                if (!Array.isArray(productsResult.data)) {
                    throw new Error(
                        "ساختار پاسخ محصولات شگفت‌انگیز معتبر نیست."
                    );
                }

                setProducts(productsResult.data);
            } catch (err) {
                console.error(
                    "خطا در دریافت شگفت‌انگیزها:",
                    err
                );

                setError(
                    err instanceof Error
                        ? err.message
                        : "خطایی هنگام دریافت شگفت‌انگیزها رخ داد."
                );
            } finally {
                setIsLoading(false);
            }
        };

        void fetchSpecialOffers();
    }, []);

    // اگر کمپین فعال نیست یا محصولی ندارد، این بخش نمایش داده نشود.
    if (!isLoading && !error && products.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col lg:flex-row bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow text-lightTextColor dark:text-textColor w-full h-auto rounded-xl mt-10">
            <div className="flex items-center justify-between lg:flex-col lg:items-center lg:justify-center lg:w-[20%] p-2 lg:p-0">
                <div className="flex items-center lg:block">
                    <p className="font-DanaBold text-4xl lg:mb-5 text-center ml-5 lg:ml-0">
                        شگفت انگیز
                    </p>

                    <p className="text-center">
                        {discountEndDate && (
                            <Timer endDate={discountEndDate} />
                        )}
                    </p>
                </div>

                <Link to={"/"}>
                    <Allbutton />
                </Link>
            </div>

            <div className="lg:w-[80%] h-full lg:pb-0">
                {isLoading ? (
                    <p className="p-6 text-center">
                        در حال دریافت محصولات شگفت‌انگیز...
                    </p>
                ) : error ? (
                    <div className="p-6 text-center">
                        <p className="text-red-500">{error}</p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-3 rounded-lg bg-primaryColor px-4 py-2 text-white"
                        >
                            تلاش مجدد
                        </button>
                    </div>
                ) : (
                    <CommonSlider products={products} />
                )}
            </div>
        </div>
    );
}

export default AmazingSuggest;
