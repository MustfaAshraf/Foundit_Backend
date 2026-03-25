import { asyncHandler } from '../../utils/asyncHandler.js';
import * as reportService from './services/report.service.js';
import { sendSuccessResponse } from '../../utils/appResponse.js';

export const createReport = asyncHandler(async (req, res, next) => {
    const newReport = await reportService.createReportService(req.body, req.files, req.user._id);

    return sendSuccessResponse(res, { report: newReport }, 201);
});

export const getReports = asyncHandler(async (req, res, next) => {
    // Pass req.query directly to the service
    const { reports, total } = await reportService.getReportsService(req.query);

    return sendSuccessResponse(res, {
        results: reports.length,
        total,
        reports
    }, 200);
});

export const getReportById = asyncHandler(async (req, res, next) => {
    const report = await reportService.getReportByIdService(req.params.id);

    return sendSuccessResponse(res, { report }, 200);
});

export const deleteReport = asyncHandler(async (req, res, next) => {
    await reportService.deleteReportService(req.params.id, req.user);

    // 204 No Content
    return sendSuccessResponse(res, null, 204);
});


// getUserReportsService

export const getUserReports = asyncHandler(async (req, res) => {
    const userId = req.user._id; 
    const reports = await reportService.getUserReportsService(userId, req.query);
      return sendSuccessResponse(res, 
        reports
    , 200);


});