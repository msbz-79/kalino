import { useState } from "react";
import { LuUserPlus } from "react-icons/lu";
import { IoMdAdd } from "react-icons/io";
import Modal from "./Modal";
import { IoNewspaperOutline } from "react-icons/io5";

function Header() {
    const [modalMode, setModalMode] = useState<
        "add" | "edit" | null
    >(null);

    const openAddModal = () => {
        setModalMode("add");
    };

    const closeModal = () => {
        setModalMode(null);
    };

    return (
        <>
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-lightBorderColor bg-lightSurfaceColor p-5 shadow-lightBoxShadow dark:border-borderColor dark:bg-surfaceColor dark:shadow-darkBoxShadow sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor">
                        <IoNewspaperOutline size={25} />
                    </div>

                    <div>
                        <h1 className="font-DanaBold text-xl text-lightTextColor dark:text-textColor">
                            مدیریت محصولات
                        </h1>

                        <p className="mt-1 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                            مشاهده و مدیریت محصولات فروشگاه
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primaryColor px-4 py-3 font-DanaMedium text-sm text-white transition hover:bg-primaryDark"
                >
                    <IoMdAdd size={18} />
                    افزودن محصول
                </button>
            </div>

            {modalMode !== null && (
                <Modal
                    mode={modalMode}
                    onClose={closeModal}
                />
            )}
        </>
    );
}

export default Header;