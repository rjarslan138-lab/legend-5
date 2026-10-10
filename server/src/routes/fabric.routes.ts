import { Router } from 'express';
import {
  listFabricBatches,
  getFabricBatch,
  createFabricBatch,
  updateFabricBatch,
  deleteFabricBatch,
} from '../controllers/fabric.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createFabricBatchSchema, updateFabricBatchSchema } from '../validators/fabric.validator';
import { asyncHandler } from '../utils/response';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listFabricBatches));
router.get('/:id', asyncHandler(getFabricBatch));

router.post(
  '/',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(createFabricBatchSchema),
  asyncHandler(createFabricBatch)
);

router.patch(
  '/:id',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(updateFabricBatchSchema),
  asyncHandler(updateFabricBatch)
);

router.delete(
  '/:id',
  requireRole(UserRole.OWNER),
  asyncHandler(deleteFabricBatch)
);

export default router;
