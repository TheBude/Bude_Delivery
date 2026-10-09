import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SupplierOrdersTab } from './SupplierOrdersTab';
import { SupplierProductsTab } from './SupplierProductsTab';
import { SupplierSettingsTab } from './SupplierSettingsTab';
import { Truck, Package, Settings } from 'lucide-react';
import { hapticImpact } from '../../utils/telegram';

export const SupplierDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');

  const handleTabChange = (tab: 'orders' | 'products' | 'settings') => {
    hapticImpact('light');
    setActiveTab(tab);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Navigation Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <button
          onClick={() => handleTabChange('orders')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>{t('supplier.orders_tab')}</span>
        </button>

        <button
          onClick={() => handleTabChange('products')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'products'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>{t('supplier.products_tab')}</span>
        </button>

        <button
          onClick={() => handleTabChange('settings')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{t('supplier.settings_tab')}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {activeTab === 'orders' && <SupplierOrdersTab />}
        {activeTab === 'products' && <SupplierProductsTab />}
        {activeTab === 'settings' && <SupplierSettingsTab />}
      </motion.div>
    </div>
  );
};
