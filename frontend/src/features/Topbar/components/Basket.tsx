import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LuShoppingCart, LuTrash2 } from "react-icons/lu";
import { useCart } from "../../../context/CartContext";

function Basket() {
  const { items, cartCount, removeFromCart } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fa-IR").format(price);

  const isMobile = () => window.matchMedia("(max-width: 1023px)").matches;

  const handleBasketClick = () => {
    if (isMobile()) {
      setOpen(false);
      navigate("/cart");
      return;
    }

    setOpen((value) => !value);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        if (!isMobile()) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!isMobile()) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label="سبد خرید"
        aria-expanded={!isMobile() && open}
        onClick={handleBasketClick}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lightButtonShadow transition-all duration-300 hover:bg-slate-100 hover:shadow-md active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <LuShoppingCart className="size-5" />

        {cartCount > 0 && (
          <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primaryColor px-1 text-[10px] text-white">
            {formatPrice(cartCount)}
          </span>
        )}
      </button>

      {!isMobile() && open && (
        <div
          className="absolute left-0 top-full z-[70] w-[min(360px,90vw)] pt-2"
          dir="rtl"
        >
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-lightTextColor shadow-xl dark:border-gray-700 dark:bg-surfaceColor dark:text-textColor">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-DanaMedium">سبد خرید</h3>
              <span className="text-xs text-textColorMuted">
                {formatPrice(cartCount)} کالا
              </span>
            </div>

            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-textColorMuted">
                سبد خرید شما خالی است.
              </p>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto">
                {items.slice(0, 5).map((item) => (
                  <div
                    key={`${item.id}-${item.selectedColor?.hex ?? "no-color"}`}
                    className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700"
                  >
                    <img
                      src={item.image || "/images/stories/story1.png"}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-lg bg-gray-50 object-contain dark:bg-gray-800"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm">{item.name}</p>

                      {item.selectedColor && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-textColorMuted">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-black/10"
                            style={{
                              backgroundColor: item.selectedColor.hex,
                            }}
                          />
                          رنگ: {item.selectedColor.name}
                        </p>
                      )}

                      <p className="mt-1 text-sm font-DanaMedium">
                        {formatPrice(item.price)} تومان ×{" "}
                        {formatPrice(item.quantity)}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label="حذف از سبد خرید"
                      onClick={() =>
                        removeFromCart(
                          item.id,
                          item.selectedColor?.hex ?? null,
                        )
                      }
                      className="h-fit cursor-pointer rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </div>
                ))}

                {items.length > 5 && (
                  <p className="text-center text-xs text-textColorMuted">
                    و {formatPrice(items.length - 5)} محصول دیگر...
                  </p>
                )}
              </div>
            )}

            <Link
              to="/cart"
              onClick={() => setOpen(false)}
              className="mt-3 flex w-full cursor-pointer items-center justify-center rounded-xl bg-primaryColor px-4 py-3 text-sm font-DanaMedium text-white transition hover:opacity-90"
            >
              مشاهده سبد خرید
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Basket;