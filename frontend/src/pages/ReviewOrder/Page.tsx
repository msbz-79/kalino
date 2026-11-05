
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  LuArrowRight,
  LuMapPin,
  LuMinus,
  LuPlus,
  LuShoppingBag,
} from "react-icons/lu";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud";

type Address = {
  id: number;
  recipient_name: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postal_code: string | null;
  is_default: boolean;
};

type OrderResponse = {
  message?: string;
  order?: {
    id: number;
    order_number: string;
    payment_status: string;
  };
};

type PaymentResponse = {
  message?: string;
  payment_url?: string;
};

function getCookie(name: string): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

async function initializeCsrf(): Promise<string> {
  const response = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("دریافت توکن امنیتی ناموفق بود.");
  }

  const token = getCookie("XSRF-TOKEN");

  if (!token) {
    throw new Error(
      "توکن امنیتی دریافت نشد. تنظیمات Sanctum و کوکی‌ها را بررسی کنید.",
    );
  }

  return token;
}

async function apiPost<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const csrfToken = await initializeCsrf();

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": csrfToken,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors = result.errors
      ? Object.values(result.errors).flat().join(" ")
      : "";

    throw new Error(
      validationErrors ||
        result.message ||
        "ارتباط با سرور ناموفق بود.",
    );
  }

  return result as T;
}

function ReviewOrderPage() {
  const { items, updateQuantity, removeFromCart } = useCart();
  const [searchParams] = useSearchParams();

  const addressId = Number(searchParams.get("addressId"));

  const [address, setAddress] = useState<Address | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fa-IR").format(price);

  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAddress() {
      if (!Number.isInteger(addressId) || addressId <= 0) {
        setLoadingAddress(false);
        toast.error("آدرس انتخاب‌شده معتبر نیست.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/addresses`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.message || "دریافت آدرس ناموفق بود.",
          );
        }

        const addresses: Address[] = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];

        const selectedAddress = addresses.find(
          (item) => item.id === addressId,
        );

        if (!selectedAddress) {
          throw new Error(
            "آدرس انتخاب‌شده پیدا نشد. لطفاً دوباره آدرس را انتخاب کنید.",
          );
        }

        if (!cancelled) {
          setAddress(selectedAddress);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "دریافت اطلاعات آدرس ناموفق بود.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAddress(false);
        }
      }
    }

    void loadAddress();

    return () => {
      cancelled = true;
    };
  }, [addressId]);

  async function handleSubmitOrder() {
    if (submittingOrder) return;

    if (!address || !Number.isInteger(addressId) || addressId <= 0) {
      toast.error("لطفاً یک آدرس معتبر انتخاب کنید.");
      return;
    }

    if (items.length === 0) {
      toast.error("سبد خرید شما خالی است.");
      return;
    }

    if (
      items.some(
        (item) =>
          !Number.isInteger(item.id) ||
          item.id <= 0 ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1,
      )
    ) {
      toast.error("اطلاعات محصولات سبد خرید معتبر نیست.");
      return;
    }

    setSubmittingOrder(true);

    try {
      // مرحله اول: ثبت سفارش در بک‌اند
      const orderResult = await apiPost<OrderResponse>(
        "/api/orders",
        {
          address_id: addressId,
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            selected_color: item.selectedColor?.name ?? null,
          })),
        },
      );

      const order = orderResult.order;

      if (!order?.id) {
        throw new Error(
          "سفارش ثبت شد، اما شناسه سفارش در پاسخ سرور وجود ندارد.",
        );
      }

      // مرحله دوم: ایجاد درخواست پرداخت برای سفارش ثبت‌شده
      const paymentResult = await apiPost<PaymentResponse>(
        `/api/orders/${order.id}/payment`,
        {},
      );

      if (!paymentResult.payment_url) {
        throw new Error(
          "آدرس درگاه پرداخت در پاسخ سرور وجود ندارد.",
        );
      }

      toast.success("سفارش ثبت شد؛ در حال انتقال به درگاه پرداخت...");

      // مرحله سوم: انتقال به درگاه زرین‌پال
      window.location.assign(paymentResult.payment_url);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "ثبت سفارش یا شروع پرداخت ناموفق بود.",
      );
    } finally {
      setSubmittingOrder(false);
    }
  }

  if (items.length === 0) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gray-50/70 px-4 py-12 dark:bg-[#111315]"
      >
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center dark:bg-surfaceColor">
          <h1 className="text-xl font-DanaMedium">
            سبد خرید شما خالی است
          </h1>

          <Link
            to="/cart"
            className="mt-5 inline-block text-primaryColor"
          >
            بازگشت به سبد خرید
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50/70 pb-12 pt-6 text-lightTextColor dark:bg-[#111315] dark:text-textColor sm:pt-8"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/checkout"
          className="mb-6 inline-flex items-center gap-2 text-sm text-textColorMuted transition hover:text-primaryColor"
        >
          <LuArrowRight size={18} />
          بازگشت به اطلاعات و آدرس
        </Link>

        <h1 className="mb-2 text-2xl font-DanaMedium">
          بررسی نهایی سفارش
        </h1>

        <p className="mb-6 text-sm text-textColorMuted">
          پیش از ثبت سفارش، آدرس و اقلام خرید را بررسی کنید.
        </p>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-DanaMedium">
                <LuMapPin size={21} />
                آدرس تحویل
              </h2>

              {loadingAddress ? (
                <p className="text-sm text-textColorMuted">
                  در حال دریافت آدرس...
                </p>
              ) : address ? (
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <p className="font-DanaMedium">
                    {address.recipient_name} ـ {address.mobile}
                  </p>

                  <p className="mt-2 text-sm leading-7 text-textColorMuted">
                    {address.province}، {address.city}،{" "}
                    {address.address}
                  </p>

                  {address.postal_code && (
                    <p className="mt-1 text-sm text-textColorMuted">
                      کد پستی: {address.postal_code}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-red-500">
                    آدرس قابل دریافت نیست.
                  </p>

                  <Link
                    to="/checkout"
                    className="mt-3 inline-block text-sm text-primaryColor"
                  >
                    بازگشت و انتخاب آدرس
                  </Link>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-DanaMedium">
                <LuShoppingBag size={21} />
                محصولات سفارش
              </h2>

              <div className="space-y-5">
                {items.map((item) => {
                  const colorHex = item.selectedColor?.hex ?? null;

                  return (
                    <div
                      key={`${item.id}-${colorHex ?? "default"}`}
                      className="flex flex-col gap-4 border-b border-gray-100 pb-5 last:border-b-0 last:pb-0 dark:border-gray-800 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 dark:bg-[#202326]">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <LuShoppingBag
                              size={28}
                              className="text-textColorMuted"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-DanaMedium">
                            {item.name}
                          </h3>

                          {item.selectedColor && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-textColorMuted">
                              <span
                                className="inline-block h-4 w-4 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor: item.selectedColor.hex,
                                }}
                              />
                              رنگ: {item.selectedColor.name}
                            </div>
                          )}

                          <p className="mt-2 text-sm text-textColorMuted">
                            قیمت واحد: {formatPrice(item.price)} تومان
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                          <button
                            type="button"
                            aria-label="افزایش تعداد"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                colorHex,
                                item.quantity + 1,
                              )
                            }
                            className="cursor-pointer text-textColorMuted hover:text-primaryColor"
                          >
                            <LuPlus size={16} />
                          </button>

                          <span className="min-w-5 text-center text-sm">
                            {formatPrice(item.quantity)}
                          </span>

                          <button
                            type="button"
                            aria-label="کاهش تعداد"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeFromCart(item.id, colorHex);
                              } else {
                                updateQuantity(
                                  item.id,
                                  colorHex,
                                  item.quantity - 1,
                                );
                              }
                            }}
                            className="cursor-pointer text-textColorMuted hover:text-primaryColor"
                          >
                            <LuMinus size={16} />
                          </button>
                        </div>

                        <div className="text-left">
                          <p className="font-DanaMedium">
                            {formatPrice(item.price * item.quantity)} تومان
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(item.id, colorHex)
                            }
                            className="mt-2 cursor-pointer text-xs text-red-500"
                          >
                            حذف محصول
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-6">
            <h2 className="mb-5 text-lg font-DanaMedium">
              خلاصه نهایی سفارش
            </h2>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-textColorMuted">تعداد اقلام</span>
              <span>{formatPrice(totalQuantity)}</span>
            </div>

            <div className="my-4 h-px bg-gray-100 dark:bg-gray-800" />

            <div className="flex items-center justify-between gap-3">
              <span className="font-DanaMedium">جمع محصولات</span>
              <span className="font-DanaMedium">
                {formatPrice(totalPrice)} تومان
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="text-textColorMuted">هزینه ارسال</span>
              <span>در مرحله ثبت سفارش مشخص می‌شود</span>
            </div>

            <div className="my-4 h-px bg-gray-100 dark:bg-gray-800" />

            <div className="flex items-center justify-between gap-3">
              <span className="font-DanaMedium">
                مبلغ فعلی محصولات
              </span>
              <span className="font-DanaMedium text-primaryColor">
                {formatPrice(totalPrice)} تومان
              </span>
            </div>

            <p className="mt-4 text-xs leading-6 text-textColorMuted">
              مبلغ نهایی و هزینه ارسال باید هنگام ثبت سفارش در
              سرور دوباره محاسبه و تأیید شوند.
            </p>

            <button
              type="button"
              disabled={
                loadingAddress ||
                !address ||
                submittingOrder ||
                items.length === 0
              }
              onClick={handleSubmitOrder}
              className="mt-6 w-full cursor-pointer rounded-xl bg-primaryColor px-5 py-3 font-DanaMedium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingOrder
                ? "در حال ثبت سفارش و اتصال به درگاه..."
                : "تأیید و ثبت سفارش"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default ReviewOrderPage;
