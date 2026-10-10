import { Router } from 'express';
import { supplierController } from '../controllers/supplier.controller';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { updateSupplierSettingsSchema } from '../validators/supplier.validator';
import { ROLES } from '../constants/app.constants';

export const supplierRouter = Router();

// 1. Get all active suppliers (optionally filtered by ?q= and ?free_delivery=true)
supplierRouter.get('/', supplierController.getAllSuppliers);

// 2. Get single supplier details and catalog
supplierRouter.get('/:id', supplierController.getSupplierById);

// 3. Update supplier delivery settings (Supplier only)
supplierRouter.put(
  '/settings',
  authMiddleware,
  requireRole([ROLES.SUPPLIER]),
  validate(updateSupplierSettingsSchema),
  supplierController.updateSettings
);
