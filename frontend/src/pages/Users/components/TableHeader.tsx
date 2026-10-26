
import { useState } from "react";
import {
    LuChevronDown,
    LuArrowUpDown,
    LuSearch,
    LuUsersRound,
} from "react-icons/lu";

export type SortOrder = "asc" | "desc";
export type UserRoleFilter = "all" | "admin" | "user";

type TableHeaderProps = {
    onSearchChange: (value: string) => void;
    onRoleChange: (role: UserRoleFilter) => void;
    onSortChange: (order: SortOrder) => void;
};

function TableHeader({
    onSearchChange,
    onRoleChange,
    onSortChange,
}: TableHeaderProps) {
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    const handleSort = () => {
        const nextOrder = sortOrder === "asc" ? "desc" : "asc";

        setSortOrder(nextOrder);
        onSortChange(nextOrder);
    };

    return (
        <div className="space-y-4 p-5">
            <div className="flex items-center gap-2">
                <LuUsersRound
                    size={20}
                    className="text-primaryColor"
                />

                <h2 className="font-DanaBold text-base text-lightTextColor dark:text-textColor">
                    فهرست کاربران
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_auto]">
                <div className="relative min-w-0">
                    <LuSearch
                        size={18}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
                    />

                    <input
                        type="search"
                        placeholder="جستجو بر اساس نام، ایمیل یا موبایل..."
                        onChange={(event) =>
                            onSearchChange(event.target.value)
                        }
                        className="w-full rounded-xl border border-lightBorderColor bg-lightBackgroundColor py-3 pr-10 pl-3 text-sm text-lightTextColor outline-none transition placeholder:text-lightTextColorMuted focus:border-primaryColor dark:border-borderColor dark:bg-backgroundColor dark:text-textColor dark:placeholder:text-textColorMuted"
                    />
                </div>

                <div className="relative">
                    <LuChevronDown
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
                    />

                    <select
                        defaultValue="all"
                        onChange={(event) =>
                            onRoleChange(
                                event.target.value as UserRoleFilter
                            )
                        }
                        className="w-full cursor-pointer appearance-none rounded-xl border border-lightBorderColor bg-lightBackgroundColor px-4 py-3 text-sm text-lightTextColor outline-none transition focus:border-primaryColor dark:border-borderColor dark:bg-backgroundColor dark:text-textColor"
                    >
                        <option value="all">همه نقش‌ها</option>
                        <option value="admin">مدیران</option>
                        <option value="user">کاربران عادی</option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={handleSort}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-lightBorderColor bg-lightSurfaceColor px-3 py-3 text-sm text-lightTextColor transition hover:border-primaryColor dark:border-borderColor dark:bg-surfaceColor dark:text-textColor"
                >
                    <LuArrowUpDown size={17} />

                    {sortOrder === "asc"
                        ? "نام: الف تا ی"
                        : "نام: ی تا الف"}
                </button>
            </div>
        </div>
    );
}

export default TableHeader;
