import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

type User = {
    id: number;
    name: string;
    email: string;
    role: "user" | "admin";
};

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setAuth: (user: User) => void;
    clearAuth: () => void;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
};

const API_URL = "https://kalino-web-owq-kalino.runflare.cloud";

async function getCsrfToken(): Promise<string> {
    const response = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        credentials: "include",
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("دریافت کوکی امنیتی ناموفق بود.");
    }

    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith("XSRF-TOKEN="));

    if (!cookie) {
        throw new Error("کوکی CSRF پیدا نشد.");
    }

    return decodeURIComponent(cookie.slice("XSRF-TOKEN=".length));
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const clearAuth = () => {
        setUser(null);
    };

    const setAuth = (user: User) => {
        setUser(user);
    };

    useEffect(() => {
        let isMounted = true;

        async function checkAuth() {
            try {
                const response = await fetch(`${API_URL}/api/user`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                });

                if (!response.ok) {
                    if (isMounted) setUser(null);
                    return;
                }

                const data = await response.json();

                if (isMounted) {
                    setUser(data.user);
                }
            } catch {
                if (isMounted) setUser(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const logout = async () => {
        try {
            const csrfToken = await getCsrfToken();

            const response = await fetch(`${API_URL}/logout`, {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-XSRF-TOKEN": csrfToken,
                },
            });

            if (!response.ok) {
                throw new Error("خروج از حساب ناموفق بود.");
            }
        } finally {
            clearAuth();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: Boolean(user),
                isLoading,
                setAuth,
                clearAuth,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}
