
import { ReactNode } from "react";

type ColorOption = {
    name: string;
    hex: string;
};

type ProductsLayoutProps = {
    title: string;
    description: string;
    children: ReactNode;

    minPrice: number;
    maxPrice: number;

    priceBounds: {
        min: number;
        max: number;
    };

    brands: string[];
    colors: ColorOption[];

    selectedBrand: string;
    selectedColor: string;

    onPriceChange: (value: number) => void;
    onBrandChange: (value: string) => void;
    onColorChange: (value: string) => void;
};

type FilterControlsProps = Omit<
    ProductsLayoutProps,
    "title" | "description" | "children"
>;

function FilterControls({
    minPrice,
    maxPrice,
    priceBounds,
    brands,
    colors,
    selectedBrand,
    selectedColor,
    onPriceChange,
    onBrandChange,
    onColorChange,
}: FilterControlsProps) {
    const rangeMin = priceBounds.min;
    const rangeMax = priceBounds.max;
    const rangeDifference = Math.max(rangeMax - rangeMin, 1);

    const minPosition = Math.min(
        100,
        Math.max(
            0,
            ((minPrice - rangeMin) / rangeDifference) * 100
        )
    );

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("fa-IR").format(price);

    return (
        <div className="space-y-6">
            {/* فیلتر قیمت */}
            <section>
                <h3 className="mb-5 text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                    محدوده قیمت
                </h3>

                <div className="px-2">
                    <div className="relative h-7" dir="ltr">
                        {/* مسیر اصلی اسلایدر */}
                        <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-gray-200 dark:bg-gray-700" />

                        {/* نوار رنگی از چپ تا دستگیره */}
                        <div
                            className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primaryColor"
                            style={{
                                width: `${minPosition}%`,
                            }}
                        />

                        {/* دستگیره حداقل قیمت */}
                        <input
                            type="range"
                            min={rangeMin}
                            max={rangeMax}
                            step={Math.max(
                                1,
                                Math.floor(rangeDifference / 500)
                            )}
                            value={minPrice}
                            disabled={rangeMax <= rangeMin}
                            onChange={(event) =>
                                onPriceChange(
                                    Number(event.target.value)
                                )
                            }
                            className="price-range-input absolute inset-0 z-20 h-7 w-full cursor-pointer appearance-none bg-transparent"
                            aria-label="حداقل قیمت"
                        />
                    </div>
                </div>

                {/* نمایش قیمت‌ها */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
                        <span className="mb-1 block text-xs text-textColorMuted">
                            از
                        </span>

                        <p className="text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                            {formatPrice(minPrice)}
                        </p>

                        <span className="mt-1 block text-xs text-textColorMuted">
                            تومان
                        </span>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
                        <span className="mb-1 block text-xs text-textColorMuted">
                            تا
                        </span>

                        <p className="text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                            {formatPrice(maxPrice)}
                        </p>

                        <span className="mt-1 block text-xs text-textColorMuted">
                            تومان
                        </span>
                    </div>
                </div>
            </section>

            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* فیلتر برند */}
            <section>
                <h3 className="mb-4 text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                    برند محصول
                </h3>

                {brands.length > 0 ? (
                    <div className="max-h-52 space-y-3 overflow-y-auto">
                        {brands.map((brand) => (
                            <label
                                key={brand}
                                className="flex cursor-pointer items-center gap-3 text-sm text-lightTextColor dark:text-textColor"
                            >
                                <input
                                    type="radio"
                                    name="product-brand"
                                    checked={selectedBrand === brand}
                                    onChange={() =>
                                        onBrandChange(brand)
                                    }
                                    className="h-4 w-4 cursor-pointer accent-primaryColor"
                                />

                                <span>{brand}</span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-textColorMuted">
                        برندی برای نمایش وجود ندارد.
                    </p>
                )}

                {selectedBrand && (
                    <button
                        type="button"
                        onClick={() => onBrandChange("")}
                        className="mt-3 cursor-pointer text-xs text-primaryColor"
                    >
                        حذف فیلتر برند
                    </button>
                )}
            </section>

            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* فیلتر رنگ */}
            <section>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                        رنگ محصول
                    </h3>

                    {selectedColor && (
                        <button
                            type="button"
                            onClick={() => onColorChange("")}
                            className="cursor-pointer text-xs text-primaryColor"
                        >
                            حذف انتخاب
                        </button>
                    )}
                </div>

                {colors.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {colors.map((color) => {
                            const isSelected =
                                selectedColor === color.name;

                            return (
                                <button
                                    key={`${color.name}-${color.hex}`}
                                    type="button"
                                    onClick={() =>
                                        onColorChange(
                                            isSelected ? "" : color.name
                                        )
                                    }
                                    aria-pressed={isSelected}
                                    className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm transition-colors ${
                                        isSelected
                                            ? "border-primaryColor bg-primaryColor/10 text-primaryColor"
                                            : "border-gray-200 bg-gray-50 text-lightTextColor hover:border-primaryColor/50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-textColor"
                                    }`}
                                >
                                    <span
                                        className="h-5 w-5 shrink-0 rounded-full border border-gray-300 dark:border-gray-600"
                                        style={{
                                            backgroundColor: color.hex,
                                        }}
                                    />

                                    <span className="truncate">
                                        {color.name}
                                    </span>

                                    {isSelected && (
                                        <span className="mr-auto text-primaryColor">
                                            ✓
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-textColorMuted">
                        رنگی برای نمایش وجود ندارد.
                    </p>
                )}
            </section>
        </div>
    );
}

function ProductsLayout({
    title,
    description,
    children,
    ...filterProps
}: ProductsLayoutProps) {
    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            {/* عنوان صفحه */}
            <div className="mb-6">
                <h1 className="text-xl font-DanaDemiBold text-lightTextColor dark:text-textColor">
                    {title}
                </h1>

                <p className="mt-2 text-sm text-textColorMuted">
                    {description}
                </p>
            </div>

            {/* فیلترها و محصولات */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                {/* فیلتر دسکتاپ */}
                <aside className="hidden lg:block">
                    <div className="sticky top-24 rounded-2xl border border-gray-100 bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor dark:shadow-darkBoxShadow">
                        <h2 className="mb-6 font-DanaDemiBold text-lightTextColor dark:text-textColor">
                            فیلتر محصولات
                        </h2>

                        <FilterControls {...filterProps} />
                    </div>
                </aside>

                <main className="min-w-0">
                    {/* فیلتر موبایل و تبلت */}
                    <div className="mb-6 rounded-2xl border border-gray-100 bg-lightSurfaceColor p-4 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor dark:shadow-darkBoxShadow lg:hidden">
                        <h2 className="mb-6 font-DanaDemiBold text-lightTextColor dark:text-textColor">
                            فیلتر محصولات
                        </h2>

                        <FilterControls {...filterProps} />
                    </div>

                    {children}
                </main>
            </div>
        </div>
    );
}

export default ProductsLayout;
