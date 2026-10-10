import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/storage';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/authMiddleware';
import { notifyProductUpdated } from '../socket';

export const productRouter = Router();

// 1. Get products for a supplier
productRouter.get('/supplier/:supplierId', (req: Request, res: Response): void => {
  const supplierId = req.params.supplierId as string;
  const { all } = req.query; // If all=true, returns both available & unavailable (for supplier management)

  const onlyAvailable = all !== 'true';
  const products = db.getProductsBySupplierId(supplierId, onlyAvailable);

  res.json(products);
});

// 2. Add New Product (Supplier only)
const createProductSchema = z.object({
  name: z.string().min(1, 'Tovar nomi kiritilishi shart'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'Narx manfiy bo\'lishi mumkin emas'),
  discount_price: z.number().min(0).optional().nullable(),
  is_available: z.boolean().default(true),
  quantity_optional: z.number().int().min(0).optional().nullable(),
  image_url: z.string().optional().nullable(),
});

productRouter.post(
  '/',
  authMiddleware,
  requireRole(['SUPPLIER']),
  (req: AuthenticatedRequest, res: Response): void => {
    const supplier = db.findSupplierByUserId(req.user!.userId);

    if (!supplier) {
      res.status(403).json({ error: 'Faqat ta\'minotchilar tovar qo\'shishi mumkin' });
      return;
    }

    const result = createProductSchema.safeParse(req.body);
    if (!result.success) {
      const errorMsg = (result.error as any).issues?.[0]?.message || result.error.message || 'Tovar ma\'lumotlarida xatolik';
      res.status(400).json({ error: errorMsg });
      return;
    }

    const data = result.data;

    const newProduct = db.createProduct({
      supplier_id: supplier.id,
      name: data.name,
      description: data.description || null,
      price: data.price,
      discount_price: data.discount_price || null,
      is_available: data.is_available,
      quantity_optional: data.quantity_optional ?? null,
      image_url: data.image_url || null,
    });

    notifyProductUpdated(supplier.id, newProduct);

    res.status(201).json({
      message: 'Tovar muvaffaqiyatli qo\'shildi',
      product: newProduct,
    });
  }
);

// 3. Update Existing Product (Supplier only)
productRouter.put(
  '/:id',
  authMiddleware,
  requireRole(['SUPPLIER']),
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const supplier = db.findSupplierByUserId(req.user!.userId);

    if (!supplier) {
      res.status(403).json({ error: 'Ruxsat berilmagan' });
      return;
    }

    const existingProduct = db.findProductById(id);
    if (!existingProduct || existingProduct.supplier_id !== supplier.id) {
      res.status(404).json({ error: 'Tovar topilmadi yoki sizga tegishli emas' });
      return;
    }

    const { name, description, price, discount_price, is_available, quantity_optional, image_url } = req.body;

    const updated = db.updateProduct(id, {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price: Number(price) } : {}),
      ...(discount_price !== undefined ? { discount_price: discount_price === null ? null : Number(discount_price) } : {}),
      ...(is_available !== undefined ? { is_available: Boolean(is_available) } : {}),
      ...(quantity_optional !== undefined ? { quantity_optional: quantity_optional === null ? null : Number(quantity_optional) } : {}),
      ...(image_url !== undefined ? { image_url } : {}),
    });

    if (updated) {
      notifyProductUpdated(supplier.id, updated);
    }

    res.json({
      message: 'Tovar yangilandi',
      product: updated,
    });
  }
);

// 4. Fast Toggle Availability ("Mavjud" / "Mavjud emas" switcher)
productRouter.patch(
  '/:id/availability',
  authMiddleware,
  requireRole(['SUPPLIER']),
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const supplier = db.findSupplierByUserId(req.user!.userId);

    if (!supplier) {
      res.status(403).json({ error: 'Ruxsat berilmagan' });
      return;
    }

    const product = db.findProductById(id);
    if (!product || product.supplier_id !== supplier.id) {
      res.status(404).json({ error: 'Tovar topilmadi' });
      return;
    }

    const isAvailable = req.body.is_available !== undefined ? Boolean(req.body.is_available) : !product.is_available;
    const updated = db.updateProduct(id, { is_available: isAvailable });

    if (updated) {
      notifyProductUpdated(supplier.id, updated);
    }

    res.json({
      message: `Tovar holati o'zgartirildi: ${isAvailable ? 'Mavjud' : 'Mavjud emas'}`,
      product: updated,
    });
  }
);

// 5. Delete Product (Supplier only)
productRouter.delete(
  '/:id',
  authMiddleware,
  requireRole(['SUPPLIER']),
  (req: AuthenticatedRequest, res: Response): void => {
    const id = req.params.id as string;
    const supplier = db.findSupplierByUserId(req.user!.userId);

    if (!supplier) {
      res.status(403).json({ error: 'Ruxsat berilmagan' });
      return;
    }

    const product = db.findProductById(id);
    if (!product || product.supplier_id !== supplier.id) {
      res.status(404).json({ error: 'Tovar topilmadi' });
      return;
    }

    db.deleteProduct(id);

    res.json({
      message: 'Tovar muvaffaqiyatli o\'chirildi',
    });
  }
);
