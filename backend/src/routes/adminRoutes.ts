import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../db/storage';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import { Role } from '../types';

export const adminRouter = Router();

adminRouter.use(authMiddleware);

// Admin permission check
function ensureAdmin(req: AuthenticatedRequest) {
  const user = req.user ? db.findUserById(req.user.userId) : null;
  const isEmailAdmin = req.user?.email === 'sbunyod15@gmail.com' || user?.email === 'sbunyod15@gmail.com';
  const isRoleAdmin = req.user?.role === 'ADMIN' || user?.role === 'ADMIN';

  if (!isEmailAdmin && !isRoleAdmin) {
    throw new ForbiddenError('Faqat Admin uchun ruxsat berilgan (Admin access only)');
  }
}

/**
 * GET /api/admin/overview
 * Returns system statistics, all registered users, suppliers, and orders
 */
adminRouter.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  ensureAdmin(req);

  const users = db.getAllUsers();
  const suppliers = db.getAllSuppliers();
  const orders = db.getAllOrders();

  const totalUsers = users.length;
  const receiversCount = users.filter((u) => u.role === 'RECEIVER').length;
  const suppliersCount = users.filter((u) => u.role === 'SUPPLIER').length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

  res.json({
    stats: {
      totalUsers,
      receiversCount,
      suppliersCount,
      totalOrders,
      totalRevenue,
    },
    users,
    suppliers,
    orders,
  });
});

/**
 * PATCH /api/admin/users/:id/role
 * Allows promoting or changing a user's role (SUPPLIER, RECEIVER, ADMIN)
 */
adminRouter.patch('/users/:id/role', (req: AuthenticatedRequest, res: Response) => {
  ensureAdmin(req);

  const id = String(req.params.id);
  const { role } = req.body as { role: Role };

  if (!['SUPPLIER', 'RECEIVER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Noto‘g‘ri rol berildi' });
  }

  const updatedUser = db.updateUser(id, { role });
  if (!updatedUser) {
    throw new NotFoundError('Foydalanuvchi topilmadi');
  }

  res.json({
    message: 'Foydalanuvchi roli muvaffaqiyatli o‘zgartirildi',
    user: updatedUser,
  });
});
