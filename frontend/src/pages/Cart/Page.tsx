import { Link } from "react-router";
import { LuArrowRight, LuMinus, LuPlus, LuShoppingCart, LuTrash2 } from "react-icons/lu";
import { useCart } from "../../context/CartContext";

function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const formatPrice = (price: number) => new Intl.NumberFormat("fa-IR").format(price);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50/70 pb-12 pt-6 text-lightTextColor dark:bg-[#111315] dark:text-textColor sm:pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link to="/" className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm text-textColorMuted transition hover:text-primaryColor"><LuArrowRight size={18} /> بازگشت به فروشگاه</Link>
        <h1 className="mb-6 text-2xl font-DanaMedium">سبد خرید</h1>

        {items.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white px-5 py-16 text-center shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor">
            <LuShoppingCart size={48} className="mb-4 text-textColorMuted" />
            <h2 className="text-lg font-DanaMedium">سبد خرید شما خالی است</h2>
            <p className="mt-2 text-sm text-textColorMuted">برای شروع، محصول موردنظرتان را به سبد خرید اضافه کنید.</p>
            <Link to="/" className="mt-6 cursor-pointer rounded-xl bg-primaryColor px-6 py-3 text-sm text-white transition hover:opacity-90">رفتن به فروشگاه</Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <section className="space-y-4 lg:col-span-2">
              {items.map((item) => {
                const colorHex = item.selectedColor?.hex ?? null;
                return (
                  <article key={`${item.id}-${colorHex ?? "no-color"}`} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:flex-row sm:items-center sm:p-5">
                    <img src={item.image || "/images/stories/story1.png"} alt={item.name} className="h-28 w-full rounded-xl bg-gray-50 object-contain p-2 dark:bg-gray-800 sm:w-28" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/products/${item.id}/${item.slug}`} className="font-DanaMedium transition hover:text-primaryColor">{item.name}</Link>
                      {item.selectedColor && <p className="mt-2 flex items-center gap-2 text-sm text-textColorMuted"><span className="inline-block h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: item.selectedColor.hex }} />رنگ: {item.selectedColor.name}</p>}
                      <p className="mt-2 text-sm text-textColorMuted">قیمت واحد: {formatPrice(item.price)} تومان</p>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex h-10 items-center gap-3 rounded-xl border border-gray-200 px-2 dark:border-gray-700">
                          <button type="button" aria-label="افزایش تعداد" onClick={() => updateQuantity(item.id, colorHex, item.quantity + 1)} className="cursor-pointer rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"><LuPlus size={16} /></button>
                          <span className="min-w-5 text-center text-sm">{formatPrice(item.quantity)}</span>
                          <button type="button" aria-label="کاهش تعداد" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, colorHex, item.quantity - 1)} className="cursor-pointer rounded-lg p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"><LuMinus size={16} /></button>
                        </div>
                        <p className="font-DanaMedium">{formatPrice(item.price * item.quantity)} تومان</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(item.id, colorHex)} className="flex cursor-pointer items-center justify-center gap-2 self-start rounded-lg p-2 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30 sm:self-center"><LuTrash2 size={17} /> حذف</button>
                  </article>
                );
              })}
              <button type="button" onClick={clearCart} className="cursor-pointer text-sm text-red-500 transition hover:text-red-700">خالی کردن سبد خرید</button>
            </section>

            <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lightBoxShadow dark:border-gray-800 dark:bg-surfaceColor sm:p-6">
              <h2 className="mb-5 text-lg font-DanaMedium">خلاصه سفارش</h2>
              <div className="flex items-center justify-between gap-3 text-sm"><span className="text-textColorMuted">جمع محصولات</span><span>{formatPrice(total)} تومان</span></div>
              <div className="my-4 h-px bg-gray-100 dark:bg-gray-800" />
              <div className="flex items-center justify-between gap-3"><span className="font-DanaMedium">مبلغ قابل پرداخت</span><span className="text-lg font-DanaMedium text-primaryColor">{formatPrice(total)} تومان</span></div>
              <Link
                to="/checkout"
                className="mt-6 block w-full rounded-xl bg-primaryColor px-5 py-3 text-center font-DanaMedium text-white transition hover:opacity-90"
              >
                ادامه فرایند خرید
              </Link>              <p className="mt-3 text-xs leading-6 text-textColorMuted">هزینه ارسال در مرحله بعد محاسبه می‌شود. پرداخت آنلاین هنوز به این صفحه متصل نشده است.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default CartPage;
