import { useState } from "react";
import { IoNewspaperOutline } from "react-icons/io5";
import { LuChevronDown, LuSearch } from "react-icons/lu";

export type SortOrder =
    | "name-asc"
    | "name-desc"
    | "price-asc"
    | "price-desc";

export type ProductStatusFilter =
    | "all"
    | "active"
    | "inactive"
    | "special-offer"
    | "discounted";

type TableHeaderProps = {
    onSearchChange: (value: string) => void;
    onStatusChange: (status: ProductStatusFilter) => void;
    onSortChange: (order: SortOrder) => void;
};

function TableHeader({
    onSearchChange,
    onStatusChange,
    onSortChange,
}: TableHeaderProps) {
    const [nameSort, setNameSort] =
        useState<"name-asc" | "name-desc">("name-asc");

    const [priceSort, setPriceSort] =
        useState<"price-asc" | "price-desc">("price-asc");

    const handleNameSort = (
        value: "name-asc" | "name-desc"
    ) => {
        setNameSort(value);
        onSortChange(value);
    };

    const handlePriceSort = (
        value: "price-asc" | "price-desc"
    ) => {
        setPriceSort(value);
        onSortChange(value);
    };

    const selectClassName =
        "w-full cursor-pointer appearance-none rounded-xl border border-lightBorderColor bg-lightBackgroundColor px-4 py-3 text-sm text-lightTextColor outline-none transition focus:border-primaryColor dark:border-borderColor dark:bg-backgroundColor dark:text-textColor";

    return (
        <div className="space-y-4 p-5">
            <div className="flex items-center gap-2">
                <IoNewspaperOutline
                    size={20}
                    className="text-primaryColor"
                />

                <h2 className="font-DanaBold text-base text-lightTextColor dark:text-textColor">
                    فهرست محصولات
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_170px_170px]">
                {/* جستجوی محصولات */}
                <div className="relative min-w-0">
                    <LuSearch
                        size={18}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
                    />

                    <input
                        type="search"
                        placeholder="جستجو بر اساس نام یا توضیحات محصول..."
                        onChange={(event) =>
                            onSearchChange(event.target.value)
                        }
                        className="w-full rounded-xl border border-lightBorderColor bg-lightBackgroundColor py-3 pr-10 pl-3 text-sm text-lightTextColor outline-none transition placeholder:text-lightTextColorMuted focus:border-primaryColor dark:border-borderColor dark:bg-backgroundColor dark:text-textColor dark:placeholder:text-textColorMuted"
                    />
                </div>

                {/* فیلتر وضعیت و نوع محصولات */}
                <div className="relative">
                    <LuChevronDown
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
                    />

                    <select
                        defaultValue="all"
                        onChange={(event) =>
                            onStatusChange(
                                event.target.value as ProductStatusFilter
                            )
                        }
                        className={selectClassName}
                    >
                        <option value="all">همه محصولات</option>
                        <option value="active">محصولات فعال</option>
                        <option value="inactive">محصولات غیرفعال</option>
                        <option value="special-offer">
                            محصولات شگفت‌انگیز
                        </option>
                        <option value="discounted">
                            محصولات دارای تخفیف
                        </option>
                    </select>
                </div>

                {/* مرتب‌سازی بر اساس نام */}
                <div className="relative">
                    <LuChevronDown
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
                    />

                    <select
                        value={nameSort}
                        onChange={(event) =>
                            handleNameSort(
                                event.target.value as
                                    | "name-asc"
                                    | "name-desc"
                            )
                        }
                        className={selectClassName}
                    >
                        <option value="name-asc">
                            نام: الف تا ی
                        </option>

                        <option value="name-desc">
                            نام: ی تا الف
                        </option>
                    </select>
                </div>

                {/* مرتب‌سازی بر اساس قیمت */}
                <div className="relative">
                    <LuChevronDown
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lightTextColorMuted dark:text-textColorMuted"
                    />

                    <select
                        value={priceSort}
                        onChange={(event) =>
                            handlePriceSort(
                                event.target.value as
                                    | "price-asc"
                                    | "price-desc"
                            )
                        }
                        className={selectClassName}
                    >
                        <option value="price-asc">
                            قیمت: کم به زیاد
                        </option>

                        <option value="price-desc">
                            قیمت: زیاد به کم
                        </option>
                    </select>
                </div>
            </div>
        </div>
    );
}

export default TableHeader;