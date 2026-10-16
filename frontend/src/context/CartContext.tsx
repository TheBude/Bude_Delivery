import React, { createContext, useContext, useState, useMemo } from 'react';
import { hapticImpact, hapticSelection } from '../utils/telegram';

export interface CartItem {
  product: {
    id: string;
    supplier_id: string;
    name: string;
    price: number;
    discount_price?: number | null;
    image_url?: string | null;
    is_available: boolean;
  };
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  activeSupplierId: string | null;
  deliveryFee: number;
  isFreeDelivery: boolean;
  addItem: (product: any, supplierId: string, deliveryFee?: number, isFree?: boolean) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isFreeDelivery, setIsFreeDelivery] = useState<boolean>(false);

  const addItem = React.useCallback((product: any, supplierId: string, fee = 0, isFree = false) => {
    hapticImpact('light');

    // If adding from a different supplier, confirm or clear old cart
    if (activeSupplierId && activeSupplierId !== supplierId && items.length > 0) {
      if (!confirm('Savatda boshqa ta\'minotchi tovarlari bor. Savatni yangilashni xohlaysizmi?')) {
        return;
      }
      setItems([{ product, quantity: 1 }]);
      setActiveSupplierId(supplierId);
      setDeliveryFee(fee);
      setIsFreeDelivery(isFree);
      return;
    }

    setActiveSupplierId(supplierId);
    setDeliveryFee(fee);
    setIsFreeDelivery(isFree);

    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, [activeSupplierId, items.length]);

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    hapticSelection();
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    hapticImpact('medium');
    setItems((prev) => {
      const filtered = prev.filter((i) => i.product.id !== productId);
      if (filtered.length === 0) {
        setActiveSupplierId(null);
      }
      return filtered;
    });
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
    setActiveSupplierId(null);
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price =
        item.product.discount_price !== null && item.product.discount_price !== undefined
          ? item.product.discount_price
          : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [items]);

  const total = useMemo(() => {
    const fee = isFreeDelivery ? 0 : deliveryFee;
    return subtotal + fee;
  }, [subtotal, deliveryFee, isFreeDelivery]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      activeSupplierId,
      deliveryFee,
      isFreeDelivery,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      total,
      itemCount,
    }),
    [
      items,
      activeSupplierId,
      deliveryFee,
      isFreeDelivery,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      total,
      itemCount,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
