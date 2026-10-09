import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import { api } from '../../api/client';
import { LocationPicker } from '../common/LocationPicker';
import { ArrowLeft, Clock, FileText, ShoppingBag, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { hapticImpact, hapticNotification, hapticSelection } from '../../utils/telegram';

interface CartCheckoutModalProps {
  onClose: () => void;
  onOrderSuccess: (order: any) => void;
}

const TIME_SLOTS = [
  '09:00 - 11:00',
  '11:00 - 13:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
];

export const CartCheckoutModal: React.FC<CartCheckoutModalProps> = ({
  onClose,
  onOrderSuccess,
}) => {
  const { t } = useTranslation();
  const { items, activeSupplierId, deliveryFee, isFreeDelivery, subtotal, total, updateQuantity, removeItem, clearCart } = useCart();

  const [lat, setLat] = useState<number>(41.311081);
  const [lng, setLng] = useState<number>(69.240562);
  const [address, setAddress] = useState<string>('Toshkent sh., Amir Temur shox ko\'chasi, 45-uy');
  const [timeSlot, setTimeSlot] = useState<string>('14:00 - 16:00');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationChange = (newLat: number, newLng: number, newAddress: string) => {
    setLat(newLat);
    setLng(newLng);
    setAddress(newAddress);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticImpact('heavy');
    setError(null);

    if (!activeSupplierId || items.length === 0) {
      setError(t('receiver.cart_empty'));
      return;
    }

    if (!address.trim()) {
      setError('Yetkazib berish manzilini kiriting');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        supplier_id: activeSupplierId,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        delivery_lat: lat,
        delivery_lng: lng,
        delivery_address: address.trim(),
        delivery_time_slot: timeSlot,
        notes: notes.trim() || null,
      };

      const res = await api.orders.create(orderPayload);
      hapticNotification('success');
      clearCart();
      onOrderSuccess(res.order);
    } catch (err: any) {
      hapticNotification('error');
      setError(err.message || 'Buyurtma berishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            hapticImpact('light');
            onClose();
          }}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          {t('receiver.checkout')}
        </h2>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-32">
        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Cart Items List */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-brand-600" />
            {t('receiver.cart')} ({items.length})
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => {
              const price = item.product.discount_price ?? item.product.price;
              return (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {Number(price).toLocaleString()} so'm × {item.quantity}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-brand-600 text-white flex items-center justify-center text-xs font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Interactive Map & Location */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <LocationPicker
            lat={lat}
            lng={lng}
            address={address}
            onChange={handleLocationChange}
          />
        </div>

        {/* 3. Delivery Time Slot */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            {t('receiver.delivery_time_slot')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  hapticSelection();
                  setTimeSlot(slot);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition ${
                  timeSlot === slot
                    ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Notes / Instructions */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-600" />
            Izoh / Qo'shimcha eslatma
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('receiver.notes_placeholder')}
            className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* 5. Financial Summary Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>{t('receiver.subtotal')}</span>
            <span>{Number(subtotal).toLocaleString()} so'm</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Yetkazib berish</span>
            <span>
              {isFreeDelivery
                ? 'Bepul'
                : `${Number(deliveryFee).toLocaleString()} so'm`}
            </span>
          </div>
          <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{t('receiver.total')}</span>
            <span className="text-brand-600 dark:text-brand-400">
              {Number(total).toLocaleString()} so'm
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto z-50">
        <button
          onClick={handleSubmitOrder}
          disabled={isSubmitting || items.length === 0}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Yuborilmoqda...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('receiver.confirm_order_btn')} • {Number(total).toLocaleString()} so'm</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};
