import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { LuStar, LuThumbsDown, LuThumbsUp } from "react-icons/lu";
import toast from "react-hot-toast";

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud/api";
const CSRF_URL = "https://kalino-web-owq-kalino.runflare.cloud/sanctum/csrf-cookie";

type Review = {
  id: number;
  name: string;
  date: string;
  rating: number;
  text: string;
  verified?: boolean;
};

type ApiComment = {
  id: number;
  rating: number;
  text: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
};

type PaginatedComments = {
  data: ApiComment[];
  current_page: number;
  last_page: number;
  total: number;
};

type ReviewsProps = {
  productId: number;
};

function formatDate(date: string): string {
  if (!date) return "—";

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

function mapComment(comment: ApiComment): Review {
  return {
    id: comment.id,
    name: comment.user?.name ?? "کاربر کالینو",
    date: formatDate(comment.created_at),
    rating: comment.rating,
    text: comment.text,
    verified: false,
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
    return "برای ثبت نظر ابتدا وارد حساب کاربری خود شوید.";
  }

  if (response.status === 419) {
    return "نشست یا CSRF معتبر نیست. صفحه را تازه‌سازی کنید و دوباره تلاش کنید.";
  }

  return "انجام عملیات با خطا مواجه شد. لطفاً دوباره تلاش کنید.";
}

function Reviews({ productId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/comments?product_id=${productId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data: PaginatedComments = await response.json();

      setReviews(data.data.map(mapComment));
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "دریافت نظرات با خطا مواجه شد.";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length
      : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const trimmedText = text.trim();

    if (trimmedText.length < 3) {
      toast.error("متن نظر باید حداقل ۳ کاراکتر باشد.");
      return;
    }

    if (trimmedText.length > 3000) {
      toast.error("متن نظر نباید بیشتر از ۳۰۰۰ کاراکتر باشد.");
      return;
    }

    setSubmitting(true);

    try {
      // دریافت کوکی CSRF از Laravel Sanctum
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

      // خواندن توکن از کوکی
      const csrfToken = getCookie("XSRF-TOKEN");

      if (!csrfToken) {
        throw new Error(
          "کوکی XSRF-TOKEN پیدا نشد. تنظیمات کوکی و Sanctum را بررسی کنید.",
        );
      }

      // ارسال نظر همراه با CSRF Token و کوکی Session
      const response = await fetch(`${API_URL}/comments`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          product_id: productId,
          rating,
          text: trimmedText,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setText("");
      setRating(5);
      setPendingCount((count) => count + 1);

      toast.success(
        "نظر شما ثبت شد و پس از بررسی مدیر نمایش داده می‌شود.",
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "ثبت نظر با خطا مواجه شد.";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="reviews"
      dir="rtl"
      className="scroll-mt-24 rounded-2xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:border-borderColor dark:bg-surfaceColor sm:p-7"
    >
      <div className="mb-7">
        <h2 className="text-xl font-DanaMedium">
          نظرات کاربران
        </h2>

        <div className="mt-3 h-1 w-14 rounded-full bg-primaryColor" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* میانگین امتیاز */}
        <aside className="h-fit rounded-xl border border-lightBorderColor p-5 text-center dark:border-borderColor">
          <p className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
            میانگین امتیاز کاربران
          </p>

          <p className="my-3 text-4xl font-DanaMedium">
            {averageRating.toLocaleString("fa-IR", {
              maximumFractionDigits: 1,
            })}
          </p>

          <div className="flex justify-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <LuStar
                key={star}
                size={19}
                fill={
                  star <= Math.round(averageRating)
                    ? "currentColor"
                    : "none"
                }
              />
            ))}
          </div>

          <p className="mt-3 text-xs text-lightTextColorMuted dark:text-textColorMuted">
            {reviews.length.toLocaleString("fa-IR")} نظر
          </p>
        </aside>

        <div className="min-w-0">
          {/* فرم ثبت نظر */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl bg-lightBackgroundColor p-4 dark:bg-backgroundColor sm:p-5"
          >
            <h3 className="mb-4 font-DanaMedium">
              نظر شما درباره این محصول
            </h3>

            <label className="mb-2 block text-sm">
              امتیاز شما
            </label>

            <div className="mb-5 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`امتیاز ${star}`}
                  aria-pressed={rating === star}
                  disabled={submitting}
                  onClick={() => setRating(star)}
                  className="cursor-pointer rounded p-1 text-amber-500 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-primaryColor disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LuStar
                    size={24}
                    fill={star <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>

            <label htmlFor="review-text" className="sr-only">
              متن نظر
            </label>

            <textarea
              id="review-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="تجربه خود را از خرید این محصول بنویسید..."
              rows={4}
              minLength={3}
              maxLength={3000}
              required
              disabled={submitting}
              className="w-full resize-y rounded-lg border border-lightBorderColor bg-lightSurfaceColor px-4 py-3 text-sm outline-none focus:border-primaryColor disabled:cursor-not-allowed disabled:opacity-60 dark:border-borderColor dark:bg-surfaceColor"
            />

            <p className="mt-2 text-left text-xs text-lightTextColorMuted dark:text-textColorMuted">
              {text.length.toLocaleString("fa-IR")} / ۳۰۰۰
            </p>

            {error && (
              <p
                role="alert"
                className="mt-3 text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 cursor-pointer rounded-lg bg-primaryColor px-6 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "در حال ثبت..." : "ثبت نظر"}
            </button>

            {pendingCount > 0 && (
              <p className="mt-3 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                {pendingCount.toLocaleString("fa-IR")} نظر ثبت‌شده در انتظار بررسی است.
              </p>
            )}
          </form>

          {/* فهرست نظرات تأییدشده */}
          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
                در حال دریافت نظرات...
              </p>
            ) : error && reviews.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
                  دریافت نظرات امکان‌پذیر نبود.
                </p>

                <button
                  type="button"
                  onClick={() => void loadReviews()}
                  className="mt-3 cursor-pointer text-sm text-primaryColor"
                >
                  تلاش دوباره
                </button>
              </div>
            ) : reviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted">
                هنوز نظری برای این محصول ثبت نشده است.
              </p>
            ) : (
              reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl border border-lightBorderColor p-4 dark:border-borderColor sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-DanaMedium">
                        {review.name}
                      </h3>

                      <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                        {review.date}
                      </p>
                    </div>
                  </div>

                  <div className="my-3 flex gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <LuStar
                        key={star}
                        size={16}
                        fill={
                          star <= review.rating
                            ? "currentColor"
                            : "none"
                        }
                      />
                    ))}
                  </div>

                  <p className="text-sm leading-7 text-lightTextColorMuted dark:text-textColorMuted">
                    {review.text}
                  </p>

                  {/* دکمه‌ها فعلاً صرفاً نمایشی هستند */}
                  <div className="mt-4 flex items-center justify-end gap-4 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                    <button
                      type="button"
                      disabled
                      title="قابلیت رأی‌دهی هنوز پیاده‌سازی نشده است"
                      className="flex cursor-not-allowed items-center gap-1 opacity-60"
                    >
                      <LuThumbsUp size={15} />
                      مفید بود
                    </button>

                    <button
                      type="button"
                      disabled
                      title="قابلیت رأی‌دهی هنوز پیاده‌سازی نشده است"
                      className="flex cursor-not-allowed items-center gap-1 opacity-60"
                    >
                      <LuThumbsDown size={15} />
                      مفید نبود
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Reviews;