import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { getSocket } from '../../api/socket';
import { useAuth } from '../../context/AuthContext';
import { 
  Check, X, Truck, Phone, Clock, MapPin, 
  UserCheck, Volume2, Copy, Search, DollarSign, TrendingUp, PackageCheck 
} from 'lucide-react';
import { hapticImpact, hapticNotification, playNotificationSound, copyToClipboard, formatOrderReceiptText } from '../../utils/telegram';

export const SupplierOrdersTab: React.FC = () => {
  const { t } = useTranslation();
  const { supplier } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'PENDING' | 'ACTIVE' | 'HISTORY'>('PENDING');

  // Accept Order Modal State
  const [acceptingOrder, setAcceptingOrder] = useState<any | null>(null);
  const [vehicleModel, setVehicleModel] = useState<string>('Labo / Damas Deluxe');
  const [vehiclePlate, setVehiclePlate] = useState<string>('01 A 777 BB');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('+998 90 ');
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Reject Order Modal State
  const [rejectingOrder, setRejectingOrder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasNewAlert, setHasNewAlert] = useState<boolean>(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.orders.getSupplierOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const socket = getSocket();
    if (socket && supplier?.id) {
      socket.emit('join:supplier', supplier.id);

      // Listen for new orders
      const handleNewOrder = (data: any) => {
        console.log('[Socket] New incoming order for supplier:', data);
        playNotificationSound();
        hapticNotification('success');
        setHasNewAlert(true);
        setOrders((prev) => [data.order, ...prev]);
      };

      // Listen for order status updates
      const handleStatusUpdate = (data: any) => {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === data.orderId ? { ...ord, ...data.order } : ord))
        );
      };

      socket.on('order:new', handleNewOrder);
      socket.on('order:status_updated', handleStatusUpdate);

      return () => {
        socket.off('order:new', handleNewOrder);
        socket.off('order:status_updated', handleStatusUpdate);
      };
    }
  }, [supplier?.id]);

  const handleOpenAcceptModal = (order: any) => {
    hapticImpact('medium');
    setAcceptingOrder(order);
    setDriverName('Rustam Qodirov');
    setDriverPhone(supplier?.user?.phone_primary || '+998 90 999 88 77');
    setAcceptError(null);
  };

  const handleConfirmAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticImpact('heavy');
    setAcceptError(null);

    if (!vehicleModel.trim() || !vehiclePlate.trim() || !driverName.trim() || !driverPhone.trim()) {
      setAcceptError('Barcha transport va haydovchi maydonlarini to\'ldiring');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.orders.accept(acceptingOrder.id, {
        vehicle_model: vehicleModel.trim(),
        vehicle_plate_number: vehiclePlate.trim(),
        driver_name: driverName.trim(),
        driver_phone: driverPhone.trim(),
      });

      setOrders((prev) =>
        prev.map((ord) => (ord.id === acceptingOrder.id ? res.order : ord))
      );
      setAcceptingOrder(null);
      hapticNotification('success');
    } catch (err: any) {
      setAcceptError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRejectModal = (order: any) => {
    hapticImpact('medium');
    setRejectingOrder(order);
    setRejectionReason('');
    setRejectError(null);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticImpact('heavy');
    setRejectError(null);

    if (!rejectionReason.trim()) {
      setRejectError(t('supplier.reject_reason_prompt'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.orders.reject(rejectingOrder.id, rejectionReason.trim());
      setOrders((prev) =>
        prev.map((ord) => (ord.id === rejectingOrder.id ? res.order : ord))
      );
      setRejectingOrder(null);
      hapticNotification('warning');
    } catch (err: any) {
      setRejectError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    hapticImpact('medium');
    try {
      const res = await api.orders.updateStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? res.order : ord))
      );
      hapticNotification('success');
    } catch (err: any) {
      alert(err.message || 'Holatni yangilashda xatolik');
    }
  };

  // Search and Copy States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const handleCopyReceipt = async (order: any) => {
    hapticImpact('medium');
    const text = formatOrderReceiptText(order);
    const ok = await copyToClipboard(text);
    if (ok) {
      hapticNotification('success');
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2500);
    }
  };

  // KPI Analytics
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  }, [orders]);

  const deliveredCount = useMemo(() => orders.filter((o) => o.status === 'DELIVERED').length, [orders]);
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'PENDING'), [orders]);
  const activeOrders = useMemo(() => orders.filter((o) => o.status === 'PREPARING' || o.status === 'IN_TRANSIT'), [orders]);
  const historyOrders = useMemo(() => orders.filter((o) => o.status === 'DELIVERED' || o.status === 'REJECTED'), [orders]);

  const displayedOrders = useMemo(() => {
    let list =
      filter === 'PENDING'
        ? pendingOrders
        : filter === 'ACTIVE'
        ? activeOrders
        : historyOrders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((ord) => {
        const idMatch = ord.id.toLowerCase().includes(q);
        const nameMatch = `${ord.receiver?.first_name || ''} ${ord.receiver?.last_name || ''}`.toLowerCase().includes(q);
        const phoneMatch = (ord.receiver?.phone_primary || '').includes(q);
        const addressMatch = (ord.delivery_address || '').toLowerCase().includes(q);
        return idMatch || nameMatch || phoneMatch || addressMatch;
      });
    }

    return list;
  }, [filter, pendingOrders, activeOrders, historyOrders, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Sound notification badge alert */}
      {hasNewAlert && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            <Volume2 className="w-4 h-4 animate-bounce" />
            <span>Yangi buyurtma qabul qilindi!</span>
          </div>
          <button
            onClick={() => setHasNewAlert(false)}
            className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded"
          >
            Yopish
          </button>
        </motion.div>
      )}

      {/* KPI Dashboard Analytics Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-gradient-to-br from-brand-600 to-teal-600 text-white rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-white/80">
            <span className="text-[10px] font-bold uppercase tracking-wider">Jami Tushum</span>
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div className="text-base font-extrabold tracking-tight">
            {totalRevenue.toLocaleString()} <span className="text-[10px] font-normal">so'm</span>
          </div>
          <p className="text-[10px] text-white/70 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Muvaffaqiyatli savdo</span>
          </p>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Yetkazilgan</span>
            <PackageCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {deliveredCount} <span className="text-[10px] font-normal text-slate-400">ta buyurtma</span>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {orders.length > 0 ? `${Math.round((deliveredCount / orders.length) * 100)}% yakunlangan` : "0%"}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-2">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => {
              hapticImpact('light');
              setFilter('PENDING');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg relative transition flex items-center justify-center gap-1.5 ${
              filter === 'PENDING'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            <span>{t('supplier.filter_pending')}</span>
            {pendingOrders.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              hapticImpact('light');
              setFilter('ACTIVE');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg relative transition flex items-center justify-center gap-1.5 ${
              filter === 'ACTIVE'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            <span>{t('supplier.filter_active')}</span>
            {activeOrders.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              hapticImpact('light');
              setFilter('HISTORY');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg relative transition flex items-center justify-center ${
              filter === 'HISTORY'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            <span>{t('supplier.filter_history')}</span>
          </button>
        </div>

        {/* Search input for orders */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buyurtma ID, mijoz ismi yoki telefon raqami..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
          {t('common.loading')}
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
          <Truck className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            {searchQuery ? "Qidiruv bo'yicha buyurtmalar topilmadi" : t('supplier.no_orders')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedOrders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(order.created_at).toLocaleTimeString('uz-UZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {order.receiver?.first_name} {order.receiver?.last_name} ({order.receiver?.phone_primary})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyReceipt(order)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 transition active:scale-95"
                    title="Chek / Yo'llanmani nusxalash"
                  >
                    {copiedOrderId === order.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Nusxalandi</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Chek</span>
                      </>
                    )}
                  </button>

                  <span className="font-extrabold text-sm text-brand-600 dark:text-brand-400">
                    {Number(order.total_price).toLocaleString()} so'm
                  </span>
                </div>
              </div>

              {/* Delivery info */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">{order.delivery_address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="text-[11px]">Vaqt: {order.delivery_time_slot}</span>
                </div>
                {order.notes && (
                  <p className="text-[10px] italic text-slate-400">Izoh: "{order.notes}"</p>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Buyurtma tarkibi:
                </span>
                <div className="space-y-1 text-xs">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-slate-700 dark:text-slate-300 text-[11px]">
                      <span>{item.product?.name || 'Tovar'} × {item.quantity}</span>
                      <span className="font-semibold">{(Number(item.price_at_order) * item.quantity).toLocaleString()} so'm</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attached Delivery info if present */}
              {order.delivery && (
                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-900 dark:text-blue-200">
                      Haydovchi: {order.delivery.driver_name}
                    </span>
                    <span className="block text-slate-500">
                      {order.delivery.vehicle_model} • {order.delivery.vehicle_plate_number}
                    </span>
                  </div>
                  <a
                    href={`tel:${order.delivery.driver_phone}`}
                    className="p-1.5 rounded-lg bg-blue-600 text-white text-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Action Buttons depending on status */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                {order.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleOpenAcceptModal(order)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>{t('supplier.accept_order_btn')}</span>
                    </button>
                    <button
                      onClick={() => handleOpenRejectModal(order)}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 flex items-center gap-1 active:scale-95 transition"
                    >
                      <X className="w-4 h-4" />
                      <span>{t('supplier.reject_order_btn')}</span>
                    </button>
                  </>
                )}

                {order.status === 'PREPARING' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'IN_TRANSIT')}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-xs flex items-center justify-center gap-2 active:scale-95 transition"
                  >
                    <Truck className="w-4 h-4" />
                    <span>{t('supplier.move_to_transit')}</span>
                  </button>
                )}

                {order.status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center justify-center gap-2 active:scale-95 transition"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{t('supplier.move_to_delivered')}</span>
                  </button>
                )}

                {order.status === 'DELIVERED' && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Yetkazib berildi
                  </span>
                )}

                {order.status === 'REJECTED' && (
                  <div className="text-xs text-rose-600 dark:text-rose-400">
                    <span className="font-bold">Rad etilgan</span>: {order.rejection_reason}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 1. Modal for Order Acceptance with Transport Details */}
      <AnimatePresence>
        {acceptingOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t('supplier.accept_modal_title')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t('supplier.accept_modal_subtitle')}
                  </p>
                </div>
                <button
                  onClick={() => setAcceptingOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {acceptError && (
                <div className="p-2.5 text-xs bg-rose-50 text-rose-600 rounded-xl">
                  {acceptError}
                </div>
              )}

              <form onSubmit={handleConfirmAccept} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    {t('supplier.vehicle_model_input')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Masalan: Labo / Damas Deluxe"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    {t('supplier.vehicle_plate_input')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="Masalan: 01 A 777 BB"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    {t('supplier.driver_name_input')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Masalan: Rustam Qodirov"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    {t('supplier.driver_phone_input')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+998 90 999 88 77"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAcceptingOrder(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25"
                  >
                    {isSubmitting ? 'Qabul qilinmoqda...' : t('supplier.confirm_accept')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal for Order Rejection with Mandatory Reason */}
      <AnimatePresence>
        {rejectingOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t('supplier.reject_modal_title')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t('supplier.reject_reason_prompt')}
                  </p>
                </div>
                <button
                  onClick={() => setRejectingOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {rejectError && (
                <div className="p-2.5 text-xs bg-rose-50 text-rose-600 rounded-xl">
                  {rejectError}
                </div>
              )}

              <form onSubmit={handleConfirmReject} className="space-y-3 text-xs">
                <div>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={t('supplier.reject_reason_placeholder')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingOrder(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-500/25"
                  >
                    {isSubmitting ? 'Rad etilmoqda...' : t('supplier.confirm_reject')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
