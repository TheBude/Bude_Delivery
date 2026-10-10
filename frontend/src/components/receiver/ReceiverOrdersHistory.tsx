import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { getSocket, initSocket } from '../../api/socket';
import { useAuth } from '../../context/AuthContext';
import { 
  Package, Truck, Phone, Clock, MapPin, CheckCircle2, 
  XCircle, ChevronDown, ChevronUp, Calendar, RefreshCw, 
  Copy, Check, Search, AlertCircle, Ban 
} from 'lucide-react';
import { hapticImpact, hapticNotification, copyToClipboard, formatOrderReceiptText } from '../../utils/telegram';

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Kutilmoqda' },
  { key: 'PREPARING', label: "Yuk yig'ilmoqda" },
  { key: 'IN_TRANSIT', label: "Yo'lga chiqdi" },
  { key: 'DELIVERED', label: 'Yetkazildi' },
];

export const ReceiverOrdersHistory: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Filters and Search
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast / Copy state
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Cancel order modal
  const [cancellingOrder, setCancellingOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.orders.getReceiverOrders();
      setOrders(data);
      if (data.length > 0 && !expandedOrderId) {
        setExpandedOrderId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // 1. Socket.io real-time listener for order updates
    const socket = getSocket() || initSocket(user?.id, 'RECEIVER');

    const joinRoom = () => {
      if (user?.id) {
        socket.emit('join:receiver', user.id);
      }
    };

    if (socket.connected) {
      joinRoom();
    }
    socket.on('connect', joinRoom);

    const handleStatusUpdate = (data: any) => {
      if (!data?.orderId && !data?.order?.id) return;
      const targetId = data.orderId || data.order.id;
      console.log('[Socket] Order status updated in Receiver view:', data);
      hapticImpact('medium');
      setOrders((prev) =>
        prev.map((ord) => (ord.id === targetId ? { ...ord, ...data.order, status: data.status || data.order.status } : ord))
      );
    };

    const handleNewOrder = (data: any) => {
      if (!data?.order) return;
      if (data.order.receiver_id === user?.id) {
        setOrders((prev) => {
          if (prev.some((o) => o.id === data.order.id)) return prev;
          return [data.order, ...prev];
        });
      }
    };

    socket.on('order:status_updated', handleStatusUpdate);
    socket.on('order:status_broadcast', handleStatusUpdate);
    socket.on('order:new', handleNewOrder);
    socket.on('order:new_broadcast', handleNewOrder);

    // 2. Real-time background sync (every 5 seconds)
    const pollInterval = setInterval(async () => {
      try {
        const latest = await api.orders.getReceiverOrders();
        setOrders(latest);
      } catch (e) {
        // Silent
      }
    }, 5000);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('order:status_updated', handleStatusUpdate);
      socket.off('order:status_broadcast', handleStatusUpdate);
      socket.off('order:new', handleNewOrder);
      socket.off('order:new_broadcast', handleNewOrder);
      clearInterval(pollInterval);
    };
  }, [user?.id]);

  const toggleExpand = (id: string) => {
    hapticImpact('light');
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

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

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    hapticImpact('heavy');
    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await api.orders.cancel(
        cancellingOrder.id,
        cancelReason.trim() || "Xaridor tomonidan bekor qilindi"
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === cancellingOrder.id ? res.order : o))
      );
      hapticNotification('success');
      setCancellingOrder(null);
    } catch (err: any) {
      setCancelError(err.message || "Buyurtmani bekor qilishda xatolik");
      hapticNotification('error');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300';
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 animate-pulse';
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStepIndex = (status: string) => {
    if (status === 'REJECTED') return -1;
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filter by status tab
      if (filter === 'ACTIVE') {
        if (!['PENDING', 'PREPARING', 'IN_TRANSIT'].includes(order.status)) return false;
      } else if (filter === 'DELIVERED') {
        if (order.status !== 'DELIVERED') return false;
      } else if (filter === 'REJECTED') {
        if (order.status !== 'REJECTED') return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = order.id.toLowerCase().includes(q);
        const supplierMatch = order.supplier?.company_name?.toLowerCase().includes(q);
        const addressMatch = order.delivery_address?.toLowerCase().includes(q);
        return idMatch || supplierMatch || addressMatch;
      }

      return true;
    });
  }, [orders, filter, searchQuery]);

  const activeCount = useMemo(() => orders.filter((o) => ['PENDING', 'PREPARING', 'IN_TRANSIT'].includes(o.status)).length, [orders]);
  const deliveredCount = useMemo(() => orders.filter((o) => o.status === 'DELIVERED').length, [orders]);

  return (
    <div className="space-y-4">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            {t('receiver.history_tab')}
          </h2>
          <p className="text-xs text-slate-500">Real-time yetkazib berish monitoringi</p>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 active:scale-95 transition"
          title="Yangilash"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-2">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => {
              hapticImpact('light');
              setFilter('ALL');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              filter === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Barchasi ({orders.length})
          </button>

          <button
            onClick={() => {
              hapticImpact('light');
              setFilter('ACTIVE');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
              filter === 'ACTIVE'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            <span>Faol</span>
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] flex items-center justify-center font-extrabold">
                {activeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              hapticImpact('light');
              setFilter('DELIVERED');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              filter === 'DELIVERED'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Yetkazildi ({deliveredCount})
          </button>

          <button
            onClick={() => {
              hapticImpact('light');
              setFilter('REJECTED');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              filter === 'REJECTED'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Bekor
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buyurtma ID yoki do'kon nomi bo'yicha qidirish..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
          {t('common.loading')}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            {searchQuery ? "Qidiruv bo'yicha buyurtmalar topilmadi" : t('receiver.no_orders_yet')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const currentStep = getStepIndex(order.status);
            const isCopied = copiedOrderId === order.id;

            return (
              <motion.div
                key={order.id}
                layout
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Header Card */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {t(`status.${order.status}`)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {order.supplier?.company_name || "Ta'minotchi"}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleDateString('uz-UZ', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {Number(order.total_price).toLocaleString()} so'm
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy Receipt Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyReceipt(order);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 transition active:scale-95"
                      title="Chekni nusxalash"
                    >
                      {isCopied ? (
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

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3"
                    >
                      {/* Status Stepper Progress */}
                      {order.status !== 'REJECTED' ? (
                        <div className="py-2">
                          <div className="flex items-center justify-between relative">
                            {/* Connecting line */}
                            <div className="absolute left-3 right-3 top-3 h-0.5 bg-slate-200 dark:bg-slate-700 z-0" />
                            <div
                              className="absolute left-3 top-3 h-0.5 bg-brand-600 z-0 transition-all duration-500"
                              style={{
                                width: `${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 92}%`,
                              }}
                            />

                            {STATUS_STEPS.map((step, idx) => {
                              const isCompleted = idx <= currentStep;
                              const isCurrent = idx === currentStep;

                              return (
                                <div key={step.key} className="flex flex-col items-center z-10 space-y-1">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                      isCompleted
                                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                    } ${isCurrent ? 'ring-4 ring-brand-100 dark:ring-brand-950 scale-110' : ''}`}
                                  >
                                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                                  </div>
                                  <span
                                    className={`text-[9px] font-medium text-center max-w-[60px] leading-tight ${
                                      isCurrent
                                        ? 'font-bold text-brand-600 dark:text-brand-400'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Rejection Banner */
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Buyurtma bekor qilingan</span>
                          </div>
                          {order.rejection_reason && (
                            <p className="text-[11px] bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg">
                              Sabab: {order.rejection_reason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Courier & Transport Details Card */}
                      {order.delivery && (
                        <div className="bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/80 p-3.5 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                  {order.delivery.driver_name}
                                </h4>
                                <p className="text-[10px] text-slate-500">
                                  {order.delivery.vehicle_model} •{' '}
                                  <span className="font-mono font-bold bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                    {order.delivery.vehicle_plate_number}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <a
                              href={`tel:${order.delivery.driver_phone}`}
                              className="py-1.5 px-3 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Qo'ng'iroq</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Delivery Meta */}
                      <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                          <span className="text-[11px]">{order.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span className="text-[11px]">Vaqt: {order.delivery_time_slot}</span>
                        </div>
                        {order.notes && (
                          <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                            Izoh: "{order.notes}"
                          </div>
                        )}
                      </div>

                      {/* Financial Monitoring Items Breakdown */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {t('receiver.financial_summary')}
                        </span>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="py-1.5 flex justify-between">
                              <span className="text-slate-700 dark:text-slate-300">
                                {item.product?.name || 'Tovar'} × {item.quantity}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {(Number(item.price_at_order) * item.quantity).toLocaleString()} so'm
                              </span>
                            </div>
                          ))}
                          <div className="pt-2 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                            <span>Yakuniy summa:</span>
                            <span className="text-brand-600 dark:text-brand-400">
                              {Number(order.total_price).toLocaleString()} so'm
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cancel Order Action (Only for PENDING status) */}
                      {order.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => {
                            hapticImpact('medium');
                            setCancellingOrder(order);
                            setCancelReason('');
                            setCancelError(null);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-rose-100 transition active:scale-[0.98]"
                        >
                          <Ban className="w-4 h-4" />
                          <span>Buyurtmani bekor qilish</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      <AnimatePresence>
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Buyurtmani bekor qilish
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    #{cancellingOrder.id.slice(-6).toUpperCase()} raqamli buyurtma
                  </p>
                </div>
              </div>

              {cancelError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 text-xs">
                  {cancelError}
                </div>
              )}

              <form onSubmit={handleConfirmCancel} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Bekor qilish sababi (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Masalan: Fikrimdan qaytdim yoki boshqa manzil..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500 outline-hidden font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancellingOrder(null)}
                    disabled={isCancelling}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition"
                  >
                    Ortga
                  </button>

                  <button
                    type="submit"
                    disabled={isCancelling}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/25 active:scale-95 transition"
                  >
                    {isCancelling ? "Bekor qilinmoqda..." : "Ha, bekor qilinsin"}
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
