
type Product = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
};

type FooterProps = {
    products?: Product[];
};

function Footer({ products = [] }: FooterProps) {
    const activeProductsCount = products.filter(
        (product) => product.is_active
    ).length;

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-lightBorderColor px-5 py-4 dark:border-borderColor">
            <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                نمایش {products.length} رکورد از {products.length} محصول
            </p>

            <p className="text-xs text-lightTextColorMuted dark:text-textColorMuted">
                تعداد محصولات فعال: {activeProductsCount}
            </p>
        </div>
    );
}

export default Footer;
