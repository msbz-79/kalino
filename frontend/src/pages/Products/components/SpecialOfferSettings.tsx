import { useEffect, useState, type FormEvent } from "react";
import { LuCalendarClock, LuSave, LuSparkles } from "react-icons/lu";
import toast from "react-hot-toast";

const API_URL = "http://localhost:8000/api/admin/special-offer-settings";
const API_BASE_URL = "http://localhost:8000";

function getCookie(name: string): string {
    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith(`${name}=`));

    if (!cookie) return "";

    const value = cookie.slice(name.length + 1);
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

async function getCsrfToken(): Promise<string> {
    // Sanctum creates the XSRF-TOKEN cookie used by stateful session requests.
    const csrfResponse = await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
    });

    if (!csrfResponse.ok) {
        throw new Error(`دریافت CSRF token ناموفق بود (${csrfResponse.status}).`);
    }

    const token = getCookie("XSRF-TOKEN");
    if (!token) {
        throw new Error("کوکی XSRF-TOKEN دریافت نشد؛ تنظیمات Sanctum و دامنه‌ها را بررسی کن.");
    }

    return token;
}

export type SpecialOfferSchedule = {
    enabled: boolean;
    startsAt: string;
    endsAt: string;
};

type SpecialOfferSettingsProps = {
    initialValue?: Partial<SpecialOfferSchedule>;
    onSave?: (schedule: SpecialOfferSchedule) => void | Promise<void>;
};

type JalaliDateTime = { date: string; time: string };

const jalaliFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
});

function gregorianToJalaliDate(value?: string | null): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const parts = jalaliFormatter.formatToParts(date);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    return `${get("year")}/${get("month")}/${get("day")}`;
}

function jalaliDateToGregorian(value: string): string {
    const match = value.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (!match) throw new Error("تاریخ را به شکل سال/ماه/روز وارد کن؛ مثلاً 1405/07/26.");

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error("تاریخ شمسی واردشده معتبر نیست.");
    }

    // Find the matching Gregorian day using the browser's Persian-calendar support.
    const approximateYear = year + 621;
    const start = Date.UTC(approximateYear - 1, 2, 15);
    const end = Date.UTC(approximateYear + 1, 2, 25);
    for (let timestamp = start; timestamp <= end; timestamp += 86400000) {
        const parts = jalaliFormatter.formatToParts(new Date(timestamp));
        const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
        if (get("year") === year && get("month") === month && get("day") === day) {
            const date = new Date(timestamp);
            const pad = (n: number) => String(n).padStart(2, "0");
            return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
        }
    }
    throw new Error("تاریخ شمسی واردشده معتبر نیست.");
}

function parseApiDate(value?: string | null): JalaliDateTime {
    if (!value) return { date: "", time: "00:00" };
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return { date: "", time: "00:00" };
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
        date: gregorianToJalaliDate(value),
        time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
    };
}

function toApiDate(date: string, time: string): string | null {
    if (!date.trim()) return null;
    const gregorianDate = jalaliDateToGregorian(date);
    const safeTime = time || "00:00";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(safeTime)) {
        throw new Error("ساعت را به شکل ساعت:دقیقه وارد کن.");
    }
    // Send local datetime without a timezone suffix; Laravel can parse this as a date.
    return `${gregorianDate}T${safeTime}:00`;
}

function SpecialOfferSettings({ initialValue, onSave }: SpecialOfferSettingsProps) {
    const [enabled, setEnabled] = useState(initialValue?.enabled ?? false);
    const initialStart = parseApiDate(initialValue?.startsAt);
    const initialEnd = parseApiDate(initialValue?.endsAt);
    const [startDate, setStartDate] = useState(initialStart.date);
    const [startTime, setStartTime] = useState(initialStart.time);
    const [endDate, setEndDate] = useState(initialEnd.date);
    const [endTime, setEndTime] = useState(initialEnd.time);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const loadSettings = async () => {
            try {
                const response = await fetch(API_URL, {
                    headers: { Accept: "application/json" },
                    credentials: "include",
                    cache: "no-store",
                });
                if (!response.ok) throw new Error(`دریافت تنظیمات ناموفق بود (${response.status}).`);
                const result = await response.json();
                const data = result?.data;
                if (cancelled) return;
                if (data) {
                    const start = parseApiDate(data.start_at);
                    const end = parseApiDate(data.end_at);
                    setEnabled(data.is_active === true || data.is_active === 1 || data.is_active === "1");
                    setStartDate(start.date);
                    setStartTime(start.time);
                    setEndDate(end.date);
                    setEndTime(end.time);
                } else {
                    setEnabled(initialValue?.enabled ?? false);
                }
            } catch (error) {
                console.error("خطا در دریافت تنظیمات شگفت‌انگیز:", error);
                if (!cancelled) toast.error(error instanceof Error ? error.message : "دریافت تنظیمات انجام نشد.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void loadSettings();
        return () => { cancelled = true; };
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        let startsAt: string | null = null;
        let endsAt: string | null = null;
        try {
            if (enabled) {
                if (!startDate || !endDate || !startTime || !endTime) {
                    throw new Error("تاریخ و ساعت شروع و پایان را مشخص کن.");
                }
                startsAt = toApiDate(startDate, startTime);
                endsAt = toApiDate(endDate, endTime);
                if (!startsAt || !endsAt || new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
                    throw new Error("زمان پایان باید بعد از زمان شروع باشد.");
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "تاریخ واردشده معتبر نیست.");
            return;
        }

        const schedule: SpecialOfferSchedule = { enabled, startsAt: startsAt ?? "", endsAt: endsAt ?? "" };
        setIsSaving(true);
        try {
            if (onSave) {
                await onSave(schedule);
            } else {
                // Fetch a fresh Sanctum CSRF cookie before the state-changing PUT request.
                const csrfToken = await getCsrfToken();
                const response = await fetch(API_URL, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-XSRF-TOKEN": csrfToken,
                    },
                    body: JSON.stringify({
                        is_active: enabled,
                        start_at: startsAt,
                        end_at: endsAt,
                    }),
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const validationMessages = result?.errors
                        ? Object.values(result.errors).flat().join(" ")
                        : "";
                    throw new Error(validationMessages || result?.message || `ذخیره تنظیمات ناموفق بود (${response.status}).`);
                }
            }
            toast.success(enabled ? "تنظیمات شگفت‌انگیز ذخیره و فعال شد." : "بخش شگفت‌انگیز غیرفعال شد.");
        } catch (error) {
            console.error("خطا هنگام ذخیره زمان‌بندی شگفت‌انگیز:", error);
            toast.error(error instanceof Error ? error.message : "ذخیره تنظیمات با خطا مواجه شد.");
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass =
        "w-full rounded-xl border border-lightBorderColor bg-lightSurfaceColor px-4 py-3 text-sm text-lightTextColor outline-none transition focus:border-primaryColor disabled:cursor-not-allowed disabled:opacity-50 dark:border-borderColor dark:bg-white/5 dark:text-textColor";

    return (
        <section dir="rtl" aria-labelledby="special-offer-settings-title"
            className="w-full min-w-0 rounded-3xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-lightCardShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkCardShadow sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                        <LuSparkles size={23} />
                    </div>
                    <div>
                        <h2 id="special-offer-settings-title" className="font-DanaBold text-base text-lightTextColor dark:text-textColor">مدیریت بخش شگفت‌انگیز</h2>
                        <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">فعال‌سازی و تعیین بازه زمانی نمایش پیشنهادهای ویژه</p>
                    </div>
                </div>
                <button type="button" role="switch" aria-checked={enabled}
                    onClick={() => setEnabled((previous) => !previous)}
                    disabled={isLoading || isSaving}
                    className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${enabled ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600"}`}
                    aria-label="فعال یا غیرفعال کردن بخش شگفت‌انگیز">
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${enabled ? "right-1" : "right-6"}`} />
                </button>
            </div>

            <div className={`mb-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${enabled ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-900/15 dark:text-yellow-200" : "bg-gray-50 text-gray-600 dark:bg-white/[0.03] dark:text-gray-400"}`}>
                <LuCalendarClock className="mt-0.5 shrink-0" size={18} />
                <p>{isLoading ? "در حال دریافت تنظیمات از سرور..." : enabled ? "بخش شگفت‌انگیز فعال است. تاریخ و ساعت شروع و پایان را مشخص کنید." : "بخش شگفت‌انگیز غیرفعال است؛ پس از ذخیره، کمپین برای کاربران غیرفعال می‌شود."}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="special-offer-start-date" className="mb-2 block text-sm text-lightTextColor dark:text-textColor">تاریخ و ساعت شروع</label>
                        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
                            <input id="special-offer-start-date" type="text" inputMode="numeric" placeholder="1405/07/26"
                                value={startDate} onChange={(event) => setStartDate(event.target.value)}
                                disabled={!enabled || isLoading || isSaving} required={enabled}
                                pattern="\d{4}[/-]\d{1,2}[/-]\d{1,2}" title="فرمت تاریخ: سال/ماه/روز" className={inputClass} />
                            <input aria-label="ساعت شروع" type="time" value={startTime}
                                onChange={(event) => setStartTime(event.target.value)} disabled={!enabled || isLoading || isSaving}
                                required={enabled} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="special-offer-end-date" className="mb-2 block text-sm text-lightTextColor dark:text-textColor">تاریخ و ساعت پایان</label>
                        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
                            <input id="special-offer-end-date" type="text" inputMode="numeric" placeholder="1405/07/30"
                                value={endDate} onChange={(event) => setEndDate(event.target.value)}
                                disabled={!enabled || isLoading || isSaving} required={enabled}
                                pattern="\d{4}[/-]\d{1,2}[/-]\d{1,2}" title="فرمت تاریخ: سال/ماه/روز" className={inputClass} />
                            <input aria-label="ساعت پایان" type="time" value={endTime}
                                onChange={(event) => setEndTime(event.target.value)} disabled={!enabled || isLoading || isSaving}
                                required={enabled} className={inputClass} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-between gap-3 border-t border-lightBorderColor pt-4 dark:border-borderColor sm:flex-row sm:items-center">
                    <button type="submit" disabled={isSaving || isLoading}
                        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primaryColor px-5 py-3 text-sm text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60">
                        <LuSave size={17} />
                        {isLoading ? "در حال دریافت..." : isSaving ? "در حال ذخیره..." : "ذخیره زمان‌بندی"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default SpecialOfferSettings;
