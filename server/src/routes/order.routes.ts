import { Router } from 'express';
import {
  listOrders,
  getOrder,
  createOrder,
  confirmOrder,
  updateOrderStatus,
  cancelOrder,
  recordPayment,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  recordPaymentSchema,
} from '../validators/order.validator';
import { asyncHandler } from '../utils/response';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listOrders));
router.get('/:id', asyncHandler(getOrder));
router.post('/', validate(createOrderSchema), asyncHandler(createOrder));
router.post('/:id/confirm', asyncHandler(confirmOrder));
router.patch('/:id/status', validate(updateOrderStatusSchema), asyncHandler(updateOrderStatus));
router.post('/:id/cancel', asyncHandler(cancelOrder));
router.post('/:id/payments', validate(recordPaymentSchema), asyncHandler(recordPayment));

export default router;
