export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            // 👇 1. PRINT THE EXACT ERROR IN THE TERMINAL
            console.error("🔥 [API CRASH DETECTED]:", err.message);
            console.error(err.stack); // Prints the exact line number where it failed

            // 👇 2. Pass it to the Global Error Handler to send to the frontend
            next(err);
        });
    };
};