
import { Link, useNavigate } from "react-router";
import { LuUserRound, LuPhone } from "react-icons/lu";
import { HiOutlineMail } from "react-icons/hi";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud";

function Register() {
    const navigate = useNavigate();
    const { setAuth } = useAuth();

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const getCsrfToken = async (): Promise<string> => {
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
            throw new Error("ارتباط با سرور برقرار نشد.");
        }

        const cookie = document.cookie
            .split("; ")
            .find((item) => item.startsWith("XSRF-TOKEN="));

        if (!cookie) {
            throw new Error("ارتباط با سرور برقرار نشد.");
        }

        return decodeURIComponent(
            cookie.slice("XSRF-TOKEN=".length)
        );
    };

    const handleSubmit = async (

        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        if (isLoading) return;

        const normalizedName = name.trim();
        const normalizedMobile = mobile.trim();
        const normalizedEmail = email.trim();

        if (!normalizedName || !normalizedMobile || !normalizedEmail) {
            toast.error("لطفاً تمام فیلدها را تکمیل کنید.");
            return;
        }

        if (!/^09[0-9]{9}$/.test(normalizedMobile)) {
            toast.error("شماره موبایل باید ۱۱ رقم و با 09 شروع شود.");
            return;
        }

        if (password.length < 8) {
            toast.error("رمز عبور باید حداقل ۸ کاراکتر باشد.");
            return;
        }

        if (password !== passwordConfirmation) {
            toast.error("رمز عبور و تکرار آن یکسان نیستند.");
            return;
        }

        try {
            setIsLoading(true);

            const csrfToken = await getCsrfToken();

            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({
                    name: normalizedName,
                    mobile: normalizedMobile,
                    email: normalizedEmail,
                    password,
                    password_confirmation: passwordConfirmation,
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
                const validationMessage =
                    data.errors?.name?.[0] ||
                    data.errors?.mobile?.[0] ||
                    data.errors?.email?.[0] ||
                    data.errors?.password?.[0];

                toast.error(
                    validationMessage ||
                    data.message ||
                    "ثبت‌ نام ناموفق بود."
                );

                return;
            }

            setAuth(data.user);

            toast.success("ثبت‌ نام با موفقیت انجام شد.");

            navigate("/", { replace: true });
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "ارتباط با سرور برقرار نشد."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen py-8">
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
                        ساخت حساب کاربری جدید
                    </p>

                    <span className="text-[14px]">
                        قبلاً ثبت‌نام کرده‌اید؟{" "}
                        <Link
                            to="/login"
                            className="text-primaryColor font-DanaBold"
                        >
                            وارد شوید
                        </Link>
                    </span>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col text-lightTextColor dark:text-textColor"
                >
                    <div className="relative">
                        <LuUserRound className="absolute top-4 left-2 size-4 text-textColorMuted" />

                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                            required
                            maxLength={255}
                            placeholder="نام و نام خانوادگی"
                            className="w-70 mb-5 p-3 pl-7 outline-0 border border-textColorMuted rounded-lg focus:shadow-lightButtonShadow dark:focus:shadow-darkButtonShadow placeholder:text-xs"
                        />
                    </div>

                    <div className="relative">
                        <LuPhone className="absolute top-4 left-2 size-4 text-textColorMuted" />

                        <input
                            type="text"
                            name="mobile"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            inputMode="numeric"
                            autoComplete="tel"
                            maxLength={11}
                            required
                            placeholder="شماره موبایل"
                            className="w-70 mb-5 p-3 pl-7 outline-0 border border-textColorMuted rounded-lg focus:shadow-lightButtonShadow dark:focus:shadow-darkButtonShadow placeholder:text-xs"
                        />
                    </div>

                    <div className="relative">
                        <HiOutlineMail className="absolute top-4 left-2 size-4 text-textColorMuted" />

                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                            maxLength={255}
                            placeholder="آدرس ایمیل"
                            className="w-70 mb-5 p-3 pl-7 outline-0 border border-textColorMuted rounded-lg focus:shadow-lightButtonShadow dark:focus:shadow-darkButtonShadow placeholder:text-xs"
                        />
                    </div>

                    <div className="relative">
                        {isPasswordVisible ? (
                            <IoEyeOffOutline
                                onClick={() => setIsPasswordVisible(false)}
                                className="absolute top-4 left-2 size-4 text-textColorMuted cursor-pointer"
                            />
                        ) : (
                            <IoEyeOutline
                                onClick={() => setIsPasswordVisible(true)}
                                className="absolute top-4 left-2 size-4 text-textColorMuted cursor-pointer"
                            />
                        )}

                        <input
                            type={isPasswordVisible ? "text" : "password"}
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            placeholder="رمز عبور"
                            className="w-70 mb-5 p-3 pl-7 outline-0 border border-textColorMuted rounded-lg focus:shadow-lightButtonShadow dark:focus:shadow-darkButtonShadow placeholder:text-xs"
                        />
                    </div>

                    <div className="relative">
                        {isConfirmationVisible ? (
                            <IoEyeOffOutline
                                onClick={() => setIsConfirmationVisible(false)}
                                className="absolute top-4 left-2 size-4 text-textColorMuted cursor-pointer"
                            />
                        ) : (
                            <IoEyeOutline
                                onClick={() => setIsConfirmationVisible(true)}
                                className="absolute top-4 left-2 size-4 text-textColorMuted cursor-pointer"
                            />
                        )}
                        <input
                            type={isConfirmationVisible ? "text" : "password"}
                            name="password_confirmation"
                            value={passwordConfirmation}
                            onChange={(e) =>
                                setPasswordConfirmation(e.target.value)
                            }
                            autoComplete="new-password"
                            required
                            placeholder="تکرار رمز عبور"
                            className="w-70 mb-10 p-3 pl-7 outline-0 border border-textColorMuted rounded-lg focus:shadow-lightButtonShadow dark:focus:shadow-darkButtonShadow placeholder:text-xs"
                        />
                    </div>

                    <input
                        type="submit"
                        disabled={isLoading}
                        className="mb-10 w-70 border border-textColorMuted p-3 rounded-lg cursor-pointer hover:bg-surfaceHoverColor hover:text-textColor transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        value={
                            isLoading
                                ? "در حال ثبت‌نام..."
                                : "تأیید و عضویت"
                        }
                    />
                </form>
            </div>

            <div className="font-DanaMedium text-lightTextColor dark:text-textColor text-[14px] mt-5 text-center">
                <p>
                    با عضویت در سایت شرایط و{" "}
                    <Link to="/" className="text-primaryColor">
                        قوانین
                    </Link>{" "}
                    کالینو را پذیرفته‌اید.
                </p>
            </div>
        </div>
    );
}

export default Register;
