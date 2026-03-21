import { HTTP_STATUS } from "../../config/constants.js";
import { sendSuccessResponse } from "../../utils/appResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as matchService from "../match/services/match.service.js" 

export const findMatches = asyncHandler(async(req,res)=>{
    const reportId = req.params.reportId;
    console.log("report id in controller: ",reportId);

    const matches = await matchService.findMatches(reportId);
    sendSuccessResponse(res, matches, HTTP_STATUS.CREATED);
    
})
// usecallback