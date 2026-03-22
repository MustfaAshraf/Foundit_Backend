import { Report } from "../../../DB/models/report.model.js";
import { Match } from "./../../../DB/models/match.model.js";
import {
  createBadRequestError,
  createNotFoundError,
} from "./../../../utils/appError.js";



// ==========================
// 1. Add Match
// ==========================
export const findMatches = async (reportId) => {
  console.log("report id in services:", reportId);

  const report = await Report.findById(reportId);
  console.log(report);

  if (!report) throw createNotFoundError(`This Report not found`);
  if (report.status !== "OPEN")
    throw createBadRequestError(
      `Cannot match a report with status: ${report.status}. Only OPEN reports are eligible.`,
    );
  const inverseType = report.type === "FOUND" ? "LOST" : "FOUND";
  console.log("inversetype :", inverseType);

  const allowedDistance = 500000;
  const category = report.category;

  const canditates = await Report.find({
    _id: { $ne: reportId },
    type: inverseType,
    category: category,
    status: "OPEN",
    location: {
      $near: {
        $geometry: report.location,
        $maxDistance: allowedDistance,
      },
    },
  });
  console.log(canditates);
  const matchesCreated = [];
  // 3. Scoring & Saving
  for (const candidate of canditates) {
    let score = 0;
    if (candidate.brand?.toLowerCase() === report.brand?.toLowerCase())
      score += 40;
    if (candidate.color?.toLowerCase() === report.color?.toLowerCase())
      score += 30;

    // Check Tags overlap
    const commonTags = report.tags.filter((tag) =>
      candidate.tags.includes(tag),
    );
    if (commonTags.length > 0) score += 30;

    // Create Match if score >= 60%
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
          score,
          status: "PROPOSED",
        },
        { upsert: true, new: true },
      );
      matchesCreated.push(match);
    }
  }
  console.log(matchesCreated);

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
// 4. Reject Match
// ==========================

// ==========================
// 4. Get All User Matches
// ==========================

// ==========================
// 5. Get Match Report
// ==========================
