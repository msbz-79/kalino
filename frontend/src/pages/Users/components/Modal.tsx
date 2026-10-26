import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
    LuUserRoundPlus,
    LuPencil,
    LuX,
    LuChevronDown,
} from "react-icons/lu";

type UserRole = "admin" | "user";

type User = {
    id: number;
    name: string;
    email: string;
    mobile: string;
    role: UserRole;
    createdAt: string;
};

type ApiUser = {
    id: number;
    name: string;
    email: string;
    mobile: string | null;
    role: UserRole;
    created_at: string;
};

type ModalProps = {
    mode: "add" | "edit";
    user: User | null;
    onClose: () => void;
    onCreated: (user: ApiUser) => void;
};

type ApiResponse = {
    message?: string;
    errors?: Record<string, string[]>;
    user?: ApiUser;
};

type FormData = {
    name: string;
    email: string;
    password: string;
    mobile: string;
    role: UserRole;
};

const API_URL = "http://localhost:8000";

async function getCsrfToken(): Promise<string> {
    const response = await fetch(
        `${API_URL}/sanctum/csrf-cookie`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error("دریافت توکن امنیتی ناموفق بود.");
    }

    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith("XSRF-TOKEN="));

    if (!cookie) {
        throw new Error(
            "کوکی CSRF پیدا نشد. تنظیمات Sanctum و کوکی‌ها را بررسی کنید."
        );
    }

    return decodeURIComponent(
        cookie.slice("XSRF-TOKEN=".length)
    );
}

function showErrors(
    errors: Record<string, string[]> | undefined,
    fallbackMessage: string
) {
    const messages = Object.values(errors ?? {}).flat();

    toast.error(
        messages.length > 0
            ? messages.join("\n")
            : fallbackMessage,
        {
            duration: 6000,
            style: {
                whiteSpace: "pre-line",
                direction: "rtl",
                textAlign: "right",
                maxWidth: "450px",
            },
        }
    );
}

function Modal({
    mode,
    user,
    onClose,
    onCreated,
}: ModalProps) {
    const [form, setForm] = useState<FormData>({
        name: "",
        email: "",
        password: "",
        mobile: "",
        role: "user",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (mode === "edit" && user) {
            setForm({
                name: user.name,
                email: user.email,
                password: "",
                mobile: user.mobile ?? "",
                role: user.role,
            });
        } else {
            setForm({
                name: "",
                email: "",
                password: "",
                mobile: "",
                role: "user",
            });
        }
    }, [mode, user]);

    const inputClass =
        "w-full rounded-xl border border-borderColor bg-lightSurfaceColor px-4 py-3 text-sm text-lightTextColor outline-none transition focus:border-primaryColor dark:border-borderColor dark:bg-surfaceColor dark:text-textColor";

    const selectClass =
        "w-full appearance-none rounded-xl border border-borderColor bg-lightSurfaceColor px-4 py-3 text-sm text-lightTextColor outline-none transition focus:border-primaryColor dark:border-borderColor dark:bg-surfaceColor dark:text-textColor cursor-pointer";

    function handleChange(
        field: keyof FormData,
        value: string
    ) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (isSubmitting) return;

        if (mode === "edit" && !user) {
            toast.error("کاربر موردنظر برای ویرایش پیدا نشد.");
            return;
        }

        if (!form.name.trim()) {
            toast.error(
                "وارد کردن نام و نام خانوادگی الزامی است."
            );
            return;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                form.email.trim()
            )
        ) {
            toast.error("فرمت ایمیل واردشده معتبر نیست.");
            return;
        }

        if (mode === "add" && form.password.length < 8) {
            toast.error(
                "رمز عبور باید حداقل ۸ کاراکتر داشته باشد."
            );
            return;
        }

        if (
            mode === "edit" &&
            form.password.length > 0 &&
            form.password.length < 8
        ) {
            toast.error(
                "رمز عبور جدید باید حداقل ۸ کاراکتر داشته باشد."
            );
            return;
        }

        if (!/^09\d{9}$/.test(form.mobile.trim())) {
            toast.error(
                "شماره موبایل باید با 09 شروع شود و ۱۱ رقم داشته باشد."
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const csrfToken = await getCsrfToken();

            const isEdit = mode === "edit";

            const url = isEdit
                ? `${API_URL}/api/users/${user!.id}`
                : `${API_URL}/api/users`;

            const body: Record<string, string> = {
                name: form.name.trim(),
                email: form.email.trim(),
                mobile: form.mobile.trim(),
                role: form.role,
            };

            if (mode === "add" || form.password.length > 0) {
                body.password = form.password;
            }

            const response = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify(body),
            });

            let data: ApiResponse;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "پاسخ معتبری از سرور دریافت نشد."
                );
            }

            if (!response.ok) {
                if (response.status === 422) {
                    showErrors(
                        data.errors,
                        data.message ??
                            "اطلاعات واردشده معتبر نیست."
                    );
                    return;
                }

                if (response.status === 401) {
                    toast.error(
                        "نشست شما معتبر نیست؛ دوباره وارد حساب شوید."
                    );
                    return;
                }

                if (response.status === 403) {
                    toast.error(
                        "شما اجازه انجام این عملیات را ندارید."
                    );
                    return;
                }

                if (response.status === 404) {
                    toast.error(
                        "کاربر موردنظر پیدا نشد."
                    );
                    return;
                }

                if (response.status === 419) {
                    toast.error(
                        "خطای امنیتی CSRF رخ داده است. صفحه را تازه‌سازی کنید."
                    );
                    return;
                }

                if (response.status >= 500) {
                    toast.error(
                        "خطایی در سرور رخ داده است. لطفاً بعداً تلاش کنید."
                    );
                    return;
                }

                toast.error(
                    data.message ??
                        `درخواست ناموفق بود. کد خطا: ${response.status}`
                );
                return;
            }

            if (!data.user) {
                toast.error(
                    "پاسخ سرور شامل اطلاعات کاربر نیست."
                );
                return;
            }

            if (mode === "add") {
                onCreated(data.user);
                toast.success("کاربر با موفقیت ثبت شد.");
            } else {
                toast.success(
                    "اطلاعات کاربر با موفقیت ویرایش شد."
                );
            }

            window.dispatchEvent(
                new Event("users:refresh")
            );

            onClose();
        } catch (error) {
            toast.error(
                error instanceof TypeError
                    ? "اتصال به سرور برقرار نشد. وضعیت اینترنت و سرور لاراول را بررسی کنید."
                    : error instanceof Error
                      ? error.message
                      : "خطای غیرمنتظره‌ای رخ داد.",
                {
                    duration: 6000,
                    style: {
                        direction: "rtl",
                        textAlign: "right",
                    },
                }
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isSubmitting
                ) {
                    onClose();
                }
            }}
        >
            <section className="my-auto w-full max-w-lg rounded-3xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-2xl dark:border-borderColor dark:bg-surfaceColor sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor">
                            {mode === "add" ? (
                                <LuUserRoundPlus size={24} />
                            ) : (
                                <LuPencil size={22} />
                            )}
                        </div>

                        <div>
                            <h2 className="text-lg font-DanaBold text-lightTextColor dark:text-textColor">
                                {mode === "add"
                                    ? "افزودن کاربر جدید"
                                    : "ویرایش اطلاعات کاربر"}
                            </h2>

                            <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                {mode === "add"
                                    ? "اطلاعات کاربر جدید را وارد کنید"
                                    : `ویرایش اطلاعات ${user?.name ?? "کاربر"}`}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-lightTextColorMuted transition hover:bg-lightSurfaceHoverColor hover:text-red-500 dark:text-textColorMuted dark:hover:bg-surfaceHoverColor disabled:opacity-50"
                    >
                        <LuX size={21} />
                    </button>
                </div>

                <form
                    className="space-y-4"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <div>
                        <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                            نام و نام خانوادگی
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(event) =>
                                handleChange("name", event.target.value)
                            }
                            className={inputClass}
                            placeholder="نام و نام خانوادگی"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                            ایمیل
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(event) =>
                                handleChange("email", event.target.value)
                            }
                            className={inputClass}
                            placeholder="example@email.com"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                            رمز عبور {mode === "edit" && "(اختیاری)"}
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(event) =>
                                handleChange("password", event.target.value)
                            }
                            className={inputClass}
                            placeholder={
                                mode === "edit"
                                    ? "برای حفظ رمز فعلی خالی بگذارید"
                                    : "حداقل ۸ کاراکتر"
                            }
                            autoComplete="new-password"
                            required={mode === "add"}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                            شماره موبایل
                        </label>
                        <input
                            type="tel"
                            value={form.mobile}
                            onChange={(event) =>
                                handleChange("mobile", event.target.value)
                            }
                            className={inputClass}
                            placeholder="09123456789"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                            نقش کاربر
                        </label>

                        <div className="relative">
                            <select
                                value={form.role}
                                onChange={(event) =>
                                    handleChange("role", event.target.value)
                                }
                                className={selectClass}
                                disabled={isSubmitting}
                            >
                                <option value="user">کاربر عادی</option>
                                <option value="admin">مدیر</option>
                            </select>

                            <LuChevronDown
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 cursor-pointer rounded-xl border border-lightBorderColor px-4 py-3 text-sm text-lightTextColor transition hover:bg-lightSurfaceHoverColor dark:border-borderColor dark:text-textColor dark:hover:bg-surfaceHoverColor disabled:opacity-50"
                        >
                            انصراف
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 cursor-pointer rounded-xl bg-primaryColor px-4 py-3 text-sm text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "در حال ذخیره..."
                                : mode === "add"
                                  ? "ثبت کاربر"
                                  : "ذخیره تغییرات"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default Modal;