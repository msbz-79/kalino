import {
    useCallback,
    useEffect,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
    FiMapPin,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiUser,
    FiPhone,
    FiHome,
    FiHash,
    FiStar,
    FiX,
    FiCheck,
    FiLoader,
    FiAlertTriangle,
} from "react-icons/fi";

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
    is_default: boolean;
};

type ApiResponse<T> = {
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
};

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud/api/addresses";
const CSRF_URL = "https://kalino-web-owq-kalino.runflare.cloud/sanctum/csrf-cookie";

const emptyForm: AddressForm = {
    recipient_name: "",
    mobile: "",
    province: "",
    city: "",
    address: "",
    postal_code: "",
    is_default: false,
};

const inputClass =
    "w-full rounded-lg border border-lightBorderColor bg-transparent px-3 py-3 text-sm text-lightTextColor outline-none transition placeholder:text-lightTextColorMuted focus:border-primaryColor dark:border-borderColor dark:text-textColor dark:placeholder:text-textColorMuted";

function getCookie(name: string): string | null {
    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith(`${name}=`));

    return cookie
        ? decodeURIComponent(cookie.substring(name.length + 1))
        : null;
}

async function ensureCsrfCookie(): Promise<void> {
    const response = await fetch(CSRF_URL, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error(
            "دریافت توکن امنیتی ناموفق بود. تنظیمات Sanctum و CORS را بررسی کنید.",
        );
    }
}

async function requestApi<T>(
    url: string,
    options: RequestInit = {},
): Promise<ApiResponse<T>> {
    const method = (options.method ?? "GET").toUpperCase();
    const requiresCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (requiresCsrf) {
        await ensureCsrfCookie();
    }

    const csrfToken = getCookie("XSRF-TOKEN");

    if (requiresCsrf && !csrfToken) {
        throw new Error(
            "توکن CSRF پیدا نشد. تنظیمات کوکی و دامنه لاراول را بررسی کنید.",
        );
    }

    let response: Response;

    try {
        response = await fetch(url, {
            ...options,
            method,
            credentials: "include",
            headers: {
                Accept: "application/json",
                ...(options.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...(requiresCsrf && csrfToken
                    ? { "X-XSRF-TOKEN": csrfToken }
                    : {}),
                ...options.headers,
            },
        });
    } catch {
        throw new Error(
            "ارتباط با سرور برقرار نشد. اتصال بک‌اند و آدرس API را بررسی کنید.",
        );
    }

    const result = (await response.json().catch(() => ({}))) as ApiResponse<T>;

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                "نشست کاربری معتبر نیست. دوباره وارد حساب کاربری شوید.",
            );
        }

        if (response.status === 403) {
            throw new Error(
                result.message || "شما اجازه انجام این عملیات را ندارید.",
            );
        }

        if (response.status === 419) {
            throw new Error(
                "توکن امنیتی معتبر نیست یا نشست منقضی شده است. صفحه را تازه‌سازی کنید.",
            );
        }

        if (response.status === 422) {
            const errors = Object.values(result.errors ?? {})
                .flat()
                .filter(Boolean);

            throw new Error(
                errors.length
                    ? errors.join("\n")
                    : result.message || "اطلاعات واردشده معتبر نیست.",
            );
        }

        throw new Error(
            result.message ||
                (response.status >= 500
                    ? "خطایی در سرور رخ داده است."
                    : "عملیات با خطا مواجه شد."),
        );
    }

    return result;
}

function showErrorToast(error: unknown) {
    toast.error(
        error instanceof Error
            ? error.message
            : "خطای نامشخصی رخ داد.",
        {
            duration: 5000,
            style: {
                whiteSpace: "pre-line",
                direction: "rtl",
                textAlign: "right",
            },
        },
    );
}

function AddressField({
    label,
    icon,
    value,
    onChange,
    placeholder,
    required = false,
    type = "text",
    dir,
    maxLength,
}: {
    label: string;
    icon: ReactNode;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    required?: boolean;
    type?: string;
    dir?: "ltr" | "rtl";
    maxLength?: number;
}) {
    return (
        <label className="block min-w-0">
            <span className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                {label}
                {required && <span className="mr-1 text-red-500">*</span>}
            </span>

            <div className="flex items-center gap-2 rounded-lg border border-lightBorderColor px-3 transition focus-within:border-primaryColor dark:border-borderColor">
                <span className="shrink-0 text-lightTextColorMuted dark:text-textColorMuted">
                    {icon}
                </span>

                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    required={required}
                    dir={dir}
                    maxLength={maxLength}
                    className="min-w-0 w-full bg-transparent py-3 text-sm text-lightTextColor outline-none placeholder:text-lightTextColorMuted dark:text-textColor dark:placeholder:text-textColorMuted"
                />
            </div>
        </label>
    );
}

export default function Addresses() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [form, setForm] = useState<AddressForm>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [actionId, setActionId] = useState<number | null>(null);
    const [pageError, setPageError] = useState("");

    const fetchAddresses = useCallback(async () => {
        setLoading(true);
        setPageError("");

        try {
            const result = await requestApi<Address[]>(API_URL);
            setAddresses(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            setPageError(
                error instanceof Error
                    ? error.message
                    : "دریافت آدرس‌ها ناموفق بود.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAddresses();
    }, [fetchAddresses]);

    function openCreateModal() {
        setEditingId(null);
        setForm({
            ...emptyForm,
            is_default: addresses.length === 0,
        });
        setModalOpen(true);
    }

    function openEditModal(address: Address) {
        setEditingId(address.id);
        setForm({
            recipient_name: address.recipient_name,
            mobile: address.mobile,
            province: address.province,
            city: address.city,
            address: address.address,
            postal_code: address.postal_code ?? "",
            is_default: address.is_default,
        });
        setModalOpen(true);
    }

    function closeModal() {
        if (saving) return;
        setModalOpen(false);
        setEditingId(null);
        setForm(emptyForm);
    }

    function updateForm<K extends keyof AddressForm>(
        key: K,
        value: AddressForm[K],
    ) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;

        setSaving(true);
        const isEditing = editingId !== null;

        try {
            const payload = {
                ...form,
                recipient_name: form.recipient_name.trim(),
                mobile: form.mobile.trim(),
                province: form.province.trim(),
                city: form.city.trim(),
                address: form.address.trim(),
                postal_code: form.postal_code.trim() || null,
            };

            const result = await requestApi<Address>(
                isEditing ? `${API_URL}/${editingId}` : API_URL,
                {
                    method: isEditing ? "PUT" : "POST",
                    body: JSON.stringify(payload),
                },
            );

            setModalOpen(false);
            setEditingId(null);
            setForm(emptyForm);

            toast.success(
                result.message ||
                    (isEditing
                        ? "آدرس با موفقیت ویرایش شد."
                        : "آدرس با موفقیت ثبت شد."),
            );

            await fetchAddresses();
        } catch (error) {
            showErrorToast(error);
        } finally {
            setSaving(false);
        }
    }

    function openDeleteModal(address: Address) {
        if (actionId !== null || deleting) return;

        setAddressToDelete(address);
        setDeleteModalOpen(true);
    }

    function closeDeleteModal() {
        if (deleting) return;

        setDeleteModalOpen(false);
        setAddressToDelete(null);
    }

    async function confirmDelete() {
        if (!addressToDelete || deleting) return;

        const selectedAddress = addressToDelete;

        setDeleting(true);
        setActionId(selectedAddress.id);

        try {
            const result = await requestApi<null>(
                `${API_URL}/${selectedAddress.id}`,
                { method: "DELETE" },
            );

            setDeleteModalOpen(false);
            setAddressToDelete(null);

            toast.success(result.message || "آدرس با موفقیت حذف شد.");

            await fetchAddresses();
        } catch (error) {
            showErrorToast(error);
        } finally {
            setDeleting(false);
            setActionId(null);
        }
    }

    async function handleSetDefault(address: Address) {
        if (address.is_default || actionId !== null) return;

        setActionId(address.id);

        try {
            const result = await requestApi<Address>(
                `${API_URL}/${address.id}/default`,
                { method: "PATCH" },
            );

            toast.success(
                result.message || "آدرس پیش‌فرض تغییر کرد.",
            );

            await fetchAddresses();
        } catch (error) {
            showErrorToast(error);
        } finally {
            setActionId(null);
        }
    }

    return (
        <div className="w-full min-w-0 space-y-5">
            <section className="w-full rounded-xl border border-lightBorderColor bg-lightSurfaceColor p-5 dark:border-borderColor dark:bg-surfaceColor">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                            <FiMapPin size={22} />
                        </div>

                        <div>
                            <h1 className="text-lg font-DanaMedium text-lightTextColor dark:text-textColor">
                                آدرس‌های من
                            </h1>
                            <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                آدرس‌های تحویل سفارش خود را مدیریت کنید.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primaryColor px-4 py-3 text-sm text-white transition hover:opacity-90"
                    >
                        <FiPlus size={18} />
                        افزودن آدرس
                    </button>
                </div>
            </section>

            {pageError && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                    <span>{pageError}</span>
                    <button
                        type="button"
                        onClick={() => void fetchAddresses()}
                        className="cursor-pointer rounded-lg border border-red-300 px-3 py-2 transition hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            <section className="w-full min-w-0 overflow-hidden rounded-xl border border-lightBorderColor bg-lightSurfaceColor dark:border-borderColor dark:bg-surfaceColor">
                <div className="flex items-center justify-between gap-3 border-b border-lightBorderColor p-5 dark:border-borderColor">
                    <h2 className="font-DanaMedium text-lightTextColor dark:text-textColor">
                        آدرس‌های ثبت‌شده
                    </h2>
                    {!loading && (
                        <span className="shrink-0 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                            {addresses.length.toLocaleString("fa-IR")} آدرس
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                        <FiLoader className="animate-spin" size={18} />
                        در حال دریافت آدرس‌ها...
                    </div>
                ) : addresses.length === 0 && !pageError ? (
                    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primaryColor/10 text-primaryColor">
                            <FiMapPin size={28} />
                        </div>
                        <h3 className="font-DanaMedium text-lightTextColor dark:text-textColor">
                            هنوز آدرسی ثبت نکرده‌اید
                        </h3>
                        <p className="max-w-sm text-sm leading-7 text-lightTextColorMuted dark:text-textColorMuted">
                            برای تحویل سفارش‌ها، اولین آدرس خود را ثبت کنید.
                        </p>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primaryColor px-4 py-3 text-sm text-white transition hover:opacity-90"
                        >
                            <FiPlus size={17} />
                            ثبت اولین آدرس
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 xl:grid-cols-2">
                        {addresses.map((address) => (
                            <article
                                key={address.id}
                                className="min-w-0 rounded-xl border border-lightBorderColor p-4 transition hover:border-primaryColor/40 dark:border-borderColor"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                                            <FiHome size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="break-words font-DanaMedium text-lightTextColor dark:text-textColor">
                                                {address.city}، {address.province}
                                            </h3>
                                            <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                گیرنده: {address.recipient_name}
                                            </p>
                                        </div>
                                    </div>

                                    {address.is_default && (
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-green-50 px-2 py-1.5 text-xs text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                            <FiStar size={13} />
                                            پیش‌فرض
                                        </span>
                                    )}
                                </div>

                                <div className="my-4 space-y-3 border-t border-lightBorderColor pt-4 dark:border-borderColor">
                                    <div className="flex items-start gap-2 text-sm">
                                        <FiMapPin className="mt-0.5 shrink-0 text-lightTextColorMuted dark:text-textColorMuted" />
                                        <p className="break-words leading-7 text-lightTextColor dark:text-textColor">
                                            {address.address}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                        <div className="flex items-center gap-2">
                                            <FiPhone className="shrink-0" />
                                            <span dir="ltr">{address.mobile}</span>
                                        </div>
                                        {address.postal_code && (
                                            <div className="flex items-center gap-2">
                                                <FiHash className="shrink-0" />
                                                <span>کد پستی: {address.postal_code}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 border-t border-lightBorderColor pt-4 dark:border-borderColor">
                                    <button
                                        type="button"
                                        disabled={actionId !== null}
                                        onClick={() => openEditModal(address)}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-lightBorderColor px-3 py-2 text-xs text-lightTextColor transition hover:border-primaryColor hover:text-primaryColor disabled:opacity-50 dark:border-borderColor dark:text-textColor"
                                    >
                                        <FiEdit2 size={14} />
                                        ویرایش
                                    </button>

                                    <button
                                        type="button"
                                        disabled={actionId !== null}
                                        onClick={() => openDeleteModal(address)}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-lightBorderColor px-3 py-2 text-xs text-red-500 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50 dark:border-borderColor dark:hover:bg-red-900/20"
                                    >
                                        {actionId === address.id ? (
                                            <FiLoader className="animate-spin" size={14} />
                                        ) : (
                                            <FiTrash2 size={14} />
                                        )}
                                        حذف
                                    </button>

                                    {!address.is_default && (
                                        <button
                                            type="button"
                                            disabled={actionId !== null}
                                            onClick={() => void handleSetDefault(address)}
                                            className="mr-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-primaryColor transition hover:bg-primaryColor/10 disabled:opacity-50"
                                        >
                                            <FiStar size={14} />
                                            انتخاب به‌عنوان پیش‌فرض
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* مدال ثبت و ویرایش آدرس */}
            {modalOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) closeModal();
                        }}
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="address-modal-title"
                            className="relative my-auto w-full max-w-2xl rounded-xl border border-lightBorderColor bg-lightSurfaceColor shadow-2xl dark:border-borderColor dark:bg-surfaceColor"
                        >
                            <div className="flex items-center justify-between gap-3 border-b border-lightBorderColor p-5 dark:border-borderColor">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
                                        {editingId ? <FiEdit2 size={20} /> : <FiPlus size={21} />}
                                    </div>
                                    <div>
                                        <h2
                                            id="address-modal-title"
                                            className="font-DanaMedium text-lightTextColor dark:text-textColor"
                                        >
                                            {editingId ? "ویرایش آدرس" : "افزودن آدرس جدید"}
                                        </h2>
                                        <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                            اطلاعات تحویل سفارش را وارد کنید.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    aria-label="بستن فرم"
                                    disabled={saving}
                                    onClick={closeModal}
                                    className="cursor-pointer rounded-lg p-2 text-lightTextColorMuted transition hover:bg-lightBackgroundColor disabled:opacity-50 dark:text-textColorMuted dark:hover:bg-backgroundColor"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                                    <AddressField
                                        label="نام گیرنده"
                                        icon={<FiUser size={17} />}
                                        value={form.recipient_name}
                                        onChange={(value) => updateForm("recipient_name", value)}
                                        placeholder="نام و نام خانوادگی"
                                        required
                                        maxLength={255}
                                    />
                                    <AddressField
                                        label="شماره موبایل"
                                        icon={<FiPhone size={17} />}
                                        value={form.mobile}
                                        onChange={(value) => updateForm("mobile", value)}
                                        placeholder="09123456789"
                                        required
                                        type="tel"
                                        dir="ltr"
                                        maxLength={20}
                                    />
                                    <AddressField
                                        label="استان"
                                        icon={<FiMapPin size={17} />}
                                        value={form.province}
                                        onChange={(value) => updateForm("province", value)}
                                        placeholder="مثلاً تهران"
                                        required
                                        maxLength={255}
                                    />
                                    <AddressField
                                        label="شهر"
                                        icon={<FiHome size={17} />}
                                        value={form.city}
                                        onChange={(value) => updateForm("city", value)}
                                        placeholder="مثلاً تهران"
                                        required
                                        maxLength={255}
                                    />
                                    <div className="sm:col-span-2">
                                        <AddressField
                                            label="کد پستی"
                                            icon={<FiHash size={17} />}
                                            value={form.postal_code}
                                            onChange={(value) => updateForm("postal_code", value)}
                                            placeholder="کد پستی ۱۰ رقمی"
                                            dir="ltr"
                                            maxLength={20}
                                        />
                                    </div>
                                    <label className="sm:col-span-2">
                                        <span className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                                            نشانی کامل
                                            <span className="mr-1 text-red-500">*</span>
                                        </span>
                                        <textarea
                                            value={form.address}
                                            onChange={(event) => updateForm("address", event.target.value)}
                                            placeholder="خیابان، کوچه، پلاک، واحد و سایر جزئیات"
                                            required
                                            rows={3}
                                            className={`${inputClass} resize-y leading-7`}
                                        />
                                    </label>
                                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-lightBorderColor p-3 sm:col-span-2 dark:border-borderColor">
                                        <input
                                            type="checkbox"
                                            checked={form.is_default}
                                            onChange={(event) => updateForm("is_default", event.target.checked)}
                                            className="mt-1 h-4 w-4 cursor-pointer accent-primaryColor"
                                        />
                                        <span>
                                            <span className="block text-sm text-lightTextColor dark:text-textColor">
                                                انتخاب به‌عنوان آدرس پیش‌فرض
                                            </span>
                                            <span className="mt-1 block text-xs leading-6 text-lightTextColorMuted dark:text-textColorMuted">
                                                این آدرس به‌صورت پیش‌فرض برای تحویل سفارش‌ها انتخاب می‌شود.
                                            </span>
                                        </span>
                                    </label>
                                </div>

                                <div className="flex flex-wrap justify-end gap-3 border-t border-lightBorderColor p-5 dark:border-borderColor">
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={closeModal}
                                        className="cursor-pointer rounded-lg border border-lightBorderColor px-4 py-3 text-sm text-lightTextColor transition hover:bg-lightBackgroundColor disabled:opacity-50 dark:border-borderColor dark:text-textColor dark:hover:bg-backgroundColor"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex min-w-32 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primaryColor px-4 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {saving ? (
                                            <>
                                                <FiLoader className="animate-spin" size={17} />
                                                در حال ذخیره...
                                            </>
                                        ) : (
                                            <>
                                                <FiCheck size={17} />
                                                {editingId ? "ذخیره تغییرات" : "ثبت آدرس"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>,
                    document.body,
                )}

            {/* مدال تأیید حذف آدرس */}
            {deleteModalOpen &&
                addressToDelete &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeDeleteModal();
                            }
                        }}
                    >
                        <section
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="delete-address-title"
                            aria-describedby="delete-address-description"
                            className="my-auto w-full max-w-md rounded-2xl border border-lightBorderColor bg-lightSurfaceColor p-6 shadow-2xl dark:border-borderColor dark:bg-surfaceColor"
                        >
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                <FiAlertTriangle size={28} />
                            </div>

                            <h2
                                id="delete-address-title"
                                className="mt-4 text-center text-lg font-DanaMedium text-lightTextColor dark:text-textColor"
                            >
                                حذف آدرس
                            </h2>

                            <p
                                id="delete-address-description"
                                className="mt-3 text-center text-sm leading-7 text-lightTextColorMuted dark:text-textColorMuted"
                            >
                                آیا مطمئن هستید که می‌خواهید آدرس شهر{" "}
                                <span className="font-DanaMedium text-lightTextColor dark:text-textColor">
                                    {addressToDelete.city}
                                </span>{" "}
                                را حذف کنید؟
                                <span className="mt-1 block">
                                    این عملیات قابل بازگشت نیست.
                                </span>
                            </p>

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={closeDeleteModal}
                                    className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-lightBorderColor px-4 py-3 text-sm text-lightTextColor transition hover:bg-lightBackgroundColor disabled:cursor-not-allowed disabled:opacity-50 dark:border-borderColor dark:text-textColor dark:hover:bg-backgroundColor"
                                >
                                    انصراف
                                </button>

                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={() => void confirmDelete()}
                                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleting ? (
                                        <>
                                            <FiLoader className="animate-spin" size={17} />
                                            در حال حذف...
                                        </>
                                    ) : (
                                        <>
                                            <FiTrash2 size={17} />
                                            بله، حذف شود
                                        </>
                                    )}
                                </button>
                            </div>
                        </section>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
