import { useEffect, useState } from "react";
import CommonSlider from "../CommonSlider";
import Allbutton from "../Allbutton";

type Product = {
    id: number;
    name: string;
    image: string | null;
    slug: string;
    price: number;
    discount_percentage?: number | null;
    original_price?: number | null;
    total_sold?: number;
};

type ApiResponse = {
    message: string;
    data: Product[];
};

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud";

function BestSeller() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const fetchBestSellers = async () => {
            try {
                setIsLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/products/best-sellers`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                        },
                        cache: "no-store",
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `دریافت پرفروش‌ترین محصولات ناموفق بود: ${response.status}`
                    );
                }

                const result: ApiResponse = await response.json();

                if (!Array.isArray(result.data)) {
                    throw new Error(
                        "ساختار پاسخ پرفروش‌ترین محصولات معتبر نیست."
                    );
                }

                setProducts(result.data);
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }

                console.error("خطا در دریافت پرفروش‌ترین محصولات:", err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "خطایی هنگام دریافت پرفروش‌ترین محصولات رخ داد."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        void fetchBestSellers();

        return () => {
            controller.abort();
        };
    }, []);

    return (
        <div className="mt-10">
            <div className="mb-10 flex items-center justify-between">
                <h5 className="relative font-DanaBold text-2xl text-lightTextColor before:absolute before:top-10 before:h-1 before:w-62 before:rounded-xl before:bg-primaryColor before:content-[''] dark:text-textColor">
                    پرفروش‌ترین محصولات
                </h5>

                <Allbutton />
            </div>

            <div className="rounded-xl bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:bg-surfaceColor dark:shadow-darkBoxShadow">
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <p className="font-DanaMedium text-textColorMuted">
                            در حال دریافت پرفروش‌ترین محصولات...
                        </p>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="py-12 text-center">
                        <p className="text-sm text-red-500">{error}</p>
                    </div>
                )}

                {!isLoading && !error && products.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-sm text-textColorMuted">
                            هنوز محصول پرفروشی برای نمایش وجود ندارد.
                        </p>
                    </div>
                )}

                {!isLoading && !error && products.length > 0 && (
                    <CommonSlider products={products} />
                )}
            </div>
        </div>
    );
}

export default BestSeller;
