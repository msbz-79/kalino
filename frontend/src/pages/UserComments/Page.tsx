import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import {
    LuCalendarDays,
    LuCheck,
    LuEye,
    LuLoaderCircle,
    LuMessageSquare,
    LuPackage,
    LuSearch,
    LuUserRound,
    LuX,
    LuThumbsDown,
    LuThumbsUp,
    LuTrash2,
} from "react-icons/lu";

type CommentStatus = "pending" | "approved" | "rejected";

type Comment = {
    id: number;
    user_id: number;
    product_id: number;
    rating: number;
    text: string;
    status: CommentStatus;
    created_at: string;
    user: {
        id: number;
        name: string;
    } | null;
    product: {
        id: number;
        name: string;
    } | null;
};

type PaginationData = {
    data: Comment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type ApiErrorResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

type PendingAction = {
    commentId: number;
    status: "approved" | "rejected";
};

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud/api";
const CSRF_URL = "https://kalino-web-owq-kalino.runflare.cloud/sanctum/csrf-cookie";

const statusLabels: Record<CommentStatus, string> = {
    pending: "در انتظار بررسی",
    approved: "تأیید شده",
    rejected: "رد شده",
};

const statusStyles: Record<CommentStatus, string> = {
    pending:
        "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    approved:
        "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300",
    rejected:
        "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300",
};

const inputClass =
    "h-11 w-full rounded-xl border border-lightBorderColor bg-lightBackgroundColor px-3 text-sm text-lightTextColor outline-none transition focus:border-primaryColor dark:border-borderColor dark:bg-backgroundColor dark:text-textColor";

function formatPersianDate(dateString: string): string {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "نامشخص";
    }

    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat("fa-IR").format(value);
}

function getCookie(name: string): string | null {
    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith(`${name}=`));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(
        cookie.substring(name.length + 1)
    );
}

async function getCsrfCookie(): Promise<void> {
    const response = await fetch(CSRF_URL, {
        method: "GET",
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("دریافت CSRF Token ناموفق بود.");
    }
}

function getRequestHeaders(
    includeContentType = false
): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (includeContentType) {
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

    return headers;
}

async function parseApiError(
    response: Response
): Promise<string> {
    let data: ApiErrorResponse = {};

    try {
        data = await response.json();
    } catch {
        // پاسخ خالی یا غیر JSON
    }

    const validationMessage = data.errors
        ? Object.values(data.errors).flat()[0]
        : undefined;

    if (response.status === 401) {
        return "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.";
    }

    if (response.status === 403) {
        return "شما اجازه انجام این عملیات را ندارید.";
    }

    return (
        validationMessage ||
        data.message ||
        "درخواست با خطا مواجه شد."
    );
}

function UserComments() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [statusFilter, setStatusFilter] = useState("all");

    const [selectedComment, setSelectedComment] =
        useState<Comment | null>(null);

    const [isDetailModalOpen, setIsDetailModalOpen] =
        useState(false);

    const [pendingAction, setPendingAction] =
        useState<PendingAction | null>(null);

    // شناسه نظری که مدیر قصد حذف آن را دارد
    const [pendingDeleteId, setPendingDeleteId] =
        useState<number | null>(null);

    const [isUpdating, setIsUpdating] = useState(false);

    // تأخیر در جست‌وجو
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setSearchTerm(searchInput.trim());
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [searchInput]);

    // دریافت نظرات
    const fetchComments = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();

            if (searchTerm) {
                params.set("search", searchTerm);
            }

            if (statusFilter !== "all") {
                params.set("status", statusFilter);
            }

            params.set("per_page", "50");

            const response = await fetch(
                `${API_URL}/admin/comments?${params.toString()}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: getRequestHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(await parseApiError(response));
            }

            const data: PaginationData = await response.json();

            setComments(data.data);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "دریافت نظرات ناموفق بود.";

            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        void fetchComments();
    }, [fetchComments]);

    // باز کردن جزئیات نظر
    const handleOpenDetails = (comment: Comment) => {
        setSelectedComment(comment);
        setIsDetailModalOpen(true);
    };

    // بستن مدال جزئیات
    const closeDetailsModal = () => {
        if (isUpdating) {
            return;
        }

        setIsDetailModalOpen(false);
        setSelectedComment(null);
    };

    // باز کردن مدال تأیید تغییر وضعیت
    const handleAskForStatusChange = (
        commentId: number,
        status: "approved" | "rejected"
    ) => {
        setPendingAction({
            commentId,
            status,
        });
    };

    // تغییر وضعیت نظر
    const handleUpdateStatus = async () => {
        if (!pendingAction || isUpdating) {
            return;
        }

        setIsUpdating(true);

        try {
            await getCsrfCookie();

            const response = await fetch(
                `${API_URL}/admin/comments/${pendingAction.commentId}/status`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: getRequestHeaders(true),
                    body: JSON.stringify({
                        status: pendingAction.status,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(await parseApiError(response));
            }

            const data = await response.json();

            toast.success(
                data.message || "وضعیت نظر تغییر کرد."
            );

            const commentId = pendingAction.commentId;

            setPendingAction(null);

            setSelectedComment((current) => {
                if (!current || current.id !== commentId) {
                    return current;
                }

                return {
                    ...current,
                    status: data.comment?.status ?? pendingAction.status,
                };
            });

            await fetchComments();
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "تغییر وضعیت نظر ناموفق بود.";

            toast.error(message);
        } finally {
            setIsUpdating(false);
        }
    };

    // باز کردن مدال تأیید حذف
    const handleAskForDelete = (commentId: number) => {
        if (isUpdating) {
            return;
        }

        setPendingDeleteId(commentId);
    };

    // حذف نظر پس از تأیید کاربر در مدال
    const handleDeleteComment = async () => {
        if (pendingDeleteId === null || isUpdating) {
            return;
        }

        setIsUpdating(true);

        try {
            await getCsrfCookie();

            const response = await fetch(
                `${API_URL}/admin/comments/${pendingDeleteId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: getRequestHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(await parseApiError(response));
            }

            const data = await response.json();

            toast.success(
                data.message || "نظر با موفقیت حذف شد."
            );

            setPendingDeleteId(null);
            setIsDetailModalOpen(false);
            setSelectedComment(null);

            await fetchComments();
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "حذف نظر ناموفق بود.";

            toast.error(message);
        } finally {
            setIsUpdating(false);
        }
    };

    const closeActionModal = () => {
        if (isUpdating) {
            return;
        }

        setPendingAction(null);
    };

    const closeDeleteModal = () => {
        if (isUpdating) {
            return;
        }

        setPendingDeleteId(null);
    };

    // قفل کردن اسکرول صفحه هنگام نمایش مدال‌ها
    useEffect(() => {
        const modalIsOpen =
            isDetailModalOpen ||
            pendingAction !== null ||
            pendingDeleteId !== null;

        if (!modalIsOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isUpdating) {
                setIsDetailModalOpen(false);
                setSelectedComment(null);
                setPendingAction(null);
                setPendingDeleteId(null);
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleEscape);
        };
    }, [
        isDetailModalOpen,
        pendingAction,
        pendingDeleteId,
        isUpdating,
    ]);

    const actionLabel =
        pendingAction?.status === "approved"
            ? "تأیید شده"
            : "رد شده";

    return (
        <div
            dir="rtl"
            className="w-full min-w-0 space-y-5 p-1"
        >
            {/* عنوان صفحه */}
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkBoxShadow sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor">
                        <LuMessageSquare size={25} />
                    </div>

                    <div>
                        <h1 className="font-DanaBold text-xl text-lightTextColor dark:text-textColor">
                            نظرات کاربران
                        </h1>

                        <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            بررسی، تأیید و مدیریت نظرات ثبت‌شده توسط کاربران
                        </p>
                    </div>
                </div>
            </div>

            {/* محتوای اصلی */}
            <div className="min-w-0 overflow-hidden rounded-3xl border border-lightBorderColor bg-lightSurfaceColor shadow-lightCardShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkCardShadow">

                {/* جست‌وجو و فیلتر */}
                <div className="flex flex-col gap-4 border-b border-lightBorderColor p-5 dark:border-borderColor">
                    <div className="relative w-full">
                        <LuSearch
                            size={19}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
                        />

                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            placeholder="جست‌وجو بر اساس متن نظر، نام کاربر یا محصول..."
                            className="h-12 w-full rounded-xl border border-lightBorderColor bg-lightBackgroundColor pr-11 pl-4 text-sm text-lightTextColor outline-none transition placeholder:text-lightTextColorMuted focus:border-primaryColor dark:border-borderColor dark:bg-backgroundColor dark:text-textColor dark:placeholder:text-textColorMuted"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="comment-status"
                                className="mb-2 block text-xs text-lightTextColorMuted dark:text-textColorMuted"
                            >
                                وضعیت نظر
                            </label>

                            <select
                                id="comment-status"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className={inputClass}
                            >
                                <option value="all">همه نظرات</option>
                                <option value="pending">در انتظار بررسی</option>
                                <option value="approved">تأیید شده</option>
                                <option value="rejected">رد شده</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* وضعیت بارگذاری */}
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3 p-12">
                        <div className="size-8 animate-spin rounded-full border-2 border-primaryColor/20 border-t-primaryColor" />

                        <p className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            در حال دریافت نظرات...
                        </p>
                    </div>
                ) : error ? (
                    <div className="space-y-4 p-8 text-center">
                        <p className="text-sm text-red-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() => void fetchComments()}
                            className="cursor-pointer rounded-xl bg-primaryColor px-5 py-2.5 text-sm text-white transition hover:bg-primaryDark"
                        >
                            تلاش مجدد
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="px-5 pb-3 pt-4 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            تعداد نظرات نمایش‌داده‌شده:{" "}
                            {formatNumber(comments.length)}
                        </div>

                        {/* جدول نظرات */}
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-220 border-collapse text-right">
                                <thead>
                                    <tr className="border-y border-lightBorderColor bg-lightBackgroundColor dark:border-borderColor dark:bg-backgroundColor">
                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            کاربر
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            محصول
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            امتیاز
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            متن نظر
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            وضعیت
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            تاریخ ثبت
                                        </th>

                                        <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                            عملیات
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {comments.length > 0 ? (
                                        comments.map((comment) => (
                                            <tr
                                                key={comment.id}
                                                className="border-b border-lightBorderColor transition last:border-b-0 hover:bg-lightSurfaceHoverColor dark:border-borderColor dark:hover:bg-surfaceHoverColor"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3 whitespace-nowrap">
                                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                                                            <LuUserRound size={19} />
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                                                                {comment.user?.name ?? "کاربر حذف‌شده"}
                                                            </p>

                                                            <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                                شناسه: {formatNumber(comment.user_id)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 whitespace-nowrap text-sm text-lightTextColor dark:text-textColor">
                                                        <LuPackage
                                                            size={16}
                                                            className="shrink-0 text-lightTextColorMuted dark:text-textColorMuted"
                                                        />

                                                        {comment.product?.name ?? "محصول حذف‌شده"}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="whitespace-nowrap text-sm text-lightTextColor dark:text-textColor">
                                                        {formatNumber(comment.rating)}
                                                        <span className="mx-1 text-lightTextColorMuted dark:text-textColorMuted">
                                                            از
                                                        </span>
                                                        {formatNumber(5)}
                                                    </span>
                                                </td>

                                                <td className="max-w-64 px-5 py-4">
                                                    <p className="line-clamp-2 text-sm leading-6 text-lightTextColor dark:text-textColor">
                                                        {comment.text}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-DanaMedium ${statusStyles[comment.status]}`}
                                                    >
                                                        {statusLabels[comment.status]}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 whitespace-nowrap text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                        <LuCalendarDays size={15} />

                                                        {formatPersianDate(comment.created_at)}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <button
                                                        type="button"
                                                        title="مشاهده و مدیریت نظر"
                                                        onClick={() =>
                                                            handleOpenDetails(comment)
                                                        }
                                                        className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor transition hover:bg-primaryColor hover:text-white"
                                                    >
                                                        <LuEye size={17} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-12 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-3">
                                                    <LuMessageSquare
                                                        size={32}
                                                        className="text-lightTextColorMuted dark:text-textColorMuted"
                                                    />

                                                    <p className="font-DanaMedium text-sm text-lightTextColor dark:text-textColor">
                                                        نظری پیدا نشد
                                                    </p>

                                                    <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                        نظری با مشخصات انتخاب‌شده وجود ندارد.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* مدال جزئیات نظر */}
            {isDetailModalOpen &&
                selectedComment &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeDetailsModal();
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="comment-details-title"
                            className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-lightBorderColor bg-lightSurfaceColor shadow-2xl dark:border-borderColor dark:bg-surfaceColor"
                        >
                            {/* سربرگ */}
                            <div className="flex items-center justify-between border-b border-lightBorderColor px-5 py-4 dark:border-borderColor">
                                <div>
                                    <h2
                                        id="comment-details-title"
                                        className="font-DanaDemiBold text-lg text-lightTextColor dark:text-textColor"
                                    >
                                        جزئیات نظر
                                    </h2>

                                    <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                        شناسه نظر: {formatNumber(selectedComment.id)}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeDetailsModal}
                                    disabled={isUpdating}
                                    className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-lightBackgroundColor text-lightTextColorMuted transition hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed dark:bg-backgroundColor dark:text-textColorMuted"
                                >
                                    <LuX size={19} />
                                </button>
                            </div>

                            <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5">

                                {/* اطلاعات کاربر و محصول */}
                                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-lightBorderColor p-4 dark:border-borderColor">
                                        <p className="flex items-center gap-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                            <LuUserRound size={16} />
                                            نام کاربر
                                        </p>

                                        <p className="mt-3 text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                                            {selectedComment.user?.name ?? "کاربر حذف‌شده"}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-lightBorderColor p-4 dark:border-borderColor">
                                        <p className="flex items-center gap-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                            <LuPackage size={16} />
                                            محصول
                                        </p>

                                        <p className="mt-3 text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                                            {selectedComment.product?.name ?? "محصول حذف‌شده"}
                                        </p>
                                    </div>
                                </section>

                                {/* امتیاز */}
                                <section className="rounded-2xl border border-lightBorderColor p-4 dark:border-borderColor">
                                    <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                        امتیاز ثبت‌شده
                                    </p>

                                    <p className="mt-3 text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                                        {formatNumber(selectedComment.rating)} از ۵
                                    </p>
                                </section>

                                {/* متن نظر */}
                                <section className="rounded-2xl border border-lightBorderColor p-4 dark:border-borderColor">
                                    <h3 className="mb-3 flex items-center gap-2 font-DanaDemiBold text-sm text-lightTextColor dark:text-textColor">
                                        <LuMessageSquare
                                            size={18}
                                            className="text-primaryColor"
                                        />

                                        متن نظر کاربر
                                    </h3>

                                    <p className="whitespace-pre-wrap break-words text-sm leading-8 text-lightTextColor dark:text-textColor">
                                        {selectedComment.text}
                                    </p>
                                </section>

                                {/* تاریخ و وضعیت */}
                                <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-lightBackgroundColor p-4 dark:bg-backgroundColor">
                                    <div>
                                        <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                            تاریخ ثبت نظر
                                        </p>

                                        <p className="mt-2 text-sm text-lightTextColor dark:text-textColor">
                                            {formatPersianDate(selectedComment.created_at)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                            وضعیت فعلی
                                        </p>

                                        <span
                                            className={`rounded-lg px-3 py-2 text-xs font-DanaMedium ${statusStyles[selectedComment.status]}`}
                                        >
                                            {statusLabels[selectedComment.status]}
                                        </span>
                                    </div>
                                </section>

                                {/* مدیریت نظر */}
                                <section className="border-t border-lightBorderColor pt-5 dark:border-borderColor">
                                    <h3 className="mb-3 font-DanaDemiBold text-sm text-lightTextColor dark:text-textColor">
                                        مدیریت نظر
                                    </h3>

                                    <p className="mb-4 text-xs leading-6 text-lightTextColorMuted dark:text-textColorMuted">
                                        می‌توانی این نظر را تأیید یا رد کنی. حتی اگر قبلاً وضعیت آن تغییر کرده باشد، امکان تغییر مجدد وجود دارد.
                                    </p>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            disabled={
                                                isUpdating ||
                                                selectedComment.status === "approved"
                                            }
                                            onClick={() =>
                                                handleAskForStatusChange(
                                                    selectedComment.id,
                                                    "approved"
                                                )
                                            }
                                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <LuThumbsUp size={17} />
                                            تأیید نظر
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                isUpdating ||
                                                selectedComment.status === "rejected"
                                            }
                                            onClick={() =>
                                                handleAskForStatusChange(
                                                    selectedComment.id,
                                                    "rejected"
                                                )
                                            }
                                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <LuThumbsDown size={17} />
                                            رد نظر
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isUpdating}
                                        onClick={() =>
                                            handleAskForDelete(selectedComment.id)
                                        }
                                        className="mt-3 w-full cursor-pointer rounded-xl border border-red-500/30 px-4 py-3 text-sm text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        حذف نظر
                                    </button>
                                </section>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* مدال تأیید تغییر وضعیت */}
            {pendingAction &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeActionModal();
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            className="w-full max-w-md rounded-3xl border border-lightBorderColor bg-lightSurfaceColor p-6 shadow-2xl dark:border-borderColor dark:bg-surfaceColor"
                        >
                            <div
                                className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${
                                    pendingAction.status === "approved"
                                        ? "bg-teal-500/10 text-teal-600"
                                        : "bg-red-500/10 text-red-500"
                                }`}
                            >
                                {pendingAction.status === "approved" ? (
                                    <LuCheck size={27} />
                                ) : (
                                    <LuX size={27} />
                                )}
                            </div>

                            <h2 className="mt-4 text-center font-DanaDemiBold text-lg text-lightTextColor dark:text-textColor">
                                تأیید تغییر وضعیت نظر
                            </h2>

                            <p className="mt-3 text-center text-sm leading-7 text-lightTextColorMuted dark:text-textColorMuted">
                                آیا از تغییر وضعیت این نظر به «{actionLabel}» اطمینان داری؟
                            </p>

                            <p className="mt-3 text-center text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                                شناسه نظر: {formatNumber(pendingAction.commentId)}
                            </p>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={closeActionModal}
                                    className="flex-1 cursor-pointer rounded-xl border border-lightBorderColor px-4 py-3 text-sm text-lightTextColor transition hover:bg-lightBackgroundColor disabled:cursor-not-allowed dark:border-borderColor dark:text-textColor dark:hover:bg-backgroundColor"
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => void handleUpdateStatus()}
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primaryColor px-4 py-3 text-sm text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isUpdating ? (
                                        <LuLoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <LuCheck size={17} />
                                    )}

                                    {isUpdating
                                        ? "در حال انجام..."
                                        : "تأیید و ثبت"}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* مدال تأیید حذف نظر */}
            {pendingDeleteId !== null &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeDeleteModal();
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="delete-comment-title"
                            className="w-full max-w-md rounded-3xl border border-lightBorderColor bg-lightSurfaceColor p-6 shadow-2xl dark:border-borderColor dark:bg-surfaceColor"
                        >
                            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                                <LuTrash2 size={26} />
                            </div>

                            <h2
                                id="delete-comment-title"
                                className="mt-4 text-center font-DanaDemiBold text-lg text-lightTextColor dark:text-textColor"
                            >
                                تأیید حذف نظر
                            </h2>

                            <p className="mt-3 text-center text-sm leading-7 text-lightTextColorMuted dark:text-textColorMuted">
                                آیا از حذف این نظر اطمینان داری؟ این عملیات باعث حذف نظر از فهرست نظرات می‌شود.
                            </p>

                            <p className="mt-3 text-center text-sm font-DanaMedium text-lightTextColor dark:text-textColor">
                                شناسه نظر: {formatNumber(pendingDeleteId)}
                            </p>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={closeDeleteModal}
                                    className="flex-1 cursor-pointer rounded-xl border border-lightBorderColor px-4 py-3 text-sm text-lightTextColor transition hover:bg-lightBackgroundColor disabled:cursor-not-allowed disabled:opacity-60 dark:border-borderColor dark:text-textColor dark:hover:bg-backgroundColor"
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => void handleDeleteComment()}
                                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isUpdating ? (
                                        <LuLoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <LuTrash2 size={17} />
                                    )}

                                    {isUpdating
                                        ? "در حال حذف..."
                                        : "بله، حذف شود"}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}

export default UserComments;