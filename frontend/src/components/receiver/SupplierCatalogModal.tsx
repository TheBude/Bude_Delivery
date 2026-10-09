import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { ArrowLeft, ShoppingBag, Plus, Minus, Truck, Sparkles, ImageOff } from 'lucide-react';
import { hapticImpact } from '../../utils/telegram';

interface SupplierCatalogModalProps {
  supplier: any;
  onClose: () => void;
  onOpenCheckout: () => void;
}

export const SupplierCatalogModal: React.FC<SupplierCatalogModalProps> = ({
  supplier,
  onClose,
  onOpenCheckout,
}) => {
  const { t } = useTranslation();
  const { items, addItem, updateQuantity, itemCount, total } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        // Only available products as required
        const data = await api.products.getBySupplier(supplier.id, false);
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [supplier.id]);

  const getItemQuantity = (productId: string) => {
    const item = items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              hapticImpact('light');
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
              {supplier.company_name}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3" />
                {supplier.is_free_delivery
                  ? 'Yetkazish bepul'
                  : `${Number(supplier.delivery_fee).toLocaleString()} so'm`}
              </span>
            </div>
          </div>
        </div>

        {/* Small Cart Button in Header */}
        <button
          onClick={() => {
            hapticImpact('medium');
            onOpenCheckout();
          }}
          className="relative p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400"
        >
          <ShoppingBag className="w-5 h-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-extrabold flex items-center justify-center animate-scale">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Catalog Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{t('receiver.only_available_note')}</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
            {t('common.loading')}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Hozirda sotuvda mahsulotlar mavjud emas
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {products.map((product) => {
              const qty = getItemQuantity(product.id);
              const price = product.discount_price !== null && product.discount_price !== undefined
                ? product.discount_price
                : product.price;

              return (
                <div
                  key={product.id}
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex gap-3 shadow-sm hover:shadow transition"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <ImageOff className="w-6 h-6 text-slate-400" />
                    )}
                    {product.discount_price && (
                      <span className="absolute top-1 left-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                        AKSIYA
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                          {product.name}
                        </h4>
                        <span className="shrink-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                          {t('receiver.in_stock')}
                        </span>
                      </div>
                      {product.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                          {product.description}
                        </p>
                      )}
                      {product.quantity_optional !== null && product.quantity_optional !== undefined && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Qoldiq: ~{product.quantity_optional} dona
                        </span>
                      )}
                    </div>

                    {/* Price and Cart Controls */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-extrabold text-xs text-brand-600 dark:text-brand-400">
                          {Number(price).toLocaleString()} so'm
                        </span>
                        {product.discount_price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {Number(product.price).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(product.id, qty - 1)}
                            className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-xs active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-1">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, qty + 1)}
                            className="w-6 h-6 rounded-md bg-brand-600 text-white flex items-center justify-center shadow-xs active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            addItem(
                              product,
                              supplier.id,
                              supplier.delivery_fee,
                              supplier.is_free_delivery
                            );
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-xs active:scale-95 flex items-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t('receiver.add_to_cart')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 max-w-md mx-auto"
          >
            <button
              onClick={() => {
                hapticImpact('heavy');
                onOpenCheckout();
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 shadow-xl shadow-brand-500/25 flex items-center justify-between active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-extrabold text-[11px]">
                  {itemCount}
                </div>
                <span>{t('receiver.checkout')}</span>
              </div>
              <span className="font-extrabold text-sm">
                {Number(total).toLocaleString()} so'm
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
