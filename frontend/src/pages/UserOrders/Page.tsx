import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import {
    LuCalendarDays,
    LuCheck,
    LuClipboardList,
    LuCreditCard,
    LuEye,
    LuLoaderCircle,
    LuMapPin,
    LuPackage,
    LuPhone,
    LuSearch,
    LuUserRound,
    LuX,
} from "react-icons/lu";

type OrderStatus =
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "returned";

type PaymentStatus =
    | "pending"
    | "paid"
    | "failed"
    | "refunded";

type Order = {
    id: number;
    user_id: number;
    order_number: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    subtotal: number | string;
    discount_amount: number | string;
    shipping_cost: number | string;
    total_amount: number | string;
    shipping_name: string;
    shipping_mobile: string;
    items_count: number;
    created_at: string;
};

type OrderItem = {
    id: number;
    product_id: number | null;
    product_name: string;
    product_image: string | null;
    selected_color: string | null;
    price: number | string;
    quantity: number;
    total: number | string;
};

type OrderDetails = {
    id: number;
    order_number: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    created_at: string;
    paid_at: string | null;
    payment_provider: string | null;
    transaction_id: string | null;
    subtotal: number | string;
    discount_amount: number | string;
    shipping_cost: number | string;
    total_amount: number | string;
    shipping_name: string;
    shipping_mobile: string;
    shipping_province: string;
    shipping_city: string;
    shipping_address: string;
    shipping_postal_code: string | null;
    customer_note: string | null;
    items: OrderItem[];
};

type PaginationData = {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type OrdersResponse = {
    orders: PaginationData;
};

type OrderDetailsResponse = {
    order: OrderDetails;
};

type ApiErrorResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

type StatusOption = {
    value: OrderStatus;
    label: string;
};

const API_URL = "http://localhost:8000/api";
const CSRF_URL = "http://localhost:8000/sanctum/csrf-cookie";

const orderStatusLabels: Record<OrderStatus, string> = {
    pending: "در انتظار بررسی",
    processing: "در حال پردازش",
    shipped: "ارسال شده",
    delivered: "تحویل داده شده",
    cancelled: "لغو شده",
    returned: "مرجوع شده",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
    pending: "در انتظار پرداخت",
    paid: "پرداخت شده",
    failed: "پرداخت ناموفق",
    refunded: "بازپرداخت شده",
};

const statusStyles: Record<OrderStatus, string> = {
    pending:
        "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    processing:
        "bg-blue-100 text-blue-800 dark:bg-blue-400/15 dark:text-blue-300",
    shipped:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-300",
    delivered:
        "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300",
    cancelled:
        "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300",
    returned:
        "bg-purple-100 text-purple-800 dark:bg-purple-400/15 dark:text-purple-300",
};

const paymentStyles: Record<PaymentStatus, string> = {
    pending:
        "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    paid:
        "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300",
    failed:
        "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300",
    refunded:
        "bg-purple-100 text-purple-800 dark:bg-purple-400/15 dark:text-purple-300",
};

// وضعیت‌هایی که مدیر می‌تواند از وضعیت فعلی به آن‌ها تغییر دهد
const allowedStatusTransitions: Record<OrderStatus, StatusOption[]> = {
    pending: [
        { value: "processing", label: "تأیید و شروع پردازش" },
        { value: "cancelled", label: "لغو سفارش" },
    ],
    processing: [
        { value: "shipped", label: "ارسال شده" },
        { value: "cancelled", label: "لغو سفارش" },
    ],
    shipped: [
        { value: "delivered", label: "تحویل داده شده" },
        { value: "returned", label: "مرجوع شده" },
    ],
    delivered: [
        { value: "returned", label: "مرجوع شده" },
    ],
    cancelled: [],
    returned: [],
};

const inputClass =
    "h-11 w-full rounded-xl border border-lightBorderColor bg-lightBackgroundColor px-3 text-sm text-lightTextColor outline-none transition focus:border-primaryColor dark:border-borderColor dark:bg-backgroundColor dark:text-textColor";

function formatPersianDate(dateString: string): string {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "نامشخص";
    }

    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

function formatPrice(price: number | string): string {
    return new Intl.NumberFormat("fa-IR").format(
        Number(price) || 0
    );
}

function getCookie(name: string): string | null {
    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith(`${name}=`));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(
        cookie.substring(name.length + 1)
    );
}

async function getCsrfCookie(): Promise<void> {
    const response = await fetch(CSRF_URL, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("دریافت CSRF Token ناموفق بود.");
    }
}

function getRequestHeaders(
    includeContentType = false
): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (includeContentType) {
        headers["Content-Type"] = "application/json";
    }

    const xsrfToken = getCookie("XSRF-TOKEN");
    const token = localStorage.getItem("kalino_token");

    if (xsrfToken) {
        headers["X-XSRF-TOKEN"] = xsrfToken;
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

async function parseApiError(
    response: Response
): Promise<string> {
    let data: ApiErrorResponse = {};

    try {
        data = await response.json();
    } catch {
        // پاسخ خالی یا غیر JSON
    }

    const validationMessage = data.errors
        ? Object.values(data.errors).flat()[0]
        : undefined;

    if (response.status === 401) {
        return "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.";
    }

    if (response.status === 403) {
        return "شما اجازه انجام این عملیات را ندارید.";
    }

    return (
        validationMessage ||
        data.message ||
        "درخواست با خطا مواجه شد."
    );
}

function getProductImageUrl(
    image: string | null
): string | null {
    if (!image) {
        return null;
    }

    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {
        return image;
    }

    return `http://localhost:8000/storage/${image.replace(/^\/+/, "")}`;
}

function UserOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");

    const [selectedOrder, setSelectedOrder] =
        useState<OrderDetails | null>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] =
        useState(false);

    const [isDetailLoading, setIsDetailLoading] =
        useState(false);

    const [pendingAction, setPendingAction] = useState<{
        orderNumber: string;
        status: OrderStatus;
    } | null>(null);

    const [isUpdating, setIsUpdating] = useState(false);

    const [selectedStatus, setSelectedStatus] =
        useState<OrderStatus | "">("");

    // تأخیر در جست‌وجو
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    // دریافت سفارش‌ها
    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();

            if (searchTerm) {
                params.set("search", searchTerm);
            }

            if (statusFilter !== "all") {
                params.set("status", statusFilter);
            }

            if (paymentFilter !== "all") {
                params.set("payment_status", paymentFilter);
            }

            params.set("page", "1");
            params.set("per_page", "50");

            const response = await fetch(
                `${API_URL}/admin/orders?${params.toString()}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: getRequestHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(await parseApiError(response));
            }

            const data: OrdersResponse = await response.json();

            setOrders(data.orders.data);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "دریافت سفارش‌ها ناموفق بود.";

            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter, paymentFilter]);

    useEffect(() => {
        void fetchOrders();
    }, [fetchOrders]);

    // دریافت جزئیات سفارش
    const handleOpenDetails = async (orderNumber: string) => {
        setIsDetailModalOpen(true);
        setIsDetailLoading(true);
        setSelectedOrder(null);

        try {
            const response = await fetch(
                `${API_URL}/admin/orders/${encodeURIComponent(orderNumber)}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: getRequestHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(await parseApiError(response));
            }

            const data: OrderDetailsResponse =
                await response.json();

            setSelectedOrder(data.order);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "دریافت جزئیات سفارش ناموفق بود.";

            toast.error(message);
            setIsDetailModalOpen(false);
        } finally {
            setIsDetailLoading(false);
        }
    };

    // باز کردن مدال تغییر وضعیت
    const handleAskForStatusChange = (
        orderNumber: string,
        status: OrderStatus
    ) => {
        setPendingAction({
            orderNumber,
            status,
        });
    };

    // تغییر وضعیت سفارش
    const handleUpdateStatus = async () => {
        if (!pendingAction || isUpdating) {
            return;
        }

        setIsUpdating(true);

        try {
            await getCsrfCookie();

            const response = await fetch(
                `${API_URL}/admin/orders/${encodeURIComponent(
                    pendingAction.orderNumber
                )}/status`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: getRequestHeaders(true),
                    body: JSON.stringify({
                        status: pendingAction.status,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(await parseApiError(response));
            }

            const data = await response.json();

            toast.success(
                data.message ||
                    "وضعیت سفارش با موفقیت تغییر کرد."
            );

            const orderNumber = pendingAction.orderNumber;

            setPendingAction(null);
            setSelectedStatus("");

            // به‌روزرسانی جدول
            await fetchOrders();

            // به‌روزرسانی مدال جزئیات در صورت باز بودن
            if (
                isDetailModalOpen &&
                selectedOrder?.order_number === orderNumber
            ) {
                await handleOpenDetails(orderNumber);
            }
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "تغییر وضعیت سفارش ناموفق بود.";

            toast.error(message);
        } finally {
            setIsUpdating(false);
        }
    };

    const closeDetailsModal = () => {
        if (isDetailLoading) {
            return;
        }

        setIsDetailModalOpen(false);
        setSelectedOrder(null);
        setSelectedStatus("");
    };

    const closeActionModal = () => {
        if (isUpdating) {
            return;
        }

        setPendingAction(null);
    };

    const currentStatusOptions = selectedOrder
        ? allowedStatusTransitions[selectedOrder.status] ?? []
        : [];

    const selectedStatusLabel = pendingAction
        ? orderStatusLabels[pendingAction.status]
        : "";

    return (
        <div
            dir="rtl"
            className="w-full min-w-0 space-y-5 p-1"
        >
            {/* عنوان صفحه */}
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkBoxShadow sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor">
                        <LuClipboardList size={25} />
                    </div>

                    <div>
                        <h1 className="font-DanaBold text-xl text-lightTextColor dark:text-textColor">
                            سفارش‌های کاربران
                        </h1>

                        <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            مدیریت و بررسی سفارش‌های ثبت‌شده در فروشگاه
                        </p>
                    </div>
                </div>
            </div>

            {/* محتوای اصلی */}
            <div className="min-w-0 overflow-hidden rounded-3xl border border-lightBorderColor bg-lightSurfaceColor shadow-lightCardShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkCardShadow">

                {/* جست‌وجو و فیلترها */}
                <div className="flex flex-col gap-4 border-b border-lightBorderColor p-5 dark:border-borderColor">
                    <div className="relative w-full">
                        <LuSearch
                            size={19}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
                        />

                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            placeholder="جست‌وجو بر اساس شماره سفارش، نام یا موبایل..."
                            className="h-12 w-full rounded-xl border border-lightBorderColor bg-lightBackgroundColor pr-11 pl-4 text-sm text-lightTextColor outline-none transition placeholder:text-lightTextColorMuted focus:border-primaryColor dark:border-borderColor dark:bg-backgroundColor dark:text-textColor dark:placeholder:text-textColorMuted"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="order-status"
                                className="mb-2 block text-xs text-lightTextColorMuted dark:text-textColorMuted"
                            >
                                وضعیت سفارش
                            </label>

                            <select
                                id="order-status"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="all">همه وضعیت‌ها</option>
                                <option value="pending">در انتظار بررسی</option>
                                <option value="processing">در حال پردازش</option>
                                <option value="shipped">ارسال شده</option>
                                <option value="delivered">تحویل داده شده</option>
                                <option value="cancelled">لغو شده</option>
                                <option value="returned">مرجوع شده</option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="payment-status"
                                className="mb-2 block text-xs text-lightTextColorMuted dark:text-textColorMuted"
                            >
                                وضعیت پرداخت
                            </label>

                            <select
                                id="payment-status"
                                value={paymentFilter}
                                onChange={(event) =>
                                    setPaymentFilter(event.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="all">همه وضعیت‌ها</option>
                                <option value="pending">در انتظار پرداخت</option>
                                <option value="paid">پرداخت شده</option>
                                <option value="failed">پرداخت ناموفق</option>
                                <option value="refunded">بازپرداخت شده</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* وضعیت بارگذاری */}
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3 p-12">
                        <div className="size-8 animate-spin rounded-full border-2 border-primaryColor/20 border-t-primaryColor" />

                        <p className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            در حال دریافت سفارش‌ها...
                        </p>
                    </div>
                ) : error ? (
                    <div className="space-y-4 p-8 text-center">
                        <p className="text-sm text-red-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() => void fetchOrders()}
                            className="cursor-pointer rounded-xl bg-primaryColor px-5 py-2.5 text-sm text-white transition hover:bg-primaryDark"
                        >
                            تلاش مجدد
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="px-5 pb-3 pt-4 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            تعداد سفارش‌های نمایش‌داده‌شده:{" "}
                            {formatPrice(orders.length)}
                        </div>

                        {/* جدول سفارش‌ها */}
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-220 border-collapse text-right">
                                <thead>
                                    <tr className="border-y border-lightBorderColor bg-lightBackgroundColor dark:border-borderColor dark:bg-backgroundColor">
                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            سفارش
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            اطلاعات خریدار
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            مبلغ نهایی
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            وضعیت سفارش
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            وضعیت پرداخت
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            تاریخ ثبت
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            عملیات
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orders.length > 0 ? (
                                        orders.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="border-b border-lightBorderColor transition last:border-b-0 hover:bg-lightSurfaceHoverColor dark:border-borderColor dark:hover:bg-surfaceHoverColor"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                                                            <LuClipboardList size={20} />
                                                        </div>

                                                        <div>
                                                            <p
                                                                dir="ltr"
                                                                className="whitespace-nowrap text-right font-DanaMedium text-sm text-lightTextColor dark:text-textColor"
                                                            >
                                                                {order.order_number}
                                                            </p>

                                                            <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                                شناسه: {formatPrice(order.id)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 whitespace-nowrap text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                                                            <LuUserRound
                                                                size={15}
                                                                className="shrink-0 text-lightTextColorMuted dark:text-textColorMuted"
                                                            />

                                                            {order.shipping_name}
                                                        </div>

                                                        <div className="flex items-center gap-2 whitespace-nowrap text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                            <LuPhone
                                                                size={14}
                                                                className="shrink-0"
                                                            />

                                                            <span dir="ltr">
                                                                {order.shipping_mobile}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="whitespace-nowrap">
                                                        <p className="font-DanaMedium text-sm text-lightTextColor dark:text-textColor">
                                                            {formatPrice(order.total_amount)}
                                                        </p>

                                                        <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                            تومان
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-DanaMedium ${statusStyles[order.status]}`}
                                                    >
                                                        {orderStatusLabels[order.status]}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-DanaMedium ${paymentStyles[order.payment_status]}`}
                                                    >
                                                        {paymentStatusLabels[order.payment_status]}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 whitespace-nowrap text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                        <LuCalendarDays size={15} />

                                                        {formatPersianDate(order.created_at)}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <button
                                                        type="button"
                                                        title="مشاهده و مدیریت سفارش"
                                                        onClick={() =>
                                                            void handleOpenDetails(order.order_number)
                                                        }
                                                        className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor transition hover:bg-primaryColor hover:text-white"
                                                    >
                                                        <LuEye size={17} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-12 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <LuSearch
                                                        size={32}
                                                        className="text-lightTextColorMuted dark:text-textColorMuted"
                                                    />

                                                    <p className="font-DanaMedium text-sm text-lightTextColor dark:text-textColor">
                                                        سفارشی پیدا نشد
                                                    </p>

                                                    <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                        سفارشی با مشخصات انتخاب‌شده وجود ندارد.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* مدال جزئیات سفارش */}
            {isDetailModalOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeDetailsModal();
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="order-details-title"
                            className="my-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-lightBorderColor bg-lightSurfaceColor shadow-2xl dark:border-borderColor dark:bg-surfaceColor"
                        >
                            {/* سربرگ مدال */}
                            <div className="flex items-center justify-between border-b border-lightBorderColor px-5 py-4 dark:border-borderColor">
                                <div>
                                    <h2
                                        id="order-details-title"
                                        className="font-DanaDemiBold text-lg text-lightTextColor dark:text-textColor"
                                    >
                                        جزئیات سفارش
                                    </h2>

                                    {selectedOrder && (
                                        <p
                                            dir="ltr"
                                            className="mt-1 text-right text-xs text-lightTextColorMuted dark:text-textColorMuted"
                                        >
                                            {selectedOrder.order_number}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={closeDetailsModal}
                                    disabled={isDetailLoading}
                                    className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-lightBackgroundColor text-lightTextColorMuted transition hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed dark:bg-backgroundColor dark:text-textColorMuted"
                                >
                                    <LuX size={19} />
                                </button>
                            </div>

                            {isDetailLoading ? (
                                <div className="flex min-h-72 flex-col items-center justify-center gap-3">
                                    <LuLoaderCircle
                                        size={34}
                                        className="animate-spin text-primaryColor"
                                    />

                                    <p className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                        در حال دریافت جزئیات سفارش...
                                    </p>
                                </div>
                            ) : selectedOrder ? (
                                <div className="max-h-[75vh] space-y-6 overflow-y-auto p-5">

                                    {/* وضعیت سفارش */}
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                            <LuCalendarDays size={16} />

                                            {formatPersianDate(selectedOrder.created_at)}
                                        </div>

                                        <span
                                            className={`rounded-lg px-3 py-2 text-xs font-DanaMedium ${statusStyles[selectedOrder.status]}`}
                                        >
                                            {orderStatusLabels[selectedOrder.status]}
                                        </span>
                                    </div>

                                    {/* اطلاعات گیرنده */}
                                    <section className="rounded-2xl border border-lightBorderColor p-4 dark:border-borderColor">
                                        <h3 className="mb-4 flex items-center gap-2 font-DanaDemiBold text-sm text-lightTextColor dark:text-textColor">
                                            <LuUserRound
                                                size={18}
                                                className="text-primaryColor"
                                            />

                                            اطلاعات گیرنده
                                        </h3>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                    نام گیرنده
                                                </p>

                                                <p className="mt-2 text-sm text-lightTextColor dark:text-textColor">
                                                    {selectedOrder.shipping_name}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                    شماره موبایل
                                                </p>

                                                <p
                                                    dir="ltr"
                                                    className="mt-2 text-right text-sm text-lightTextColor dark:text-textColor"
                                                >
                                                    {selectedOrder.shipping_mobile}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 border-t border-lightBorderColor pt-4 dark:border-borderColor">
                                            <p className="flex items-center gap-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                <LuMapPin size={15} />
                                                آدرس ارسال
                                            </p>

                                            <p className="mt-2 text-sm leading-7 text-lightTextColor dark:text-textColor">
                                                {selectedOrder.shipping_province}،{" "}
                                                {selectedOrder.shipping_city}،{" "}
                                                {selectedOrder.shipping_address}
                                            </p>

                                            {selectedOrder.shipping_postal_code && (
                                                <p className="mt-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                    کد پستی: {selectedOrder.shipping_postal_code}
                                                </p>
                                            )}
                                        </div>
                                    </section>

                                    {/* اقلام سفارش */}
                                    <section>
                                        <h3 className="mb-3 flex items-center gap-2 font-DanaDemiBold text-sm text-lightTextColor dark:text-textColor">
                                            <LuPackage
                                                size={18}
                                                className="text-primaryColor"
                                            />

                                            محصولات سفارش
                                        </h3>

                                        <div className="space-y-3">
                                            {selectedOrder.items.map((item) => {
                                                const imageUrl =
                                                    getProductImageUrl(
                                                        item.product_image
                                                    );

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex gap-3 rounded-2xl border border-lightBorderColor p-3 dark:border-borderColor"
                                                    >
                                                        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-lightBackgroundColor dark:bg-backgroundColor">
                                                            {imageUrl ? (
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={item.product_name}
                                                                    className="size-full object-contain"
                                                                />
                                                            ) : (
                                                                <LuPackage
                                                                    size={25}
                                                                    className="text-lightTextColorMuted dark:text-textColorMuted"
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                                                            <p className="line-clamp-2 text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                                                                {item.product_name}
                                                            </p>

                                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                                <span>
                                                                    تعداد: {formatPrice(item.quantity)}
                                                                </span>

                                                                <span>
                                                                    قیمت واحد: {formatPrice(item.price)} تومان
                                                                </span>

                                                                {item.selected_color && (
                                                                    <span>
                                                                        رنگ: {item.selected_color}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <p className="mt-2 text-sm font-DanaDemiBold text-primaryColor">
                                                                {formatPrice(item.total)} تومان
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </section>

                                    {/* مبالغ سفارش */}
                                    <section className="space-y-3 rounded-2xl bg-lightBackgroundColor p-4 dark:bg-backgroundColor">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-lightTextColorMuted dark:text-textColorMuted">
                                                مبلغ محصولات
                                            </span>

                                            <span className="text-lightTextColor dark:text-textColor">
                                                {formatPrice(selectedOrder.subtotal)} تومان
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-sm">
                                            <span className="text-lightTextColorMuted dark:text-textColorMuted">
                                                تخفیف
                                            </span>

                                            <span className="text-teal-600 dark:text-teal-400">
                                                {formatPrice(selectedOrder.discount_amount)} تومان
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-sm">
                                            <span className="text-lightTextColorMuted dark:text-textColorMuted">
                                                هزینه ارسال
                                            </span>

                                            <span className="text-lightTextColor dark:text-textColor">
                                                {formatPrice(selectedOrder.shipping_cost)} تومان
                                            </span>
                                        </div>

                                        <div className="flex justify-between border-t border-lightBorderColor pt-3 dark:border-borderColor">
                                            <span className="font-DanaDemiBold text-sm text-lightTextColor dark:text-textColor">
                                                مبلغ نهایی
                                            </span>

                                            <span className="font-DanaDemiBold text-base text-primaryColor">
                                                {formatPrice(selectedOrder.total_amount)} تومان
                                            </span>
                                        </div>
                                    </section>

                                    {/* اطلاعات پرداخت */}
                                    <section className="rounded-2xl border border-lightBorderColor p-4 dark:border-borderColor">
                                        <h3 className="mb-3 flex items-center gap-2 font-DanaDemiBold text-sm text-lightTextColor dark:text-textColor">
                                            <LuCreditCard
                                                size={18}
                                                className="text-primaryColor"
                                            />

                                            اطلاعات پرداخت
                                        </h3>

                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <span className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                وضعیت پرداخت
                                            </span>

                                            <span
                                                className={`rounded-lg px-3 py-1.5 text-xs ${paymentStyles[selectedOrder.payment_status]}`}
                                            >
                                                {paymentStatusLabels[selectedOrder.payment_status]}
                                            </span>
                                        </div>

                                        {selectedOrder.payment_provider && (
                                            <p className="mt-3 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                درگاه پرداخت: {selectedOrder.payment_provider}
                                            </p>
                                        )}

                                        {selectedOrder.transaction_id && (
                                            <p className="mt-2 break-all text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                شناسه تراکنش: {selectedOrder.transaction_id}
                                            </p>
                                        )}

                                        {selectedOrder.paid_at && (
                                            <p className="mt-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                تاریخ پرداخت: {formatPersianDate(selectedOrder.paid_at)}
                                            </p>
                                        )}
                                    </section>

                                    {/* یادداشت مشتری */}
                                    {selectedOrder.customer_note && (
                                        <section className="rounded-2xl border border-lightBorderColor p-4 dark:border-borderColor">
                                            <h3 className="mb-2 font-DanaDemiBold text-sm text-lightTextColor dark:text-textColor">
                                                توضیحات مشتری
                                            </h3>

                                            <p className="text-sm leading-7 text-lightTextColorMuted dark:text-textColorMuted">
                                                {selectedOrder.customer_note}
                                            </p>
                                        </section>
                                    )}

                                    {/* تغییر وضعیت سفارش */}
                                    <section className="border-t border-lightBorderColor pt-5 dark:border-borderColor">
                                        <h3 className="mb-3 font-DanaDemiBold text-sm text-lightTextColor dark:text-textColor">
                                            مدیریت وضعیت سفارش
                                        </h3>

                                        {currentStatusOptions.length > 0 ? (
                                            <div className="space-y-3">
                                                <label
                                                    htmlFor="change-order-status"
                                                    className="block text-xs text-lightTextColorMuted dark:text-textColorMuted"
                                                >
                                                    وضعیت جدید را انتخاب کن
                                                </label>

                                                <select
                                                    id="change-order-status"
                                                    value={selectedStatus}
                                                    onChange={(event) =>
                                                        setSelectedStatus(
                                                            event.target.value as OrderStatus | ""
                                                        )
                                                    }
                                                    className={inputClass}
                                                >
                                                    <option value="">
                                                        انتخاب وضعیت جدید
                                                    </option>

                                                    {currentStatusOptions.map((option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>

                                                <button
                                                    type="button"
                                                    disabled={!selectedStatus}
                                                    onClick={() => {
                                                        if (selectedStatus) {
                                                            handleAskForStatusChange(
                                                                selectedOrder.order_number,
                                                                selectedStatus
                                                            );
                                                        }
                                                    }}
                                                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primaryColor px-4 py-3 text-sm text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <LuCheck size={17} />
                                                    ثبت وضعیت جدید
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="rounded-xl bg-lightBackgroundColor p-4 text-sm text-lightTextColorMuted dark:bg-backgroundColor dark:text-textColorMuted">
                                                برای این سفارش امکان تغییر وضعیت دیگری وجود ندارد.
                                            </p>
                                        )}
                                    </section>
                                </div>
                            ) : (
                                <div className="p-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                    اطلاعات سفارش در دسترس نیست.
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}

            {/* مدال تأیید تغییر وضعیت */}
            {pendingAction &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeActionModal();
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            className="w-full max-w-md rounded-3xl border border-lightBorderColor bg-lightSurfaceColor p-6 shadow-2xl dark:border-borderColor dark:bg-surfaceColor"
                        >
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor">
                                <LuCheck size={27} />
                            </div>

                            <h2 className="mt-4 text-center font-DanaDemiBold text-lg text-lightTextColor dark:text-textColor">
                                تأیید تغییر وضعیت
                            </h2>

                            <p className="mt-3 text-center text-sm leading-7 text-lightTextColorMuted dark:text-textColorMuted">
                                آیا از تغییر وضعیت سفارش به «{selectedStatusLabel}» اطمینان داری؟
                            </p>

                            <p
                                dir="ltr"
                                className="mt-3 text-center text-sm font-DanaMedium text-lightTextColor dark:text-textColor"
                            >
                                {pendingAction.orderNumber}
                            </p>

                            {pendingAction.status === "cancelled" && (
                                <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs leading-6 text-amber-700 dark:text-amber-300">
                                    با لغو سفارش، موجودی محصولات به انبار بازگردانده می‌شود.
                                </p>
                            )}

                            {pendingAction.status === "returned" && (
                                <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs leading-6 text-amber-700 dark:text-amber-300">
                                    با ثبت مرجوعی، موجودی محصولات به انبار بازگردانده می‌شود. بازپرداخت وجه باید جداگانه انجام شود.
                                </p>
                            )}

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={closeActionModal}
                                    className="flex-1 cursor-pointer rounded-xl border border-lightBorderColor px-4 py-3 text-sm text-lightTextColor transition hover:bg-lightBackgroundColor disabled:cursor-not-allowed dark:border-borderColor dark:text-textColor dark:hover:bg-backgroundColor"
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => void handleUpdateStatus()}
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primaryColor px-4 py-3 text-sm text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isUpdating ? (
                                        <LuLoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <LuCheck size={17} />
                                    )}

                                    {isUpdating
                                        ? "در حال انجام..."
                                        : "تأیید و ثبت"}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}

export default UserOrders;