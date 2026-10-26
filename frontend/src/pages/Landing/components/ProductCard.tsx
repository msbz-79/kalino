
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
    const discountPercentage = Number(product?.discount_percentage ?? 0);
    const hasDiscount = discountPercentage > 0;

    const formattedPrice = new Intl.NumberFormat("fa-IR").format(price);

    const formattedOriginalPrice =
        product?.original_price != null
            ? new Intl.NumberFormat("fa-IR").format(
                  Number(product.original_price)
              )
            : "";

    return (
        <Link to={`/products/${product.id}/${product.slug}`} className="block">
            <div className="flex flex-col w-50 bg-lightSurfaceColor dark:bg-surfaceColor text-lightTextColor dark:text-textColor rounded-lg shadow-lightBoxShadow dark:shadow-darkBoxShadow mb-2">
                <div className="w-full">
                    <img src={image} alt={name} />
                </div>

                <div className="flex flex-col p-5">
                    <p className="font-DanaMedium text-xl">{name}</p>

                    {hasDiscount && (
                        <>
                            <span className="text-left text-textColorMuted text-sm line-through">
                                {formattedOriginalPrice
                                    ? `${formattedOriginalPrice} تومان`
                                    : ""}
                            </span>

                            <div className="flex items-center justify-between">
                                <span className="bg-secondaryColor p-1 rounded-4xl">
                                    {discountPercentage}%
                                </span>

                                <span className="text-lg font-medium">
                                    {formattedPrice}
                                </span>
                            </div>
                        </>
                    )}

                    {!hasDiscount && (
                        <div className="flex items-center justify-end">
                            <span className="text-lg font-medium">
                                {formattedPrice}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

export default ProductCard;
