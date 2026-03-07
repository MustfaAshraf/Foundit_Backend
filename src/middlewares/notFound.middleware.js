import { createNotFoundError } from "../utils/appError";

export const notFound = (req, res, next) => {
    const error = createNotFoundError(`Route${req.originalUrl} not found`);
    next(error);
};