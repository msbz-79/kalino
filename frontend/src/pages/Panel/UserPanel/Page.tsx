import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import {
  FiShoppingBag,
  FiCreditCard,
  FiMessageSquare,
  FiHeadphones,
  FiArrowLeft,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiStar,
  FiPlus,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";

const API_URL = "http://localhost:8000/api";
const CSRF_URL = "http://localhost:8000/sanctum/csrf-cookie";

type CommentStatus = "pending" | "approved" | "rejected";

type ApiComment = {
  id: number;
  text: string;
  rating: number;
  status: CommentStatus;
  created_at: string;
  product?: {
    id: number;
    name: string;
  };
};

type PaginatedComments = {
  data: ApiComment[];
  total: number;
};

type RecentComment = {
  id: number;
  product: string;
  comment: string;
  date: string;
  status: string;
  statusStyle: string;
};

type ApiOrder = {
  id: number;
  order_number?: string;
  status: string;
  payment_status: string;
  total_amount: string | number;
  created_at: string;
};

type DashboardResponse = {
  dashboard: {
    wallet_balance: string | number;
    orders_count: number;
    comments_count: number;
    recent_orders: ApiOrder[];
  };
};

type RecentOrder = {
  id: number;
  date: string;
  amount: string;
  status: string;
  statusStyle: string;
  icon: typeof FiCheckCircle;
};

type DepositResponse = {
  message?: string;
  payment_url?: string;
  transaction_id?: number;
  errors?: Record<string, string[]>;
};

async function getCsrfToken(): Promise<string> {
  const response = await fetch(CSRF_URL, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("دریافت توکن امنیتی ناموفق بود. دوباره تلاش کنید.");
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("XSRF-TOKEN="));

  if (!cookie) {
    throw new Error(
      "کوکی CSRF در دسترس نیست. تنظیمات دامنه و کوکی‌های بک‌اند را بررسی کنید.",
    );
  }

  return decodeURIComponent(
    cookie.substring("XSRF-TOKEN=".length),
  );
}

const statistics = [
  {
    title: "تعداد سفارشات",
    description: "کل سفارش‌های ثبت‌شده",
    icon: FiShoppingBag,
    iconStyle: "bg-primaryColor/10 text-primaryColor",
    link: "/panel/orders",
    key: "orders",
  },
  {
    title: "موجودی کیف پول",
    description: "موجودی قابل استفاده",
    icon: FiCreditCard,
    iconStyle:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    link: "/panel",
    key: "wallet",
  },
  {
    title: "تعداد نظرات",
    description: "کل نظرات ثبت‌شده",
    icon: FiMessageSquare,
    iconStyle:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    link: "/panel/comments",
    key: "comments",
  },
  {
    title: "تعداد تیکت‌ها",
    description: "کل تیکت‌های ثبت‌شده",
    icon: FiHeadphones,
    iconStyle:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    link: "/panel/tickets",
    key: "tickets",
  },
] as const;

const orderStatusLabels: Record<string, string> = {
  pending: "در انتظار بررسی",
  processing: "در حال پردازش",
  confirmed: "تأیید شده",
  shipped: "ارسال شده",
  delivered: "تحویل‌شده",
  cancelled: "لغو شده",
  returned: "مرجوع شده",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  failed: "پرداخت ناموفق",
  cancelled: "پرداخت لغو شده",
  refunded: "مسترد شده",
};

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

function getOrderStatus(order: ApiOrder) {
  if (order.payment_status !== "paid") {
    return {
      label:
        paymentStatusLabels[order.payment_status] ??
        orderStatusLabels[order.status] ??
        "نامشخص",
      style: getStatusStyle(order.payment_status),
      icon: FiClock,
    };
  }

  return {
    label: orderStatusLabels[order.status] ?? "نامشخص",
    style: getStatusStyle(order.status),
    icon:
      order.status === "delivered" ? FiCheckCircle : FiPackage,
  };
}

function formatPrice(value: string | number | undefined) {
  const amount = Number(value ?? 0);

  return `${(Number.isFinite(amount) ? amount : 0).toLocaleString("fa-IR")} تومان`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fa-IR", {
    calendar: "persian",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function mapComment(comment: ApiComment): RecentComment {
  const statusMap: Record<
    CommentStatus,
    { label: string; style: string }
  > = {
    pending: {
      label: "در انتظار تأیید",
      style:
        "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    },
    approved: {
      label: "تأییدشده",
      style:
        "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    },
    rejected: {
      label: "ردشده",
      style:
        "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    },
  };

  const status = statusMap[comment.status] ?? statusMap.pending;

  return {
    id: comment.id,
    product: comment.product?.name ?? "محصول",
    comment: comment.text,
    date: formatDate(comment.created_at),
    status: status.label,
    statusStyle: status.style,
  };
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
        <FiArrowLeft size={15} />
      </Link>
    </div>
  );
}

export default function Panel() {
  const [dashboard, setDashboard] = useState<
    DashboardResponse["dashboard"]
  >({
    wallet_balance: 0,
    orders_count: 0,
    comments_count: 0,
    recent_orders: [],
  });

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("100000");
  const [depositLoading, setDepositLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const response = await fetch(`${API_URL}/dashboard`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "برای مشاهده داشبورد، ابتدا وارد حساب کاربری شوید.",
          );
        }

        throw new Error("دریافت اطلاعات داشبورد با خطا مواجه شد.");
      }

      const data: DashboardResponse = await response.json();

      setDashboard({
        wallet_balance: data.dashboard.wallet_balance ?? 0,
        orders_count: data.dashboard.orders_count ?? 0,
        comments_count: data.dashboard.comments_count ?? 0,
        recent_orders: data.dashboard.recent_orders ?? [],
      });
    } catch (error) {
      setDashboardError(
        error instanceof Error
          ? error.message
          : "دریافت اطلاعات داشبورد با خطا مواجه شد.",
      );
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadRecentComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsError("");

    try {
      const response = await fetch(`${API_URL}/my-comments`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "برای مشاهده نظرات، ابتدا وارد حساب کاربری شوید.",
          );
        }

        throw new Error("دریافت نظرات با خطا مواجه شد.");
      }

      const data: PaginatedComments = await response.json();

      setRecentComments(
        (data.data ?? []).slice(0, 3).map(mapComment),
      );
    } catch (error) {
      setCommentsError(
        error instanceof Error
          ? error.message
          : "دریافت نظرات با خطا مواجه شد.",
      );
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    void loadRecentComments();
  }, [loadDashboard, loadRecentComments]);

  const handleDeposit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(depositAmount);

    if (!Number.isInteger(amount) || amount < 1000 || amount > 50000000) {
      toast.error("مبلغ شارژ باید بین ۱,۰۰۰ تا ۵۰,۰۰۰,۰۰۰ تومان باشد.");
      return;
    }

    setDepositLoading(true);

    try {
      // دریافت کوکی CSRF پیش از درخواست POST
      const csrfToken = await getCsrfToken();

      const response = await fetch(`${API_URL}/wallet/deposit`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({ amount }),
      });

      const data: DepositResponse = await response.json();

      if (!response.ok) {
        const validationMessage = data.errors
          ? Object.values(data.errors).flat()[0]
          : undefined;

        throw new Error(
          validationMessage ??
            data.message ??
            "شروع فرایند شارژ کیف پول ناموفق بود.",
        );
      }

      if (!data.payment_url) {
        throw new Error("آدرس پرداخت از سمت سرور دریافت نشد.");
      }

      toast.success("در حال انتقال به درگاه پرداخت...");
      window.location.assign(data.payment_url);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "خطا در اتصال به درگاه پرداخت.",
      );

      setDepositLoading(false);
    }
  };

  const recentOrders: RecentOrder[] = dashboard.recent_orders.map((order) => {
    const status = getOrderStatus(order);

    return {
      id: order.id,
      date: formatDate(order.created_at),
      amount: formatPrice(order.total_amount),
      status: status.label,
      statusStyle: status.style,
      icon: status.icon,
    };
  });

  const statValues: Record<
    (typeof statistics)[number]["key"],
    string
  > = {
    orders: dashboard.orders_count.toLocaleString("fa-IR"),
    wallet: Number(dashboard.wallet_balance).toLocaleString("fa-IR"),
    comments: dashboard.comments_count.toLocaleString("fa-IR"),
    tickets: "—",
  };

  return (
    <div dir="rtl" className="w-full min-w-0 space-y-5 pb-6">
      <section className="w-full rounded-xl border border-lightBorderColor bg-lightSurfaceColor p-5 dark:border-borderColor dark:bg-surfaceColor">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
            <FiShoppingBag size={22} />
          </div>

          <div>
            <h1 className="text-lg font-DanaMedium text-lightTextColor dark:text-textColor">
              داشبورد
            </h1>

            <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
              خلاصه وضعیت حساب کاربری شما در کالینو
            </p>
          </div>
        </div>
      </section>

      {dashboardError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          <p>{dashboardError}</p>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-2 cursor-pointer text-sm underline"
          >
            تلاش دوباره
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="group min-w-0 rounded-xl border border-lightBorderColor bg-lightSurfaceColor p-5 transition hover:border-primaryColor/40 hover:shadow-sm dark:border-borderColor dark:bg-surfaceColor"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={item.link}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <p className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
                    {item.title}
                  </p>

                  <div className="mt-4 flex flex-wrap items-baseline gap-1.5">
                    <span className="break-words text-2xl font-DanaMedium text-lightTextColor dark:text-textColor">
                      {dashboardLoading ? "..." : statValues[item.key]}
                    </span>

                    {item.key === "wallet" && (
                      <span className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                        تومان
                      </span>
                    )}
                  </div>
                </Link>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconStyle}`}
                >
                  <Icon size={22} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-lightBorderColor pt-3 dark:border-borderColor">
                <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                  {item.description}
                </p>

                {item.key === "wallet" && (
                  <button
                    type="button"
                    aria-label="شارژ کیف پول"
                    title="شارژ کیف پول"
                    onClick={() => setDepositModalOpen(true)}
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor transition hover:bg-primaryColor/20"
                  >
                    <FiPlus size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="w-full min-w-0 overflow-hidden rounded-xl border border-lightBorderColor bg-lightSurfaceColor dark:border-borderColor dark:bg-surfaceColor">
        <div className="border-b border-lightBorderColor p-5 dark:border-borderColor">
          <SectionHeader
            title="آخرین سفارشات"
            subtitle="آخرین سفارش‌های ثبت‌شده شما"
            to="/panel/orders"
          />
        </div>

        {dashboardLoading ? (
          <div className="px-4 py-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
            در حال دریافت سفارش‌ها...
          </div>
        ) : recentOrders.length > 0 ? (
          <div>
            {recentOrders.map((order) => {
              const StatusIcon = order.icon;

              return (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 border-b border-lightBorderColor p-4 last:border-b-0 transition hover:bg-gray-50/70 dark:border-borderColor dark:hover:bg-backgroundColor/40 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                      <FiPackage size={20} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                        سفارش شماره{" "}
                        {(order.id).toLocaleString("fa-IR")}
                      </p>

                      <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                        تاریخ ثبت: {order.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <p className="text-sm text-lightTextColor dark:text-textColor">
                      {order.amount}
                    </p>

                    <span
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs ${order.statusStyle}`}
                    >
                      <StatusIcon size={14} />
                      {order.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
            هنوز سفارشی ثبت نکرده‌اید.
          </div>
        )}

        <div className="border-t border-lightBorderColor p-3 dark:border-borderColor sm:hidden">
          <Link
            to="/panel/orders"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-sm text-primaryColor"
          >
            مشاهده تمام سفارشات
            <FiArrowLeft size={16} />
          </Link>
        </div>
      </section>

      <section className="w-full min-w-0 overflow-hidden rounded-xl border border-lightBorderColor bg-lightSurfaceColor dark:border-borderColor dark:bg-surfaceColor">
        <div className="border-b border-lightBorderColor p-5 dark:border-borderColor">
          <SectionHeader
            title="آخرین نظرات"
            subtitle="آخرین دیدگاه‌های ثبت‌شده شما"
            to="/panel/comments"
          />
        </div>

        {commentsLoading ? (
          <div className="px-4 py-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
            در حال دریافت نظرات...
          </div>
        ) : commentsError ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              {commentsError}
            </p>

            <button
              type="button"
              onClick={() => void loadRecentComments()}
              className="mt-3 cursor-pointer text-sm text-primaryColor"
            >
              تلاش دوباره
            </button>
          </div>
        ) : recentComments.length > 0 ? (
          <div>
            {recentComments.map((comment) => (
              <div
                key={comment.id}
                className="flex flex-col gap-3 border-b border-lightBorderColor p-4 last:border-b-0 dark:border-borderColor sm:flex-row sm:items-start sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                    <FiStar size={20} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                      {comment.product}
                    </h3>

                    <p className="mt-2 break-words text-sm leading-6 text-lightTextColorMuted dark:text-textColorMuted">
                      {comment.comment}
                    </p>

                    <p className="mt-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                      تاریخ ثبت: {comment.date}
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit shrink-0 rounded-lg px-2.5 py-1.5 text-xs ${comment.statusStyle}`}
                >
                  {comment.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
            هنوز نظری ثبت نکرده‌اید.
          </div>
        )}

        <div className="border-t border-lightBorderColor p-3 dark:border-borderColor sm:hidden">
          <Link
            to="/panel/comments"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-sm text-primaryColor"
          >
            مشاهده تمام نظرات
            <FiArrowLeft size={16} />
          </Link>
        </div>
      </section>

      {depositModalOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              !depositLoading
            ) {
              setDepositModalOpen(false);
            }
          }}
        >
          <div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deposit-title"
            className="w-full max-w-md rounded-2xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-xl dark:border-borderColor dark:bg-surfaceColor"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2
                id="deposit-title"
                className="text-lg font-DanaMedium text-lightTextColor dark:text-textColor"
              >
                شارژ کیف پول
              </h2>

              <button
                type="button"
                aria-label="بستن"
                disabled={depositLoading}
                onClick={() => setDepositModalOpen(false)}
                className="cursor-pointer rounded-lg p-2 text-lightTextColorMuted transition hover:bg-lightSurfaceHoverColor disabled:cursor-not-allowed dark:text-textColorMuted dark:hover:bg-surfaceHoverColor"
              >
                <FiX size={20} />
              </button>
            </div>

            <p className="mb-4 text-sm text-lightTextColorMuted dark:text-textColorMuted">
              مبلغ موردنظر را به تومان وارد کنید. سپس به درگاه زرین‌پال منتقل می‌شوید.
            </p>

            <form onSubmit={handleDeposit}>
              <label
                htmlFor="deposit-amount"
                className="mb-2 block text-sm text-lightTextColor dark:text-textColor"
              >
                مبلغ شارژ (تومان)
              </label>

              <input
                id="deposit-amount"
                type="number"
                min={1000}
                max={50000000}
                step={1000}
                required
                disabled={depositLoading}
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                className="w-full rounded-xl border border-lightBorderColor bg-transparent px-4 py-3 text-lightTextColor outline-none transition focus:border-primaryColor dark:border-borderColor dark:text-textColor"
                placeholder="مثلاً ۱۰۰۰۰۰"
              />

              <p className="mt-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                حداقل ۱,۰۰۰ و حداکثر ۵۰,۰۰۰,۰۰۰ تومان
              </p>

              <div className="mt-5 flex gap-3">
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="flex-1 cursor-pointer rounded-xl bg-primaryColor px-4 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {depositLoading ? "در حال اتصال..." : "پرداخت و شارژ"}
                </button>

                <button
                  type="button"
                  disabled={depositLoading}
                  onClick={() => setDepositModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-lightBorderColor px-4 py-3 text-sm text-lightTextColor transition hover:bg-lightSurfaceHoverColor disabled:cursor-not-allowed dark:border-borderColor dark:text-textColor dark:hover:bg-surfaceHoverColor"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
