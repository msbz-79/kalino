import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import toast from "react-hot-toast";

import {
  FiArrowRight,
  FiChevronLeft,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiShield,
  FiTruck,
  FiPackage,
} from "react-icons/fi";

import Specifications from "./components/Specifications";
import Reviews from "./components/Reviews";
import { useCart } from "../../context/CartContext";

type ProductColor = {
  name: string;
  hex: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount_price?: number | null;
  discount_percentage?: number | null;
  stock: number;
  image: string | null;
  colors?: ProductColor[] | null;
  is_active?: boolean;
};

type ProductApiResponse = {
  data?: Product;
  product?: Product;
} & Partial<Product>;

const productTabs = [
  { id: "introduction", label: "معرفی اجمالی" },
  { id: "description", label: "معرفی تکمیلی" },
  { id: "specifications", label: "مشخصات فنی" },
  { id: "reviews", label: "نظرات" },
  { id: "questions", label: "پرسش و پاسخ" },
];

function ProductDetails() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedColor, setSelectedColor] =
    useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("introduction");

  useEffect(() => {
    if (!id) {
      setError("شناسه محصول معتبر نیست.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:8000/api/products/${id}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "محصول موردنظر پیدا نشد."
              : "دریافت اطلاعات محصول با خطا مواجه شد."
          );
        }

        const result: ProductApiResponse = await response.json();
        const fetchedProduct = result.data ?? result.product ?? result;

        if (fetchedProduct.id == null || fetchedProduct.name == null) {
          throw new Error("ساختار اطلاعات دریافتی از سرور معتبر نیست.");
        }

        const normalizedProduct = fetchedProduct as Product;

        setProduct(normalizedProduct);
        setSelectedColor(normalizedProduct.colors?.[0] ?? null);
        setQuantity(1);

        if (
          normalizedProduct.slug &&
          slug !== normalizedProduct.slug
        ) {
          navigate(
            `/products/${normalizedProduct.id}/${normalizedProduct.slug}`,
            { replace: true }
          );
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.name !== "AbortError"
        ) {
          setError(err.message || "خطایی رخ داده است.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => controller.abort();
  }, [id, slug, navigate]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fa-IR").format(price);

  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (!product.colors?.length) {
      // محصول بدون رنگ قابل انتخاب است.
    } else if (!selectedColor) {
      toast.error("لطفاً رنگ محصول را انتخاب کنید.");
      return;
    }

    if (!product.is_active || product.stock < 1) {
      toast.error("این محصول در حال حاضر ناموجود است.");
      return;
    }

    if (quantity > product.stock) {
      toast.error("تعداد انتخاب‌شده بیشتر از موجودی محصول است.");
      return;
    }

    const finalPrice = Number(
      product.discount_price ?? product.price
    );

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image
        ? product.image.startsWith("http")
          ? product.image
          : `http://localhost:8000/storage/${product.image.replace(
            /^\/?storage\//,
            ""
          )}`
        : "/images/stories/story1.png",
      price: finalPrice,
      quantity,
      selectedColor,
    });

    toast.success("محصول به سبد خرید اضافه شد.");
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-800 lg:col-span-5" />
          <div className="h-96 rounded-2xl bg-gray-200 dark:bg-gray-800 lg:col-span-7" />
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-96 flex-col items-center justify-center gap-4 px-4 text-center">
        <FiPackage size={40} className="text-textColorMuted" />

        <h1 className="text-xl font-DanaMedium">
          محصول در دسترس نیست
        </h1>

        <p className="text-sm text-textColorMuted">
          {error || "اطلاعات محصول پیدا نشد."}
        </p>

        <Link
          to="/"
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primaryColor px-5 py-3 text-white transition hover:opacity-90"
        >
          <FiArrowRight />
          بازگشت به فروشگاه
        </Link>
      </main>
    );
  }

  const discount = Number(product.discount_percentage ?? 0);
  const hasDiscount = discount > 0;

  const finalPrice = Number(
    product.discount_price ?? product.price
  );

  const originalPrice = Number(product.price);

  const inStock =
    Number(product.stock) > 0 &&
    product.is_active !== false;

  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `http://localhost:8000/storage/${product.image.replace(
        /^\/?storage\//,
        ""
      )}`
    : "/images/stories/story1.png";

  return (
    <main className="min-h-screen bg-gray-50/70 pb-12 pt-5 text-lightTextColor dark:bg-[#111315] dark:text-textColor sm:pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="مسیر صفحه"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs text-textColorMuted sm:text-sm"
        >
          <Link
            to="/"
            className="cursor-pointer transition hover:text-primaryColor"
          >
            خانه
          </Link>

          <FiChevronLeft size={15} />
          <span>فروشگاه</span>
          <FiChevronLeft size={15} />

          <span className="max-w-64 truncate font-medium text-lightTextColor dark:text-textColor">
            {product.name}
          </span>
        </nav>

        {/* بخش اصلی محصول */}
        <section
          id="introduction"
          className="scroll-mt-24 grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8"
        >
          {/* تصویر محصول */}
          <div className="lg:col-span-5">
            <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:min-h-[420px] sm:p-10">
              {hasDiscount && (
                <span className="absolute right-5 top-5 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white">
                  {formatPrice(discount)}٪ تخفیف
                </span>
              )}

              <img
                src={imageUrl}
                alt={product.name}
                className="max-h-[360px] w-full object-contain transition duration-300 hover:scale-105"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "/images/stories/story1.png";
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 text-center dark:border-gray-800 dark:bg-surfaceColor sm:flex-row sm:justify-center">
                <FiTruck size={20} className="text-primaryColor" />
                <span className="text-xs sm:text-sm">
                  ارسال سفارش
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 text-center dark:border-gray-800 dark:bg-surfaceColor sm:flex-row sm:justify-center">
                <FiShield size={20} className="text-primaryColor" />
                <span className="text-xs sm:text-sm">
                  خرید مطمئن
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 text-center dark:border-gray-800 dark:bg-surfaceColor sm:flex-row sm:justify-center">
                <FiPackage size={20} className="text-primaryColor" />
                <span className="text-xs sm:text-sm">
                  بسته‌بندی مناسب
                </span>
              </div>
            </div>
          </div>

          {/* اطلاعات و خرید */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  کد محصول: {formatPrice(product.id)}
                </span>

                <span
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${inStock
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                    }`}
                >
                  {inStock
                    ? `موجود در انبار (${formatPrice(
                      product.stock
                    )} عدد)`
                    : "ناموجود"}
                </span>
              </div>

              <h1 className="text-xl font-DanaMedium leading-9 sm:text-2xl">
                {product.name}
              </h1>

              {product.description && (
                <p className="mt-4 whitespace-pre-line text-sm leading-8 text-textColorMuted">
                  {product.description}
                </p>
              )}

              <div className="my-6 h-px bg-gray-100 dark:bg-gray-800" />

              {/* انتخاب رنگ محصول */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <p className="mb-4 text-sm font-DanaMedium">
                    رنگ محصول:
                    <span className="mr-2 font-normal text-textColorMuted">
                      {selectedColor?.name ?? "انتخاب رنگ"}
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => {
                      const selected =
                        selectedColor?.hex === color.hex;

                      return (
                        <button
                          key={`${color.hex}-${color.name}`}
                          type="button"
                          title={color.name}
                          aria-label={`انتخاب رنگ ${color.name}`}
                          aria-pressed={selected}
                          onClick={() => setSelectedColor(color)}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 transition ${selected
                            ? "border-primaryColor bg-primaryColor/10 ring-2 ring-primaryColor"
                            : "border-gray-200 hover:border-primaryColor dark:border-gray-700"
                            }`}
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border border-black/10 ${selected
                              ? "ring-2 ring-primaryColor ring-offset-2 dark:ring-offset-surfaceColor"
                              : ""
                              }`}
                            style={{
                              backgroundColor: color.hex,
                            }}
                          >
                            {selected && (
                              <span
                                className={`h-2 w-2 rounded-full ${color.hex.toLowerCase() === "#ffffff"
                                  ? "bg-black"
                                  : "bg-white"
                                  }`}
                              />
                            )}
                          </span>

                          <span className="text-sm">
                            {color.name}
                          </span>

                          {selected && (
                            <span className="text-xs font-DanaMedium text-primaryColor">
                              انتخاب‌شده
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* قیمت محصول */}
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-[#191c1f] sm:p-5">
                <p className="mb-2 text-sm text-textColorMuted">
                  قیمت محصول
                </p>

                {hasDiscount && (
                  <p className="mb-1 text-sm text-textColorMuted line-through">
                    {formatPrice(originalPrice)} تومان
                  </p>
                )}

                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-DanaMedium sm:text-3xl">
                    {formatPrice(finalPrice)}
                  </span>

                  <span className="text-sm text-textColorMuted">
                    تومان
                  </span>

                  {hasDiscount && (
                    <span className="mr-auto rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                      {formatPrice(discount)}٪ تخفیف
                    </span>
                  )}
                </div>
              </div>

              {/* انتخاب تعداد و افزودن به سبد خرید */}
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                {inStock && (
                  <div className="flex h-12 items-center justify-between rounded-xl border border-gray-200 px-3 dark:border-gray-700 sm:w-36">
                    <button
                      type="button"
                      aria-label="افزایش تعداد"
                      disabled={quantity >= Number(product.stock)}
                      onClick={() =>
                        setQuantity((current) =>
                          Math.min(
                            current + 1,
                            Number(product.stock)
                          )
                        )
                      }
                      className="cursor-pointer rounded-lg p-1.5 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
                    >
                      <FiPlus size={17} />
                    </button>

                    <span className="min-w-6 text-center">
                      {formatPrice(quantity)}
                    </span>

                    <button
                      type="button"
                      aria-label="کاهش تعداد"
                      disabled={quantity <= 1}
                      onClick={() =>
                        setQuantity((current) =>
                          Math.max(1, current - 1)
                        )
                      }
                      className="cursor-pointer rounded-lg p-1.5 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
                    >
                      <FiMinus size={17} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!inStock}
                  onClick={handleAddToCart}
                  className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primaryColor px-5 font-DanaMedium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  <FiShoppingCart size={20} />
                  {inStock
                    ? "افزودن به سبد خرید"
                    : "محصول ناموجود است"}
                </button>
              </div>

              {inStock && (
                <p className="mt-3 text-xs text-textColorMuted">
                  تعداد انتخاب‌شده: {formatPrice(quantity)} عدد
                </p>
              )}
            </div>
          </div>
        </section>

        {/* نوار تب‌های جزئیات */}
        <nav className="sticky top-0 z-20 mt-8 rounded-2xl border border-gray-100 bg-white p-3 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-4">
          <div className="flex gap-2 overflow-x-auto">
            {productTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToSection(tab.id)}
                className={`shrink-0 cursor-pointer rounded-xl px-4 py-3 text-sm transition ${activeTab === tab.id
                  ? "bg-primaryColor font-DanaMedium text-white"
                  : "bg-blue-50 text-lightTextColor hover:bg-blue-100 dark:bg-gray-800 dark:text-textColor dark:hover:bg-gray-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* معرفی تکمیلی */}
        <section
          id="description"
          className="mt-6 scroll-mt-28 rounded-2xl border border-gray-100 bg-white p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-7"
        >
          <div className="mb-6">
            <h2 className="text-xl font-DanaMedium">
              معرفی تکمیلی محصول
            </h2>
            <div className="mt-3 h-1 w-14 rounded-full bg-primaryColor" />
          </div>

          {product.description ? (
            <p className="whitespace-pre-line text-sm leading-8 text-textColorMuted sm:text-base">
              {product.description}
            </p>
          ) : (
            <p className="text-sm leading-8 text-textColorMuted">
              توضیحات تکمیلی برای این محصول ثبت نشده است.
            </p>
          )}
        </section>

        {/* مشخصات فنی */}
        <div id="specifications" className="mt-6 scroll-mt-28">
          <Specifications />
        </div>

        {/* نظرات کاربران */}
        <div id="reviews" className="mt-6 scroll-mt-28">
          <Reviews productId={product.id} />
        </div>

        {/* پرسش و پاسخ */}
        <section
          id="questions"
          className="mt-6 scroll-mt-28 rounded-2xl border border-gray-100 bg-white p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-7"
        >
          <div className="mb-6">
            <h2 className="text-xl font-DanaMedium">
              پرسش و پاسخ
            </h2>
            <div className="mt-3 h-1 w-14 rounded-full bg-primaryColor" />
          </div>

          <p className="text-sm leading-7 text-textColorMuted">
            هنوز پرسشی برای این محصول ثبت نشده است.
          </p>
        </section>
      </div>
    </main>
  );
}

export default ProductDetails;