import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Edit2, Trash2, 
  Package, X, Search 
} from 'lucide-react';
import { hapticImpact, hapticNotification, hapticSelection } from '../../utils/telegram';

const IMAGE_PRESETS = [
  { name: 'Olma', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=60' },
  { name: 'Pomidor', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=60' },
  { name: 'Bodring', url: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&auto=format&fit=crop&q=60' },
  { name: 'Sut', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60' },
  { name: 'Sariyog\'', url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=60' },
  { name: 'Asal', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=60' },
];

export const SupplierProductsTab: React.FC = () => {
  const { t } = useTranslation();
  const { supplier } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterAvailability, setFilterAvailability] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE' | 'DISCOUNT'>('ALL');

  const [loading, setLoading] = useState<boolean>(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [discountPrice, setDiscountPrice] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [quantityOptional, setQuantityOptional] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchProducts = async () => {
    if (!supplier?.id) return;
    try {
      setLoading(true);
      const data = await api.products.getBySupplier(supplier.id, true);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [supplier?.id]);

  const openAddModal = () => {
    hapticImpact('light');
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setIsAvailable(true);
    setQuantityOptional('');
    setImageUrl(IMAGE_PRESETS[0].url);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    hapticImpact('light');
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(String(product.price));
    setDiscountPrice(product.discount_price ? String(product.discount_price) : '');
    setIsAvailable(product.is_available);
    setQuantityOptional(product.quantity_optional ? String(product.quantity_optional) : '');
    setImageUrl(product.image_url || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    hapticSelection();
    try {
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_available: !currentStatus } : p))
      );
      await api.products.toggleAvailability(productId, !currentStatus);
      hapticNotification('success');
    } catch (err: any) {
      // Rollback
      fetchProducts();
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    hapticImpact('heavy');
    if (!confirm('Haqiqatan ham ushbu tovarni o\'chirmoqchimisiz?')) return;

    try {
      await api.products.delete(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      hapticNotification('success');
    } catch (err: any) {
      alert(err.message || 'Tovarni o\'chirishda xatolik');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticImpact('medium');
    setError(null);

    if (!name.trim()) {
      setError(t('supplier.product_name') + ' kiritilishi shart');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('Tovar narxini to\'g\'ri kiriting');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        discount_price: discountPrice ? Number(discountPrice) : null,
        is_available: isAvailable,
        quantity_optional: quantityOptional ? Number(quantityOptional) : null,
        image_url: imageUrl.trim() || null,
      };

      if (editingProduct) {
        const res = await api.products.update(editingProduct.id, payload);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? res.product : p))
        );
      } else {
        const res = await api.products.create(payload);
        setProducts((prev) => [res.product, ...prev]);
      }

      setIsModalOpen(false);
      hapticNotification('success');
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const availableCount = useMemo(() => products.filter((p) => p.is_available).length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => !p.is_available).length, [products]);
  const discountCount = useMemo(() => products.filter((p) => Boolean(p.discount_price)).length, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));

      let matchesFilter = true;
      if (filterAvailability === 'AVAILABLE') matchesFilter = p.is_available;
      else if (filterAvailability === 'UNAVAILABLE') matchesFilter = !p.is_available;
      else if (filterAvailability === 'DISCOUNT') matchesFilter = Boolean(p.discount_price);

      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, filterAvailability]);

  return (
    <div className="space-y-4">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            {t('supplier.products_management')}
          </h2>
          <p className="text-xs text-slate-500">
            Katalogdagi tovarlar: {products.length} ta
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t('supplier.add_product_btn')}</span>
        </button>
      </div>

      {/* Inventory Stats Cards */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">Sotuvda mavjud</span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{availableCount} ta</span>
        </div>
        <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">Tugagan</span>
          <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{outOfStockCount} ta</span>
        </div>
        <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">Aksiyada</span>
          <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{discountCount} ta</span>
        </div>
      </div>

      {/* Search & Filter Chips */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tovar nomi yoki tavsifi bo'yicha qidirish..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
          <button
            onClick={() => {
              hapticSelection();
              setFilterAvailability('ALL');
            }}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
              filterAvailability === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Barchasi ({products.length})
          </button>

          <button
            onClick={() => {
              hapticSelection();
              setFilterAvailability('AVAILABLE');
            }}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              filterAvailability === 'AVAILABLE'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Mavjud</span>
            <span>({availableCount})</span>
          </button>

          <button
            onClick={() => {
              hapticSelection();
              setFilterAvailability('UNAVAILABLE');
            }}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              filterAvailability === 'UNAVAILABLE'
                ? 'bg-amber-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Mavjud emas</span>
            <span>({outOfStockCount})</span>
          </button>

          {discountCount > 0 && (
            <button
              onClick={() => {
                hapticSelection();
                setFilterAvailability('DISCOUNT');
              }}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                filterAvailability === 'DISCOUNT'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>Aksiya</span>
              <span>({discountCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
          {t('common.loading')}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">
            {searchQuery ? "Qidiruv bo'yicha tovarlar topilmadi" : "Hozircha tovarlar mavjud emas"}
          </p>
          <button
            onClick={openAddModal}
            className="py-2 px-4 rounded-xl bg-brand-600 text-white text-xs font-bold mx-auto"
          >
            Tovar qo'shish
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              className={`p-3.5 bg-white dark:bg-slate-900 rounded-2xl border transition shadow-xs flex items-center justify-between gap-3 ${
                product.is_available
                  ? 'border-slate-200/80 dark:border-slate-800'
                  : 'border-slate-200/40 dark:border-slate-800/40 opacity-70 bg-slate-50/50'
              }`}
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Package className="w-6 h-6" />
                  </div>
                )}
                {product.discount_price && (
                  <span className="absolute top-1 left-1 bg-rose-500 text-white text-[8px] font-extrabold px-1 rounded-sm">
                    AKSIYA
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {product.name}
                  </h4>
                </div>

                <div className="flex items-baseline gap-1.5 text-xs">
                  <span className="font-extrabold text-brand-600 dark:text-brand-400">
                    {Number(product.discount_price ?? product.price).toLocaleString()} so'm
                  </span>
                  {product.discount_price && (
                    <span className="text-[10px] text-slate-400 line-through">
                      {Number(product.price).toLocaleString()}
                    </span>
                  )}
                </div>

                {product.quantity_optional !== null && (
                  <span className="text-[10px] text-slate-400 block">
                    Qoldiq: ~{product.quantity_optional} dona
                  </span>
                )}
              </div>

              {/* Action Controls & Stock Switcher */}
              <div className="flex items-center gap-2">
                {/* Instant In-Stock Switcher */}
                <button
                  onClick={() => handleToggleAvailability(product.id, product.is_available)}
                  title="Mavjudlik holatini o'zgartirish"
                  className={`p-1.5 rounded-xl border flex items-center gap-1 text-[11px] font-semibold transition ${
                    product.is_available
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${product.is_available ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span>{product.is_available ? 'Mavjud' : 'Yo\'q'}</span>
                </button>

                <button
                  onClick={() => openEditModal(product)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Product Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingProduct ? t('supplier.edit_product') : t('supplier.add_product_btn')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-2.5 text-xs bg-rose-50 text-rose-600 rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    {t('supplier.product_name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Qizil Olma (1kg)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    {t('supplier.product_desc')}
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tovar haqida qisqacha ma'lumot..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      {t('supplier.product_price')} *
                    </label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Masalan: 18000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      {t('supplier.discount_price')}
                    </label>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="Masalan: 15000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center pt-1">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      {t('supplier.quantity_optional')}
                    </label>
                    <input
                      type="number"
                      value={quantityOptional}
                      onChange={(e) => setQuantityOptional(e.target.value)}
                      placeholder="Ixtiyoriy miqdor"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {t('receiver.in_stock')} holatida
                      </span>
                    </label>
                  </div>
                </div>

                {/* Image presets */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
                    {t('supplier.image_url')} yoki shablon tanlang:
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {IMAGE_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setImageUrl(p.url)}
                        className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                          imageUrl === p.url ? 'border-brand-600 scale-105' : 'border-transparent'
                        }`}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 mt-1"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25"
                  >
                    {submitting ? 'Saqlanmoqda...' : t('supplier.save_product')}
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
