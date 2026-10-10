import { Router } from 'express';
import { authRouter } from './authRoutes';
import { supplierRouter } from './supplierRoutes';
import { productRouter } from './productRoutes';
import { orderRouter } from './orderRoutes';
import { adminRouter } from './adminRoutes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/suppliers', supplierRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/admin', adminRouter);
