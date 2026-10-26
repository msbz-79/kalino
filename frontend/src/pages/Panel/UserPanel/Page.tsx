import { useCallback, useEffect, useState } from "react";
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
} from "react-icons/fi";

const API_URL = "http://localhost:8000/api";

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

const statistics = [
  {
    title: "تعداد سفارشات",
    value: "۱۲",
    description: "کل سفارش‌های ثبت‌شده",
    icon: FiShoppingBag,
    iconStyle: "bg-primaryColor/10 text-primaryColor",
    link: "/panel/orders",
  },
  {
    title: "موجودی کیف پول",
    value: "۲,۵۰۰,۰۰۰",
    unit: "تومان",
    description: "موجودی قابل استفاده",
    icon: FiCreditCard,
    iconStyle:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    link: "/panel",
  },
  {
    title: "تعداد نظرات",
    value: "۸",
    description: "کل نظرات ثبت‌شده",
    icon: FiMessageSquare,
    iconStyle:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    link: "/panel/comments",
  },
  {
    title: "تعداد تیکت‌ها",
    value: "۲",
    description: "کل تیکت‌های ثبت‌شده",
    icon: FiHeadphones,
    iconStyle:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    link: "/panel/tickets",
  },
];

const recentOrders = [
  {
    id: "1245",
    date: "۱۴۰۵/۰۷/۲۲",
    amount: "۲۵,۰۰۰,۰۰۰ تومان",
    status: "تحویل‌شده",
    statusStyle:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    icon: FiCheckCircle,
  },
  {
    id: "1244",
    date: "۱۴۰۵/۰۷/۲۰",
    amount: "۱۸,۵۰۰,۰۰۰ تومان",
    status: "در حال پردازش",
    statusStyle:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    icon: FiClock,
  },
  {
    id: "1243",
    date: "۱۴۰۵/۰۷/۱۸",
    amount: "۹,۸۰۰,۰۰۰ تومان",
    status: "در انتظار پرداخت",
    statusStyle:
      "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    icon: FiPackage,
  },
];

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsedDate);
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
        className="flex shrink-0 items-center gap-2 rounded-lg border border-lightBorderColor px-3 py-2 text-sm text-lightTextColor transition hover:border-primaryColor hover:text-primaryColor dark:border-borderColor dark:text-textColor"
      >
        مشاهده همه
        <FiArrowLeft size={15} />
      </Link>
    </div>
  );
}

export default function Panel() {
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");

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
          throw new Error("برای مشاهده نظرات، ابتدا وارد حساب کاربری شوید.");
        }

        throw new Error("دریافت نظرات با خطا مواجه شد.");
      }

      const data: PaginatedComments = await response.json();

      const mappedComments = data.data
        .map(mapComment)
        .slice(0, 3);

      setRecentComments(mappedComments);
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
    void loadRecentComments();
  }, [loadRecentComments]);

  return (
    <div dir="rtl" className="w-full min-w-0 space-y-5 pb-6">
      {/* عنوان داشبورد */}
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

      {/* کارت‌های آماری */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              to={item.link}
              className="group min-w-0 rounded-xl border border-lightBorderColor bg-lightSurfaceColor p-5 transition hover:border-primaryColor/40 hover:shadow-sm dark:border-borderColor dark:bg-surfaceColor"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
                    {item.title}
                  </p>

                  <div className="mt-4 flex flex-wrap items-baseline gap-1.5">
                    <span className="break-words text-2xl font-DanaMedium text-lightTextColor dark:text-textColor">
                      {item.value}
                    </span>

                    {item.unit && (
                      <span className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                        {item.unit}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconStyle}`}
                >
                  <Icon size={22} />
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

      {/* آخرین سفارشات */}
      <section className="w-full min-w-0 overflow-hidden rounded-xl border border-lightBorderColor bg-lightSurfaceColor dark:border-borderColor dark:bg-surfaceColor">
        <div className="border-b border-lightBorderColor p-5 dark:border-borderColor">
          <SectionHeader
            title="آخرین سفارشات"
            subtitle="آخرین سفارش‌های ثبت‌شده شما"
            to="/panel/orders"
          />
        </div>

        {recentOrders.length > 0 ? (
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
                        سفارش شماره {order.id}
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
            className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm text-primaryColor"
          >
            مشاهده تمام سفارشات
            <FiArrowLeft size={16} />
          </Link>
        </div>
      </section>

      {/* آخرین نظرات واقعی کاربر */}
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
              className="mt-3 text-sm text-primaryColor"
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
            className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm text-primaryColor"
          >
            مشاهده تمام نظرات
            <FiArrowLeft size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}