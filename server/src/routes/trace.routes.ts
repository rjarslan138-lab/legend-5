import { Router } from 'express';
import { traceSku } from '../controllers/trace.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/response';

const router = Router();

router.use(authenticate);

router.get('/sku/:sku', asyncHandler(traceSku));

export default router;
