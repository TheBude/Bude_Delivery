import { db } from '../db/storage';
import { NotFoundError } from '../errors/AppError';
import { UpdateSupplierSettingsInput } from '../validators/supplier.validator';

export class SupplierService {
  /**
   * Get all active suppliers with product counts, optionally filtered
   */
  public getAllSuppliers(searchQuery?: string, freeDeliveryOnly?: boolean) {
    let suppliers = db.getAllSuppliers();

    if (searchQuery && typeof searchQuery === 'string') {
      const query = searchQuery.toLowerCase().trim();
      suppliers = suppliers.filter(
        (s) =>
          s.company_name.toLowerCase().includes(query) ||
          s.user?.first_name.toLowerCase().includes(query) ||
          s.user?.last_name.toLowerCase().includes(query)
      );
    }

    if (freeDeliveryOnly) {
      suppliers = suppliers.filter((s) => s.is_free_delivery);
    }

    return suppliers.map((s) => {
      const products = db.getProductsBySupplierId(s.id, true);
      return {
        ...s,
        active_products_count: products.length,
      };
    });
  }

  /**
   * Get supplier by ID with full profile and products
   */
  public getSupplierById(id: string) {
    const supplier = db.findSupplierById(id);
    if (!supplier) {
      throw new NotFoundError('Ta\'minotchi topilmadi');
    }

    const user = db.findUserById(supplier.user_id);
    const products = db.getProductsBySupplierId(supplier.id, true);

    return {
      ...supplier,
      user,
      products,
    };
  }

  /**
   * Update supplier settings for authenticated user
   */
  public updateSettings(userId: string, input: UpdateSupplierSettingsInput) {
    const supplier = db.findSupplierByUserId(userId);
    if (!supplier) {
      throw new NotFoundError('Ta\'minotchi profili topilmadi');
    }

    const updated = db.updateSupplier(supplier.id, {
      ...(input.company_name ? { company_name: input.company_name.trim() } : {}),
      ...(input.delivery_fee !== undefined ? { delivery_fee: Number(input.delivery_fee) } : {}),
      ...(input.is_free_delivery !== undefined ? { is_free_delivery: Boolean(input.is_free_delivery) } : {}),
    });

    return {
      message: 'Yetkazib berish sozlamalari yangilandi',
      supplier: updated,
    };
  }
}

export const supplierService = new SupplierService();
