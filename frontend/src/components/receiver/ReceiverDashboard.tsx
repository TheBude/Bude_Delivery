import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SupplierList } from './SupplierList';
import { SupplierCatalogModal } from './SupplierCatalogModal';
import { CartCheckoutModal } from './CartCheckoutModal';
import { ReceiverOrdersHistory } from './ReceiverOrdersHistory';
import { useCart } from '../../context/CartContext';
import { Store, Package } from 'lucide-react';
import { hapticImpact } from '../../utils/telegram';

export const ReceiverDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { itemCount, total } = useCart();

  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  const handleTabChange = (tab: 'suppliers' | 'orders') => {
    hapticImpact('light');
    setActiveTab(tab);
  };

  const handleOrderSuccess = () => {
    setIsCheckoutOpen(false);
    setSelectedSupplier(null);
    setActiveTab('orders'); // Jump straight to order tracking!
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Navigation Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <button
          onClick={() => handleTabChange('suppliers')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'suppliers'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Dillerlar (Yetkazuvchilar)</span>
        </button>

        <button
          onClick={() => handleTabChange('orders')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'orders'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>{t('receiver.history_tab')}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {activeTab === 'suppliers' && (
          <SupplierList onSelectSupplier={(sup) => setSelectedSupplier(sup)} />
        )}
        {activeTab === 'orders' && <ReceiverOrdersHistory />}
      </motion.div>

      {/* Supplier Catalog Modal */}
      <AnimatePresence>
        {selectedSupplier && (
          <SupplierCatalogModal
            supplier={selectedSupplier}
            onClose={() => setSelectedSupplier(null)}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Cart Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <CartCheckoutModal
            onClose={() => setIsCheckoutOpen(false)}
            onOrderSuccess={handleOrderSuccess}
          />
        )}
      </AnimatePresence>

      {/* Floating Bottom Cart Bar when outside catalog modal */}
      <AnimatePresence>
        {!selectedSupplier && !isCheckoutOpen && itemCount > 0 && activeTab === 'suppliers' && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-3 left-4 right-4 max-w-md mx-auto z-30"
          >
            <button
              onClick={() => {
                hapticImpact('heavy');
                setIsCheckoutOpen(true);
              }}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 shadow-xl shadow-brand-500/30 flex items-center justify-between active:scale-[0.98] transition"
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
    </div>
  );
};
