import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoArrowForwardOutline,
  IoBagHandleOutline,
  IoReloadOutline,
  IoTimeOutline,
} from "react-icons/io5";

type OrderInfo = {
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number | string;
  transaction_id: string | number | null;
  paid_at: string | null;
};

type OrderResponse = {
  order: OrderInfo;
  message?: string;
};

type RequestState = "loading" | "success" | "failed" | "error";

type PaymentType = "wallet" | "order" | "unknown";

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud/api";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();

  const orderNumber = searchParams.get("order");
  const paymentType = searchParams.get("type");
  const paymentStatus = searchParams.get("status");

  const isWalletPayment = paymentType === "wallet";
  const isOrderPayment = paymentType === "order" || Boolean(orderNumber);

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [requestState, setRequestState] =
    useState<RequestState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchOrder() {
      // نتیجه شارژ کیف پول از مسیر جداگانه مدیریت می‌شود.
      if (isWalletPayment) {
        setOrder(null);
        setErrorMessage("");

        if (paymentStatus === "success") {
          setRequestState("success");
        } else if (paymentStatus === "failed") {
          setRequestState("failed");
        } else {
          setRequestState("error");
          setErrorMessage(
            "وضعیت پرداخت کیف پول مشخص نیست. لطفاً وضعیت تراکنش را بررسی کنید."
          );
        }

        return;
      }

      // پرداخت سفارش باید شماره سفارش داشته باشد.
      if (!orderNumber) {
        setRequestState("error");
        setErrorMessage(
          "شماره سفارش در آدرس صفحه وجود ندارد."
        );
        return;
      }

      setRequestState("loading");
      setErrorMessage("");

      try {
        const response = await fetch(
          `${API_URL}/orders/${encodeURIComponent(orderNumber)}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = (await response.json()) as OrderResponse;

        if (!response.ok) {
          throw new Error(
            data.message || "دریافت اطلاعات سفارش ناموفق بود."
          );
        }

        if (!data.order) {
          throw new Error(
            "اطلاعات سفارش در پاسخ سرور موجود نیست."
          );
        }

        if (cancelled) return;

        setOrder(data.order);
        setRequestState(
          data.order.payment_status === "paid"
            ? "success"
            : "failed"
        );
      } catch (error) {
        if (cancelled) return;

        setRequestState("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "در دریافت اطلاعات سفارش خطایی رخ داد."
        );
      }
    }

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [orderNumber, isWalletPayment, paymentStatus]);

  const isSuccess = requestState === "success";
  const isLoading = requestState === "loading";
  const isError = requestState === "error";

  const formatAmount = (amount: number | string) =>
    Number(amount).toLocaleString("fa-IR");

  const pageTitle = isLoading
    ? "در حال بررسی پرداخت"
    : isSuccess
      ? isWalletPayment
        ? "شارژ کیف پول با موفقیت انجام شد"
        : "پرداخت با موفقیت انجام شد"
      : isError
        ? "بررسی وضعیت پرداخت ممکن نشد"
        : isWalletPayment
          ? "شارژ کیف پول ناموفق بود"
          : "پرداخت تأیید نشده است";

  const pageDescription = isLoading
    ? "لطفاً صبر کنید تا وضعیت واقعی سفارش از سرور دریافت شود."
    : isSuccess
      ? isWalletPayment
        ? "درخواست شارژ کیف پول با موفقیت تأیید شده است."
        : "پرداخت شما توسط سرور تأیید شده است. می‌توانید جزئیات سفارش را پیگیری کنید."
      : isError
        ? errorMessage
        : isWalletPayment
          ? "پرداخت شارژ کیف پول تأیید نشده است. اگر مبلغی از حساب شما کسر شده، وضعیت تراکنش را بررسی کنید."
          : "در حال حاضر پرداخت این سفارش در دیتابیس تأیید نشده است. اگر پرداخت را انجام داده‌اید، کمی بعد دوباره وضعیت را بررسی کنید.";

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-lightBackgroundColor px-4 py-10 text-textColor transition-colors duration-300 dark:bg-backgroundColor"
    >
      <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-lightBoxShadow transition-colors duration-300 dark:border-white/10 dark:bg-surfaceColor sm:p-9">
        {/* آیکون وضعیت */}
        <div
          className={`mx-auto mb-6 flex size-24 items-center justify-center rounded-full ${
            isLoading
              ? "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
              : isSuccess
                ? "bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"
                : isError
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                  : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
          }`}
        >
          {isLoading ? (
            <IoReloadOutline className="animate-spin" size={48} />
          ) : isSuccess ? (
            <IoCheckmarkCircleOutline size={64} />
          ) : isError ? (
            <IoTimeOutline size={56} />
          ) : (
            <IoCloseCircleOutline size={64} />
          )}
        </div>

        {/* عنوان و توضیحات */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 font-DanaMedium text-xl leading-9 text-gray-800 dark:text-textColor sm:text-2xl">
            {pageTitle}
          </h1>

          <p className="mx-auto max-w-sm text-sm leading-7 text-gray-600 dark:text-textColorMuted">
            {pageDescription}
          </p>
        </div>

        {/* اطلاعات سفارش */}
        {order && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors duration-300 dark:border-white/10 dark:bg-backgroundColor">
            <span className="mb-2 block text-xs text-gray-500 dark:text-textColorMuted">
              شماره سفارش
            </span>

            <span className="block break-all font-DanaMedium text-sm text-gray-800 dark:text-textColor">
              {order.order_number}
            </span>

            <div className="mt-4 border-t border-gray-200 pt-3 dark:border-white/10">
              <span className="block text-xs leading-6 text-gray-600 dark:text-textColorMuted">
                وضعیت پرداخت
              </span>

              <span
                className={`mt-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-DanaMedium text-sm ${
                  isSuccess
                    ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                }`}
              >
                {isSuccess ? (
                  <IoCheckmarkCircleOutline size={18} />
                ) : (
                  <IoCloseCircleOutline size={18} />
                )}

                {isSuccess
                  ? "پرداخت موفق"
                  : "پرداخت تأیید نشده"}
              </span>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-3 dark:border-white/10">
              <span className="block text-xs leading-6 text-gray-600 dark:text-textColorMuted">
                مبلغ سفارش
              </span>

              <span className="font-DanaMedium text-sm text-gray-800 dark:text-textColor">
                {formatAmount(order.total_amount)} تومان
              </span>
            </div>

            {order.transaction_id && (
              <div className="mt-4 border-t border-gray-200 pt-3 dark:border-white/10">
                <span className="block text-xs leading-6 text-gray-600 dark:text-textColorMuted">
                  شماره پیگیری تراکنش
                </span>

                <span className="block break-all font-DanaMedium text-sm text-gray-800 dark:text-textColor">
                  {order.transaction_id}
                </span>
              </div>
            )}
          </div>
        )}

        {/* اطلاعات شارژ کیف پول */}
        {isWalletPayment && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-backgroundColor">
            <span className="mb-2 block text-xs text-gray-500 dark:text-textColorMuted">
              نوع تراکنش
            </span>

            <span className="font-DanaMedium text-sm text-gray-800 dark:text-textColor">
              شارژ کیف پول کالینو
            </span>

            <div className="mt-4 border-t border-gray-200 pt-3 dark:border-white/10">
              <span className="block text-xs leading-6 text-gray-600 dark:text-textColorMuted">
                وضعیت تراکنش
              </span>

              <span
                className={`mt-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-DanaMedium text-sm ${
                  isSuccess
                    ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                    : isError
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                      : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                }`}
              >
                {isSuccess ? (
                  <IoCheckmarkCircleOutline size={18} />
                ) : isError ? (
                  <IoTimeOutline size={18} />
                ) : (
                  <IoCloseCircleOutline size={18} />
                )}

                {isSuccess
                  ? "شارژ موفق"
                  : isError
                    ? "وضعیت نامشخص"
                    : "شارژ ناموفق"}
              </span>
            </div>
          </div>
        )}

        {/* دکمه‌ها */}
        <div className="flex flex-col gap-3">
          {isError && !isWalletPayment && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primaryColor px-5 py-3 font-DanaMedium text-white transition-opacity hover:opacity-90"
            >
              <IoReloadOutline size={20} />
              تلاش مجدد برای بررسی
            </button>
          )}

          <Link
            to="/panel"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primaryColor px-5 py-3 font-DanaMedium text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaryColor"
          >
            <IoBagHandleOutline size={20} />
            مشاهده حساب کاربری
          </Link>

          <Link
            to="/"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 font-DanaMedium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaryColor dark:border-white/15 dark:bg-surfaceColor dark:text-textColor dark:hover:bg-white/5"
          >
            <IoArrowForwardOutline size={20} />
            بازگشت به فروشگاه
          </Link>
        </div>

        <p className="mt-6 text-center text-xs leading-6 text-gray-500 dark:text-textColorMuted">
          {isSuccess
            ? isWalletPayment
              ? "کیف پول کالینو را برای مشاهده موجودی به‌روز بررسی کنید."
              : "از خرید شما از کالینو سپاسگزاریم."
            : isLoading
              ? "در حال دریافت اطلاعات سفارش از سرور..."
              : "برای اطمینان از وضعیت پرداخت، اطلاعات را از حساب کاربری خود نیز بررسی کنید."}
        </p>
      </section>
    </main>
  );
}
