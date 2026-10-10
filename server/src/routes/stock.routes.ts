import { Router } from 'express';
import {
  listStock,
  receiveStock,
  transferStock,
  adjustStock,
  recordDamagedStock,
  listMovements,
} from '../controllers/stock.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  receiveStockSchema,
  transferStockSchema,
  adjustStockSchema,
  damagedStockSchema,
} from '../validators/stock.validator';
import { asyncHandler } from '../utils/response';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Read stock and movements
router.get('/', asyncHandler(listStock));
router.get('/movements', asyncHandler(listMovements));

// Stock mutations (Storekeeper or Owner)
router.post(
  '/receive',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(receiveStockSchema),
  asyncHandler(receiveStock)
);

router.post(
  '/transfer',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(transferStockSchema),
  asyncHandler(transferStock)
);

router.post(
  '/adjust',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(adjustStockSchema),
  asyncHandler(adjustStock)
);

router.post(
  '/damaged',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(damagedStockSchema),
  asyncHandler(recordDamagedStock)
);

export default router;
