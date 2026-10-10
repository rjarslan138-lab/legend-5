import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/response';

const router = Router();

router.use(authenticate);

router.get('/summary', asyncHandler(getDashboardSummary));

export default router;
