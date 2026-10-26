import { useEffect, useState } from "react";
import Allbutton from "../Allbutton";
import CommonSlider from "../CommonSlider";

interface Product {
    id: number;
    name: string;
    image: string | null;
    price: number;
    discount_price?: number | null;
    discount_percentage?: number | null;
    original_price?: number | null;
    [key: string]: unknown;
}

function Latest() {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchProducts() {
            try {
                const response = await fetch(
                    "http://localhost:8000/api/products?sort=newest&per_page=10",
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error("دریافت محصولات با خطا مواجه شد.");
                }

                const result = await response.json();

                // محصولات داخل پاسخ صفحه‌بندی‌شده لاراول قرار دارند.
                const productList = result?.data?.data;

                if (!Array.isArray(productList)) {
                    throw new Error("ساختار پاسخ محصولات معتبر نیست.");
                }

                const formattedProducts = productList.map((product) => ({
                    ...product,

                    // در صورت وجود تخفیف، قیمت نهایی نمایش داده می‌شود.
                    price: Number(
                        product.discount_price ?? product.price ?? 0
                    ),

                    // قیمت اصلی فقط برای محصولات تخفیف‌دار نمایش داده می‌شود.
                    original_price:
                        product.discount_price != null
                            ? Number(product.price)
                            : product.original_price ?? null,

                    discount_percentage:
                        product.discount_percentage ?? 0,
                }));

                setProducts(formattedProducts);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.name !== "AbortError"
                ) {
                    console.error("خطا در دریافت محصولات:", error);
                }
            }
        }

        fetchProducts();

        return () => controller.abort();
    }, []);

    return (
        <div className="mt-10">
            <div className="flex items-center justify-between mb-10">
                <h5 className="relative font-DanaBold text-lightTextColor dark:text-textColor text-2xl before:content[''] before:absolute before:w-55 before:h-1 before:bg-primaryColor before:top-10 before:rounded-xl">
                    جدیدترین محصولات
                </h5>
                <Allbutton />
            </div>

            <div className="bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow rounded-xl p-5">
                <div>
                    <CommonSlider products={products} />
                </div>
            </div>
        </div>
    );
}

export default Latest;
