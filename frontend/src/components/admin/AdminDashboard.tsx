import React, { useState, useEffect } from 'react';
import { 
  Users, ShoppingBag, Truck, RefreshCw, ArrowLeft, 
  Search, DollarSign, Calendar, Phone
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
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{u.first_name} {u.last_name}</span>
                      {u.email === 'sbunyod15@gmail.com' && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-md">
                          Asosiy Admin
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      {u.phone_primary && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {u.phone_primary}
                        </span>
                      )}
                      {u.email && <span>• {u.email}</span>}
                    </p>
                  </div>

                  {/* Role Selector */}
                  <select
                    value={u.role}
                    disabled={updatingUserId === u.id}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                    className={`text-[11px] font-bold rounded-xl px-2.5 py-1 border transition-colors cursor-pointer ${
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

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <span>ID: {u.id.substring(0, 16)}...</span>
                  {u.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(u.created_at).toLocaleDateString('uz-UZ')}
                    </span>
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
    </div>
  );
};
