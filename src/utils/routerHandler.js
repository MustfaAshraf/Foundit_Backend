import authRouter from "../modules/auth/auth.routes.js"
import matchRouter from "../modules/match/match.routes.js"
import notificationRouter from "../modules/notification/notification.routes.js"
import reportRouter from "../modules/report/report.routes.js"
import userRouter from "../modules/user/user.routes.js"
import paymentRouter from "../modules/payment/payment.routes.js"
import adminRouter from "../modules/admin/admin.routes.js"

// import userRouter from "../modules/user/user.routes.js"
import chatRouter from "../modules/chat/chat.routes.js"

const routerHandler = async (app, express) => {

    app.use("/api/v1/auth", authRouter)
    app.use("/api/v1/match", matchRouter)
    app.use("/api/v1/notifications", notificationRouter)
    app.use("/api/v1/reports", reportRouter)
    app.use("/api/v1/users", userRouter)
    app.use("/api/v1/payments", paymentRouter)
    // app.use("/api/v1/users", userRouter)
    app.use("/api/v1/chat", chatRouter)
    app.use("/api/v1/admin", adminRouter)

    app.use("/{*any}", (req, res) => {
        res.status(404).json({ message: "this Router is not found" });
    });
};

export default routerHandler;
