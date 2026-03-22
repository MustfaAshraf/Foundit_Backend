import { HTTP_STATUS } from "../../config/constants.js";
import { sendSuccessResponse } from "../../utils/appResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as matchService from "../match/services/match.service.js" 



// @desc     Create a new match
// @route    POST /match/:reportId
// @access   

// ==========================
// 1. Add Match 
// ==========================
export const findMatches = asyncHandler(async(req,res)=>{
    const reportId = req.params.reportId;
    console.log("report id in controller: ",reportId);

    const matches = await matchService.findMatches(reportId);
    sendSuccessResponse(res, matches, HTTP_STATUS.CREATED);
    
})

// @desc     Accept Match
// @route    Patch /match/accept/:matchId
// @access   Private

// ==========================
// 2. Accept Match
// ==========================
export const acceptMatch = asyncHandler(async (req, res) => {
    console.log("in accept match match");
    
    const { matchId } = req.params;
     console.log(`matchId: ${matchId}`);
    const userId = req.user._id; 
    console.log(`matchId: ${matchId}, userId: ${userId}`);
    
    const updatedMatch = await matchService.acceptMatch(matchId, userId);
    
    const message = updatedMatch.status === 'ACCEPTED' 
        ? "Match confirmed! You can now start chatting." 
        : "You have accepted the match. Waiting for the other party.";

    sendSuccessResponse(res, { message, match: updatedMatch }, HTTP_STATUS.OK);
});