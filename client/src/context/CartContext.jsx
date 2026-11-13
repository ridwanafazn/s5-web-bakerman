/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'bakerman_cart_v1';
const CartContext = createContext(null);

function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.slug === product.slug);
      if (existing) {
        return current.map((item) =>
          item.slug === product.slug
            ? { ...item, qty: Math.min(10, item.qty + qty) }
            : item
        );
      }

      return [
        ...current,
        {
          slug: product.slug,
          id: product.id,
          name: product.name,
          price: product.price,
          sugarGrams: product.sugarGrams,
          sugarLevel: product.sugarLevel,
          image: product.image,
          category: product.category,
          qty,
        },
      ];
    });
  };

  const updateQty = (slug, qty) => {
    setItems((current) =>
      current.map((item) =>
        item.slug === slug
          ? { ...item, qty: Math.max(1, Math.min(10, Number(qty) || 1)) }
          : item
      )
    );
  };

  const removeItem = (slug) => {
    setItems((current) => current.filter((item) => item.slug !== slug));
  };

  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalSugar = items.reduce(
      (sum, item) => sum + item.sugarGrams * item.qty,
      0
    );
    return { itemCount, subtotal, totalSugar };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQty,
      removeItem,
      clear,
      ...totals,
    }),
    [items, totals]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart harus dipakai di dalam CartProvider');
  }
  return context;
}
