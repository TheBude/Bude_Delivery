import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Settings, Truck, Building2, CheckCircle2 } from 'lucide-react';
import { hapticImpact, hapticNotification } from '../../utils/telegram';

export const SupplierSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const { supplier, refreshProfile } = useAuth();

  const [companyName, setCompanyName] = useState<string>(supplier?.company_name || '');
  const [deliveryFee, setDeliveryFee] = useState<number>(supplier?.delivery_fee || 15000);
  const [isFreeDelivery, setIsFreeDelivery] = useState<boolean>(supplier?.is_free_delivery || false);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticImpact('medium');
    setSaving(true);
    setSuccess(false);

    try {
      await api.suppliers.updateSettings({
        company_name: companyName.trim(),
        delivery_fee: Number(deliveryFee),
        is_free_delivery: isFreeDelivery,
      });
      await refreshProfile();
      setSuccess(true);
      hapticNotification('success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Sozlamalarni saqlashda xatolik');
      hapticNotification('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          {t('supplier.delivery_settings_title')}
        </h2>
        <p className="text-xs text-slate-500">
          {t('supplier.delivery_settings_desc')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        {success && (
          <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold uppercase tracking-wider text-[11px]">
              {t('supplier.company_name_label')} *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Masalan: Buxoro Fresh Market"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-600" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {t('supplier.free_delivery_toggle')}
                </span>
              </div>
              <input
                type="checkbox"
                checked={isFreeDelivery}
                onChange={(e) => setIsFreeDelivery(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                {t('supplier.standard_delivery_fee')}
              </label>
              <input
                type="number"
                disabled={isFreeDelivery}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-40 font-semibold"
              />
              {isFreeDelivery && (
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                  * Bepul yetkazish xizmati yoqilgan. Xaridorlar uchun yetkazish 0 so'm bo'ladi.
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-500 hover:to-teal-500 shadow-lg shadow-brand-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>{saving ? 'Saqlanmoqda...' : t('supplier.save_settings')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
