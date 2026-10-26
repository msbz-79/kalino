import {
    LuCalendarDays,
    LuMail,
    LuPencil,
    LuPhone,
    LuSearch,
    LuShieldCheck,
    LuTrash2,
    LuUserRound,
} from "react-icons/lu";
import { useState } from "react";
import Modal from "./Modal";
import DeleteModal from "./DeleteModal";

type UserRole = "admin" | "user";

type User = {
    id: number;
    name: string;
    email: string;
    mobile: string;
    role: UserRole;
    createdAt: string;
};

type CreatedUser = {
    id: number;
    name: string;
    email: string;
    mobile: string | null;
    role: UserRole;
    created_at: string;
};

type UsersPageProps = {
    users: User[];
    onUserCreated: (user: User) => void;
};

// تبدیل تاریخ میلادی به شمسی
function formatPersianDate(dateString: string): string {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "نامشخص";
    }

    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

function Table({ users, onUserCreated }: UsersPageProps) {
    const [modalMode, setModalMode] = useState<
        "add" | "edit" | null
    >(null);

    const [deleteUser, setDeleteUser] =
        useState<User | null>(null);

    const [selectedUser, setSelectedUser] =
        useState<User | null>(null);

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setModalMode("edit");
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedUser(null);
    };

    const openDeleteModal = (user: User) => {
        setDeleteUser(user);
    };

    const closeDeleteModal = () => {
        setDeleteUser(null);
    };

    const handleUserCreated = (createdUser: CreatedUser) => {
        const newUser: User = {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            mobile: createdUser.mobile ?? "",
            role: createdUser.role,
            createdAt: createdUser.created_at,
        };

        onUserCreated(newUser);
    };

    return (
        <>
            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-180 border-collapse text-right">
                    <thead>
                        <tr className="border-y border-lightBorderColor bg-lightBackgroundColor dark:border-borderColor dark:bg-backgroundColor">
                            <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                کاربر
                            </th>
                            <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                اطلاعات تماس
                            </th>
                            <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                نقش
                            </th>
                            <th className="px-5 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                تاریخ عضویت
                            </th>
                            <th className="px-5 py-4 text-center text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                عملیات
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-lightBorderColor transition last:border-b-0 hover:bg-lightSurfaceHoverColor dark:border-borderColor dark:hover:bg-surfaceHoverColor"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                                                <LuUserRound size={20} />
                                            </div>

                                            <div>
                                                <p className="whitespace-nowrap font-DanaMedium text-sm text-lightTextColor dark:text-textColor">
                                                    {user.name}
                                                </p>
                                                <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                    شناسه: {user.id}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                <LuMail
                                                    size={14}
                                                    className="shrink-0"
                                                />
                                                <span dir="ltr">
                                                    {user.email}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                <LuPhone
                                                    size={14}
                                                    className="shrink-0"
                                                />
                                                <span dir="ltr">
                                                    {user.mobile || "ثبت نشده"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        {user.role === "admin" ? (
                                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-DanaMedium text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                                                <LuShieldCheck size={15} />
                                                مدیر
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-100 px-2.5 py-1.5 text-xs font-DanaMedium text-teal-800 dark:bg-teal-400/15 dark:text-teal-300">
                                                <LuUserRound size={14} />
                                                کاربر عادی
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2 whitespace-nowrap text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                            <LuCalendarDays size={15} />
                                            {formatPersianDate(user.createdAt)}
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                title="ویرایش کاربر"
                                                aria-label={`ویرایش ${user.name}`}
                                                onClick={() => openEditModal(user)}
                                                className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor transition hover:bg-primaryColor hover:text-white"
                                            >
                                                <LuPencil size={17} />
                                            </button>

                                            <button
                                                type="button"
                                                title="حذف کاربر"
                                                aria-label={`حذف ${user.name}`}
                                                onClick={() => openDeleteModal(user)}
                                                className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition hover:bg-red-500 hover:text-white"
                                            >
                                                <LuTrash2 size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-5 py-12 text-center"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <LuSearch
                                            size={30}
                                            className="text-lightTextColorMuted dark:text-textColorMuted"
                                        />
                                        <p className="font-DanaMedium text-sm text-lightTextColor dark:text-textColor">
                                            کاربری پیدا نشد
                                        </p>
                                        <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                            هنوز کاربری برای نمایش وجود ندارد.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modalMode !== null && (
                <Modal
                    mode={modalMode}
                    user={selectedUser}
                    onClose={closeModal}
                    onCreated={handleUserCreated}
                />
            )}

            {deleteUser !== null && (
                <DeleteModal
                    deleteUser={deleteUser}
                    onClose={closeDeleteModal}
                />
            )}
        </>
    );
}

export default Table;
