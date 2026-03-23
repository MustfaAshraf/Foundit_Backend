import { asyncHandler } from '../../utils/asyncHandler.js';
import * as reportService from './services/report.service.js';

export const createReport = asyncHandler(async (req, res, next) => {
    const newReport = await reportService.createReportService(req.body, req.files, req.user._id);

    res.status(201).json({
        status: 'success',
        data: { report: newReport }
    });
});

export const getReports = asyncHandler(async (req, res, next) => {
    // Pass req.query directly to the service
    const { reports, total } = await reportService.getReportsService(req.query);

    res.status(200).json({
        status: 'success',
        results: reports.length,
        total,
        data: { reports }
    });
});

export const getReportById = asyncHandler(async (req, res, next) => {
    const report = await reportService.getReportByIdService(req.params.id);

    res.status(200).json({
        status: 'success',
        data: { report }
    });
});

export const deleteReport = asyncHandler(async (req, res, next) => {
    await reportService.deleteReportService(req.params.id, req.user);

    res.status(204).json({
        status: 'success',
        data: null
    });
});
