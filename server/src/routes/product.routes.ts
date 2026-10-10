import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from '../controllers/product.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from '../validators/product.validator';
import { asyncHandler } from '../utils/response';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listProducts));
router.get('/:id', asyncHandler(getProduct));

router.post(
  '/',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(createProductSchema),
  asyncHandler(createProduct)
);

router.patch(
  '/:id',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(updateProductSchema),
  asyncHandler(updateProduct)
);

router.delete(
  '/:id',
  requireRole(UserRole.OWNER),
  asyncHandler(deleteProduct)
);

// Variant routes
router.post(
  '/:productId/variants',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(createVariantSchema),
  asyncHandler(createVariant)
);

router.patch(
  '/variants/:variantId',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(updateVariantSchema),
  asyncHandler(updateVariant)
);

router.delete(
  '/variants/:variantId',
  requireRole(UserRole.OWNER),
  asyncHandler(deleteVariant)
);

export default router;
