import { Report } from "../../../DB/models/report.model.js";
import { Match } from "./../../../DB/models/match.model.js";
import { Conversation } from "./../../../DB/models/conversation.model.js";
import {
  createBadRequestError,
  createNotFoundError,
  createForbiddenError
} from "./../../../utils/appError.js";
import { sendNotification } from '../../notification/services/notification.service.js';



// ==========================
// 1. Add Match
// ==========================
export const findMatches = async (reportId) => {
  console.log("report id in services:", reportId);

  const report = await Report.findById(reportId);
  console.log("Processing Match for:", report?.title);

  if (!report) throw createNotFoundError(`This Report not found`);
  if (report.status !== "OPEN")
    throw createBadRequestError(
      `Cannot match a report with status: ${report.status}. Only OPEN reports are eligible.`,
    );
    
  const inverseType = report.type === "FOUND" ? "LOST" : "FOUND";
  const allowedDistance = 50000; // 50 km boundary
  const category = report.category;
  const subCategory = report.subCategory; // Hard constraint

  // Retrieve eligible candidates using Hard Constraints + Location Radius
  const canditates = await Report.find({
    _id: { $ne: reportId },
    user: { $ne: report.user }, // Prevent matching with the exact same user
    type: inverseType,
    category: category,
    subCategory: subCategory, // MUST match exactly
    status: "OPEN",
    location: {
      $near: {
        $geometry: report.location,
        $maxDistance: allowedDistance,
      },
    },
  });
  
  console.log(`Found ${canditates.length} eligible candidates in radius.`);
  const matchesCreated = [];
  
  // 3. Dynamic Weighted Scoring Matrix
  for (const candidate of canditates) {
    let score = 0;
    
    // Tag Overlap (40% Priority - Fuzzy logic normalized strings)
    const normalize = (tag) => tag.toLowerCase().replace(/[-،,]/g, ' ').replace(/\s+/g, ' ').trim();
    const candidateTags = candidate.tags.map(normalize);
    const reportTags = report.tags.map(normalize);
    
    if (reportTags.length > 0) {
      const commonTags = reportTags.filter((tag) => candidateTags.includes(tag));
      score += (commonTags.length / reportTags.length) * 40;
    }

    // Brand (25% Exact case-insensitive match)
    if (candidate.brand && report.brand && candidate.brand.toLowerCase() === report.brand.toLowerCase()) {
      score += 25;
    }

    // Date Proximity (15%)
    if (candidate.dateHappened && report.dateHappened) {
      const diffTime = Math.abs(candidate.dateHappened - report.dateHappened);
      const diffHours = diffTime / (1000 * 60 * 60);
      if (diffHours <= 24) {
        score += 15;
      } else if (diffHours <= 72) {
        score += 7;
      }
    }

    // Color (10%)
    if (candidate.color && report.color && candidate.color.toLowerCase() === report.color.toLowerCase()) {
      score += 10;
    }

    // Location (10%) 
    // Mongoose $near explicitly filters out documents beyond 50km, meaning all loop candidates win 10pts.
    score += 10;

    console.log(`Candidate ${candidate._id} - Target Score: ${Math.round(score)}%`);

    // Create Match specifically at Threshold >= 60%
    if (score >= 60) {
      const lostId = report.type === "LOST" ? reportId : candidate._id;
      const foundId = report.type === "FOUND" ? reportId : candidate._id;
      const match = await Match.findOneAndUpdate(
        {
          $or: [
            { lostReport: reportId, foundReport: candidate._id },
            { lostReport: candidate._id, foundReport: reportId },
          ],
        },
        {
          lostReport: { report: lostId, isAccepted: false },
          foundReport: { report: foundId, isAccepted: false },
          score: Math.round(score),
          status: "PROPOSED",
        },
        { upsert: true, new: true },
      );
      matchesCreated.push(match);

      // Lock global statuses inherently
      if (report.status !== "MATCHED") {
        report.status = "MATCHED";
        await report.save();
      }
      if (candidate.status !== "MATCHED") {
        candidate.status = "MATCHED";
        await candidate.save();
      }

      // Dispatch Notifications to both owners seamlessly in background
      try {
        await sendNotification({
          recipientId: report.user,
          category: 'MATCH',
          title: 'Potential Match Found!',
          message: `We found a potential match for your report: ${report.title} (Score: ${Math.round(score)}%). Review it now!`,
          data: { reportId: report._id }
        });
        
        await sendNotification({
          recipientId: candidate.user,
          category: 'MATCH',
          title: 'Potential Match Proposed!',
          message: `A new report has been submitted that might match your item: ${candidate.title} (Score: ${Math.round(score)}%). Check it out!`,
          data: { reportId: candidate._id }
        });
      } catch (notifErr) {
        console.error("Match Notification Output Error:", notifErr.message);
      }
    }
  }

  return matchesCreated;
};



// ==========================
// 2. Accept Match
// ==========================
export const acceptMatch = async (matchId, userId) => {
  console.log("accept Match function");

  const match = await Match.findById(matchId).populate([
    {
      path: "lostReport.report",
      model: "Report",
    },
    {
      path: "foundReport.report",
      model: "Report",
    },
  ]);
  if (!match) throw createNotFoundError(`This Match not found`);
  console.log("foundUser");

  console.log(match.foundReport);
  const foundReportOwnerId = match.foundReport?.report?.user;
  const lostReportOwnerId = match.lostReport?.report?.user;
  const isFoundUser = foundReportOwnerId?.toString() === userId.toString();
  const isLostUser = lostReportOwnerId?.toString() === userId.toString();

  console.log(
    `Lost Owner: ${isLostUser}, Found Owner: ${isFoundUser}, Current User: ${userId}`,
  );
  if (!isFoundUser && !isLostUser)
    throw createBadRequestError("You are not a party to this match.");
  if (isFoundUser) {
    match.foundReport.isAccepted = true;
    match.foundReport.acceptedAt = new Date();
  } else {
    match.lostReport.isAccepted = true;
    match.lostReport.acceptedAt = new Date();
  }
  if (match.lostReport.isAccepted && match.foundReport.isAccepted) {
    match.status = "ACCEPTED";
    console.log("Match fully ACCEPTED by both parties!");
  }
  await match.save();
  return match;
};

// ==========================
// 3. Reject Match
// ==========================

export const rejectMatch = async (matchId, userId) => {
    const match = await Match.findById(matchId).populate([
        { path: 'lostReport.report', model: 'Report' },
        { path: 'foundReport.report', model: 'Report' }
    ]);

    if (!match) throw createNotFoundError(`Match not found`);
    const isLostOwner = match.lostReport?.report?.user?.toString() === userId.toString();
    const isFoundOwner = match.foundReport?.report?.user?.toString() === userId.toString();

    if (!isLostOwner && !isFoundOwner) {
        throw createForbiddenError('You are not authorized to reject this match.');
    }

    match.status = 'REJECTED';
    
    await match.save();

    // Check gracefully evaluating if native global revert to 'OPEN' safely applies globally exclusively
    const checkAndRevertReport = async (repId) => {
        const otherMatches = await Match.find({
            $or: [
                { 'lostReport.report': repId },
                { 'foundReport.report': repId }
            ],
            status: { $ne: 'REJECTED' }
        });
        if (otherMatches.length === 0) {
            await Report.findByIdAndUpdate(repId, { status: 'OPEN' });
        }
    };

    await Promise.all([
        checkAndRevertReport(match.lostReport.report._id),
        checkAndRevertReport(match.foundReport.report._id)
    ]);

    return match;
};

// ==========================
// 4. Resolve Match
// ==========================
export const resolveMatch = async (matchId, userId) => {
    const match = await Match.findById(matchId).populate([
        { path: 'lostReport.report', model: 'Report' },
        { path: 'foundReport.report', model: 'Report' }
    ]);

    if (!match) throw createNotFoundError(`Match not found`);
    const isLostOwner = match.lostReport?.report?.user?.toString() === userId.toString();
    const isFoundOwner = match.foundReport?.report?.user?.toString() === userId.toString();

    if (!isLostOwner && !isFoundOwner) {
        throw createForbiddenError('You are not authorized to resolve this match.');
    }

    if (match.status !== 'ACCEPTED') {
        throw createBadRequestError('Match cannot be resolved unless it is fully ACCEPTED by both parties.');
    }

    match.status = 'VERIFIED';
    await match.save();

    await Report.findByIdAndUpdate(match.lostReport.report._id, { status: 'RESOLVED' });
    await Report.findByIdAndUpdate(match.foundReport.report._id, { status: 'RESOLVED' });

    return match;
};

// ==========================
// 4. Get All Matches
// ==========================

export const getAllMatches = async (filters = {}) => {
    const matches = await Match.find(filters).populate([{ 
                path: 'lostReport.report', 
                model: 'Report',
                populate: { path: 'user', select: 'name email phone' } 
            },
            { 
                path: 'foundReport.report', 
                model: 'Report',
                populate: { path: 'user', select: 'name email phone' }
            }
        ])
        .sort({ createdAt: -1 });

        if(!matches) throw createNotFoundError('There is no any Matches');

    return matches;
};

// ==========================
// 5. Get user Matches 
// ==========================
export const getUserMatches = async (userId) => {
    const matches = await Match.find().populate([
        { 
            path: 'lostReport.report', 
            model: 'Report'
        },
        { 
            path: 'foundReport.report', 
            model: 'Report'
        }
    ]);

    const userMatches = matches.filter(match => {
        const isLostOwner = match.lostReport.report?.user.toString() === userId.toString();
        const isFoundOwner = match.foundReport.report?.user.toString() === userId.toString();
        return isLostOwner || isFoundOwner;
    });
    if(userMatches.length ===0)  throw createNotFoundError('There is no any Matches');

    // Add hasChat logic: check if there's an active conversation with messages for either report
    const enhancedMatches = await Promise.all(userMatches.map(async (match) => {
        const conversation = await Conversation.findOne({
            relatedReport: { $in: [match.lostReport.report._id, match.foundReport.report._id] },
            lastMessage: { $exists: true, $ne: "" }
        });

        const matchObj = match.toObject();
        matchObj.hasChat = !!conversation;
        return matchObj;
    }));

    return enhancedMatches;
};