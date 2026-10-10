import { Router } from 'express';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../validators/auth.validator';
import { asyncHandler } from '../utils/response';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.OWNER));

router.get('/', asyncHandler(listUsers));
router.post('/', validate(createUserSchema), asyncHandler(createUser));
router.patch('/:id', validate(updateUserSchema), asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));

export default router;
