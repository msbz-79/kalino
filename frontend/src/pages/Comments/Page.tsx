import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiMessageSquare,
  FiSearch,
  FiStar,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiPackage,
} from "react-icons/fi";

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud/api";
const CSRF_URL = "https://kalino-web-owq-kalino.runflare.cloud/sanctum/csrf-cookie";

type CommentStatus = "approved" | "pending" | "rejected";
type FilterStatus = "all" | CommentStatus;

type ProductComment = {
  id: number;
  productName: string;
  date: string;
  rating: number;
  text: string;
  status: CommentStatus;
};

type ApiComment = {
  id: number;
  product_id: number;
  rating: number;
  text: string;
  status: CommentStatus;
  created_at: string;
  product?: {
    id: number;
    name: string;
  } | null;
};

type PaginatedComments = {
  data: ApiComment[];
  current_page: number;
  last_page: number;
  total: number;
};

const statusConfig: Record<
  CommentStatus,
  { label: string; className: string }
> = {
  approved: {
    label: "تأییدشده",
    className:
      "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  },
  pending: {
    label: "در انتظار بررسی",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  },
  rejected: {
    label: "ردشده",
    className:
      "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  },
};

const filterOptions: { label: string; value: FilterStatus }[] = [
  { label: "همه نظرات", value: "all" },
  { label: "تأییدشده", value: "approved" },
  { label: "در انتظار بررسی", value: "pending" },
  { label: "ردشده", value: "rejected" },
];

function formatDate(date: string): string {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("fa-IR", {
    calendar: "persian",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsedDate);
}

function mapApiComment(comment: ApiComment): ProductComment {
  return {
    id: comment.id,
    productName: comment.product?.name ?? "محصول حذف‌شده",
    date: formatDate(comment.created_at),
    rating: comment.rating,
    text: comment.text,
    status: comment.status,
  };
}

function getCookie(name: string): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  const value = cookie.substring(name.length + 1);

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * ابتدا کوکی CSRF را از Laravel دریافت می‌کند
 * و سپس مقدار XSRF-TOKEN را برای درخواست‌های تغییردهنده برمی‌گرداند.
 */
async function getCsrfToken(): Promise<string> {
  const csrfResponse = await fetch(CSRF_URL, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!csrfResponse.ok) {
    throw new Error(
      "دریافت CSRF Token ناموفق بود. اتصال بک‌اند را بررسی کنید.",
    );
  }

  const csrfToken = getCookie("XSRF-TOKEN");

  if (!csrfToken) {
    throw new Error(
      "کوکی XSRF-TOKEN پیدا نشد. تنظیمات کوکی و Sanctum را بررسی کنید.",
    );
  }

  return csrfToken;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (data.errors) {
      const firstError = Object.values(
        data.errors as Record<string, string[]>,
      )[0]?.[0];

      if (firstError) return firstError;
    }

    if (data.message) return data.message;
  } catch {
    // ممکن است پاسخ سرور JSON نباشد.
  }

  if (response.status === 401) {
    return "برای انجام این عملیات ابتدا وارد حساب کاربری خود شوید.";
  }

  if (response.status === 403) {
    return "اجازه انجام این عملیات را ندارید.";
  }

  if (response.status === 404) {
    return "نظر موردنظر پیدا نشد.";
  }

  if (response.status === 419) {
    return "نشست یا CSRF معتبر نیست. صفحه را تازه‌سازی کنید و دوباره تلاش کنید.";
  }

  return "در ارتباط با سرور مشکلی پیش آمد.";
}

function showError(error: unknown, fallbackMessage: string) {
  toast.error(
    error instanceof Error ? error.message : fallbackMessage,
    {
      style: {
        direction: "rtl",
        textAlign: "right",
      },
    },
  );
}

function CommentStatusBadge({ status }: { status: CommentStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${config.className}`}
    >
      {status === "approved" && <FiCheckCircle size={14} />}
      {status === "pending" && <FiClock size={14} />}
      {status === "rejected" && <FiXCircle size={14} />}
      {config.label}
    </span>
  );
}

function RatingStars({
  rating,
  onChange,
}: {
  rating: number;
  onChange?: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          aria-label={`امتیاز ${star} از ۵`}
          className={
            onChange
              ? "cursor-pointer rounded p-0.5 transition hover:scale-110"
              : "cursor-default p-0.5"
          }
        >
          <FiStar
            size={16}
            className={
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-lightBorderColor dark:text-borderColor"
            }
          />
        </button>
      ))}
    </div>
  );
}

export default function Comments() {
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [editingComment, setEditingComment] =
    useState<ProductComment | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ProductComment | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [totalComments, setTotalComments] = useState(0);

  const loadComments = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/my-comments`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data: PaginatedComments = await response.json();

      setComments(data.data.map(mapApiComment));
      setTotalComments(data.total ?? data.data.length);
    } catch (err) {
      showError(err, "دریافت نظرات با خطا مواجه شد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const filteredComments = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return comments.filter((comment) => {
      const matchesSearch =
        comment.productName.toLocaleLowerCase().includes(normalizedSearch) ||
        comment.text.toLocaleLowerCase().includes(normalizedSearch);

      const matchesStatus =
        filter === "all" || comment.status === filter;

      return matchesSearch && matchesStatus;
    });
  }, [comments, search, filter]);

  async function saveComment() {
    if (!editingComment || !editingComment.text.trim() || saving) return;

    if (editingComment.text.trim().length < 3) {
      toast.error("متن نظر باید حداقل ۳ کاراکتر باشد.");
      return;
    }

    if (editingComment.text.trim().length > 3000) {
      toast.error("متن نظر نباید بیشتر از ۳۰۰۰ کاراکتر باشد.");
      return;
    }

    setSaving(true);

    try {
      // دریافت CSRF Token پیش از درخواست PATCH
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_URL}/comments/${editingComment.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": csrfToken,
          },
          body: JSON.stringify({
            text: editingComment.text.trim(),
            rating: editingComment.rating,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();
      const updated = mapApiComment(data.comment as ApiComment);

      setComments((current) =>
        current.map((comment) =>
          comment.id === updated.id ? updated : comment,
        ),
      );

      setEditingComment(null);

      toast.success(data.message || "نظر با موفقیت ویرایش شد.", {
        style: {
          direction: "rtl",
          textAlign: "right",
        },
      });
    } catch (err) {
      showError(err, "ویرایش نظر انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteComment() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);

    try {
      // دریافت CSRF Token پیش از درخواست DELETE
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${API_URL}/comments/${deleteTarget.id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-XSRF-TOKEN": csrfToken,
          },
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json().catch(() => ({}));

      setComments((current) =>
        current.filter((comment) => comment.id !== deleteTarget.id),
      );

      setTotalComments((current) => Math.max(0, current - 1));
      setDeleteTarget(null);

      toast.success(data.message || "نظر با موفقیت حذف شد.", {
        style: {
          direction: "rtl",
          textAlign: "right",
        },
      });
    } catch (err) {
      showError(err, "حذف نظر انجام نشد.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* عنوان صفحه */}
      <div className="w-full rounded-xl border border-lightBorderColor bg-lightSurfaceColor p-5 dark:border-borderColor dark:bg-surfaceColor">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
            <FiMessageSquare size={22} />
          </div>

          <div>
            <h1 className="text-lg font-DanaMedium text-lightTextColor dark:text-textColor">
              نظرات من
            </h1>
            <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
              نظرات ثبت‌شده برای محصولات را مشاهده و مدیریت کنید.
            </p>
          </div>
        </div>
      </div>

      {/* فهرست نظرات */}
      <section className="overflow-hidden rounded-xl border border-lightBorderColor bg-lightSurfaceColor dark:border-borderColor dark:bg-surfaceColor">
        <div className="border-b border-lightBorderColor p-5 dark:border-borderColor">
          <h2 className="font-DanaMedium text-lightTextColor dark:text-textColor">
            فهرست نظرات
          </h2>
          <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
            نظرات خود را مشاهده، جست‌وجو و ویرایش کنید.
          </p>
        </div>

        {/* جست‌وجو و فیلتر */}
        <div className="flex flex-col gap-3 border-b border-lightBorderColor p-4 dark:border-borderColor sm:flex-row">
          <div className="relative flex-1">
            <FiSearch
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجو در نام محصول یا متن نظر..."
              className="w-full rounded-lg border border-lightBorderColor bg-transparent py-3 pr-10 pl-3 text-sm text-lightTextColor outline-none transition placeholder:text-lightTextColorMuted focus:border-primaryColor dark:border-borderColor dark:text-textColor dark:placeholder:text-textColorMuted"
            />
          </div>

          <div className="relative sm:w-52">
            <FiFilter
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
            />
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as FilterStatus)
              }
              className="w-full cursor-pointer appearance-none rounded-lg border border-lightBorderColor bg-lightSurfaceColor py-3 pr-9 pl-3 text-sm text-lightTextColor outline-none focus:border-primaryColor dark:border-borderColor dark:bg-surfaceColor dark:text-textColor"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* وضعیت بارگذاری */}
        {loading && (
          <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primaryColor/25 border-t-primaryColor" />
            <p className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
              در حال دریافت نظرات...
            </p>
          </div>
        )}

        {/* کارت‌های نظر */}
        {!loading && (
          <div className="divide-y divide-lightBorderColor dark:divide-borderColor">
            {filteredComments.map((comment) => (
              <article key={comment.id} className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                    <FiPackage size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="font-DanaMedium text-lightTextColor dark:text-textColor">
                          {comment.productName}
                        </h3>
                        <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                          تاریخ ثبت: {comment.date}
                        </p>
                      </div>

                      <CommentStatusBadge status={comment.status} />
                    </div>

                    <div className="mt-3">
                      <RatingStars rating={comment.rating} />
                    </div>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-lightTextColorMuted dark:text-textColorMuted">
                      {comment.text}
                    </p>

                    {comment.status === "rejected" && (
                      <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs leading-6 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        این نظر تأیید نشده است.
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingComment({ ...comment });
                        }}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-lightBorderColor px-3 py-2 text-sm text-lightTextColor transition hover:border-primaryColor hover:text-primaryColor dark:border-borderColor dark:text-textColor"
                      >
                        <FiEdit2 size={15} />
                        ویرایش نظر
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(comment);
                        }}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-lightBorderColor px-3 py-2 text-sm text-red-600 transition hover:border-red-300 hover:bg-red-50 dark:border-borderColor dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <FiTrash2 size={15} />
                        حذف نظر
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {filteredComments.length === 0 && (
              <div className="flex flex-col items-center px-5 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primaryColor/10 text-primaryColor">
                  <FiMessageSquare size={26} />
                </div>

                <h3 className="mt-4 font-DanaMedium text-lightTextColor dark:text-textColor">
                  {comments.length === 0
                    ? "هنوز نظری ثبت نکرده‌اید"
                    : "نظری پیدا نشد"}
                </h3>

                <p className="mt-2 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                  {comments.length === 0
                    ? "پس از ثبت نظر برای یک محصول، آن را در این قسمت خواهید دید."
                    : "عبارت جست‌وجو یا فیلتر انتخاب‌شده را تغییر دهید."}
                </p>

                {(search || filter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setFilter("all");
                    }}
                    className="mt-4 cursor-pointer rounded-lg bg-primaryColor px-4 py-2 text-sm text-white transition hover:opacity-90"
                  >
                    نمایش همه نظرات
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && comments.length > 0 && (
          <div className="border-t border-lightBorderColor px-5 py-4 text-sm text-lightTextColorMuted dark:border-borderColor dark:text-textColorMuted">
            نمایش {filteredComments.length.toLocaleString("fa-IR")} نظر از{" "}
            {totalComments.toLocaleString("fa-IR")} نظر دریافتی
          </div>
        )}
      </section>

      {/* پنجره ویرایش نظر */}
      {editingComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-comment-title"
            className="my-auto w-full max-w-lg rounded-xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-xl dark:border-borderColor dark:bg-surfaceColor sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="edit-comment-title"
                className="font-DanaMedium text-lightTextColor dark:text-textColor"
              >
                ویرایش نظر
              </h2>

              <button
                type="button"
                onClick={() => setEditingComment(null)}
                aria-label="بستن"
                className="cursor-pointer rounded-lg p-2 text-lightTextColorMuted hover:bg-lightBackgroundColor dark:text-textColorMuted dark:hover:bg-backgroundColor"
              >
                <FiX size={20} />
              </button>
            </div>

            <p className="mt-2 text-sm text-lightTextColorMuted dark:text-textColorMuted">
              {editingComment.productName}
            </p>

            <label className="mt-5 block text-sm text-lightTextColor dark:text-textColor">
              امتیاز شما
            </label>

            <div className="mt-2">
              <RatingStars
                rating={editingComment.rating}
                onChange={(rating) =>
                  setEditingComment((current) =>
                    current ? { ...current, rating } : current,
                  )
                }
              />
            </div>

            <label
              htmlFor="comment-text"
              className="mt-5 block text-sm text-lightTextColor dark:text-textColor"
            >
              متن نظر
            </label>

            <textarea
              id="comment-text"
              value={editingComment.text}
              onChange={(event) =>
                setEditingComment((current) =>
                  current ? { ...current, text: event.target.value } : current,
                )
              }
              rows={5}
              maxLength={3000}
              className="mt-2 w-full resize-y rounded-lg border border-lightBorderColor bg-transparent p-3 text-sm leading-7 text-lightTextColor outline-none focus:border-primaryColor dark:border-borderColor dark:text-textColor"
            />

            <p className="mt-1 text-left text-xs text-lightTextColorMuted dark:text-textColorMuted">
              {editingComment.text.length.toLocaleString("fa-IR")} از ۳٬۰۰۰
              کاراکتر
            </p>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditingComment(null)}
                disabled={saving}
                className="cursor-pointer rounded-lg border border-lightBorderColor px-4 py-2.5 text-sm text-lightTextColor disabled:cursor-not-allowed disabled:opacity-50 dark:border-borderColor dark:text-textColor"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => void saveComment()}
                disabled={
                  saving ||
                  !editingComment.text.trim() ||
                  editingComment.text.trim().length < 3
                }
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primaryColor px-4 py-2.5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiCheck size={17} />
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* تأیید حذف */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-comment-title"
            className="w-full max-w-md rounded-xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-xl dark:border-borderColor dark:bg-surfaceColor sm:p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <FiTrash2 size={22} />
            </div>

            <h2
              id="delete-comment-title"
              className="mt-4 font-DanaMedium text-lightTextColor dark:text-textColor"
            >
              حذف نظر
            </h2>

            <p className="mt-2 text-sm leading-7 text-lightTextColorMuted dark:text-textColorMuted">
              آیا مطمئن هستید که می‌خواهید نظر مربوط به «
              {deleteTarget.productName}» را حذف کنید؟
            </p>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="cursor-pointer rounded-lg border border-lightBorderColor px-4 py-2.5 text-sm text-lightTextColor disabled:cursor-not-allowed disabled:opacity-50 dark:border-borderColor dark:text-textColor"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => void deleteComment()}
                disabled={deleting}
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "در حال حذف..." : "بله، حذف شود"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}