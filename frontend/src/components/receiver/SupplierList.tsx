import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { Search, Truck, ChevronRight, Store, Sparkles } from 'lucide-react';
import { hapticImpact, hapticSelection } from '../../utils/telegram';

interface SupplierListProps {
  onSelectSupplier: (supplier: any) => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({ onSelectSupplier }) => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [onlyFreeDelivery, setOnlyFreeDelivery] = useState<boolean>(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await api.suppliers.getAll({
        q: search || undefined,
        free_delivery: onlyFreeDelivery || undefined,
      });
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, onlyFreeDelivery]);

  return (
    <div className="space-y-4">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Store className="w-5 h-5 text-brand-600" />
          {t('receiver.suppliers_title')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('receiver.suppliers_subtitle')}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('receiver.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              hapticSelection();
              setOnlyFreeDelivery(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              !onlyFreeDelivery
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {t('receiver.filter_all')}
          </button>
          <button
            onClick={() => {
              hapticSelection();
              setOnlyFreeDelivery(true);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              onlyFreeDelivery
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {t('receiver.filter_free_delivery')}
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
          {t('common.loading')}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
          <Store className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">{t('receiver.no_suppliers')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map((supplier, idx) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                hapticImpact('light');
                onSelectSupplier(supplier);
              }}
              className="group p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="space-y-1.5 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {supplier.company_name}
                  </h3>
                  {supplier.is_free_delivery && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Bepul yetkazish
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    {supplier.is_free_delivery
                      ? t('receiver.free_delivery_badge')
                      : t('receiver.delivery_fee', { fee: Number(supplier.delivery_fee).toLocaleString() })}
                  </span>
                  <span>•</span>
                  <span>
                    {t('receiver.active_products', { count: supplier.active_products_count || 0 })}
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950 transition">
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
