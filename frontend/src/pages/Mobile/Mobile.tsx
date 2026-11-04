
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import ProductsLayout from "../../components/Layout/ProductsLayout";

type SortOption =
    | "newest"
    | "price_asc"
    | "price_desc"
    | "bestselling";

type Product = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    price: number;
    discount_percentage: number | null;
    discount_price: number | null;
};

type ColorOption = {
    name: string;
    hex: string;
};

type ApiResponse = {
    data: {
        data: Product[];
    };
};

type FilterOptionsResponse = {
    data: {
        brands: string[];
        colors: ColorOption[];
        min_price: number;
        max_price: number;
    };
};

function Mobile() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // محدوده قیمت اصلی محصولات
    const [priceBounds, setPriceBounds] = useState({
        min: 0,
        max: 0,
    });

    // حداقل قیمت انتخاب‌شده
    const [minPrice, setMinPrice] = useState(0);

    const [brands, setBrands] = useState<string[]>([]);
    const [colors, setColors] = useState<ColorOption[]>([]);

    const [selectedBrand, setSelectedBrand] = useState(
        searchParams.get("brand") ?? ""
    );

    const [selectedColor, setSelectedColor] = useState(
        searchParams.get("color") ?? ""
    );

    const [sort, setSort] = useState<SortOption>("newest");
    const [optionsLoaded, setOptionsLoaded] = useState(false);

    // دریافت حداکثر قیمت از URL
    const maxPriceParam = searchParams.get("max_price");

    const parsedMaxPrice =
        maxPriceParam !== null &&
        /^\d+$/.test(maxPriceParam) &&
        Number.isSafeInteger(Number(maxPriceParam))
            ? Number(maxPriceParam)
            : null;

    // حداکثر قیمت قابل استفاده در اسلایدر
    const sliderMaxPrice =
        parsedMaxPrice !== null
            ? Math.min(parsedMaxPrice, priceBounds.max)
            : priceBounds.max;

    const safeSliderMax = Math.max(
        priceBounds.min,
        sliderMaxPrice
    );

    // به‌روزرسانی پارامترهای URL
    const updateUrlParam = (
        key: string,
        value: string,
        replace = true
    ) => {
        setSearchParams(
            (currentParams) => {
                const newParams = new URLSearchParams(currentParams);

                if (value.trim() !== "") {
                    newParams.set(key, value);
                } else {
                    newParams.delete(key);
                }

                return newParams;
            },
            { replace }
        );
    };

    // دریافت گزینه‌های فیلتر
    useEffect(() => {
        const controller = new AbortController();

        async function fetchFilterOptions() {
            try {
                const response = await fetch(
                    "http://localhost:8000/api/products/filter-options?category=mobile",
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            Accept: "application/json",
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "دریافت اطلاعات فیلترها با خطا مواجه شد."
                    );
                }

                const result: FilterOptionsResponse =
                    await response.json();

                const min = Number(result.data.min_price ?? 0);
                const max = Number(result.data.max_price ?? 0);

                setBrands(result.data.brands ?? []);
                setColors(result.data.colors ?? []);

                setPriceBounds({
                    min,
                    max,
                });
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.name === "AbortError"
                ) {
                    return;
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : "خطای غیرمنتظره‌ای رخ داده است."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setOptionsLoaded(true);
                }
            }
        }

        fetchFilterOptions();

        return () => {
            controller.abort();
        };
    }, []);

    // هماهنگ‌سازی فیلترها با پارامترهای URL
    useEffect(() => {
        const brand = searchParams.get("brand") ?? "";
        const color = searchParams.get("color") ?? "";

        setSelectedBrand(brand);
        setSelectedColor(color);

        if (!optionsLoaded) {
            return;
        }

        const minPriceParam = searchParams.get("min_price");

        const parsedMinPrice =
            minPriceParam !== null &&
            /^\d+$/.test(minPriceParam) &&
            Number.isSafeInteger(Number(minPriceParam))
                ? Number(minPriceParam)
                : null;

        const maxParam = searchParams.get("max_price");

        const parsedMax =
            maxParam !== null &&
            /^\d+$/.test(maxParam) &&
            Number.isSafeInteger(Number(maxParam))
                ? Number(maxParam)
                : null;

        const upperLimit =
            parsedMax !== null
                ? Math.min(parsedMax, priceBounds.max)
                : priceBounds.max;

        const safeUpperLimit = Math.max(
            priceBounds.min,
            upperLimit
        );

        const initialMinPrice =
            parsedMinPrice !== null
                ? Math.min(
                    Math.max(parsedMinPrice, priceBounds.min),
                    safeUpperLimit
                )
                : priceBounds.min;

        setMinPrice(initialMinPrice);
    }, [searchParams, optionsLoaded, priceBounds]);

    // دریافت محصولات با فیلترهای انتخاب‌شده
    useEffect(() => {
        if (!optionsLoaded) {
            return;
        }

        const controller = new AbortController();

        const timer = window.setTimeout(async () => {
            try {
                setLoading(true);
                setError("");

                const params = new URLSearchParams({
                    category: "mobile",
                    per_page: "20",
                    sort,
                });

                // فیلتر حداقل قیمت
                const requestMinPrice =
                    parsedMaxPrice !== null
                        ? Math.min(minPrice, parsedMaxPrice)
                        : minPrice;

                if (requestMinPrice > priceBounds.min) {
                    params.set(
                        "min_price",
                        String(requestMinPrice)
                    );
                }

                // فیلتر حداکثر قیمت
                if (parsedMaxPrice !== null) {
                    params.set(
                        "max_price",
                        String(parsedMaxPrice)
                    );
                }

                // فیلتر برند
                if (selectedBrand) {
                    params.set("brand", selectedBrand);
                }

                // فیلتر رنگ
                if (selectedColor) {
                    params.set("color", selectedColor);
                }

                const response = await fetch(
                    `http://localhost:8000/api/products?${params.toString()}`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            Accept: "application/json",
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);

                    throw new Error(
                        errorBody?.message ||
                            "دریافت محصولات با خطا مواجه شد."
                    );
                }

                const result: ApiResponse = await response.json();

                setProducts(result.data.data);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.name === "AbortError"
                ) {
                    return;
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : "خطای غیرمنتظره‌ای رخ داده است."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }, 350);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [
        optionsLoaded,
        minPrice,
        priceBounds,
        selectedBrand,
        selectedColor,
        sort,
        parsedMaxPrice,
    ]);

    // تغییر حداقل قیمت
    const handleMinPriceChange = (value: number) => {
        const safeValue = Math.min(
            Math.max(value, priceBounds.min),
            safeSliderMax
        );

        setMinPrice(safeValue);

        updateUrlParam(
            "min_price",
            safeValue > priceBounds.min
                ? String(safeValue)
                : ""
        );
    };

    // تغییر برند
    const handleBrandChange = (value: string) => {
        setSelectedBrand(value);
        updateUrlParam("brand", value);
    };

    // تغییر رنگ
    const handleColorChange = (value: string) => {
        setSelectedColor(value);
        updateUrlParam("color", value);
    };

    // فرمت قیمت
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("fa-IR").format(price);
    };

    return (
        <ProductsLayout
            title="خرید گوشی موبایل"
            description="بررسی و مقایسه انواع گوشی موبایل"
            minPrice={minPrice}
            maxPrice={parsedMaxPrice ?? priceBounds.max}
            priceBounds={{
                min: priceBounds.min,
                max: safeSliderMax,
            }}
            brands={brands}
            colors={colors}
            selectedBrand={selectedBrand}
            selectedColor={selectedColor}
            onPriceChange={handleMinPriceChange}
            onBrandChange={handleBrandChange}
            onColorChange={handleColorChange}
        >
            {/* عنوان و مرتب‌سازی محصولات */}
            <div className="mb-6">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="font-DanaDemiBold text-lightTextColor dark:text-textColor">
                        محصولات موبایل
                    </h2>

                    {!loading && !error && (
                        <span className="text-sm text-textColorMuted">
                            {formatPrice(products.length)} محصول
                        </span>
                    )}
                </div>

                {/* مرتب‌سازی */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-gray-100 pb-4 dark:border-gray-800">
                    <span className="text-sm text-textColorMuted">
                        مرتب‌سازی:
                    </span>

                    {[
                        {
                            value: "newest",
                            label: "همه",
                        },
                        {
                            value: "price_desc",
                            label: "گران‌ترین",
                        },
                        {
                            value: "price_asc",
                            label: "ارزان‌ترین",
                        },
                        {
                            value: "bestselling",
                            label: "پرفروش‌ترین",
                        },
                    ].map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() =>
                                setSort(item.value as SortOption)
                            }
                            className={`relative cursor-pointer pb-1 text-sm transition ${
                                sort === item.value
                                    ? "font-DanaDemiBold text-primaryColor after:absolute after:-bottom-4 after:right-0 after:h-0.5 after:w-full after:bg-primaryColor"
                                    : "text-textColorMuted hover:text-primaryColor"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* بارگذاری */}
            {loading && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-lightSurfaceColor p-4 dark:border-gray-800 dark:bg-surfaceColor"
                        >
                            <div className="mb-4 h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />
                            <div className="mb-3 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                    ))}
                </div>
            )}

            {/* خطا */}
            {!loading && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                </div>
            )}

            {/* محصولات خالی */}
            {!loading && !error && products.length === 0 && (
                <div className="rounded-2xl border border-gray-100 bg-lightSurfaceColor p-8 text-center dark:border-gray-800 dark:bg-surfaceColor">
                    <p className="text-sm text-textColorMuted">
                        محصولی با فیلترهای انتخاب‌شده پیدا نشد.
                    </p>
                </div>
            )}

            {/* کارت محصولات */}
            {!loading && !error && products.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {products.map((product) => {
                        const price = Number(product.price ?? 0);

                        const discountPercentage = Number(
                            product.discount_percentage ?? 0
                        );

                        const discountPrice =
                            product.discount_price !== null
                                ? Number(product.discount_price)
                                : price;

                        const hasDiscount =
                            discountPercentage > 0 &&
                            discountPrice < price;

                        const finalPrice = hasDiscount
                            ? discountPrice
                            : price;

                        return (
                            <Link
                                key={product.id}
                                to={`/products/${product.id}/${product.slug}`}
                                className="group block min-w-0 cursor-pointer"
                            >
                                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-lightSurfaceColor text-lightTextColor shadow-lightBoxShadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-surfaceColor dark:text-textColor dark:shadow-darkBoxShadow">
                                    {/* تصویر محصول */}
                                    <div className="relative flex h-40 shrink-0 items-center justify-center overflow-hidden bg-gray-50 p-4 sm:h-48 dark:bg-gray-900/30">
                                        {hasDiscount && (
                                            <span className="absolute right-3 top-3 z-10 rounded-lg bg-red-500 px-2.5 py-1 text-xs font-DanaMedium text-white shadow-sm">
                                                {formatPrice(discountPercentage)}
                                                ٪ تخفیف
                                            </span>
                                        )}

                                        <img
                                            src={
                                                product.image ??
                                                "/images/stories/story1.png"
                                            }
                                            alt={product.name}
                                            loading="lazy"
                                            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* اطلاعات محصول */}
                                    <div className="flex flex-1 flex-col justify-between gap-4 p-3 sm:p-4">
                                        <p className="line-clamp-2 min-h-12 text-sm font-DanaMedium leading-6">
                                            {product.name}
                                        </p>

                                        {/* قیمت محصول */}
                                        <div className="flex min-h-[52px] flex-col justify-end gap-1">
                                            <div className="flex h-5 items-center justify-end">
                                                {hasDiscount && (
                                                    <span className="text-xs text-textColorMuted line-through">
                                                        {formatPrice(price)} تومان
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex h-6 items-center justify-between gap-2">
                                                <span className="text-xs text-textColorMuted">
                                                    قیمت:
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm font-DanaDemiBold text-primaryColor sm:text-base">
                                                        {formatPrice(finalPrice)}
                                                    </span>

                                                    <span className="text-xs text-textColorMuted">
                                                        تومان
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </ProductsLayout>
    );
}

export default Mobile;
