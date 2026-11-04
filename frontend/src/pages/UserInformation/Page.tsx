import { useEffect, useState, type FormEvent } from "react";
import {
  IoPersonOutline,
  IoMailOutline,
  IoPhonePortraitOutline,
  IoShieldCheckmarkOutline,
  IoSaveOutline,
  IoRefreshOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoLockClosedOutline,
} from "react-icons/io5";
import toast from "react-hot-toast";

type AccountUser = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  email_verified_at: string | null;
};

type AccountResponse = {
  user?: AccountUser;
  message?: string;
  errors?: Record<string, string[]>;
};

type AccountForm = {
  name: string;
  email: string;
  mobile: string;
};

type PasswordForm = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

const API_URL = "http://localhost:8000/api";
const CSRF_URL = "http://localhost:8000/sanctum/csrf-cookie";

const inputClass =
  "mt-2 w-full rounded-xl border border-lightBorderColor bg-lightSurfaceColor px-4 py-3 text-sm text-lightTextColor dark:text-textColor outline-none transition-colors placeholder:text-gray-500 dark:placeholder:text-textColorMuted focus:border-primaryColor dark:border-white/10 dark:bg-backgroundColor";

function getCookie(name: string): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie
    ? decodeURIComponent(cookie.substring(name.length + 1))
    : null;
}

async function getCsrfCookie(): Promise<void> {
  const response = await fetch(CSRF_URL, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("دریافت CSRF Token ناموفق بود.");
  }
}

async function accountRequest<T>(
  path: string,
  method: "GET" | "PATCH",
  body?: object
): Promise<T> {
  if (method !== "GET") {
    await getCsrfCookie();
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body) {
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

  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = (await response.json()) as T & AccountResponse;

  if (!response.ok) {
    const validationMessage = data.errors
      ? Object.values(data.errors).flat()[0]
      : undefined;

    throw new Error(
      validationMessage ||
        data.message ||
        "درخواست با خطا مواجه شد."
    );
  }

  return data;
}

export default function AccountInformation() {
  const [user, setUser] = useState<AccountUser | null>(null);

  const [form, setForm] = useState<AccountForm>({
    name: "",
    email: "",
    mobile: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const loadAccount = async () => {
    setLoading(true);

    try {
      const data = await accountRequest<AccountResponse>(
        "/account",
        "GET"
      );

      if (!data.user) {
        throw new Error("اطلاعات کاربر دریافت نشد.");
      }

      setUser(data.user);
      setForm({
        name: data.user.name ?? "",
        email: data.user.email ?? "",
        mobile: data.user.mobile ?? "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "دریافت اطلاعات حساب ناموفق بود."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccount();
  }, []);

  const handleAccountSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      toast.error("نام و ایمیل الزامی هستند.");
      return;
    }

    setSaving(true);

    try {
      const data = await accountRequest<AccountResponse>(
        "/account",
        "PATCH",
        {
          name: form.name.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim() || null,
        }
      );

      if (!data.user) {
        throw new Error("اطلاعات به‌روزشده دریافت نشد.");
      }

      setUser(data.user);
      setForm({
        name: data.user.name ?? "",
        email: data.user.email ?? "",
        mobile: data.user.mobile ?? "",
      });

      toast.success("اطلاعات حساب ذخیره شد.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "ذخیره اطلاعات ناموفق بود."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !passwordForm.current_password ||
      !passwordForm.password ||
      !passwordForm.password_confirmation
    ) {
      toast.error("تمام فیلدهای رمز عبور را تکمیل کنید.");
      return;
    }

    if (passwordForm.password.length < 8) {
      toast.error("رمز عبور جدید باید حداقل ۸ کاراکتر باشد.");
      return;
    }

    if (
      passwordForm.password !==
      passwordForm.password_confirmation
    ) {
      toast.error("تکرار رمز عبور جدید مطابقت ندارد.");
      return;
    }

    setChangingPassword(true);

    try {
      const data = await accountRequest<{ message?: string }>(
        "/account/password",
        "PATCH",
        passwordForm
      );

      toast.success(data.message || "رمز عبور با موفقیت تغییر کرد.");

      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "تغییر رمز عبور ناموفق بود."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <section
        dir="rtl"
        className="w-full min-w-0 rounded-2xl border border-lightBorderColor bg-lightSurfaceColor p-6 shadow-lightBoxShadow dark:border-white/10 dark:bg-surfaceColor"
      >
        <div className="flex items-center justify-center gap-3 py-16 text-gray-500 dark:text-textColorMuted">
          <IoRefreshOutline className="animate-spin" size={24} />
          <span className="text-sm">
            در حال دریافت اطلاعات حساب کاربری...
          </span>
        </div>
      </section>
    );
  }

  const passwordInput = (
    id: string,
    label: string,
    value: string,
    field: keyof PasswordForm,
    autoComplete: string
  ) => (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm text-lightTextColor dark:text-textColor"
      >
        <IoLockClosedOutline size={18} />
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={showPasswords ? "text" : "password"}
          autoComplete={autoComplete}
          dir="ltr"
          value={value}
          onChange={(event) =>
            setPasswordForm((previous) => ({
              ...previous,
              [field]: event.target.value,
            }))
          }
          minLength={field === "current_password" ? undefined : 8}
          required
          className={`${inputClass} pl-12`}
          placeholder={label}
        />

        <button
          type="button"
          aria-label={
            showPasswords ? "مخفی کردن رمزها" : "نمایش رمزها"
          }
          onClick={() => setShowPasswords((previous) => !previous)}
          className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-2 text-gray-500 dark:text-textColorMuted transition-colors hover:text-primaryColor"
        >
          {showPasswords ? (
            <IoEyeOffOutline size={19} />
          ) : (
            <IoEyeOutline size={19} />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <section dir="rtl" className="w-full min-w-0 space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:border-white/10 dark:bg-surfaceColor sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor">
            <IoPersonOutline size={25} />
          </div>

          <div>
            <h1 className="font-DanaMedium text-lg text-lightTextColor dark:text-textColor sm:text-xl">
              اطلاعات حساب کاربری
            </h1>
            <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-textColorMuted">
              اطلاعات شخصی و امنیت حساب خود را مدیریت کنید.
            </p>
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-lightBorderColor bg-lightSurfaceColor p-5 dark:border-white/10 dark:bg-surfaceColor sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
            <IoShieldCheckmarkOutline size={22} />
          </div>

          <div>
            <h2 className="font-DanaMedium text-sm text-lightTextColor dark:text-textColor">
              تأیید ایمیل
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-textColorMuted">
              {user?.email_verified_at
                ? "آدرس ایمیل شما تأیید شده است."
                : "آدرس ایمیل شما هنوز تأیید نشده است."}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex w-fit items-center rounded-lg px-3 py-2 text-xs font-DanaMedium ${
            user?.email_verified_at
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          {user?.email_verified_at ? "تأیید شده" : "تأیید نشده"}
        </span>
      </div>

      <form
        onSubmit={handleAccountSubmit}
        className="rounded-2xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:border-white/10 dark:bg-surfaceColor sm:p-6"
      >
        <div className="mb-6 border-b border-lightBorderColor pb-4 dark:border-white/10">
          <h2 className="font-DanaMedium text-base text-lightTextColor dark:text-textColor">
            اطلاعات شخصی
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-textColorMuted">
            اطلاعات موردنیاز را ویرایش و ذخیره کنید.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <label
              htmlFor="account-name"
              className="flex items-center gap-2 text-sm text-lightTextColor dark:text-textColor"
            >
              <IoPersonOutline size={18} />
              نام
            </label>
            <input
              id="account-name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              maxLength={255}
              required
              className={inputClass}
              placeholder="نام خود را وارد کنید"
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="account-email"
              className="flex items-center gap-2 text-sm text-lightTextColor dark:text-textColor"
            >
              <IoMailOutline size={18} />
              آدرس ایمیل
            </label>
            <input
              id="account-email"
              type="email"
              autoComplete="email"
              dir="ltr"
              value={form.email}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
              maxLength={255}
              required
              className={inputClass}
              placeholder="example@email.com"
            />
            <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-textColorMuted">
              پس از تغییر ایمیل، باید آدرس جدید را تأیید کنید.
            </p>
          </div>

          <div className="min-w-0 sm:col-span-2">
            <label
              htmlFor="account-mobile"
              className="flex items-center gap-2 text-sm text-lightTextColor dark:text-textColor"
            >
              <IoPhonePortraitOutline size={18} />
              شماره موبایل
            </label>
            <input
              id="account-mobile"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              value={form.mobile}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  mobile: event.target.value,
                }))
              }
              maxLength={20}
              className={inputClass}
              placeholder="09xxxxxxxxx"
            />
          </div>
        </div>

        <div className="mt-7 flex justify-end border-t border-lightBorderColor pt-5 dark:border-white/10">
          <button
            type="submit"
            disabled={saving || changingPassword}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primaryColor px-6 py-3 font-DanaMedium text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <IoRefreshOutline className="animate-spin" size={19} />
            ) : (
              <IoSaveOutline size={19} />
            )}
            {saving ? "در حال ذخیره..." : "ذخیره اطلاعات"}
          </button>
        </div>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-2xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:border-white/10 dark:bg-surfaceColor sm:p-6"
      >
        <div className="mb-6 flex items-center gap-3 border-b border-lightBorderColor pb-4 dark:border-white/10">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
            <IoShieldCheckmarkOutline size={23} />
          </div>
          <div>
            <h2 className="font-DanaMedium text-base text-lightTextColor dark:text-textColor">
              تغییر رمز عبور
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-textColorMuted">
              برای امنیت حساب، رمز فعلی خود را وارد کنید.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {passwordInput(
            "current-password",
            "رمز عبور فعلی",
            passwordForm.current_password,
            "current_password",
            "current-password"
          )}

          {passwordInput(
            "new-password",
            "رمز عبور جدید",
            passwordForm.password,
            "password",
            "new-password"
          )}

          <div className="sm:col-span-2">
            {passwordInput(
              "confirm-password",
              "تکرار رمز عبور جدید",
              passwordForm.password_confirmation,
              "password_confirmation",
              "new-password"
            )}
          </div>
        </div>

        <p className="mt-4 text-xs leading-6 text-gray-500 dark:text-textColorMuted">
          رمز عبور جدید باید حداقل ۸ کاراکتر داشته باشد.
        </p>

        <div className="mt-6 flex justify-end border-t border-lightBorderColor pt-5 dark:border-white/10">
          <button
            type="submit"
            disabled={changingPassword || saving}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primaryColor px-6 py-3 font-DanaMedium text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changingPassword ? (
              <IoRefreshOutline className="animate-spin" size={19} />
            ) : (
              <IoLockClosedOutline size={19} />
            )}
            {changingPassword
              ? "در حال تغییر رمز..."
              : "تغییر رمز عبور"}
          </button>
        </div>
      </form>
    </section>
  );
}
