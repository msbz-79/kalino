import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Table, { type ProductColor } from "./components/Table";
import SpecialOfferSettings from "./components/SpecialOfferSettings";
import TableHeader, {
    type SortOrder,
    type ProductStatusFilter,
} from "./components/TableHeader";

type Product = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image: string | null;
    colors?: ProductColor[] | null;
    is_active: boolean;
    discount_percentage: number | null;
    discount_price: number | null;
    is_special_offer: boolean;
    created_at?: string;
    updated_at?: string;
};

type ApiProduct = {
    id: number;
    name: string;
    description: string | null;
    price: number | string;
    stock: number | string;
    image: string | null;
    colors?: ProductColor[] | string | null;
    is_active: boolean | number | string;
    discount_percentage?: number | string | null;
    discount_price?: number | string | null;
    is_special_offer?: boolean | number | string;
    created_at?: string;
    updated_at?: string;
};

type ProductsApiResponse = {
    data?:
    | ApiProduct[]
    | {
        data?: ApiProduct[];
    };
    products?: ApiProduct[];
    message?: string;
};

const API_URL = "http://localhost:8000";

function toBoolean(value: boolean | number | string | undefined): boolean {
    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    );
}

function toNullableNumber(
    value: number | string | null | undefined
): number | null {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : null;
}

function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<ProductStatusFilter>("all");
    const [sortOrder, setSortOrder] =
        useState<SortOrder>("name-asc");

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/api/products?status=all`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                    cache: "no-store",
                }
            );

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "برای مشاهده محصولات باید وارد حساب کاربری شوید."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "شما اجازه مشاهده همه محصولات را ندارید. دسترسی مدیر را بررسی کن."
                    );
                }

                throw new Error(
                    `دریافت اطلاعات محصولات ناموفق بود. کد خطا: ${response.status}`
                );
            }

            const data: ProductsApiResponse = await response.json();

            const apiProducts = Array.isArray(data.data)
                ? data.data
                : data.data &&
                    !Array.isArray(data.data) &&
                    Array.isArray(data.data.data)
                    ? data.data.data
                    : Array.isArray(data.products)
                        ? data.products
                        : null;

            if (!apiProducts) {
                throw new Error(
                    "ساختار پاسخ API محصولات معتبر نیست."
                );
            }

            const formattedProducts: Product[] = apiProducts.map(
                (product) => ({
                    id: Number(product.id),
                    name: product.name,
                    description: product.description ?? null,
                    price: Number(product.price),
                    stock: Number(product.stock ?? 0),
                    image: product.image ?? null,
                    colors: Array.isArray(product.colors)
                        ? product.colors
                        : typeof product.colors === "string"
                          ? (() => {
                                try {
                                    const parsed = JSON.parse(product.colors) as unknown;
                                    return Array.isArray(parsed) ? parsed as ProductColor[] : [];
                                } catch {
                                    return [];
                                }
                            })()
                          : [],
                    is_active: toBoolean(product.is_active),
                    discount_percentage: toNullableNumber(
                        product.discount_percentage
                    ),
                    discount_price: toNullableNumber(
                        product.discount_price
                    ),
                    is_special_offer: toBoolean(
                        product.is_special_offer
                    ),
                    created_at: product.created_at,
                    updated_at: product.updated_at,
                })
            );

            setProducts(formattedProducts);
        } catch (err) {
            console.error(
                "خطا هنگام دریافت فهرست محصولات:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "خطایی هنگام دریافت محصولات رخ داد."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchProducts();

        const handleProductsRefresh = () => {
            void fetchProducts();
        };

        window.addEventListener(
            "products:refresh",
            handleProductsRefresh
        );

        return () => {
            window.removeEventListener(
                "products:refresh",
                handleProductsRefresh
            );
        };
    }, [fetchProducts]);

    const filteredProducts = useMemo(() => {
        const normalizedSearch = searchTerm
            .trim()
            .toLocaleLowerCase("fa");

        return products
            .filter((product) => {
                const normalizedName = product.name.toLocaleLowerCase("fa");

                const normalizedDescription = (
                    product.description ?? ""
                ).toLocaleLowerCase("fa");

                const matchesSearch =
                    normalizedName.includes(normalizedSearch) ||
                    normalizedDescription.includes(normalizedSearch);

                const matchesStatus =
                    statusFilter === "all" ||
                    (statusFilter === "active" &&
                        product.is_active) ||
                    (statusFilter === "inactive" &&
                        !product.is_active) ||
                    (statusFilter === "special-offer" &&
                        product.is_special_offer) ||
                    (statusFilter === "discounted" &&
                        product.discount_percentage !== null &&
                        product.discount_percentage > 0 &&
                        product.discount_price !== null);

                return matchesSearch && matchesStatus;
            })
            .sort((productA, productB) => {
                switch (sortOrder) {
                    case "name-asc":
                        return productA.name.localeCompare(
                            productB.name,
                            "fa"
                        );

                    case "name-desc":
                        return productB.name.localeCompare(
                            productA.name,
                            "fa"
                        );

                    case "price-asc":
                        return productA.price - productB.price;

                    case "price-desc":
                        return productB.price - productA.price;

                    default:
                        return 0;
                }
            });
    }, [products, searchTerm, statusFilter, sortOrder]);

    const handleProductChanged = useCallback(() => {
        void fetchProducts();
    }, [fetchProducts]);

    return (
        <div
            dir="rtl"
            className="w-full min-w-0 space-y-5 p-1"
        >
            <Header />
            <SpecialOfferSettings />
            <div className="min-w-0 overflow-hidden rounded-3xl border border-lightBorderColor bg-lightSurfaceColor shadow-lightCardShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkCardShadow">
                <TableHeader
                    onSearchChange={setSearchTerm}
                    onStatusChange={setStatusFilter}
                    onSortChange={setSortOrder}
                />

                {isLoading ? (
                    <p className="p-6 text-center text-lightTextColor dark:text-textColor">
                        در حال دریافت اطلاعات محصولات...
                    </p>
                ) : error ? (
                    <div className="space-y-3 p-6 text-center">
                        <p className="text-red-500">{error}</p>

                        <button
                            type="button"
                            onClick={() => void fetchProducts()}
                            className="cursor-pointer rounded-xl bg-primaryColor px-4 py-2 text-sm text-white transition hover:bg-primaryDark"
                        >
                            تلاش مجدد
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="px-5 pb-3 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            تعداد نتایج:{" "}
                            {filteredProducts.length.toLocaleString("fa-IR")}{" "}
                            از {products.length.toLocaleString("fa-IR")} محصول
                        </div>

                        <Table
                            products={filteredProducts}
                            onProductChanged={handleProductChanged}
                        />

                        <Footer products={filteredProducts} />
                    </>
                )}
            </div>
        </div>
    );
}

export default Products;
