import { Link } from "react-router";

type Product = {
    id: number;
    name: string;
    image: string | null;
    slug: string;
    price: number;
    discount_percentage?: number | null;
    original_price?: number | null;
};

type ProductCardProps = {
    product: Product;
};

function ProductCard({ product }: ProductCardProps) {
    const name = product?.name ?? "محصول";
    const image = product?.image ?? "/images/stories/story1.png";

    const price = Number(product?.price ?? 0);
    const discountPercentage = Number(
        product?.discount_percentage ?? 0
    );

    const hasDiscount = discountPercentage > 0;

    const formattedPrice = new Intl.NumberFormat("fa-IR").format(price);

    const formattedOriginalPrice =
        product?.original_price != null
            ? new Intl.NumberFormat("fa-IR").format(
                  Number(product.original_price)
              )
            : "";

    return (
        <Link
            to={`/products/${product.id}/${product.slug}`}
            className="group block w-full max-w-[220px]"
        >
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-lightSurfaceColor text-lightTextColor shadow-lightBoxShadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-surfaceColor dark:text-textColor dark:shadow-darkBoxShadow">

                {/* تصویر محصول */}
                <div className="relative flex h-48 shrink-0 items-center justify-center overflow-hidden bg-gray-50 p-4 dark:bg-gray-900/30">

                    {hasDiscount && (
                        <span className="absolute right-3 top-3 z-10 rounded-lg bg-red-500 px-2.5 py-1 text-xs font-DanaMedium text-white shadow-sm">
                            {new Intl.NumberFormat("fa-IR").format(
                                discountPercentage
                            )}
                            ٪ تخفیف
                        </span>
                    )}

                    <img
                        src={image}
                        alt={name}
                        loading="lazy"
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                {/* اطلاعات محصول */}
                <div className="flex flex-1 flex-col justify-between gap-4 p-4">

                    {/* نام محصول */}
                    <p className="line-clamp-2 min-h-12 text-sm font-DanaMedium leading-6">
                        {name}
                    </p>

                    {/* بخش قیمت با ارتفاع ثابت */}
                    <div className="flex min-h-[52px] flex-col justify-end gap-1">

                        {/* قیمت اصلی */}
                        <div className="flex h-5 items-center justify-end">
                            {hasDiscount && formattedOriginalPrice && (
                                <span className="text-xs text-textColorMuted line-through">
                                    {formattedOriginalPrice} تومان
                                </span>
                            )}
                        </div>

                        {/* قیمت نهایی */}
                        <div className="flex h-6 items-center justify-between gap-2">
                            <span className="text-xs text-textColorMuted">
                                قیمت:
                            </span>

                            <div className="flex items-center gap-1">
                                <span className="text-base font-DanaDemiBold text-primaryColor">
                                    {formattedPrice}
                                </span>

                                <span className="text-xs text-textColorMuted">
                                    تومان
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default ProductCard;
