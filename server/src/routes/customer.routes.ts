import { Router } from 'express';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validator';
import { asyncHandler } from '../utils/response';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listCustomers));
router.get('/:id', asyncHandler(getCustomer));
router.post('/', validate(createCustomerSchema), asyncHandler(createCustomer));
router.patch('/:id', validate(updateCustomerSchema), asyncHandler(updateCustomer));
router.delete('/:id', asyncHandler(deleteCustomer));

export default router;
