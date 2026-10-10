import { Router, Request, Response } from 'express';
import { db } from '../db/storage';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/authMiddleware';

export const supplierRouter = Router();

// 1. Get all active suppliers (For Receiver view)
supplierRouter.get('/', (req: Request, res: Response): void => {
  const { q, free_delivery } = req.query;
  let suppliers = db.getAllSuppliers();

  // Filter by search query
  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    suppliers = suppliers.filter(
      (s) =>
        s.company_name.toLowerCase().includes(query) ||
        s.user?.first_name.toLowerCase().includes(query) ||
        s.user?.last_name.toLowerCase().includes(query)
    );
  }

  // Filter by free delivery
  if (free_delivery === 'true') {
    suppliers = suppliers.filter((s) => s.is_free_delivery);
  }

  // Enrich with active product count
  const results = suppliers.map((s) => {
    const products = db.getProductsBySupplierId(s.id, true);
    return {
      ...s,
      active_products_count: products.length,
    };
  });

  res.json(results);
});

// 2. Get single supplier details
supplierRouter.get('/:id', (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const supplier = db.findSupplierById(id);

  if (!supplier) {
    res.status(404).json({ error: 'Ta\'minotchi topilmadi' });
    return;
  }

  const user = db.findUserById(supplier.user_id);
  const products = db.getProductsBySupplierId(supplier.id, true);

  res.json({
    ...supplier,
    user,
    products,
  });
});

// 3. Update Supplier Delivery Settings (Supplier only)
supplierRouter.put(
  '/settings',
  authMiddleware,
  requireRole(['SUPPLIER']),
  (req: AuthenticatedRequest, res: Response): void => {
    const supplier = db.findSupplierByUserId(req.user!.userId);

    if (!supplier) {
      res.status(404).json({ error: 'Ta\'minotchi profili topilmadi' });
      return;
    }

    const { company_name, delivery_fee, is_free_delivery } = req.body;

    const updated = db.updateSupplier(supplier.id, {
      ...(company_name ? { company_name: company_name.trim() } : {}),
      ...(delivery_fee !== undefined ? { delivery_fee: Number(delivery_fee) } : {}),
      ...(is_free_delivery !== undefined ? { is_free_delivery: Boolean(is_free_delivery) } : {}),
    });

    res.json({
      message: 'Yetkazib berish sozlamalari yangilandi',
      supplier: updated,
    });
  }
);
