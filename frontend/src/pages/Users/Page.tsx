import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Table from "./components/Table";
import TableHeader, {
    type SortOrder,
    type UserRoleFilter,
} from "./components/TableHeader";

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

const API_URL = "http://localhost:8000";

function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] =
        useState<UserRoleFilter>("all");
    const [sortOrder, setSortOrder] =
        useState<SortOrder>("asc");

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/users`, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "برای مشاهده کاربران باید وارد حساب کاربری شوید."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "شما اجازه دسترسی به فهرست کاربران را ندارید."
                    );
                }

                throw new Error(
                    "دریافت اطلاعات کاربران ناموفق بود."
                );
            }

            const data: { users: ApiUser[] } =
                await response.json();

            const formattedUsers: User[] = data.users.map(
                (user) => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile ?? "",
                    role: user.role,
                    createdAt: user.created_at,
                })
            );

            setUsers(formattedUsers);
            setError("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "خطایی هنگام دریافت کاربران رخ داد."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchUsers();

        const handleUsersRefresh = () => {
            void fetchUsers();
        };

        window.addEventListener(
            "users:refresh",
            handleUsersRefresh
        );

        return () => {
            window.removeEventListener(
                "users:refresh",
                handleUsersRefresh
            );
        };
    }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchTerm
            .trim()
            .toLocaleLowerCase("fa");

        return users
            .filter((user) => {
                const matchesSearch =
                    user.name
                        .toLocaleLowerCase("fa")
                        .includes(normalizedSearch) ||
                    user.email
                        .toLocaleLowerCase("fa")
                        .includes(normalizedSearch) ||
                    user.mobile.includes(searchTerm.trim());

                const matchesRole =
                    roleFilter === "all" ||
                    user.role === roleFilter;

                return matchesSearch && matchesRole;
            })
            .sort((userA, userB) => {
                const comparison = userA.name.localeCompare(
                    userB.name,
                    "fa"
                );

                return sortOrder === "asc"
                    ? comparison
                    : -comparison;
            });
    }, [users, searchTerm, roleFilter, sortOrder]);

    const handleUserCreated = (updatedUser: User) => {
        setUsers((currentUsers) => {
            const userExists = currentUsers.some(
                (user) => user.id === updatedUser.id
            );

            if (userExists) {
                return currentUsers.map((user) =>
                    user.id === updatedUser.id
                        ? updatedUser
                        : user
                );
            }

            return [...currentUsers, updatedUser];
        });
    };

    return (
        <div
            dir="rtl"
            className="w-full min-w-0 space-y-5 p-1"
        >
            <Header />

            <div className="min-w-0 overflow-hidden rounded-3xl border border-lightBorderColor bg-lightSurfaceColor shadow-lightCardShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkCardShadow">
                <TableHeader
                    onSearchChange={setSearchTerm}
                    onRoleChange={setRoleFilter}
                    onSortChange={setSortOrder}
                />

                {isLoading ? (
                    <p className="p-6 text-center text-lightTextColor dark:text-textColor">
                        در حال دریافت اطلاعات کاربران...
                    </p>
                ) : error ? (
                    <div className="space-y-3 p-6 text-center">
                        <p className="text-red-500">{error}</p>

                        <button
                            type="button"
                            onClick={() => void fetchUsers()}
                            className="cursor-pointer rounded-xl bg-primaryColor px-4 py-2 text-sm text-white transition hover:bg-primaryDark"
                        >
                            تلاش مجدد
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="px-5 pb-3 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            تعداد نتایج: {filteredUsers.length} از{" "}
                            {users.length} کاربر
                        </div>

                        <Table
                            users={filteredUsers}
                            onUserCreated={handleUserCreated}
                        />

                        <Footer users={filteredUsers} />
                    </>
                )}
            </div>
        </div>
    );
}

export default Users;