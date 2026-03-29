import * as transService from "./services/transactions.services.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccessResponse } from "../../../utils/appResponse.js";

export const getAllTransactions = asyncHandler(async (req, res, next) => {
  const { page, limit } = req.query;
  const data = await transService.fetchAllTransactions(page * 1, limit * 1);

  return sendSuccessResponse(res, data, 200);
});

export const getStats = asyncHandler(async (req, res, next) => {
  const stats = await transService.fetchTransactionStats();

  return sendSuccessResponse(res, stats, 200);
});
