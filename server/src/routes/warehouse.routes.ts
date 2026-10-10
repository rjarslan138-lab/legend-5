import { Router } from 'express';
import {
  listWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/warehouse.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  createLocationSchema,
  updateLocationSchema,
} from '../validators/warehouse.validator';
import { asyncHandler } from '../utils/response';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

// List/view warehouses
router.get('/', asyncHandler(listWarehouses));
router.get('/:id', asyncHandler(getWarehouse));

// Modify warehouses (Owner or Storekeeper)
router.post(
  '/',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(createWarehouseSchema),
  asyncHandler(createWarehouse)
);
router.patch(
  '/:id',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(updateWarehouseSchema),
  asyncHandler(updateWarehouse)
);
router.delete('/:id', requireRole(UserRole.OWNER), asyncHandler(deleteWarehouse));

// Locations per warehouse
router.get('/:warehouseId/locations', asyncHandler(listLocations));
router.post(
  '/:warehouseId/locations',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(createLocationSchema),
  asyncHandler(createLocation)
);
router.patch(
  '/:warehouseId/locations/:locationId',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  validate(updateLocationSchema),
  asyncHandler(updateLocation)
);
router.delete(
  '/:warehouseId/locations/:locationId',
  requireRole(UserRole.OWNER, UserRole.STOREKEEPER),
  asyncHandler(deleteLocation)
);

export default router;
