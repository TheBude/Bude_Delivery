import React, { useState, useEffect } from 'react';
import { 
  Users, ShoppingBag, Truck, RefreshCw, ArrowLeft, 
  Search, DollarSign, Calendar, Phone, Key, Trash2, Eye, EyeOff, ShieldCheck, X
} from 'lucide-react';
import { api } from '../../api/client';
import type { User, Supplier, Order, Role } from '../../types';
import { hapticImpact } from '../../utils/telegram';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'suppliers' | 'orders'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [data, setData] = useState<{
    stats: {
      totalUsers: number;
      receiversCount: number;
      suppliersCount: number;
      totalOrders: number;
      totalRevenue: number;
    };
    users: User[];
    suppliers: Supplier[];
    orders: Order[];
  }>({
    stats: {
      totalUsers: 0,
      receiversCount: 0,
      suppliersCount: 0,
      totalOrders: 0,
      totalRevenue: 0,
    },
    users: [],
    suppliers: [],
    orders: [],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getOverview();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    hapticImpact('medium');
    setUpdatingUserId(userId);
    try {
      await api.admin.updateUserRole(userId, newRole);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Rolni o‘zgartirishda xatolik yuz berdi');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleDeleteUser = async (userId: string) => {
    hapticImpact('heavy');
    setIsDeleting(true);
    try {
      await api.admin.deleteUser(userId);
      setDeleteConfirmUser(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Akkauntni o‘chirishda xatolik yuz berdi');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPasswordInput.trim()) return;
    if (newPasswordInput.trim().length < 4) {
      alert('Parol kamida 4 ta belgidan iborat bo‘lishi kerak');
      return;
    }
    hapticImpact('medium');
    setIsResettingPassword(true);
    try {
      await api.admin.resetUserPassword(resetModalUser.id, newPasswordInput.trim());
      setResetModalUser(null);
      setNewPasswordInput('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Parolni yangilashda xatolik yuz berdi');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filteredUsers = data.users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const phone = (u.phone_primary || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return fullName.includes(q) || phone.includes(q) || email.includes(q);
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            hapticImpact('light');
            onBack();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ilovaga qaytish</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            👑 Admin Panel
          </span>
          <button
            onClick={() => {
              hapticImpact('light');
              fetchData();
            }}
            disabled={loading}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Jami A’zolar</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {data.stats.totalUsers}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
            <span>📥 {data.stats.receiversCount} mijoz</span>
            <span>•</span>
            <span>🚚 {data.stats.suppliersCount} do‘kon</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Do‘konlar</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {data.stats.suppliersCount}
          </p>
          <p className="mt-1 text-[10px] text-emerald-600 font-semibold">
            Faol yetkazib beruvchilar
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Buyurtmalar</span>
            <ShoppingBag className="w-4 h-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {data.stats.totalOrders}
          </p>
          <p className="mt-1 text-[10px] text-purple-600 font-semibold">
            Barcha berilgan zakazlar
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Aylanma</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100 truncate">
            {data.stats.totalRevenue.toLocaleString('uz-UZ')} <span className="text-xs font-normal">so‘m</span>
          </p>
          <p className="mt-1 text-[10px] text-amber-600 font-semibold">
            Jami savdo summasi
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl gap-1">
        <button
          onClick={() => {
            hapticImpact('light');
            setActiveTab('users');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          👥 Foydalanuvchilar ({data.users.length})
        </button>
        <button
          onClick={() => {
            hapticImpact('light');
            setActiveTab('suppliers');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'suppliers'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          🚚 Do‘konlar ({data.suppliers.length})
        </button>
        <button
          onClick={() => {
            hapticImpact('light');
            setActiveTab('orders');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'orders'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          📦 Buyurtmalar ({data.orders.length})
        </button>
      </div>

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism, telefon yoki email bo‘yicha qidirish..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-2.5">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span>{u.first_name} {u.last_name}</span>
                      {(u.email === 'sbunyod15@gmail.com' || String(u.telegram_id) === '8012592174') && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Asosiy Admin
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                      {u.phone_primary && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {u.phone_primary}
                        </span>
                      )}
                      {u.email && <span>• {u.email}</span>}
                      {u.telegram_id && <span>• TG: {u.telegram_id}</span>}
                    </p>
                  </div>

                  {/* Role Selector */}
                  <select
                    value={u.role}
                    disabled={updatingUserId === u.id}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                    className={`text-[11px] font-bold rounded-xl px-2.5 py-1 border transition-colors cursor-pointer shrink-0 ${
                      u.role === 'SUPPLIER'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                        : u.role === 'ADMIN'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <option value="RECEIVER">📥 Mijoz (Receiver)</option>
                    <option value="SUPPLIER">🚚 Do‘kon (Supplier)</option>
                    <option value="ADMIN">👑 Admin</option>
                  </select>
                </div>

                {/* Password Section */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Key className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-500 font-medium shrink-0">Parol:</span>
                    {u.plain_password ? (
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-wider truncate">
                        {showPasswordMap[u.id] ? u.plain_password : '••••••••'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {u.telegram_id ? 'Telegram orqali (parolsiz)' : 'Belgilanmagan'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {u.plain_password && (
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(u.id)}
                        className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title={showPasswordMap[u.id] ? "Yashirish" : "Ko'rsatish"}
                      >
                        {showPasswordMap[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setResetModalUser(u);
                        setNewPasswordInput('');
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
                    >
                      {u.plain_password ? 'O‘zgartirish' : 'O‘rnatish'}
                    </button>
                  </div>
                </div>

                {/* Card Footer: ID, Date & Delete Button */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span>ID: {u.id.substring(0, 12)}...</span>
                    {u.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(u.created_at).toLocaleDateString('uz-UZ')}
                      </span>
                    )}
                  </div>

                  {u.email === 'sbunyod15@gmail.com' || String(u.telegram_id) === '8012592174' ? (
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-amber-500" />
                      Himoyalangan
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmUser(u)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>O‘chirish</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-400">
                Foydalanuvchi topilmadi
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="space-y-2.5">
          {data.suppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {sup.company_name}
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  {sup.is_free_delivery ? 'Yetkazish tekin' : `${sup.delivery_fee.toLocaleString()} so‘m`}
                </span>
              </div>

              {sup.user && (
                <p className="text-xs text-slate-500">
                  Mas’ul: {sup.user.first_name} {sup.user.last_name} ({sup.user.phone_primary})
                </p>
              )}
            </div>
          ))}

          {data.suppliers.length === 0 && (
            <p className="text-center py-8 text-xs text-slate-400">
              Do‘konlar mavjud emas
            </p>
          )}
        </div>
      )}

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-2.5">
          {data.orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  #{ord.id.substring(0, 8)}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ord.status === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : ord.status === 'IN_TRANSIT'
                      ? 'bg-blue-100 text-blue-700'
                      : ord.status === 'PREPARING'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ord.status}
                </span>
              </div>

              <div className="text-xs space-y-0.5 text-slate-600 dark:text-slate-400">
                <p>📍 Manzil: <span className="font-medium text-slate-900 dark:text-slate-200">{ord.delivery_address}</span></p>
                <p>⏰ Vaqt: {ord.delivery_time_slot}</p>
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  💰 Summa: {Number(ord.total_price).toLocaleString('uz-UZ')} so‘m
                </p>
              </div>
            </div>
          ))}

          {data.orders.length === 0 && (
            <p className="text-center py-8 text-xs text-slate-400">
              Buyurtmalar mavjud emas
            </p>
          )}
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-500" />
                Parolni o‘zgartirish
              </h3>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p>
                Foydalanuvchi:{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {resetModalUser.first_name} {resetModalUser.last_name}
                </strong>
              </p>
              {resetModalUser.plain_password && (
                <p>
                  Hozirgi parol:{' '}
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {resetModalUser.plain_password}
                  </span>
                </p>
              )}
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Yangi parol
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Yangi parolni kiriting..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex-1 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {isResettingPassword ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Akkauntni o‘chirish
                </h3>
                <p className="text-xs text-slate-500">
                  Ushbu amalni ortga qaytarib bo‘lmaydi!
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Rostdan ham{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {deleteConfirmUser.first_name} {deleteConfirmUser.last_name}
              </strong>{' '}
              akkauntini butunlay o‘chirib tashlamoqchimisiz?
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteUser(deleteConfirmUser.id)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'O‘chirilmoqda...' : 'Ha, o‘chirilsin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
