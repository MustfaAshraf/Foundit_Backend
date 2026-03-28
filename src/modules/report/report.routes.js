import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import { uploadMultiple } from '../../middlewares/upload.middleware.js';
import * as reportController from './report.controller.js';

const router = Router();

router.route('/')
.post(
    protect,
    uploadMultiple('images', 5),
    reportController.createReport
)
.get(reportController.getReports);

router.get('/stats', reportController.getStats);
router.get('/my-reports', protect, reportController.getUserReports);

router.route('/:id')
    .get(reportController.getReportById)
    .delete(
        protect,
        reportController.deleteReport
    );



export default router;
