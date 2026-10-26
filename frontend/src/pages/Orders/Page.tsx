import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { FiSearch, FiEye, FiCalendar, FiPackage } from "react-icons/fi";

type Order = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: string | number;
  discount_amount: string | number;
  shipping_cost: string | number;
  total_amount: string | number;
  created_at: string;
  paid_at: string | null;
};

type PaginatedOrders = {
  data: Order[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

type OrdersResponse = {
  orders: PaginatedOrders;
};

const API_URL = "http://localhost:8000/api/orders";

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

const persianCalendar = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});

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
      return "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400";

    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  }
}

function formatPrice(price: string | number) {
  return `${Number(price).toLocaleString("fa-IR")} تومان`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    calendar: "persian",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// تبدیل ارقام فارسی و عربی به ارقام انگلیسی
function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)),
    )
    .trim();
}

// تبدیل تاریخ شمسی به میلادی برای ارسال به API
function jalaliToGregorian(value: string): string | null {
  const normalized = normalizeDigits(value).replace(/-/g, "/");
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  // سال شمسی تقریباً ۶۲۱ سال از سال میلادی جلوتر است.
  const approximateYear = year + 621;
  const start = Date.UTC(approximateYear, 2, 1);
  const end = Date.UTC(approximateYear + 1, 2, 1);
  const oneDay = 24 * 60 * 60 * 1000;

  for (let timestamp = start; timestamp < end; timestamp += oneDay) {
    const parts = persianCalendar.formatToParts(new Date(timestamp));

    const values: Record<string, string> = {};

    for (const part of parts) {
      if (part.type !== "literal") {
        values[part.type] = part.value;
      }
    }

    if (
      Number(values.year) === year &&
      Number(values.month) === month &&
      Number(values.day) === day
    ) {
      const date = new Date(timestamp);

      const gregorianYear = date.getUTCFullYear();
      const gregorianMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
      const gregorianDay = String(date.getUTCDate()).padStart(2, "0");

      return `${gregorianYear}-${gregorianMonth}-${gregorianDay}`;
    }
  }

  return null;
}

function isValidJalaliInput(value: string) {
  if (!value.trim()) return true;

  return jalaliToGregorian(value) !== null;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedOrders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // جلوگیری از ارسال درخواست با هر بار فشردن کلید جست‌وجو
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    if (!isValidJalaliInput(dateFrom) || !isValidJalaliInput(dateTo)) {
      setLoading(false);
      setError("تاریخ را به شکل صحیح، مانند ۱۴۰۵/۰۷/۰۲ وارد کنید.");
      setOrders([]);
      setPagination(null);
      return;
    }

    const gregorianFrom = dateFrom ? jalaliToGregorian(dateFrom) : null;
    const gregorianTo = dateTo ? jalaliToGregorian(dateTo) : null;

    if (dateFrom && dateTo && gregorianFrom && gregorianTo && gregorianFrom > gregorianTo) {
      setLoading(false);
      setError("تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.");
      setOrders([]);
      setPagination(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "10",
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status) params.set("status", status);
      if (paymentStatus) params.set("payment_status", paymentStatus);

      // API لاراول تاریخ میلادی با قالب YYYY-MM-DD دریافت می‌کند.
      if (gregorianFrom) params.set("date_from", gregorianFrom);
      if (gregorianTo) params.set("date_to", gregorianTo);

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.status === 401) {
        throw new Error("برای مشاهده سفارش‌ها ابتدا وارد حساب کاربری شوید.");
      }

      if (!response.ok) {
        throw new Error("دریافت سفارش‌ها با خطا مواجه شد.");
      }

      const result: OrdersResponse = await response.json();

      setOrders(result.orders.data);
      setPagination(result.orders);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "خطای نامشخصی رخ داد.";

      setError(message);
      setOrders([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, paymentStatus, dateFrom, dateTo]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setPage(1);
    setter(value);
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      {/* عنوان صفحه */}
      <section className="w-full rounded-xl border border-lightBorderColor bg-lightSurfaceColor p-5 dark:border-borderColor dark:bg-surfaceColor">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
            <FiPackage size={22} />
          </div>

          <div>
            <h1 className="text-lg font-DanaMedium text-lightTextColor dark:text-textColor">
              لیست سفارشات
            </h1>

            <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
              سفارش‌های ثبت‌شده در حساب کاربری شما
            </p>
          </div>
        </div>
      </section>

      {/* جست‌وجو و فیلترها */}
      <section className="w-full rounded-xl border border-lightBorderColor bg-lightSurfaceColor p-5 dark:border-borderColor dark:bg-surfaceColor">
        <h2 className="mb-4 text-base font-DanaMedium text-lightTextColor dark:text-textColor">
          جست‌وجو و فیلتر سفارش‌ها
        </h2>

        <div className="space-y-4">
          <div className="relative">
            <FiSearch
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => updateFilter(setSearch, event.target.value)}
              placeholder="جست‌وجو بر اساس شماره سفارش..."
              className="w-full rounded-lg border border-lightBorderColor bg-transparent py-3 pl-3 pr-10 text-sm text-lightTextColor outline-none transition focus:border-primaryColor dark:border-borderColor dark:text-textColor"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={status}
              onChange={(event) => updateFilter(setStatus, event.target.value)}
              className="cursor-pointer rounded-lg border border-lightBorderColor bg-lightSurfaceColor px-3 py-3 text-sm text-lightTextColor outline-none focus:border-primaryColor dark:border-borderColor dark:bg-surfaceColor dark:text-textColor"
            >
              <option value="">همه وضعیت‌های سفارش</option>
              <option value="pending">در انتظار بررسی</option>
              <option value="processing">در حال پردازش</option>
              <option value="confirmed">تأیید شده</option>
              <option value="shipped">ارسال شده</option>
              <option value="delivered">تحویل شده</option>
              <option value="cancelled">لغو شده</option>
              <option value="returned">مرجوع شده</option>
            </select>

            <select
              value={paymentStatus}
              onChange={(event) =>
                updateFilter(setPaymentStatus, event.target.value)
              }
              className="cursor-pointer rounded-lg border border-lightBorderColor bg-lightSurfaceColor px-3 py-3 text-sm text-lightTextColor outline-none focus:border-primaryColor dark:border-borderColor dark:bg-surfaceColor dark:text-textColor"
            >
              <option value="">همه وضعیت‌های پرداخت</option>
              <option value="pending">در انتظار پرداخت</option>
              <option value="paid">پرداخت شده</option>
              <option value="failed">پرداخت ناموفق</option>
              <option value="cancelled">پرداخت لغو شده</option>
              <option value="refunded">مسترد شده</option>
            </select>

            {/* تاریخ شروع شمسی */}
            <label className="flex items-center gap-2 rounded-lg border border-lightBorderColor px-3 dark:border-borderColor">
              <FiCalendar className="shrink-0 text-lightTextColorMuted dark:text-textColorMuted" />

              <input
                type="text"
                inputMode="numeric"
                dir="rtl"
                aria-label="از تاریخ شمسی"
                value={dateFrom}
                onChange={(event) =>
                  updateFilter(setDateFrom, event.target.value)
                }
                placeholder="از 1405/08/01"
                className="min-w-0 w-full bg-transparent py-3 text-sm text-lightTextColor outline-none placeholder:text-xs placeholder:text-lightTextColorMuted dark:text-textColor dark:placeholder:text-textColorMuted"
              />
            </label>

            {/* تاریخ پایان شمسی */}
            <label className="flex items-center gap-2 rounded-lg border border-lightBorderColor px-3 dark:border-borderColor">
              <FiCalendar className="shrink-0 text-lightTextColorMuted dark:text-textColorMuted" />

              <input
                type="text"
                inputMode="numeric"
                dir="rtl"
                aria-label="تا تاریخ شمسی"
                value={dateTo}
                onChange={(event) =>
                  updateFilter(setDateTo, event.target.value)
                }
                placeholder="تا 1406/08/01"
                className="min-w-0 w-full bg-transparent py-3 text-sm text-lightTextColor outline-none placeholder:text-xs placeholder:text-lightTextColorMuted dark:text-textColor dark:placeholder:text-textColorMuted"
              />
            </label>
          </div>
        </div>
      </section>

      {/* جدول سفارش‌ها */}
      <section className="w-full min-w-0 overflow-hidden rounded-xl border border-lightBorderColor bg-lightSurfaceColor dark:border-borderColor dark:bg-surfaceColor">
        <div className="flex items-center justify-between gap-3 border-b border-lightBorderColor p-5 dark:border-borderColor">
          <h2 className="font-DanaMedium text-lightTextColor dark:text-textColor">
            سفارش‌های شما
          </h2>

          {pagination && (
            <span className="shrink-0 text-xs text-lightTextColorMuted dark:text-textColorMuted">
              {pagination.total.toLocaleString("fa-IR")} سفارش
            </span>
          )}
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <p className="text-sm text-red-500">{error}</p>

            <button
              type="button"
              onClick={() => void fetchOrders()}
              className="cursor-pointer rounded-lg bg-primaryColor px-4 py-2 text-sm text-white transition hover:opacity-90"
            >
              تلاش مجدد
            </button>
          </div>
        ) : loading ? (
          <div className="px-4 py-12 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
            در حال دریافت سفارش‌ها...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <FiPackage
              size={34}
              className="text-lightTextColorMuted dark:text-textColorMuted"
            />

            <p className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
              سفارشی با این مشخصات پیدا نشد.
            </p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[850px] text-right">
                <thead className="bg-lightBackgroundColor dark:bg-backgroundColor">
                  <tr className="border-b border-lightBorderColor dark:border-borderColor">
                    <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                      شماره سفارش
                    </th>
                    <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                      تاریخ ثبت
                    </th>
                    <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                      مبلغ کل
                    </th>
                    <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                      وضعیت سفارش
                    </th>
                    <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                      وضعیت پرداخت
                    </th>
                    <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                      جزئیات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-lightBorderColor transition hover:bg-lightBackgroundColor/60 dark:border-borderColor dark:hover:bg-backgroundColor/60"
                    >
                      <td className="px-4 py-4 text-sm text-lightTextColor dark:text-textColor">
                        <span dir="ltr" className="inline-block">
                          {order.order_number}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-lightTextColor dark:text-textColor">
                        {formatPrice(order.total_amount)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs ${getStatusStyle(order.status)}`}
                        >
                          {orderStatusLabels[order.status] ?? order.status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs ${getStatusStyle(order.payment_status)}`}
                        >
                          {paymentStatusLabels[order.payment_status] ??
                            order.payment_status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <Link
                          to={`/panel/orders/${encodeURIComponent(order.order_number)}`}
                          className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-primaryColor transition hover:opacity-75"
                        >
                          <FiEye size={16} />
                          مشاهده
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* صفحه‌بندی */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                  صفحه {pagination.current_page.toLocaleString("fa-IR")} از{" "}
                  {pagination.last_page.toLocaleString("fa-IR")}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="cursor-pointer rounded-lg border border-lightBorderColor px-3 py-2 text-sm text-lightTextColor disabled:cursor-not-allowed disabled:opacity-40 dark:border-borderColor dark:text-textColor"
                  >
                    قبلی
                  </button>

                  <button
                    type="button"
                    disabled={page >= pagination.last_page}
                    onClick={() => setPage((current) => current + 1)}
                    className="cursor-pointer rounded-lg border border-lightBorderColor px-3 py-2 text-sm text-lightTextColor disabled:cursor-not-allowed disabled:opacity-40 dark:border-borderColor dark:text-textColor"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}