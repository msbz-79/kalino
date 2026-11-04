
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { IoSearchOutline } from "react-icons/io5";
import { MdClose } from "react-icons/md";

type Product = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    price: number;
    discount_percentage?: number | null;
    discount_price?: number | null;
};

type SearchInputProps = {
    isSearchOpen: boolean;
    setIsSearchOpen: (value: boolean) => void;
};

type ApiResponse = {
    data: {
        data: Product[];
    };
};

const API_URL = "http://localhost:8000";

function SearchInput({
    isSearchOpen,
    setIsSearchOpen,
}: SearchInputProps) {
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const searchRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<AbortController | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const searchValue = search.trim();

        if (searchValue.length < 2) {
            setProducts([]);
            setIsLoading(false);
            setError("");
            requestRef.current?.abort();
            return;
        }

        const timer = setTimeout(async () => {
            requestRef.current?.abort();

            const controller = new AbortController();
            requestRef.current = controller;

            try {
                setIsLoading(true);
                setError("");

                const params = new URLSearchParams({
                    search: searchValue,
                    per_page: "6",
                });

                const response = await fetch(
                    `${API_URL}/api/products?${params.toString()}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error("دریافت محصولات با خطا مواجه شد.");
                }

                const result: ApiResponse = await response.json();

                if (!controller.signal.aborted) {
                    setProducts(result.data.data);
                }
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }

                console.error("Search error:", err);
                setError("مشکلی در جستجوی محصولات رخ داد.");
                setProducts([]);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, 400);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    useEffect(() => {
        if (!isSearchOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setIsSearchOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isSearchOpen, setIsSearchOpen]);

    const handleSearchChange = (value: string) => {
        setSearch(value);

        if (value.trim().length >= 2) {
            setIsSearchOpen(true);
        } else {
            setIsSearchOpen(false);
        }
    };

    const handleProductClick = (product: Product) => {
        requestRef.current?.abort();
        setIsSearchOpen(false);
        setSearch("");
        setProducts([]);

        navigate(`/products/${product.id}/${product.slug}`);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("fa-IR").format(price);
    };

    const hasSearchValue = search.trim().length >= 2;

    return (
        <div ref={searchRef} className="relative z-[60] font-DanaMedium">
            {/* Search Input */}
            <div className="relative text-lightTextColor dark:text-textColor">
                <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                        handleSearchChange(event.target.value)
                    }
                    onFocus={() => {
                        if (hasSearchValue) {
                            setIsSearchOpen(true);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            setIsSearchOpen(false);
                        }
                    }}
                    placeholder="جستجو کنید..."
                    autoComplete="off"
                    className="
                        w-48 rounded-xl border-0 bg-lightSurfaceColor
                        px-7 py-2 outline-0
                        shadow-lightBoxShadow
                        focus:shadow-lightButtonShadow
                        dark:bg-surfaceColor
                        dark:shadow-darkBoxShadow
                        dark:focus:shadow-darkButtonShadow
                        sm:w-130 lg:w-55 xl:w-100
                    "
                />

                <IoSearchOutline className="absolute left-0 top-0 my-auto ml-2 size-5 h-full" />

                {search && (
                    <button
                        type="button"
                        onClick={() => {
                            requestRef.current?.abort();
                            setSearch("");
                            setProducts([]);
                            setIsSearchOpen(false);
                        }}
                        className="
                            absolute right-2 top-0 flex h-full
                            cursor-pointer items-center
                            text-textColorMuted hover:text-red-500
                        "
                        aria-label="پاک کردن جستجو"
                    >
                        <MdClose className="size-5" />
                    </button>
                )}
            </div>

            {/* Search Results */}
            {isSearchOpen && hasSearchValue && (
                <div
                    className="
                        absolute right-0 top-full z-[70] mt-3
                        w-72 overflow-hidden rounded-xl
                        border border-gray-100 bg-lightSurfaceColor
                        shadow-xl dark:border-gray-700
                        dark:bg-surfaceColor
                        sm:w-96
                    "
                >
                    <div
                        className="
                            max-h-[420px] overflow-y-auto p-3
                            scrollbar-hide
                        "
                    >
                        {isLoading && (
                            <div className="py-8 text-center text-sm text-textColorMuted">
                                در حال جستجوی محصولات...
                            </div>
                        )}

                        {!isLoading && error && (
                            <div className="py-8 text-center text-sm text-red-500">
                                {error}
                            </div>
                        )}

                        {!isLoading &&
                            !error &&
                            products.length === 0 && (
                                <div className="py-8 text-center text-sm text-textColorMuted">
                                    محصولی با این مشخصات پیدا نشد.
                                </div>
                            )}

                        {!isLoading &&
                            !error &&
                            products.map((product) => {
                                const hasDiscount =
                                    Number(product.discount_percentage ?? 0) > 0 &&
                                    product.discount_price != null;

                                const finalPrice = hasDiscount
                                    ? Number(product.discount_price)
                                    : Number(product.price);

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() =>
                                            handleProductClick(product)
                                        }
                                        className="
                                            flex w-full cursor-pointer
                                            items-center gap-3 rounded-lg
                                            p-2 text-right
                                            transition-colors
                                            hover:bg-gray-100
                                            dark:hover:bg-gray-800
                                        "
                                    >
                                        <div
                                            className="
                                                flex size-16 shrink-0
                                                items-center justify-center
                                                overflow-hidden rounded-lg
                                                bg-gray-50
                                                dark:bg-gray-900/40
                                            "
                                        >
                                            <img
                                                src={
                                                    product.image ??
                                                    "/images/stories/story1.png"
                                                }
                                                alt={product.name}
                                                className="h-full w-full object-contain p-1"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm text-lightTextColor dark:text-textColor">
                                                {product.name}
                                            </p>

                                            <div className="mt-2 flex items-center gap-1">
                                                <span className="text-sm font-DanaDemiBold text-primaryColor">
                                                    {formatPrice(finalPrice)}
                                                </span>

                                                <span className="text-xs text-textColorMuted">
                                                    تومان
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchInput;
