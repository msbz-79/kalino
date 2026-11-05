import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import {
    FiArrowRight,
    FiPackage,
    FiCalendar,
    FiCreditCard,
    FiMapPin,
    FiUser,
    FiHash,
    FiPhone,
    FiHome,
} from "react-icons/fi";

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud/api/orders";

type OrderItem = {
    id: number;
    product_id?: number;
    product_name?: string;
    name?: string;
    quantity: number;
    price: string | number;
    total?: string | number;
    total_price?: string | number;
    product?: {
        id: number;
        name: string;
        image?: string | null;
    } | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    payment_provider?: string | null;
    transaction_id?: string | null;
    subtotal: string | number;
    discount_amount: string | number;
    shipping_cost: string | number;
    total_amount: string | number;
    created_at: string;
    paid_at: string | null;
    shipping_name?: string | null;
    shipping_mobile?: string | null;
    shipping_province?: string | null;
    shipping_city?: string | null;
    shipping_address?: string | null;
    shipping_postal_code?: string | null;
    customer_note?: string | null;
    items?: OrderItem[];
};

type OrderResponse = {
    order?: Order;
} & Partial<Order>;

const orderStatusLabels: Record<string, string> = {
    pending: "در انتظار بررسی",
    processing: "در حال پردازش",
    confirmed: "تأیید شده",
    shipped: "ارسال شده",
    delivered: "تحویل شده",
    cancelled: "لغو شده",
    returned: "مرجوع شده",
};

const paymentStatusLabels: Record<string, string> = {
    pending: "در انتظار پرداخت",
    paid: "پرداخت شده",
    failed: "پرداخت ناموفق",
    cancelled: "پرداخت لغو شده",
    refunded: "مسترد شده",
};

function formatPrice(value: string | number | undefined) {
    return `${Number(value ?? 0).toLocaleString("fa-IR")} تومان`;
}

function formatDate(value: string | null | undefined) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("fa-IR", {
        calendar: "persian",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function getStatusStyle(status: string) {
    switch (status) {
        case "paid":
        case "delivered":
        case "confirmed":
            return "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400";

        case "pending":
        case "processing":
            return "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400";

        case "shipped":
            return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";

        case "failed":
        case "cancelled":
        case "returned":
        case "refunded":
            return "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400";

        default:
            return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
    }
}

function StatusBadge({
    status,
    labels,
}: {
    status: string;
    labels: Record<string, string>;
}) {
    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-lg px-3 py-1.5 text-xs ${getStatusStyle(status)}`}
        >
            {labels[status] ?? status}
        </span>
    );
}

function InfoItem({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value?: string | number | null;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 text-primaryColor">
                {icon}
            </div>

            <div className="min-w-0">
                <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                    {label}
                </p>

                <p className="mt-1 break-words text-sm text-lightTextColor dark:text-textColor">
                    {value || "ثبت نشده"}
                </p>
            </div>
        </div>
    );
}

export default function OrderDetails() {
    const { orderNumber } = useParams();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function fetchOrder() {
            if (!orderNumber) {
                setError("شماره سفارش معتبر نیست.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const response = await fetch(
                    `${API_URL}/${encodeURIComponent(orderNumber)}`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            Accept: "application/json",
                        },
                        signal: controller.signal,
                    },
                );

                if (response.status === 401) {
                    throw new Error(
                        "برای مشاهده سفارش، ابتدا وارد حساب کاربری شوید.",
                    );
                }

                if (response.status === 404) {
                    throw new Error("سفارش موردنظر پیدا نشد.");
                }

                if (!response.ok) {
                    throw new Error(
                        "دریافت اطلاعات سفارش با خطا مواجه شد.",
                    );
                }

                const result: OrderResponse = await response.json();
                const orderData = result.order ?? (result as Order);

                if (!orderData.order_number) {
                    throw new Error(
                        "اطلاعات سفارش از سرور به شکل مورد انتظار دریافت نشد.",
                    );
                }

                setOrder(orderData);
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : "خطای نامشخصی هنگام دریافت سفارش رخ داد.",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void fetchOrder();

        return () => controller.abort();
    }, [orderNumber]);

    const cardClass =
        "rounded-xl border border-lightBorderColor bg-lightSurfaceColor p-5 dark:border-borderColor dark:bg-surfaceColor";

    const headingClass =
        "mb-5 flex items-center gap-2 font-DanaMedium text-lightTextColor dark:text-textColor";

    if (loading) {
        return (
            <div className="w-full min-w-0 rounded-xl border border-lightBorderColor bg-lightSurfaceColor px-4 py-16 text-center text-sm text-lightTextColorMuted dark:border-borderColor dark:bg-surfaceColor dark:text-textColorMuted">
                در حال دریافت اطلاعات سفارش...
            </div>
        );
    }

    if (error || !order) {
        return (
            <section className={`${cardClass} text-center`}>
                <FiPackage
                    size={36}
                    className="mx-auto mb-4 text-lightTextColorMuted dark:text-textColorMuted"
                />

                <p className="text-sm text-red-500">
                    {error || "سفارش موردنظر پیدا نشد."}
                </p>

                <Link
                    to="/panel/orders"
                    className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primaryColor px-4 py-2.5 text-sm text-white transition hover:opacity-90"
                >
                    <FiArrowRight size={16} />
                    بازگشت به سفارش‌ها
                </Link>
            </section>
        );
    }

    const items = order.items ?? [];

    return (
        <div className="w-full min-w-0 space-y-5">
            {/* عنوان و دکمه بازگشت */}
            <section className={cardClass}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                            <FiPackage size={22} />
                        </div>

                        <div>
                            <h1 className="text-lg font-DanaMedium text-lightTextColor dark:text-textColor">
                                جزئیات سفارش
                            </h1>

                            <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                اطلاعات و اقلام سفارش ثبت‌شده
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/panel/orders"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-lightBorderColor px-4 py-2.5 text-sm text-lightTextColor transition hover:bg-lightBackgroundColor dark:border-borderColor dark:text-textColor dark:hover:bg-backgroundColor"
                    >
                        <FiArrowRight size={16} />
                        بازگشت به سفارش‌ها
                    </Link>
                </div>
            </section>

            {/* اطلاعات اصلی سفارش */}
            <section className={cardClass}>
                <h2 className={headingClass}>
                    <FiHash size={19} />
                    اطلاعات سفارش
                </h2>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoItem
                        icon={<FiHash size={18} />}
                        label="شماره سفارش"
                        value={order.order_number}
                    />

                    <InfoItem
                        icon={<FiCalendar size={18} />}
                        label="تاریخ ثبت سفارش"
                        value={formatDate(order.created_at)}
                    />

                    <div>
                        <p className="mb-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                            وضعیت سفارش
                        </p>

                        <StatusBadge
                            status={order.status}
                            labels={orderStatusLabels}
                        />
                    </div>

                    <div>
                        <p className="mb-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                            وضعیت پرداخت
                        </p>

                        <StatusBadge
                            status={order.payment_status}
                            labels={paymentStatusLabels}
                        />
                    </div>
                </div>
            </section>

            {/* اقلام سفارش */}
            <section className="w-full min-w-0 overflow-hidden rounded-xl border border-lightBorderColor bg-lightSurfaceColor dark:border-borderColor dark:bg-surfaceColor">
                <div className="border-b border-lightBorderColor p-5 dark:border-borderColor">
                    <h2 className={headingClass.replace("mb-5 ", "mb-0 ")}>
                        <FiPackage size={19} />
                        اقلام سفارش
                    </h2>
                </div>

                {items.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
                        اطلاعات محصولات این سفارش در پاسخ سرور موجود نیست.
                    </p>
                ) : (
                    <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <table className="w-full min-w-[650px] text-right">
                            <thead className="bg-lightBackgroundColor dark:bg-backgroundColor">
                                <tr className="border-b border-lightBorderColor dark:border-borderColor">
                                    <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                        محصول
                                    </th>

                                    <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                        قیمت واحد
                                    </th>

                                    <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                        تعداد
                                    </th>

                                    <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                        مبلغ
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((item) => {
                                    const itemName =
                                        item.product_name ??
                                        item.product?.name ??
                                        item.name ??
                                        "محصول";

                                    const itemTotal =
                                        item.total ??
                                        item.total_price ??
                                        Number(item.price) * Number(item.quantity);

                                    return (
                                        <tr
                                            key={item.id}
                                            className="border-b border-lightBorderColor last:border-b-0 dark:border-borderColor"
                                        >
                                            <td className="px-5 py-4 text-sm text-lightTextColor dark:text-textColor">
                                                {itemName}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                                {formatPrice(item.price)}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-lightTextColor dark:text-textColor">
                                                {Number(item.quantity).toLocaleString("fa-IR")}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-lightTextColor dark:text-textColor">
                                                {formatPrice(itemTotal)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* اطلاعات گیرنده و ارسال */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <section className={cardClass}>
                    <h2 className={headingClass}>
                        <FiUser size={19} />
                        اطلاعات گیرنده و ارسال
                    </h2>

                    <div className="space-y-5">
                        <InfoItem
                            icon={<FiUser size={18} />}
                            label="نام گیرنده"
                            value={order.shipping_name}
                        />

                        <InfoItem
                            icon={<FiPhone size={18} />}
                            label="شماره موبایل"
                            value={order.shipping_mobile}
                        />

                        <InfoItem
                            icon={<FiMapPin size={18} />}
                            label="استان و شهر"
                            value={
                                [order.shipping_province, order.shipping_city]
                                    .filter(Boolean)
                                    .join("، ") || null
                            }
                        />

                        <InfoItem
                            icon={<FiHome size={18} />}
                            label="آدرس"
                            value={order.shipping_address}
                        />

                        <InfoItem
                            icon={<FiHash size={18} />}
                            label="کد پستی"
                            value={order.shipping_postal_code}
                        />
                    </div>

                    {order.customer_note && (
                        <div className="mt-5 border-t border-lightBorderColor pt-4 dark:border-borderColor">
                            <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                توضیحات سفارش
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm text-lightTextColor dark:text-textColor">
                                {order.customer_note}
                            </p>
                        </div>
                    )}
                </section>

                {/* خلاصه پرداخت */}
                <section className={cardClass}>
                    <h2 className={headingClass}>
                        <FiCreditCard size={19} />
                        خلاصه پرداخت
                    </h2>

                    <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-lightTextColorMuted dark:text-textColorMuted">
                                جمع محصولات
                            </span>

                            <span className="text-lightTextColor dark:text-textColor">
                                {formatPrice(order.subtotal)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <span className="text-lightTextColorMuted dark:text-textColorMuted">
                                تخفیف
                            </span>

                            <span className="text-green-600 dark:text-green-400">
                                {formatPrice(order.discount_amount)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <span className="text-lightTextColorMuted dark:text-textColorMuted">
                                هزینه ارسال
                            </span>

                            <span className="text-lightTextColor dark:text-textColor">
                                {formatPrice(order.shipping_cost)}
                            </span>
                        </div>

                        <div className="border-t border-lightBorderColor pt-4 dark:border-borderColor">
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-DanaMedium text-lightTextColor dark:text-textColor">
                                    مبلغ نهایی
                                </span>

                                <span className="text-lg font-DanaMedium text-primaryColor">
                                    {formatPrice(order.total_amount)}
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-lightBorderColor pt-4 dark:border-borderColor">
                            <InfoItem
                                icon={<FiCreditCard size={18} />}
                                label="درگاه پرداخت"
                                value={order.payment_provider}
                            />

                            <div className="mt-4">
                                <InfoItem
                                    icon={<FiHash size={18} />}
                                    label="شناسه تراکنش"
                                    value={order.transaction_id}
                                />
                            </div>

                            <div className="mt-4">
                                <InfoItem
                                    icon={<FiCalendar size={18} />}
                                    label="تاریخ پرداخت"
                                    value={formatDate(order.paid_at)}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
