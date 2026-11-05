
import { Link, useNavigate } from "react-router";
import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud";

function Login() {
    const navigate = useNavigate();
    const { setAuth, isAuthenticated, user } = useAuth();

    const [identifier, setIdentifier] = useState("");
    const [showFields, setShowFields] = useState(false);
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isEmail = identifier.includes("@");
    const normalizedIdentifier = identifier.replace(/\s/g, "");
    const isMobile = /^09\d{9}$/.test(normalizedIdentifier);

    useEffect(() => {
        if (isAuthenticated && user) {
            const destination =
                user.role === "admin" ? "/admin" : "/panel";

            navigate(destination, { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleIdentifierChange = (value: string) => {
        setIdentifier(value);
        setShowFields(false);
        setPassword("");
    };

    const getCsrfToken = async (): Promise<string> => {
        const csrfResponse = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        });

        if (!csrfResponse.ok) {
            throw new Error("دریافت کوکی امنیتی ناموفق بود.");
        }

        const csrfCookie = document.cookie
            .split("; ")
            .find((cookie) => cookie.startsWith("XSRF-TOKEN="));

        if (!csrfCookie) {
            throw new Error("کوکی امنیتی پیدا نشد.");
        }

        return decodeURIComponent(
            csrfCookie.slice("XSRF-TOKEN=".length)
        );
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;

        const normalized = identifier.trim();

        if (normalized.includes("@")) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(normalized)) {
                toast.error("ایمیل وارد شده معتبر نمی‌باشد.");
                setShowFields(false);
                return;
            }

            if (!showFields) {
                setShowFields(true);
                return;
            }

            if (!password.trim()) {
                toast.error("لطفاً رمز عبور خود را وارد کنید.");
                return;
            }

            try {
                setIsLoading(true);

                const csrfToken = await getCsrfToken();

                const response = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-XSRF-TOKEN": csrfToken,
                    },
                    body: JSON.stringify({
                        email: normalized,
                        password,
                    }),
                });

                let data;

                try {
                    data = await response.json();
                } catch {
                    toast.error("درخواست با شکست مواجه شد.");
                    return;
                }

                if (!response.ok) {
                    toast.error(
                        data.errors?.email?.[0] ||
                        data.message ||
                        "ورود ناموفق بود."
                    );
                    return;
                }

                setAuth(data.user);

                toast.success("با موفقیت وارد حساب کاربری شدید.");

                const destination =
                    data.user.role === "admin" ? "/admin" : "/panel";

                navigate(destination, { replace: true });
                
            } catch {
                toast.error(
                    "ارتباط با سرور برقرار نشد."
                );
            } finally {
                setIsLoading(false);
            }

            return;
        }

        if (!/^09\d{9}$/.test(normalized)) {
            toast.error("شماره موبایل یا ایمیل معتبر نمی‌باشد.");
            setShowFields(false);
            return;
        }

        toast.error("ورود پیامکی هنوز فعال نشده است.");
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen">
            <div className="mb-10">
                <Link to="/">
                    <img
                        src="/images/logo.png"
                        alt="logo"
                        className="w-40 h-20"
                    />
                </Link>
            </div>

            <div className="flex items-center justify-center flex-col rounded-xl shadow-lightBoxShadow dark:shadow-darkBoxShadow bg-lightSurfaceColor dark:bg-surfaceColor">
                <div className="py-10 px-20 text-center text-lightTextColor dark:text-textColor">
                    <p className="font-DanaBold text-xl mb-3">
                        ورود به حساب کاربری
                    </p>

                    <span className="text-[14px]">
                        هنوز ثبت نام نکرده اید؟{" "}
                        <Link
                            to="/register"
                            className="text-primaryColor font-DanaBold"
                        >
                            ثبت نام
                        </Link>
                    </span>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col text-lightTextColor dark:text-textColor"
                >
                    <label htmlFor="identifier" className="mb-5 text-[14px]">
                        شماره موبایل یا ایمیلتان را وارد کنید
                    </label>

                    <input
                        id="identifier"
                        type="text"
                        name="identifier"
                        value={identifier}
                        onChange={(e) => handleIdentifierChange(e.target.value)}
                        placeholder="شماره موبایل یا ایمیل"
                        autoComplete="username"
                        className="w-70 mb-5 p-3 pl-7 outline-0 border border-textColorMuted rounded-lg focus:shadow-lightButtonShadow dark:focus:shadow-darkButtonShadow placeholder:text-xs"
                    />

                    {showFields && isEmail && (
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="رمز عبور"
                            className="w-70 mb-5 p-3 pl-7 outline-0 border border-textColorMuted rounded-lg focus:shadow-lightButtonShadow dark:focus:shadow-darkButtonShadow placeholder:text-xs"
                        />
                    )}

                    {showFields && !isEmail && isMobile && (
                        <input
                            type="text"
                            name="verificationCode"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="کد تأیید پیامکی"
                            className="w-70 mb-5 p-3 pl-7 outline-0 border border-textColorMuted rounded-lg focus:shadow-lightButtonShadow dark:focus:shadow-darkButtonShadow placeholder:text-xs"
                        />
                    )}

                    <input
                        type="submit"
                        className="mb-10 w-70 border border-textColorMuted p-3 rounded-lg cursor-pointer hover:bg-surfaceHoverColor hover:text-textColor transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        value={isLoading ? "در حال ورود..." : "ورود به حساب"}
                        disabled={isLoading}
                    />
                </form>
            </div>

            <div className="font-DanaMedium text-lightTextColor dark:text-textColor text-[14px] mt-5">
                <p>
                    با عضویت در سایت شرایط و{" "}
                    <Link to="/" className="text-primaryColor">
                        قوانین
                    </Link>{" "}
                    کالینو را پذیرفته اید.
                </p>
            </div>
        </div>
    );
}

export default Login;
