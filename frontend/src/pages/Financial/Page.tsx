import { useCallback, useEffect, useState } from "react";

import {
    RiMoneyDollarCircleLine,
    RiShoppingBag3Line,
    RiArrowDownCircleLine,
    RiArrowUpCircleLine,
} from "react-icons/ri";

import { FiCalendar, FiCreditCard } from "react-icons/fi";

import Header from "./components/Header";
import JalaliDatePicker from "./components/JalaliDatePicker";

const API_URL = "http://localhost:8000";

type SalesItem = {
    date: string;
    orders_count: number;
    revenue: number | string;
};

type WalletTransaction = {
    id: number;
    user_id: number;
    type: "deposit" | "withdrawal";
    amount: number | string;
    status: "pending" | "completed" | "failed";
    payment_provider: string | null;
    transaction_id: string | null;
    paid_at: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
};

type OverviewResponse = {
    sales: {
        total_revenue: number | string;
        paid_orders_count: number;
        average_order_amount: number | string;
    };
    wallet: {
        total_deposits: number | string;
        deposits_count: number;
        total_withdrawals: number | string;
        withdrawals_count: number;
    };
};

type TransactionsResponse = {
    data: WalletTransaction[];
};

const getToday = () => {
    const date = new Date();

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
};

const getMonthStart = () => {
    const date = new Date();

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}-01`;
};

const getWeekStart = () => {
    const date = new Date();
    const difference = date.getDay() === 6 ? 0 : date.getDay() + 1;

    date.setDate(date.getDate() - difference);

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
};

const getYearStart = () => `${new Date().getFullYear()}-01-01`;

const formatPrice = (value: number | string) =>
    `${Number(value || 0).toLocaleString("fa-IR")} تومان`;

const formatNumber = (value: number) =>
    Number(value || 0).toLocaleString("fa-IR");

const formatJalaliDate = (value: string | null) => {
    if (!value) return "-";

    const date = new Date(
        value.length === 10 ? `${value}T12:00:00` : value
    );

    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
};

const getStatusLabel = (status: WalletTransaction["status"]) => {
    switch (status) {
        case "completed":
            return "موفق";
        case "pending":
            return "در انتظار";
        case "failed":
            return "ناموفق";
        default:
            return status;
    }
};

const getTypeLabel = (type: WalletTransaction["type"]) =>
    type === "deposit" ? "شارژ کیف پول" : "برداشت از کیف پول";

const cardClass = `
    rounded-2xl border border-lightBorderColor/70
    bg-lightSurfaceColor shadow-lightCardShadow
    dark:border-borderColor/70 dark:bg-surfaceColor
    dark:shadow-darkCardShadow
`;

const mutedTextClass =
    "text-lightTextColorMuted dark:text-textColorMuted";

function Financial() {
    const [from, setFrom] = useState(getMonthStart);
    const [to, setTo] = useState(getToday);

    const [overview, setOverview] = useState<OverviewResponse | null>(null);
    const [sales, setSales] = useState<SalesItem[]>([]);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

    const [transactionType, setTransactionType] = useState("");
    const [transactionStatus, setTransactionStatus] = useState("");

    const [totalTransactions, setTotalTransactions] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getCsrfCookie = async () => {
        const response = await fetch(
            `${API_URL}/sanctum/csrf-cookie`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(
                "دریافت اطلاعات امنیتی ارتباط با سرور ناموفق بود."
            );
        }
    };

    const fetchFinanceData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            await getCsrfCookie();

            const query = new URLSearchParams({
                from,
                to,
            });

            const transactionsQuery = new URLSearchParams({
                from,
                to,
            });

            if (transactionType) {
                transactionsQuery.set("type", transactionType);
            }

            if (transactionStatus) {
                transactionsQuery.set("status", transactionStatus);
            }

            const requestOptions: RequestInit = {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            };

            const [
                overviewResponse,
                salesResponse,
                transactionsResponse,
            ] = await Promise.all([
                fetch(
                    `${API_URL}/api/admin/finance/overview?${query}`,
                    requestOptions
                ),
                fetch(
                    `${API_URL}/api/admin/finance/sales?${query}`,
                    requestOptions
                ),
                fetch(
                    `${API_URL}/api/admin/finance/wallet-transactions?${transactionsQuery}`,
                    requestOptions
                ),
            ]);

            const responses = [
                overviewResponse,
                salesResponse,
                transactionsResponse,
            ];

            const failedResponse = responses.find(
                (response) => !response.ok
            );

            if (failedResponse) {
                let message = "دریافت اطلاعات مالی با خطا مواجه شد.";

                try {
                    const data = await failedResponse.json();
                    message = data.message || message;
                } catch {
                    // پاسخ JSON معتبر نبود.
                }

                if (failedResponse.status === 401) {
                    message =
                        "نشست شما منقضی شده است. دوباره وارد حساب مدیر شوید.";
                }

                if (failedResponse.status === 403) {
                    message =
                        "شما دسترسی لازم برای مشاهده اطلاعات مالی را ندارید.";
                }

                throw new Error(message);
            }

            const overviewData: OverviewResponse =
                await overviewResponse.json();

            const salesData = await salesResponse.json();

            const transactionsData: TransactionsResponse =
                await transactionsResponse.json();

            setOverview(overviewData);
            setSales(salesData.sales || []);

            setTransactions(transactionsData.data || []);
            setTotalTransactions(
                transactionsData.total ?? transactionsData.data?.length ?? 0
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "ارتباط با سرور برقرار نشد."
            );
        } finally {
            setLoading(false);
        }
    }, [
        from,
        to,
        transactionType,
        transactionStatus,
    ]);

    useEffect(() => {
        fetchFinanceData();
    }, [fetchFinanceData]);

    const handleDatePreset = (preset: string) => {
        const today = getToday();

        switch (preset) {
            case "today":
                setFrom(today);
                setTo(today);
                break;

            case "week":
                setFrom(getWeekStart());
                setTo(today);
                break;

            case "month":
                setFrom(getMonthStart());
                setTo(today);
                break;

            case "year":
                setFrom(getYearStart());
                setTo(today);
                break;
        }
    };

    const revenue = Number(overview?.sales.total_revenue || 0);
    const deposits = Number(overview?.wallet.total_deposits || 0);
    const withdrawals = Number(overview?.wallet.total_withdrawals || 0);

    const walletTotal = deposits + withdrawals;

    const maxRevenue = Math.max(
        ...sales.map((item) => Number(item.revenue)),
        1
    );

    const maxOrders = Math.max(
        ...sales.map((item) => Number(item.orders_count)),
        1
    );

    const chartPoints = sales.map((item, index) => {
        const x =
            sales.length <= 1
                ? 50
                : (index / (sales.length - 1)) * 100;

        const y =
            100 - (Number(item.revenue) / maxRevenue) * 85;

        return { ...item, x, y };
    });

    const linePath = chartPoints
        .map(
            (point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        )
        .join(" ");

    const areaPath = chartPoints.length
        ? `${linePath} L 100 100 L 0 100 Z`
        : "";

    const depositPercentage = walletTotal
        ? (deposits / walletTotal) * 100
        : 0;

    return (
        <div className="space-y-5 pb-6 font-DanaMedium text-lightTextColor dark:text-textColor">

            <Header />

            {/* فیلتر تاریخ */}

            <section className={`${cardClass} p-4 sm:p-5`}>
                <div className="mb-4 flex items-center gap-2">
                    <FiCalendar className="size-5 text-primaryColor" />

                    <h2 className="font-DanaDemiBold">
                        بازه زمانی گزارش
                    </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                    {[
                        { label: "امروز", value: "today" },
                        { label: "هفته جاری", value: "week" },
                        { label: "ماه جاری", value: "month" },
                        { label: "سال جاری", value: "year" },
                    ].map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => handleDatePreset(item.value)}
                            className="
                                cursor-pointer rounded-xl border
                                border-lightBorderColor px-4 py-2 text-sm
                                transition hover:border-primaryColor
                                hover:bg-primaryColor/10
                                dark:border-borderColor
                            "
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">

                    <JalaliDatePicker
                        label="از تاریخ"
                        value={from}
                        maxDate={to}
                        onChange={(date) => {
                            setFrom(date);
                        }}
                    />

                    <JalaliDatePicker
                        label="تا تاریخ"
                        value={to}
                        minDate={from}
                        maxDate={getToday()}
                        onChange={(date) => {
                            setTo(date);
                        }}
                    />

                </div>
            </section>

            {/* نمایش خطا */}

            {error && (
                <div className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 sm:flex-row sm:items-center sm:justify-between">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={fetchFinanceData}
                        className="
                            w-fit cursor-pointer rounded-lg border
                            border-red-500/30 px-3 py-1.5
                            transition hover:bg-red-500/10
                        "
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {/* کارت‌های آماری */}

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">

                <StatCard
                    title="مجموع درآمد فروش"
                    value={loading ? "..." : formatPrice(revenue)}
                    icon={<RiMoneyDollarCircleLine size={25} />}
                    color="emerald"
                />

                <StatCard
                    title="سفارش‌های پرداخت‌شده"
                    value={loading ? "..." : formatNumber(overview?.sales.paid_orders_count || 0)}
                    icon={<RiShoppingBag3Line size={25} />}
                    color="blue"
                />

                <StatCard
                    title="میانگین مبلغ سفارش"
                    value={loading ? "..." : formatPrice(overview?.sales.average_order_amount || 0)}
                    icon={<FiCreditCard size={25} />}
                    color="violet"
                />

                <StatCard
                    title="مجموع شارژ کیف پول"
                    value={loading ? "..." : formatPrice(deposits)}
                    icon={<RiArrowDownCircleLine size={25} />}
                    color="sky"
                />

                <StatCard
                    title="مجموع برداشت کیف پول"
                    value={loading ? "..." : formatPrice(withdrawals)}
                    icon={<RiArrowUpCircleLine size={25} />}
                    color="orange"
                />

            </section>

            {/* نمودار درآمد */}

            <section className={`${cardClass} p-4 sm:p-6`}>
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-DanaDemiBold text-lg">
                            روند درآمد فروش
                        </h2>

                        <p className={`mt-1 text-sm ${mutedTextClass}`}>
                            تغییرات درآمد سفارش‌های پرداخت‌شده
                        </p>
                    </div>

                    <span className="flex items-center gap-2 text-sm text-emerald-600">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        درآمد روزانه
                    </span>
                </div>

                {loading ? (
                    <EmptyState>در حال دریافت اطلاعات...</EmptyState>
                ) : sales.length === 0 ? (
                    <EmptyState>
                        در این بازه زمانی اطلاعات فروشی وجود ندارد.
                    </EmptyState>
                ) : (
                    <>
                        <div className="relative h-64 w-full sm:h-80">
                            <div className="absolute inset-0 flex flex-col justify-between">
                                {[100, 75, 50, 25, 0].map((value) => (
                                    <div
                                        key={value}
                                        className="flex items-center gap-3"
                                    >
                                        <span className={`w-9 text-left text-[10px] ${mutedTextClass}`}>
                                            {value}٪
                                        </span>

                                        <div className="h-px flex-1 border-t border-dashed border-lightBorderColor dark:border-borderColor" />
                                    </div>
                                ))}
                            </div>

                            <svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                className="absolute inset-0 h-full w-full overflow-visible"
                            >
                                <defs>
                                    <linearGradient
                                        id="revenueGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#10b981"
                                            stopOpacity="0.28"
                                        />

                                        <stop
                                            offset="100%"
                                            stopColor="#10b981"
                                            stopOpacity="0"
                                        />
                                    </linearGradient>
                                </defs>

                                <path
                                    d={areaPath}
                                    fill="url(#revenueGradient)"
                                />

                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="0.9"
                                    vectorEffect="non-scaling-stroke"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {chartPoints.map((point) => (
                                    <circle
                                        key={point.date}
                                        cx={point.x}
                                        cy={point.y}
                                        r="1.5"
                                        fill="#10b981"
                                        stroke="currentColor"
                                        strokeWidth="0.3"
                                    />
                                ))}
                            </svg>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-between gap-2">
                            {sales.map((item) => (
                                <div
                                    key={item.date}
                                    className="min-w-0 text-center"
                                >
                                    <p className={`text-[10px] sm:text-xs ${mutedTextClass}`}>
                                        {formatJalaliDate(item.date)}
                                    </p>

                                    <p className="mt-1 text-[10px] font-DanaDemiBold sm:text-xs">
                                        {formatNumber(Number(item.orders_count))} سفارش
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            {/* نمودار تعداد سفارش */}

            <section className={`${cardClass} p-4 sm:p-6`}>
                <div className="mb-6">
                    <h2 className="font-DanaDemiBold text-lg">
                        تعداد سفارش‌های روزانه
                    </h2>

                    <p className={`mt-1 text-sm ${mutedTextClass}`}>
                        تعداد سفارش‌های پرداخت‌شده در هر روز
                    </p>
                </div>

                {loading ? (
                    <EmptyState>در حال دریافت اطلاعات...</EmptyState>
                ) : sales.length === 0 ? (
                    <EmptyState>
                        اطلاعاتی برای نمایش وجود ندارد.
                    </EmptyState>
                ) : (
                    <div className="flex h-52 items-end gap-2 overflow-x-auto pb-2 sm:gap-3">
                        {sales.map((item) => {
                            const height =
                                (Number(item.orders_count) / maxOrders) * 100;

                            return (
                                <div
                                    key={item.date}
                                    className="group flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-2 sm:min-w-10"
                                >
                                    <span className="text-[10px] opacity-0 transition group-hover:opacity-100">
                                        {formatNumber(Number(item.orders_count))}
                                    </span>

                                    <div
                                        className="
                                            w-full max-w-12 rounded-t-lg
                                            bg-primaryColor/80 transition-all
                                            duration-300 group-hover:bg-primaryDark
                                        "
                                        style={{
                                            height: `${Math.max(height, 2)}%`,
                                        }}
                                        title={`${formatJalaliDate(item.date)} - ${item.orders_count} سفارش`}
                                    />

                                    <span className={`whitespace-nowrap text-[10px] ${mutedTextClass}`}>
                                        {new Date(`${item.date}T12:00:00`).toLocaleDateString(
                                            "fa-IR-u-ca-persian",
                                            {
                                                day: "numeric",
                                                month: "short",
                                            }
                                        )}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* نمودار کیف پول */}

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                <div className={`${cardClass} p-4 sm:p-6`}>
                    <div className="mb-5">
                        <h2 className="font-DanaDemiBold text-lg">
                            وضعیت مالی کیف پول
                        </h2>

                        <p className={`mt-1 text-sm ${mutedTextClass}`}>
                            مقایسه مجموع شارژ و برداشت کاربران
                        </p>
                    </div>

                    {loading ? (
                        <EmptyState>در حال دریافت اطلاعات...</EmptyState>
                    ) : walletTotal === 0 ? (
                        <EmptyState>
                            تراکنشی در این بازه زمانی ثبت نشده است.
                        </EmptyState>
                    ) : (
                        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
                            <div
                                className="relative size-44 shrink-0 rounded-full"
                                style={{
                                    background: `conic-gradient(
                                        #0ea5e9 0% ${depositPercentage}%,
                                        #f97316 ${depositPercentage}% 100%
                                    )`,
                                }}
                            >
                                <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-lightSurfaceColor dark:bg-surfaceColor">
                                    <span className={`text-xs ${mutedTextClass}`}>
                                        مجموع تراکنش‌ها
                                    </span>

                                    <span className="mt-2 text-sm font-DanaDemiBold">
                                        {formatPrice(walletTotal)}
                                    </span>
                                </div>
                            </div>

                            <div className="w-full space-y-5 sm:w-auto">
                                <WalletLegend
                                    color="bg-sky-500"
                                    title="شارژ کیف پول"
                                    amount={deposits}
                                    count={overview?.wallet.deposits_count || 0}
                                />

                                <WalletLegend
                                    color="bg-orange-500"
                                    title="برداشت از کیف پول"
                                    amount={withdrawals}
                                    count={overview?.wallet.withdrawals_count || 0}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className={`${cardClass} p-4 sm:p-6`}>
                    <div className="mb-5">
                        <h2 className="font-DanaDemiBold text-lg">
                            مقایسه تعداد تراکنش‌ها
                        </h2>

                        <p className={`mt-1 text-sm ${mutedTextClass}`}>
                            تعداد شارژ و برداشت کیف پول
                        </p>
                    </div>

                    <div className="space-y-6">
                        <TransactionBar
                            title="تعداد شارژها"
                            count={overview?.wallet.deposits_count || 0}
                            total={
                                (overview?.wallet.deposits_count || 0) +
                                (overview?.wallet.withdrawals_count || 0)
                            }
                            color="bg-sky-500"
                        />

                        <TransactionBar
                            title="تعداد برداشت‌ها"
                            count={overview?.wallet.withdrawals_count || 0}
                            total={
                                (overview?.wallet.deposits_count || 0) +
                                (overview?.wallet.withdrawals_count || 0)
                            }
                            color="bg-orange-500"
                        />
                    </div>
                </div>

            </section>

            {/* جدول تراکنش‌ها */}

            <section className={`${cardClass} overflow-hidden`}>
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="font-DanaDemiBold text-lg">
                            تراکنش‌های کیف پول
                        </h2>

                        <p className={`mt-1 text-sm ${mutedTextClass}`}>
                            مجموع {formatNumber(totalTransactions)} تراکنش ثبت‌شده
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <select
                            value={transactionType}
                            onChange={(event) => {
                                setTransactionType(event.target.value);
                            }}
                            className="
                                cursor-pointer rounded-xl border
                                border-lightBorderColor bg-lightBackgroundColor
                                px-3 py-2.5 text-sm outline-none
                                focus:border-primaryColor
                                dark:border-borderColor dark:bg-backgroundColor
                            "
                        >
                            <option value="">همه انواع تراکنش</option>
                            <option value="deposit">شارژ کیف پول</option>
                            <option value="withdrawal">برداشت از کیف پول</option>
                        </select>

                        <select
                            value={transactionStatus}
                            onChange={(event) => {
                                setTransactionStatus(event.target.value);
                            }}
                            className="
                                cursor-pointer rounded-xl border
                                border-lightBorderColor bg-lightBackgroundColor
                                px-3 py-2.5 text-sm outline-none
                                focus:border-primaryColor
                                dark:border-borderColor dark:bg-backgroundColor
                            "
                        >
                            <option value="">همه وضعیت‌ها</option>
                            <option value="completed">موفق</option>
                            <option value="pending">در انتظار</option>
                            <option value="failed">ناموفق</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-right text-sm">
                        <thead className="bg-lightBackgroundColor dark:bg-backgroundColor">
                            <tr>
                                {[
                                    "کاربر",
                                    "نوع تراکنش",
                                    "مبلغ",
                                    "وضعیت",
                                    "درگاه پرداخت",
                                    "تاریخ",
                                ].map((title) => (
                                    <th
                                        key={title}
                                        className={`px-4 py-4 font-DanaMedium ${mutedTextClass}`}
                                    >
                                        {title}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-lightBorderColor dark:divide-borderColor">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className={`px-4 py-12 text-center ${mutedTextClass}`}
                                    >
                                        در حال دریافت تراکنش‌ها...
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className={`px-4 py-12 text-center ${mutedTextClass}`}
                                    >
                                        تراکنشی برای نمایش وجود ندارد.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((transaction) => (
                                    <tr
                                        key={transaction.id}
                                        className="transition hover:bg-lightSurfaceHoverColor dark:hover:bg-surfaceHoverColor"
                                    >
                                        <td className="px-4 py-4">
                                            <p className="font-DanaDemiBold">
                                                {transaction.user?.name || "کاربر حذف‌شده"}
                                            </p>

                                            <p className={`mt-1 text-xs ${mutedTextClass}`}>
                                                {transaction.user?.email || "-"}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {transaction.type === "deposit" ? (
                                                    <RiArrowDownCircleLine className="size-5 text-sky-500" />
                                                ) : (
                                                    <RiArrowUpCircleLine className="size-5 text-orange-500" />
                                                )}

                                                {getTypeLabel(transaction.type)}
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 font-DanaDemiBold">
                                            {formatPrice(transaction.amount)}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`
                                                    inline-flex rounded-lg px-3 py-1.5 text-xs
                                                    ${
                                                        transaction.status === "completed"
                                                            ? "bg-emerald-500/10 text-emerald-600"
                                                            : transaction.status === "pending"
                                                            ? "bg-amber-500/10 text-amber-600"
                                                            : "bg-red-500/10 text-red-600"
                                                    }
                                                `}
                                            >
                                                {getStatusLabel(transaction.status)}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            {transaction.payment_provider || "-"}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            {formatJalaliDate(
                                                transaction.paid_at ||
                                                transaction.created_at
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        emerald: "bg-emerald-500/10 text-emerald-600",
        blue: "bg-blue-500/10 text-blue-600",
        violet: "bg-violet-500/10 text-violet-600",
        sky: "bg-sky-500/10 text-sky-600",
        orange: "bg-orange-500/10 text-orange-600",
    };

    return (
        <div className={`${cardClass} p-4 sm:p-5`}>
            <div
                className={`flex size-12 items-center justify-center rounded-xl ${colorClasses[color]}`}
            >
                {icon}
            </div>

            <p className={`mt-4 text-sm ${mutedTextClass}`}>
                {title}
            </p>

            <p className="mt-2 break-words text-lg font-DanaDemiBold sm:text-xl">
                {value}
            </p>
        </div>
    );
}

function EmptyState({ children }: { children: React.ReactNode }) {
    return (
        <div
            className={`flex h-52 items-center justify-center text-sm ${mutedTextClass}`}
        >
            {children}
        </div>
    );
}

function WalletLegend({
    color,
    title,
    amount,
    count,
}: {
    color: string;
    title: string;
    amount: number;
    count: number;
}) {
    return (
        <div>
            <div className="flex items-center gap-2 text-sm">
                <span className={`size-3 rounded-full ${color}`} />
                <span>{title}</span>
            </div>

            <p className="mt-2 font-DanaDemiBold">
                {formatPrice(amount)}
            </p>

            <p className={`mt-1 text-xs ${mutedTextClass}`}>
                {formatNumber(count)} تراکنش
            </p>
        </div>
    );
}

function TransactionBar({
    title,
    count,
    total,
    color,
}: {
    title: string;
    count: number;
    total: number;
    color: string;
}) {
    const percentage = total ? (count / total) * 100 : 0;

    return (
        <div>
            <div className="mb-2 flex items-center justify-between text-sm">
                <span>{title}</span>

                <span className="font-DanaDemiBold">
                    {formatNumber(count)}
                </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-lightBackgroundColor dark:bg-backgroundColor">
                <div
                    className={`h-full rounded-full transition-all ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default Financial;