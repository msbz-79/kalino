
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
    LuUsers,
    LuPackage,
    LuShoppingBag,
    LuMessageSquare,
    LuChartNoAxesCombined,
    LuArrowLeft,
    LuCalendarDays,
    LuWallet,
} from "react-icons/lu";

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud/api";

type SalesItem = {
    label: string;
    amount: number | string;
};

type RecentProduct = {
    id: number;
    name: string;
    price: number | string;
    stock: number;
    image: string | null;
    created_at: string;
};

type RecentUser = {
    id: number;
    name: string;
    email: string;
    created_at: string;
};

type AdminDashboardData = {
    users_count: number;
    products_count: number;
    orders_count: number;
    comments_count: number;
    sales_chart: SalesItem[];
    recent_products: RecentProduct[];
    recent_users: RecentUser[];
};

type DashboardResponse = {
    dashboard: AdminDashboardData;
};

type StatItem = {
    title: string;
    description: string;
    value: keyof Pick<
        AdminDashboardData,
        "users_count" | "products_count" | "orders_count" | "comments_count"
    >;
    icon: typeof LuUsers;
    iconStyle: string;
    link: string;
};

const statistics: StatItem[] = [
    {
        title: "تعداد کاربران",
        description: "کل کاربران ثبت‌نام‌شده",
        value: "users_count",
        icon: LuUsers,
        iconStyle:
            "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
        link: "/admin/users",
    },
    {
        title: "تعداد محصولات",
        description: "کل محصولات فروشگاه",
        value: "products_count",
        icon: LuPackage,
        iconStyle:
            "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
        link: "/admin/products",
    },
    {
        title: "تعداد سفارش‌ها",
        description: "کل سفارش‌های ثبت‌شده",
        value: "orders_count",
        icon: LuShoppingBag,
        iconStyle:
            "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
        link: "/admin/userorders",
    },
    {
        title: "تعداد نظرات",
        description: "کل نظرات ثبت‌شده",
        value: "comments_count",
        icon: LuMessageSquare,
        iconStyle:
            "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
        link: "/admin/usercomments",
    },
];

function formatNumber(value: number | string): string {
    return Number(value || 0).toLocaleString("fa-IR");
}

function formatPrice(value: number | string): string {
    return `${formatNumber(value)} تومان`;
}

function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

function formatMonth(value: string): string {
    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        month: "long",
    }).format(date);
}

function getProductImageUrl(image: string | null): string | null {
    if (!image) {
        return null;
    }

    if (image.startsWith("http://") || image.startsWith("https://")) {
        return image;
    }

    return `https://kalino-web-owq-kalino.runflare.cloud/storage/${image.replace(/^\/+/, "")}`;
}

function SectionHeader({
    title,
    subtitle,
    to,
}: {
    title: string;
    subtitle: string;
    to: string;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h2 className="text-base font-DanaMedium text-lightTextColor dark:text-textColor">
                    {title}
                </h2>

                <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                    {subtitle}
                </p>
            </div>

            <Link
                to={to}
                className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-lightBorderColor px-3 py-2 text-sm text-lightTextColor transition hover:border-primaryColor hover:text-primaryColor dark:border-borderColor dark:text-textColor"
            >
                مشاهده همه
                <LuArrowLeft size={15} />
            </Link>
        </div>
    );
}

function SalesChart({ data }: { data: SalesItem[] }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chartWidth = 760;
    const chartHeight = 280;

    const paddingLeft = 100;
    const paddingRight = 30;
    const paddingTop = 35;
    const paddingBottom = 50;

    const chartAreaWidth = chartWidth - paddingLeft - paddingRight;
    const chartAreaHeight = chartHeight - paddingTop - paddingBottom;

    const values = data.map((item) => Number(item.amount) || 0);
    const maxValue = Math.max(...values, 1);

    const points = data.map((item, index) => {
        const x =
            data.length <= 1
                ? paddingLeft + chartAreaWidth / 2
                : paddingLeft +
                  (index * chartAreaWidth) / (data.length - 1);

        const y =
            paddingTop +
            chartAreaHeight -
            ((Number(item.amount) || 0) / maxValue) * chartAreaHeight;

        return { x, y, item };
    });

    const linePoints = points
        .map((point) => `${point.x},${point.y}`)
        .join(" ");

    const areaPoints =
        points.length > 0
            ? `${points[0].x},${chartHeight - paddingBottom} ${linePoints} ${
                  points[points.length - 1].x
              },${chartHeight - paddingBottom}`
            : "";

    const hoveredPoint =
        hoveredIndex !== null ? points[hoveredIndex] : null;

    if (data.length === 0) {
        return (
            <div className="flex min-h-60 items-center justify-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
                اطلاعاتی برای نمایش نمودار وجود ندارد.
            </div>
        );
    }

    return (
        <div className="w-full min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                    <span className="size-2.5 rounded-full bg-primaryColor" />
                    میزان فروش
                </div>

                <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                    مبالغ به تومان
                </p>
            </div>

            <div className="w-full overflow-hidden">
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="h-auto w-full overflow-visible"
                    role="img"
                    aria-label="نمودار میزان فروش فروشگاه"
                >
                    {/* خطوط راهنما و اعداد محور عمودی */}
                    {[0, 1, 2, 3, 4].map((line) => {
                        const y =
                            paddingTop + (line * chartAreaHeight) / 4;

                        const value = maxValue * (1 - line / 4);

                        return (
                            <g key={line}>
                                <line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={chartWidth - paddingRight}
                                    y2={y}
                                    stroke="currentColor"
                                    strokeOpacity="0.12"
                                    strokeDasharray="5 5"
                                />

                                <text
                                    x={paddingLeft - 12}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="12"
                                    fill="currentColor"
                                    className="text-lightTextColorMuted dark:text-textColorMuted"
                                >
                                    {formatNumber(Math.round(value))}
                                </text>
                            </g>
                        );
                    })}

                    {/* محدوده رنگی زیر نمودار */}
                    {points.length > 1 && (
                        <polygon
                            points={areaPoints}
                            fill="currentColor"
                            className="text-primaryColor"
                            opacity="0.08"
                        />
                    )}

                    {/* خط اصلی نمودار */}
                    {points.length > 1 && (
                        <polyline
                            points={linePoints}
                            fill="none"
                            stroke="currentColor"
                            className="text-primaryColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* نقاط نمودار و اطلاعات هر نقطه */}
                    {points.map((point, index) => (
                        <g
                            key={`${point.item.label}-${index}`}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onFocus={() => setHoveredIndex(index)}
                            onBlur={() => setHoveredIndex(null)}
                            tabIndex={0}
                            role="button"
                            aria-label={`${formatMonth(
                                point.item.label
                            )}: ${formatPrice(point.item.amount)}`}
                            className="cursor-pointer outline-none"
                        >
                            {/* محدوده بزرگ‌تر برای راحتی هاور */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="13"
                                fill="transparent"
                            />

                            {/* نقطه اصلی نمودار */}
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={hoveredIndex === index ? 7 : 5}
                                fill="currentColor"
                                className="text-primaryColor"
                                stroke="currentColor"
                                strokeWidth="2"
                            />

                            {/* نام ماه */}
                            <text
                                x={point.x}
                                y={chartHeight - 12}
                                textAnchor="middle"
                                fontSize="13"
                                fill="currentColor"
                                className="text-lightTextColorMuted dark:text-textColorMuted"
                            >
                                {formatMonth(point.item.label)}
                            </text>
                        </g>
                    ))}

                    {/* Tooltip نقطه انتخاب‌شده */}
                    {hoveredPoint && (
                        <g pointerEvents="none">
                            <rect
                                x={Math.max(
                                    paddingLeft,
                                    Math.min(
                                        hoveredPoint.x - 95,
                                        chartWidth - paddingRight - 190
                                    )
                                )}
                                y={Math.max(hoveredPoint.y - 65, 5)}
                                width="190"
                                height="48"
                                rx="9"
                                fill="currentColor"
                                className="text-lightTextColor dark:text-textColor"
                                opacity="0.95"
                            />

                            <text
                                x={Math.max(
                                    paddingLeft + 95,
                                    Math.min(
                                        hoveredPoint.x,
                                        chartWidth - paddingRight - 95
                                    )
                                )}
                                y={Math.max(hoveredPoint.y - 45, 25)}
                                textAnchor="middle"
                                fontSize="12"
                                fill="white"
                            >
                                {formatMonth(hoveredPoint.item.label)}
                            </text>

                            <text
                                x={Math.max(
                                    paddingLeft + 95,
                                    Math.min(
                                        hoveredPoint.x,
                                        chartWidth - paddingRight - 95
                                    )
                                )}
                                y={Math.max(hoveredPoint.y - 27, 43)}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="600"
                                fill="white"
                            >
                                {formatPrice(hoveredPoint.item.amount)}
                            </text>
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
}

export default function Admin() {
    const [dashboard, setDashboard] = useState<AdminDashboardData>({
        users_count: 0,
        products_count: 0,
        orders_count: 0,
        comments_count: 0,
        sales_chart: [],
        recent_products: [],
        recent_users: [],
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/admin/dashboard`, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "برای مشاهده داشبورد، ابتدا وارد حساب کاربری شوید."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "شما اجازه دسترسی به داشبورد مدیریت را ندارید."
                    );
                }

                throw new Error("دریافت اطلاعات داشبورد با خطا مواجه شد.");
            }

            const data: DashboardResponse = await response.json();

            setDashboard({
                users_count: data.dashboard.users_count ?? 0,
                products_count: data.dashboard.products_count ?? 0,
                orders_count: data.dashboard.orders_count ?? 0,
                comments_count: data.dashboard.comments_count ?? 0,
                sales_chart: data.dashboard.sales_chart ?? [],
                recent_products: data.dashboard.recent_products ?? [],
                recent_users: data.dashboard.recent_users ?? [],
            });
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "دریافت اطلاعات داشبورد ناموفق بود."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    return (
        <div dir="rtl" className="w-full min-w-0 space-y-5 p-1">
            {/* عنوان صفحه */}
            <div className="flex flex-col gap-4 rounded-3xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkBoxShadow sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor">
                        <LuChartNoAxesCombined size={25} />
                    </div>

                    <div>
                        <h1 className="font-DanaBold text-xl text-lightTextColor dark:text-textColor">
                            داشبورد
                        </h1>

                        <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            خلاصه وضعیت فروشگاه و فعالیت‌های کالینو
                        </p>
                    </div>
                </div>
            </div>

            {/* خطای دریافت اطلاعات */}
            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() => void loadDashboard()}
                        className="mt-2 cursor-pointer underline"
                    >
                        تلاش دوباره
                    </button>
                </div>
            )}

            {/* کارت‌های آماری */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statistics.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.value}
                            to={item.link}
                            className="group block min-w-0 cursor-pointer rounded-2xl border border-lightBorderColor bg-lightSurfaceColor p-5 transition hover:border-primaryColor/40 hover:shadow-sm dark:border-borderColor dark:bg-surfaceColor"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                        {item.title}
                                    </p>

                                    <p className="mt-4 break-words text-2xl font-DanaBold text-lightTextColor dark:text-textColor">
                                        {isLoading
                                            ? "..."
                                            : formatNumber(
                                                  dashboard[item.value]
                                              )}
                                    </p>
                                </div>

                                <div
                                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${item.iconStyle}`}
                                >
                                    <Icon size={23} />
                                </div>
                            </div>

                            <div className="mt-4 border-t border-lightBorderColor pt-3 dark:border-borderColor">
                                <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                    {item.description}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </section>

            {/* نمودار میزان فروش */}
            <section className="w-full min-w-0 overflow-hidden rounded-3xl border border-lightBorderColor bg-lightSurfaceColor shadow-lightBoxShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkBoxShadow">
                <div className="border-b border-lightBorderColor p-5 dark:border-borderColor">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                            <LuWallet size={21} />
                        </div>

                        <div>
                            <h2 className="font-DanaMedium text-base text-lightTextColor dark:text-textColor">
                                نمودار میزان فروش
                            </h2>

                            <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                میزان فروش در ماه‌های اخیر بر اساس سفارش‌های پرداخت‌شده
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    {isLoading ? (
                        <div className="flex min-h-60 items-center justify-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            در حال دریافت اطلاعات نمودار...
                        </div>
                    ) : (
                        <SalesChart data={dashboard.sales_chart} />
                    )}
                </div>
            </section>

            {/* آخرین محصولات */}
            <section className="w-full min-w-0 overflow-hidden rounded-3xl border border-lightBorderColor bg-lightSurfaceColor shadow-lightBoxShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkBoxShadow">
                <div className="border-b border-lightBorderColor p-5 dark:border-borderColor">
                    <SectionHeader
                        title="آخرین محصولات"
                        subtitle="آخرین محصولاتی که در فروشگاه ثبت شده‌اند"
                        to="/admin/products"
                    />
                </div>

                {isLoading ? (
                    <div className="px-4 py-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
                        در حال دریافت محصولات...
                    </div>
                ) : dashboard.recent_products.length > 0 ? (
                    <div>
                        {dashboard.recent_products.map((product) => {
                            const imageUrl = getProductImageUrl(product.image);

                            return (
                                <div
                                    key={product.id}
                                    className="flex flex-col gap-3 border-b border-lightBorderColor p-4 last:border-b-0 dark:border-borderColor sm:flex-row sm:items-center sm:justify-between sm:p-5"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primaryColor/10 text-primaryColor">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={product.name}
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <LuPackage size={22} />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                                                {product.name}
                                            </h3>

                                            <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                تاریخ ثبت:{" "}
                                                {formatDate(product.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                        <p className="text-sm text-lightTextColor dark:text-textColor">
                                            {formatPrice(product.price)}
                                        </p>

                                        <span className="rounded-lg bg-primaryColor/10 px-3 py-1.5 text-xs text-primaryColor">
                                            موجودی:{" "}
                                            {formatNumber(product.stock)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="px-4 py-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
                        هنوز محصولی ثبت نشده است.
                    </div>
                )}
            </section>

            {/* آخرین کاربران */}
            <section className="w-full min-w-0 overflow-hidden rounded-3xl border border-lightBorderColor bg-lightSurfaceColor shadow-lightBoxShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkBoxShadow">
                <div className="border-b border-lightBorderColor p-5 dark:border-borderColor">
                    <SectionHeader
                        title="آخرین کاربران"
                        subtitle="آخرین کاربرانی که در کالینو ثبت‌نام کرده‌اند"
                        to="/admin/users"
                    />
                </div>

                {isLoading ? (
                    <div className="px-4 py-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
                        در حال دریافت کاربران...
                    </div>
                ) : dashboard.recent_users.length > 0 ? (
                    <div>
                        {dashboard.recent_users.map((user) => (
                            <div
                                key={user.id}
                                className="flex flex-col gap-3 border-b border-lightBorderColor p-4 last:border-b-0 dark:border-borderColor sm:flex-row sm:items-center sm:justify-between sm:p-5"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primaryColor/10 text-primaryColor">
                                        <LuUsers size={20} />
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                                            {user.name}
                                        </h3>

                                        <p className="mt-1 truncate text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                    <LuCalendarDays size={15} />
                                    عضویت: {formatDate(user.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
                        هنوز کاربری ثبت‌نام نکرده است.
                    </div>
                )}
            </section>
        </div>
    );
}
