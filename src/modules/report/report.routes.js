import { Router } from 'express';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';
import { uploadMultiple } from '../../middlewares/upload.middleware.js';
import * as reportController from './report.controller.js';
import { cacheReports } from '../../middlewares/cache.middleware.js';

const router = Router();

router.route('/')
.post(
    protect,
    restrictTo('user'),
    uploadMultiple('images', 5),
    reportController.createReport
)
.get(protect, cacheReports, reportController.getReports)
router.get('/stats', protect, reportController.getStats);
router.get('/my-reports', protect, restrictTo('user'), reportController.getUserReports);

router.route('/:id')
    .get(protect, reportController.getReportById)
    .delete(
        protect,
        reportController.deleteReport
    );



export default router;
