
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { LuArrowRight, LuMapPin, LuLoaderCircle } from "react-icons/lu";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:8000";

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

type AddressForm = {
  recipient_name: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  postal_code: string;
};

const emptyForm: AddressForm = {
  recipient_name: "",
  mobile: "",
  province: "",
  city: "",
  address: "",
  postal_code: "",
};

function getCookie(name: string): string {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix));

  return cookie
    ? decodeURIComponent(cookie.substring(prefix.length))
    : "";
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
      "کوکی CSRF دریافت نشد. درخواست csrf-cookie را در تب Network بررسی کنید.",
    );
  }

  return token;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = await initializeCsrf();
    headers.set("X-XSRF-TOKEN", csrfToken);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    credentials: "include",
    headers,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("برای ادامه خرید ابتدا وارد حساب کاربری شوید.");
    }

    if (response.status === 419) {
      throw new Error(
        "نشست یا توکن CSRF معتبر نیست. کوکی‌های درخواست را بررسی کنید.",
      );
    }

    const errors = result.errors
      ? Object.values(result.errors).flat().join("\n")
      : "";

    throw new Error(
      errors || result.message || "خطایی در ارتباط با سرور رخ داد.",
    );
  }

  return result as T;
}

function CheckoutPage() {
  const { items } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fa-IR").format(price);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAddresses() {
      setLoading(true);

      try {
        const result = await apiRequest<{
          data?: Address[];
          [key: string]: unknown;
        }>("/api/addresses");

        if (cancelled) return;

        const loaded = Array.isArray(result.data)
          ? result.data
          : [];

        setAddresses(loaded);

        const defaultAddress = loaded.find(
          (address) => address.is_default,
        );

        setSelectedAddressId(
          defaultAddress?.id ?? loaded[0]?.id ?? null,
        );

        setShowForm(loaded.length === 0);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "دریافت آدرس‌ها ناموفق بود.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAddresses();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleChange = (
    field: keyof AddressForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSaveAddress = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: "/checkout" },
      });
      return;
    }

    setSaving(true);

    try {
      const result = await apiRequest<{
        message?: string;
        data?: Address;
        id?: number;
      }>("/api/addresses", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          postal_code: form.postal_code || null,
        }),
      });

      // کنترلر ممکن است مدل را مستقیماً یا در data برگرداند.
      const newAddress = result.data ?? (result as Address);

      if (!newAddress.id) {
        throw new Error(
          "پاسخ ثبت آدرس از سرور قابل شناسایی نیست.",
        );
      }

      setAddresses((previous) => [
        ...previous.filter(
          (address) => address.id !== newAddress.id,
        ),
        newAddress,
      ]);

      setSelectedAddressId(newAddress.id);
      setForm(emptyForm);
      setShowForm(false);

      toast.success(result.message || "آدرس با موفقیت ثبت شد.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "ثبت آدرس ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  };

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
          to="/cart"
          className="mb-6 inline-flex items-center gap-2 text-sm text-textColorMuted transition hover:text-primaryColor"
        >
          <LuArrowRight size={18} />
          بازگشت به سبد خرید
        </Link>

        <h1 className="mb-2 text-2xl font-DanaMedium">
          اطلاعات و آدرس تحویل
        </h1>

        <p className="mb-6 text-sm text-textColorMuted">
          اطلاعات تحویل سفارش را بررسی و آدرس موردنظر را انتخاب کنید.
        </p>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {!isAuthenticated ? (
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor">
                <h2 className="font-DanaMedium">
                  برای ادامه خرید وارد حساب کاربری شوید
                </h2>

                <Link
                  to="/login"
                  state={{ from: "/checkout" }}
                  className="mt-4 inline-block rounded-xl bg-primaryColor px-5 py-3 text-white"
                >
                  ورود به حساب کاربری
                </Link>
              </section>
            ) : (
              <>
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-6">
                  <h2 className="mb-4 text-lg font-DanaMedium">
                    مشخصات حساب کاربری
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-sm text-textColorMuted">
                        نام کاربر
                      </p>
                      <p className="font-DanaMedium">
                        {user?.name || "نام ثبت نشده"}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-sm text-textColorMuted">
                        ایمیل
                      </p>
                      <p className="break-all font-DanaMedium" dir="ltr">
                        {user?.email || "ایمیل ثبت نشده"}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-DanaMedium">
                    <LuMapPin size={21} />
                    آدرس تحویل سفارش
                  </h2>

                  {loading ? (
                    <p className="text-sm text-textColorMuted">
                      در حال دریافت آدرس‌ها...
                    </p>
                  ) : (
                    <>
                      {addresses.map((address) => (
                        <label
                          key={address.id}
                          className="mb-3 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                        >
                          <input
                            type="radio"
                            name="delivery-address"
                            checked={selectedAddressId === address.id}
                            onChange={() =>
                              setSelectedAddressId(address.id)
                            }
                            className="mt-1 accent-current"
                          />

                          <span className="text-sm leading-7">
                            <span className="block font-DanaMedium">
                              {address.recipient_name} ـ {address.mobile}
                            </span>

                            <span className="text-textColorMuted">
                              {address.province}، {address.city}،{" "}
                              {address.address}
                            </span>

                            {address.postal_code && (
                              <span className="block text-textColorMuted">
                                کد پستی: {address.postal_code}
                              </span>
                            )}

                            {address.is_default && (
                              <span className="block text-primaryColor">
                                آدرس پیش‌فرض
                              </span>
                            )}
                          </span>
                        </label>
                      ))}

                      {!showForm && (
                        <button
                          type="button"
                          onClick={() => setShowForm(true)}
                          className="mt-2 cursor-pointer text-sm text-primaryColor"
                        >
                          + افزودن آدرس جدید
                        </button>
                      )}

                      {showForm && (
                        <form
                          onSubmit={handleSaveAddress}
                          className="mt-5 space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                        >
                          <h3 className="font-DanaMedium">
                            مشخصات تحویل‌گیرنده و آدرس جدید
                          </h3>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <input
                              required
                              maxLength={255}
                              value={form.recipient_name}
                              onChange={(event) =>
                                handleChange(
                                  "recipient_name",
                                  event.target.value,
                                )
                              }
                              placeholder="نام تحویل‌گیرنده"
                              className="w-full rounded-lg border border-gray-200 bg-transparent p-3 text-sm outline-none focus:border-primaryColor dark:border-gray-700"
                            />

                            <input
                              required
                              type="tel"
                              maxLength={20}
                              value={form.mobile}
                              onChange={(event) =>
                                handleChange("mobile", event.target.value)
                              }
                              placeholder="شماره موبایل تحویل‌گیرنده"
                              className="w-full rounded-lg border border-gray-200 bg-transparent p-3 text-sm outline-none focus:border-primaryColor dark:border-gray-700"
                            />

                            <input
                              required
                              maxLength={100}
                              value={form.province}
                              onChange={(event) =>
                                handleChange("province", event.target.value)
                              }
                              placeholder="استان"
                              className="w-full rounded-lg border border-gray-200 bg-transparent p-3 text-sm outline-none focus:border-primaryColor dark:border-gray-700"
                            />

                            <input
                              required
                              maxLength={100}
                              value={form.city}
                              onChange={(event) =>
                                handleChange("city", event.target.value)
                              }
                              placeholder="شهر"
                              className="w-full rounded-lg border border-gray-200 bg-transparent p-3 text-sm outline-none focus:border-primaryColor dark:border-gray-700"
                            />
                          </div>

                          <textarea
                            required
                            maxLength={2000}
                            rows={3}
                            value={form.address}
                            onChange={(event) =>
                              handleChange("address", event.target.value)
                            }
                            placeholder="نشانی کامل، خیابان، کوچه و پلاک"
                            className="w-full rounded-lg border border-gray-200 bg-transparent p-3 text-sm outline-none focus:border-primaryColor dark:border-gray-700"
                          />

                          <input
                            maxLength={20}
                            value={form.postal_code}
                            onChange={(event) =>
                              handleChange("postal_code", event.target.value)
                            }
                            placeholder="کد پستی (اختیاری)"
                            className="w-full rounded-lg border border-gray-200 bg-transparent p-3 text-sm outline-none focus:border-primaryColor dark:border-gray-700"
                          />

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="submit"
                              disabled={saving}
                              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primaryColor px-5 py-3 text-sm text-white disabled:opacity-60"
                            >
                              {saving && (
                                <LuLoaderCircle
                                  size={17}
                                  className="animate-spin"
                                />
                              )}
                              ذخیره آدرس
                            </button>

                            {addresses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="cursor-pointer rounded-xl border border-gray-200 px-5 py-3 text-sm dark:border-gray-700"
                              >
                                انصراف
                              </button>
                            )}
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </section>
              </>
            )}
          </div>

          <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-6">
            <h2 className="mb-5 text-lg font-DanaMedium">
              خلاصه سفارش
            </h2>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-textColorMuted">تعداد اقلام</span>
              <span>
                {formatPrice(
                  items.reduce((sum, item) => sum + item.quantity, 0),
                )}
              </span>
            </div>

            <div className="my-4 h-px bg-gray-100 dark:bg-gray-800" />

            <div className="flex items-center justify-between gap-3">
              <span className="font-DanaMedium">جمع محصولات</span>
              <span className="font-DanaMedium">
                {formatPrice(total)} تومان
              </span>
            </div>

            <p className="mt-4 text-xs leading-6 text-textColorMuted">
              در مرحله بعد سفارش را بررسی می‌کنیم و سپس به پرداخت می‌رویم.
            </p>

            <button
              type="button"
              disabled={
                !isAuthenticated ||
                loading ||
                saving ||
                showForm ||
                !selectedAddressId
              }
              onClick={() =>
                navigate(`/review-order?addressId=${selectedAddressId}`)
              }
              className="mt-6 w-full cursor-pointer rounded-xl bg-primaryColor px-5 py-3 font-DanaMedium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ادامه و بررسی سفارش
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;
