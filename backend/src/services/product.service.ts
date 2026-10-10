import { db } from '../db/storage';
import { notifyProductUpdated } from '../socket';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';

export class ProductService {
  /**
   * Get products by supplier ID
   */
  public getProductsBySupplier(supplierId: string, onlyAvailable: boolean = true) {
    return db.getProductsBySupplierId(supplierId, onlyAvailable);
  }

  /**
   * Create a new product for authenticated supplier
   */
  public createProduct(userId: string, input: CreateProductInput) {
    const supplier = db.findSupplierByUserId(userId);
    if (!supplier) {
      throw new ForbiddenError('Faqat ta\'minotchilar tovar qo\'shishi mumkin');
    }

    const newProduct = db.createProduct({
      supplier_id: supplier.id,
      name: input.name,
      description: input.description || null,
      price: input.price,
      discount_price: input.discount_price || null,
      is_available: input.is_available,
      quantity_optional: input.quantity_optional ?? null,
      image_url: input.image_url || null,
    });

    notifyProductUpdated(supplier.id, newProduct);

    return {
      message: 'Tovar muvaffaqiyatli qo\'shildi',
      product: newProduct,
    };
  }

  /**
   * Update existing product
   */
  public updateProduct(userId: string, productId: string, input: UpdateProductInput) {
    const supplier = db.findSupplierByUserId(userId);
    if (!supplier) {
      throw new ForbiddenError('Ruxsat berilmagan');
    }

    const existingProduct = db.findProductById(productId);
    if (!existingProduct || existingProduct.supplier_id !== supplier.id) {
      throw new NotFoundError('Tovar topilmadi yoki sizga tegishli emas');
    }

    const updated = db.updateProduct(productId, {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: Number(input.price) } : {}),
      ...(input.discount_price !== undefined
        ? { discount_price: input.discount_price === null ? null : Number(input.discount_price) }
        : {}),
      ...(input.is_available !== undefined ? { is_available: Boolean(input.is_available) } : {}),
      ...(input.quantity_optional !== undefined
        ? { quantity_optional: input.quantity_optional === null ? null : Number(input.quantity_optional) }
        : {}),
      ...(input.image_url !== undefined ? { image_url: input.image_url } : {}),
    });

    if (updated) {
      notifyProductUpdated(supplier.id, updated);
    }

    return {
      message: 'Tovar yangilandi',
      product: updated,
    };
  }

  /**
   * Toggle product availability status
   */
  public toggleAvailability(userId: string, productId: string, explicitStatus?: boolean) {
    const supplier = db.findSupplierByUserId(userId);
    if (!supplier) {
      throw new ForbiddenError('Ruxsat berilmagan');
    }

    const product = db.findProductById(productId);
    if (!product || product.supplier_id !== supplier.id) {
      throw new NotFoundError('Tovar topilmadi');
    }

    const isAvailable = explicitStatus !== undefined ? Boolean(explicitStatus) : !product.is_available;
    const updated = db.updateProduct(productId, { is_available: isAvailable });

    if (updated) {
      notifyProductUpdated(supplier.id, updated);
    }

    return {
      message: `Tovar holati o'zgartirildi: ${isAvailable ? 'Mavjud' : 'Mavjud emas'}`,
      product: updated,
    };
  }

  /**
   * Delete product
   */
  public deleteProduct(userId: string, productId: string) {
    const supplier = db.findSupplierByUserId(userId);
    if (!supplier) {
      throw new ForbiddenError('Ruxsat berilmagan');
    }

    const product = db.findProductById(productId);
    if (!product || product.supplier_id !== supplier.id) {
      throw new NotFoundError('Tovar topilmadi');
    }

    db.deleteProduct(productId);

    return {
      message: 'Tovar muvaffaqiyatli o\'chirildi',
    };
  }
}

export const productService = new ProductService();
