type UserRole = "admin" | "user";

type User = {
    id: number;
    name: string;
    email: string;
    mobile: string;
    role: UserRole;
    createdAt: string;
};

type UsersPageProps = {
    users: User[];
};

function Footer({ users }: UsersPageProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-lightBorderColor px-5 py-4 dark:border-borderColor">
            <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                نمایش {users.length} رکورد از {users.length} کاربر
            </p>

            <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                تعداد مدیران:{" "}
                {users.filter((user) => user.role === "admin").length}
            </p>
        </div>)
}

export default Footer