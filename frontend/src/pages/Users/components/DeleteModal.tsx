
import { useState } from "react";
import { LuTriangle, LuLoaderCircle } from "react-icons/lu";
import toast from "react-hot-toast";

type User = {
    id: number;
    name: string;
};

type DeleteModalProps = {
    deleteUser: User;
    onClose: () => void;
};

type ApiResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

const API_URL = "http://localhost:8000";

function getCsrfToken(): string | null {
    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith("XSRF-TOKEN="));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(cookie.substring("XSRF-TOKEN=".length));
}

function DeleteModal({
    deleteUser,
    onClose,
}: DeleteModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (isDeleting) {
            return;
        }

        setIsDeleting(true);

        try {
            // دریافت کوکی CSRF از لاراول
            const csrfResponse = await fetch(
                `${API_URL}/sanctum/csrf-cookie`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (!csrfResponse.ok) {
                toast.error("دریافت توکن امنیتی ناموفق بود.");
                return;
            }

            const csrfToken = getCsrfToken();

            if (!csrfToken) {
                toast.error(
                    "توکن امنیتی پیدا نشد. اتصال و تنظیمات کوکی را بررسی کنید."
                );
                return;
            }

            // ارسال درخواست حذف به API لاراول
            const response = await fetch(
                `${API_URL}/api/users/${deleteUser.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "X-XSRF-TOKEN": csrfToken,
                    },
                }
            );

            const data = (await response.json().catch(() => ({}))) as ApiResponse;

            if (response.status === 401) {
                toast.error("نشست شما منقضی شده است؛ دوباره وارد شوید.");
                return;
            }

            if (response.status === 403) {
                toast.error("شما اجازه حذف این کاربر را ندارید.");
                return;
            }

            if (response.status === 404) {
                toast.error("این کاربر پیدا نشد یا قبلاً حذف شده است.");
                return;
            }

            if (response.status === 419) {
                toast.error(
                    "نشست امنیتی معتبر نیست. صفحه را تازه‌سازی و دوباره تلاش کنید."
                );
                return;
            }

            if (!response.ok) {
                toast.error(
                    data.message || "حذف کاربر با خطا مواجه شد."
                );
                return;
            }

            // به‌روزرسانی خودکار جدول کاربران
            window.dispatchEvent(new Event("users:refresh"));

            toast.success(data.message || "کاربر با موفقیت حذف شد.");

            onClose();
        } catch (error) {
            console.error("Delete user error:", error);

            toast.error(
                "ارتباط با سرور برقرار نشد. اتصال بک‌اند را بررسی کنید."
            );
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
                if (
                    !isDeleting &&
                    event.target === event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-user-title"
                aria-describedby="delete-user-description"
                className="w-full max-w-md rounded-3xl border border-lightBorderColor bg-lightSurfaceColor p-6 text-center shadow-2xl dark:border-borderColor dark:bg-surfaceColor sm:p-7"
            >
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                    <LuTriangle size={32} />
                </div>

                <h2
                    id="delete-user-title"
                    className="font-DanaBold text-lg text-lightTextColor dark:text-textColor"
                >
                    تأیید حذف کاربر
                </h2>

                <p
                    id="delete-user-description"
                    className="mt-4 text-sm leading-7 text-lightTextColorMuted dark:text-textColorMuted"
                >
                    آیا از حذف کاربر{" "}
                    <span className="font-DanaBold text-lightTextColor dark:text-textColor">
                        «{deleteUser.name}»
                    </span>{" "}
                    اطمینان دارید؟
                </p>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="cursor-pointer rounded-xl border border-lightBorderColor px-4 py-3 text-sm text-lightTextColor transition hover:bg-lightSurfaceHoverColor disabled:cursor-not-allowed disabled:opacity-50 dark:border-borderColor dark:text-textColor dark:hover:bg-surfaceHoverColor sm:flex-1"
                    >
                        انصراف
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                    >
                        {isDeleting ? (
                            <>
                                <LuLoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                                در حال حذف...
                            </>
                        ) : (
                            "بله، حذف شود"
                        )}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default DeleteModal;
