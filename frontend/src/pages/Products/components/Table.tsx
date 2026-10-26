import { useState } from "react";
import { LuPencil, LuTrash2, LuImage } from "react-icons/lu";
import Modal from "./Modal";
import DeleteModal from "./DeleteModal";

export type ProductColor = {
    name: string;
    hex: string;
};

export type Product = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image: string | null;
    colors?: ProductColor[] | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    discount_percentage: number | null;
    discount_price: number | null;
    is_special_offer: boolean;
};

type TableProps = {
    products: Product[];
    onProductChanged: () => void;
};

function Table({ products, onProductChanged }: TableProps) {
    const [selectedProduct, setSelectedProduct] =
        useState<Product | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const formatPrice = (price: number) =>
        `${Number(price).toLocaleString("fa-IR")} تومان`;

    const openEditModal = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    const openDeleteModal = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedProduct(null);
    };

    const handleProductChanged = () => {
        onProductChanged();
    };

    const deleteProduct = async () => {
        if (!selectedProduct) return;

        const response = await fetch(
            `http://localhost:8000/api/products/${selectedProduct.id}`,
            {
                method: "DELETE",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error("حذف محصول با خطا مواجه شد.");
        }
    };

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-right">
                    <thead className="bg-lightBackgroundColor dark:bg-backgroundColor">
                        <tr className="border-b border-lightBorderColor dark:border-borderColor">
                            <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                محصول
                            </th>

                            <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                توضیحات
                            </th>

                            <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                رنگ
                            </th>

                            <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                قیمت
                            </th>

                            <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                درصد تخفیف
                            </th>

                            <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                موجودی
                            </th>

                            <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                وضعیت
                            </th>

                            <th className="px-4 py-4 text-xs font-DanaMedium text-lightTextColorMuted dark:text-textColorMuted">
                                عملیات
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {products.map((product) => (
                            <tr
                                key={product.id}
                                className="border-b border-lightBorderColor transition hover:bg-lightBackgroundColor/60 dark:border-borderColor dark:hover:bg-backgroundColor/60"
                            >
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="size-12 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-12 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                                                <LuImage size={22} />
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-sm text-lightTextColor dark:text-textColor">
                                                {product.name}
                                            </p>

                                            <p className="mt-1 text-xs text-lightTextColorMuted dark:text-textColorMuted">
                                                شناسه: {product.id}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="max-w-[240px] px-4 py-4 text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                    <p className="line-clamp-2">
                                        {product.description || "—"}
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    {product.colors &&
                                    product.colors.length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {product.colors.map(
                                                (color, index) => (
                                                    <div
                                                        key={`${color.hex}-${index}`}
                                                        className="flex items-center gap-2"
                                                        title={color.name}
                                                    >
                                                        <span
                                                            className="size-4 shrink-0 rounded-full border border-lightBorderColor dark:border-borderColor"
                                                            style={{
                                                                backgroundColor:
                                                                    color.hex,
                                                            }}
                                                        />

                                                        <span className="text-sm text-lightTextColor dark:text-textColor">
                                                            {color.name}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                            —
                                        </span>
                                    )}
                                </td>

                                <td className="whitespace-nowrap px-4 py-4 text-sm text-lightTextColor dark:text-textColor">
                                    {formatPrice(product.price)}
                                </td>

                                <td className="whitespace-nowrap px-4 py-4">
                                    {product.discount_percentage ? (
                                        <span className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                            {product.discount_percentage.toLocaleString(
                                                "fa-IR"
                                            )}
                                            ٪
                                        </span>
                                    ) : (
                                        <span className="text-sm text-lightTextColorMuted dark:text-textColorMuted">
                                            —
                                        </span>
                                    )}
                                </td>

                                <td className="px-4 py-4 text-sm text-lightTextColor dark:text-textColor">
                                    {product.stock.toLocaleString("fa-IR")}
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded-lg px-3 py-1.5 text-xs ${
                                                product.is_active
                                                    ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                                    : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                                            }`}
                                        >
                                            {product.is_active
                                                ? "فعال"
                                                : "غیرفعال"}
                                        </span>

                                        {product.is_special_offer && (
                                            <span className="rounded-lg bg-yellow-100 px-3 py-1.5 text-xs text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300">
                                                شگفت‌انگیز
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditModal(product)
                                            }
                                            aria-label="ویرایش محصول"
                                            className="cursor-pointer rounded-lg p-2 text-primaryColor transition hover:bg-primaryColor/10"
                                        >
                                            <LuPencil size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openDeleteModal(product)
                                            }
                                            aria-label="حذف محصول"
                                            className="cursor-pointer rounded-lg p-2 text-red-500 transition hover:bg-red-500/10"
                                        >
                                            <LuTrash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {products.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-10 text-center text-sm text-lightTextColorMuted dark:text-textColorMuted"
                                >
                                    محصولی برای نمایش وجود ندارد.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && selectedProduct && (
                <Modal
                    mode="edit"
                    product={selectedProduct}
                    onClose={closeModal}
                    onSaved={handleProductChanged}
                />
            )}

            {isDeleteModalOpen && selectedProduct && (
                <DeleteModal
                    deleteProduct={deleteProduct}
                    onClose={closeDeleteModal}
                    onDeleted={handleProductChanged}
                />
            )}
        </>
    );
}

export default Table;