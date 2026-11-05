import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
    LuPackagePlus,
    LuPencil,
    LuX,
    LuUpload,
    LuImage,
} from "react-icons/lu";
import toast from "react-hot-toast";

type ProductColor = {
    name: string;
    hex: string;
};

type Product = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image: string | null;
    colors?: ProductColor[] | null;
    is_active: boolean;
    discount_percentage?: number | null;
    discount_price?: number | null;
    is_special_offer?: boolean;
};

type ModalProps = {
    mode: "add" | "edit";
    product?: Product | null;
    onClose: () => void;
    onSaved?: () => void;
};

type ApiResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud";

function getCsrfToken(): string {
    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith("XSRF-TOKEN="));

    return cookie
        ? decodeURIComponent(cookie.slice("XSRF-TOKEN=".length))
        : "";
}

async function prepareCsrf(): Promise<void> {
    const response = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("دریافت توکن امنیتی ناموفق بود.");
    }
}

function showErrors(errors: Record<string, string[]>) {
    Object.values(errors)
        .flat()
        .forEach((message) => {
            toast.error(message, {
                style: {
                    direction: "rtl",
                    textAlign: "right",
                },
            });
        });
}

function Modal({ mode, product = null, onClose, onSaved }: ModalProps) {
    const isEdit = mode === "edit";

    const [name, setName] = useState(product?.name ?? "");
    const [description, setDescription] = useState(product?.description ?? "");
    const [price, setPrice] = useState(String(product?.price ?? ""));
    const [stock, setStock] = useState(String(product?.stock ?? "0"));
    const [colors, setColors] = useState<ProductColor[]>(product?.colors ?? []);
    const [newColorName, setNewColorName] = useState("");
    const [newColorHex, setNewColorHex] = useState("#000000");
    const [isActive, setIsActive] = useState(product?.is_active ?? true);

    const [discountPercentage, setDiscountPercentage] = useState(
        String(product?.discount_percentage ?? "")
    );

    const [isSpecialOffer, setIsSpecialOffer] = useState(
        product?.is_special_offer ?? false
    );

    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(product?.image ?? null);
    const [loading, setLoading] = useState(false);

    const discountValue = Number(discountPercentage);
    const originalPrice = Number(price);

    const hasDiscount =
        discountPercentage.trim() !== "" &&
        Number.isInteger(discountValue) &&
        discountValue >= 1 &&
        discountValue <= 100;

    const finalPrice = hasDiscount
        ? Math.round((originalPrice * (100 - discountValue)) / 100)
        : originalPrice;

    useEffect(() => {
        setName(product?.name ?? "");
        setDescription(product?.description ?? "");
        setPrice(String(product?.price ?? ""));
        setStock(String(product?.stock ?? "0"));
        setColors(Array.isArray(product?.colors) ? product.colors : []);
        setNewColorName("");
        setNewColorHex("#000000");
        setIsActive(product?.is_active ?? true);
        setDiscountPercentage(String(product?.discount_percentage ?? ""));
        setIsSpecialOffer(product?.is_special_offer ?? false);
        setImage(null);
        setPreview(product?.image ?? null);
    }, [product, mode]);

    useEffect(() => {
        if (!image) {
            setPreview(product?.image ?? null);
            return;
        }

        const objectUrl = URL.createObjectURL(image);
        setPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [image, product?.image]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !loading) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [loading, onClose]);

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (loading) return;

        if (!name.trim()) {
            toast.error("نام محصول را وارد کن.");
            return;
        }

        if (
            price.trim() === "" ||
            !Number.isInteger(originalPrice) ||
            originalPrice < 0
        ) {
            toast.error("قیمت باید یک عدد صحیح و صفر یا بیشتر باشد.");
            return;
        }

        if (
            stock.trim() === "" ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            toast.error("موجودی باید یک عدد صحیح و صفر یا بیشتر باشد.");
            return;
        }

        if (isEdit && !product) {
            toast.error("محصول موردنظر برای ویرایش پیدا نشد.");
            return;
        }

        if (discountPercentage.trim() !== "") {
            if (
                !Number.isInteger(discountValue) ||
                discountValue < 1 ||
                discountValue > 100
            ) {
                toast.error("درصد تخفیف باید عددی صحیح بین ۱ تا ۱۰۰ باشد.");
                return;
            }

            if (finalPrice >= originalPrice) {
                toast.error("قیمت پس از تخفیف باید کمتر از قیمت اصلی باشد.");
                return;
            }
        }

        if (colors.length > 30) {
            toast.error("حداکثر ۳۰ رنگ برای هر محصول می‌توانی ثبت کنی.");
            return;
        }

        if (colors.some((color) => !color.name.trim() || !/^#[0-9A-Fa-f]{6}$/.test(color.hex))) {
            toast.error("نام و کد HEX همه رنگ‌ها باید معتبر باشند.");
            return;
        }

        if (image) {
            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

            if (!allowedTypes.includes(image.type)) {
                toast.error("فرمت تصویر باید JPG، PNG یا WEBP باشد.");
                return;
            }

            if (image.size > 2 * 1024 * 1024) {
                toast.error("حجم تصویر نباید بیشتر از ۲ مگابایت باشد.");
                return;
            }
        }

        setLoading(true);

        try {
            await prepareCsrf();

            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("description", description.trim());
            formData.append("price", price);
            formData.append("stock", stock);
            formData.append("colors", JSON.stringify(colors.map((color) => ({ name: color.name.trim(), hex: color.hex.toUpperCase() }))));
            formData.append("is_active", isActive ? "1" : "0");
            formData.append(
                "discount_percentage",
                hasDiscount ? String(discountValue) : ""
            );
            formData.append(
                "discount_price",
                hasDiscount ? String(finalPrice) : ""
            );
            formData.append("is_special_offer", isSpecialOffer ? "1" : "0");

            if (image) {
                formData.append("image", image);
            }

            let url = `${API_URL}/api/products`;
            const method = "POST";

            if (isEdit && product) {
                url = `${API_URL}/api/products/${product.id}`;
                formData.append("_method", "PUT");
            }

            const csrfToken = getCsrfToken();

            if (!csrfToken) {
                throw new Error(
                    "توکن CSRF پیدا نشد. تنظیمات Sanctum و کوکی‌ها را بررسی کن."
                );
            }

            const response = await fetch(url, {
                method,
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                },
                body: formData,
            });

            const result: ApiResponse = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 422 && result.errors) {
                    showErrors(result.errors);
                    return;
                }

                if (response.status === 401 || response.status === 403) {
                    toast.error(
                        "اجازه انجام این عملیات را نداری یا وارد حساب نشده‌ای."
                    );
                    return;
                }

                if (response.status === 404) {
                    toast.error("محصول موردنظر پیدا نشد.");
                    return;
                }

                if (response.status === 419) {
                    toast.error(
                        "خطای امنیتی CSRF رخ داده است. صفحه را تازه‌سازی کن."
                    );
                    return;
                }

                toast.error(result.message || "ذخیره محصول با خطا مواجه شد.");
                return;
            }

            toast.success(
                result.message ||
                    (isEdit
                        ? "محصول با موفقیت ویرایش شد."
                        : "محصول با موفقیت ایجاد شد.")
            );

            onClose();
            window.dispatchEvent(new Event("products:refresh"));

            try {
                onSaved?.();
            } catch (callbackError) {
                console.error(
                    "خطا هنگام به‌روزرسانی فهرست محصولات:",
                    callbackError
                );
            }
        } catch (error) {
            console.error("خطا هنگام ذخیره محصول:", error);

            toast.error(
                error instanceof TypeError
                    ? "ارتباط با سرور برقرار نشد. اتصال بک‌اند را بررسی کن."
                    : error instanceof Error
                      ? error.message
                      : "خطای غیرمنتظره‌ای رخ داد."
            );
        } finally {
            setLoading(false);
        }
    };

    // Read the app's existing theme class and mirror it onto the portal.
    // This also reacts if the app toggles the `dark` class while the modal is open.
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof document === "undefined") return false;

        const root = document.documentElement;
        const body = document.body;
        const appRoot = document.getElementById("root");

        return (
            root.classList.contains("dark") ||
            body.classList.contains("dark") ||
            appRoot?.classList.contains("dark") === true ||
            root.dataset.theme === "dark" ||
            body.dataset.theme === "dark" ||
            appRoot?.getAttribute("data-theme") === "dark"
        );
    });

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        const appRoot = document.getElementById("root");

        const updateTheme = () => {
            setIsDarkMode(
                root.classList.contains("dark") ||
                    body.classList.contains("dark") ||
                    Boolean(appRoot?.classList.contains("dark")) ||
                    root.dataset.theme === "dark" ||
                    body.dataset.theme === "dark" ||
                    appRoot?.getAttribute("data-theme") === "dark"
            );
        };

        updateTheme();

        const observer = new MutationObserver(updateTheme);
        observer.observe(root, {
            attributes: true,
            attributeFilter: ["class", "data-theme"],
        });
        observer.observe(body, {
            attributes: true,
            attributeFilter: ["class", "data-theme"],
        });

        if (appRoot) {
            observer.observe(appRoot, {
                attributes: true,
                attributeFilter: ["class", "data-theme"],
            });
        }

        return () => observer.disconnect();
    }, []);

    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm ${
                isDarkMode ? "dark" : ""
            }`}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                dir="rtl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-modal-title"
                className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 shadow-2xl sm:p-8"
                style={{
                    backgroundColor: isDarkMode ? "#171923" : "#ffffff",
                    color: isDarkMode ? "#f3f4f6" : "#1f2937",
                }}
            >
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor">
                            {isEdit ? <LuPencil size={23} /> : <LuPackagePlus size={23} />}
                        </div>

                        <div>
                            <h2
                                id="product-modal-title"
                                className="font-DanaBold text-lg text-lightTextColor dark:text-textColor"
                            >
                                {isEdit ? "ویرایش محصول" : "افزودن محصول جدید"}
                            </h2>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                اطلاعات محصول را وارد کن.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="cursor-pointer rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-500 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/10"
                        aria-label="بستن"
                    >
                        <LuX size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                            نام محصول
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="مثلاً گوشی موبایل"
                            maxLength={255}
                            required
                            disabled={loading}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primaryColor dark:border-white/10"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff",
                                color: isDarkMode ? "#f3f4f6" : "#1f2937",
                                borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb",
                            }}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                            توضیحات محصول
                        </label>
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="توضیحات محصول را وارد کن..."
                            rows={3}
                            disabled={loading}
                            className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primaryColor dark:border-white/10 dark:bg-white/5 dark:text-textColor dark:placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                            رنگ‌های محصول
                        </label>
                        <div className="space-y-3">
                            {colors.map((color, index) => (
                                <div key={`${index}-${color.hex}`} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
                                    <input
                                        type="text"
                                        value={color.name}
                                        onChange={(event) => setColors((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}
                                        placeholder="نام رنگ؛ مثلاً مشکی"
                                        maxLength={100}
                                        disabled={loading}
                                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primaryColor dark:border-white/10"
                                        style={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff", color: isDarkMode ? "#f3f4f6" : "#1f2937", borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb" }}
                                    />
                                    <input
                                        type="color"
                                        value={/^#[0-9A-Fa-f]{6}$/.test(color.hex) ? color.hex : "#000000"}
                                        onChange={(event) => setColors((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, hex: event.target.value.toUpperCase() } : item))}
                                        aria-label={`انتخاب رنگ ${color.name || index + 1}`}
                                        disabled={loading}
                                        className="h-11 w-12 cursor-pointer rounded-lg border border-gray-200 bg-transparent p-1 dark:border-white/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setColors((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                        disabled={loading}
                                        className="cursor-pointer rounded-lg p-2 text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                                        aria-label="حذف رنگ"
                                    >
                                        <LuX size={18} />
                                    </button>
                                    <p className="col-span-3 -mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">کد رنگ: {color.hex}</p>
                                </div>
                            ))}
                            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
                                <input
                                    type="text"
                                    value={newColorName}
                                    onChange={(event) => setNewColorName(event.target.value)}
                                    placeholder="نام رنگ جدید"
                                    maxLength={100}
                                    disabled={loading}
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primaryColor dark:border-white/10"
                                    style={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff", color: isDarkMode ? "#f3f4f6" : "#1f2937", borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb" }}
                                />
                                <input
                                    type="color"
                                    value={newColorHex}
                                    onChange={(event) => setNewColorHex(event.target.value.toUpperCase())}
                                    aria-label="انتخاب رنگ جدید"
                                    disabled={loading}
                                    className="h-11 w-12 cursor-pointer rounded-lg border border-gray-200 bg-transparent p-1 dark:border-white/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!newColorName.trim()) { toast.error("نام رنگ را وارد کن."); return; }
                                        if (colors.length >= 30) { toast.error("حداکثر ۳۰ رنگ برای هر محصول مجاز است."); return; }
                                        setColors((current) => [...current, { name: newColorName.trim(), hex: newColorHex.toUpperCase() }]);
                                        setNewColorName("");
                                        setNewColorHex("#000000");
                                    }}
                                    disabled={loading}
                                    className="cursor-pointer rounded-xl bg-primaryColor px-3 py-3 text-sm text-white transition hover:bg-primaryDark disabled:opacity-50"
                                >
                                    افزودن
                                </button>
                            </div>
                            <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">ثبت رنگ اختیاری است. برای حذف همه رنگ‌ها، تمام موارد را حذف کن.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                                قیمت (تومان)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={price}
                                onChange={(event) => setPrice(event.target.value)}
                                placeholder="مثلاً 250000"
                                required
                                disabled={loading}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primaryColor dark:border-white/10"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff",
                                color: isDarkMode ? "#f3f4f6" : "#1f2937",
                                borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb",
                            }}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                                موجودی انبار
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={stock}
                                onChange={(event) => setStock(event.target.value)}
                                required
                                disabled={loading}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primaryColor dark:border-white/10"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff",
                                color: isDarkMode ? "#f3f4f6" : "#1f2937",
                                borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb",
                            }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                            درصد تخفیف
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            value={discountPercentage}
                            onChange={(event) => setDiscountPercentage(event.target.value)}
                            placeholder="برای مثال ۲۰؛ بدون تخفیف خالی بگذار"
                            disabled={loading}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-primaryColor dark:border-white/10"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff",
                                color: isDarkMode ? "#f3f4f6" : "#1f2937",
                                borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb",
                            }}
                        />

                        {hasDiscount && Number.isInteger(originalPrice) && originalPrice > 0 && (
                            <div className="mt-3 rounded-xl border border-gray-200 px-4 py-3 dark:border-white/10"
                                style={{
                                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#f9fafb",
                                    borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb",
                                }}>
                                <p className="text-sm text-lightTextColor dark:text-textColor">
                                    قیمت اصلی: {originalPrice.toLocaleString("fa-IR")} تومان
                                </p>
                                <p className="mt-2 text-sm font-DanaBold text-primaryColor">
                                    قیمت پس از تخفیف: {finalPrice.toLocaleString("fa-IR")} تومان
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-lightTextColor dark:text-textColor">
                            تصویر محصول
                        </label>
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-5 transition hover:border-primaryColor dark:border-white/10"
                            style={{
                                backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "#f9fafb",
                                borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e5e7eb",
                            }}>
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="پیش‌نمایش محصول"
                                    className="mb-3 h-36 w-full rounded-xl object-contain"
                                />
                            ) : (
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor">
                                    <LuImage size={28} />
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-primaryColor">
                                <LuUpload size={18} />
                                <span>
                                    {image ? "انتخاب تصویر دیگر" : "انتخاب تصویر محصول"}
                                </span>
                            </div>
                            <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                JPG، PNG یا WEBP — حداکثر ۲ مگابایت
                            </span>

                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={loading}
                                onChange={(event) => {
                                    const selectedFile = event.target.files?.[0] ?? null;
                                    setImage(selectedFile);
                                    event.target.value = "";
                                }}
                            />
                        </label>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-white/10">
                        <div>
                            <p className="text-sm text-lightTextColor dark:text-textColor">
                                وضعیت محصول
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {isActive ? "محصول فعال است." : "محصول غیرفعال است."}
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            disabled={loading}
                            onClick={() => setIsActive((previous) => !previous)}
                            className={`relative h-6 w-11 cursor-pointer rounded-full transition disabled:opacity-50 ${
                                isActive ? "bg-primaryColor" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                        >
                            <span
                                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                                    isActive ? "right-1" : "right-6"
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-yellow-300 bg-yellow-50/60 px-4 py-3 dark:border-yellow-700 dark:bg-yellow-900/10">
                        <div>
                            <p className="text-sm text-lightTextColor dark:text-textColor">
                                محصول شگفت‌انگیز
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                نمایش محصول در بخش شگفت‌انگیزها
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={isSpecialOffer}
                            disabled={loading}
                            onClick={() => setIsSpecialOffer((previous) => !previous)}
                            className={`relative h-6 w-11 cursor-pointer rounded-full transition disabled:opacity-50 ${
                                isSpecialOffer ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                        >
                            <span
                                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                                    isSpecialOffer ? "right-1" : "right-6"
                                }`}
                            />
                        </button>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 cursor-pointer rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-textColor dark:hover:bg-white/5"
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 cursor-pointer rounded-xl bg-primaryColor px-4 py-3 text-sm text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading
                                ? "در حال ذخیره..."
                                : isEdit
                                  ? "ذخیره تغییرات"
                                  : "افزودن محصول"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default Modal;
