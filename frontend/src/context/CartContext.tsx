import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartColor = {
  name: string;
  hex: string;
};

export type CartItem = {
  id: number;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  selectedColor: CartColor | null;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (
    id: number,
    colorHex?: string | null
  ) => void;
  updateQuantity: (
    id: number,
    colorHex: string | null,
    quantity: number
  ) => void;
  clearCart: () => void;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

const STORAGE_KEY = "kalino_cart";

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: CartItem) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) =>
          item.id === newItem.id &&
          (item.selectedColor?.hex ?? null) ===
            (newItem.selectedColor?.hex ?? null)
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === newItem.id &&
          (item.selectedColor?.hex ?? null) ===
            (newItem.selectedColor?.hex ?? null)
            ? {
                ...item,
                quantity: item.quantity + newItem.quantity,
              }
            : item
        );
      }

      return [...currentItems, newItem];
    });
  };

  const removeFromCart = (
    id: number,
    colorHex?: string | null
  ) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          !(
            item.id === id &&
            (colorHex === undefined ||
              (item.selectedColor?.hex ?? null) === colorHex)
          )
      )
    );
  };

  const updateQuantity = (
    id: number,
    colorHex: string | null,
    quantity: number
  ) => {
    if (quantity < 1) return;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id &&
        (item.selectedColor?.hex ?? null) === colorHex
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const cartCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart باید داخل CartProvider استفاده شود."
    );
  }

  return context;
}
