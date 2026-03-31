import authRouter from "../modules/auth/auth.routes.js";
import matchRouter from "../modules/match/match.routes.js";
import notificationRouter from "../modules/notification/notification.routes.js";
import reportRouter from "../modules/report/report.routes.js";
import userRouter from "../modules/user/user.routes.js";
import paymentRouter from "../modules/payment/payment.routes.js";
import communityRouter from "../modules/admin/community/community.routes.js";
import adminUserRoutes from "../modules/admin/user/user.routes.js";
import adminRouter from "../modules/admin/reports/report.routes.js";
import chatRouter from "../modules/chat/chat.routes.js";
import adminTransRouter from "../modules/admin/transactions/transactions.routes.js";
import supportRouter from "../modules/support/support.routes.js";
import broadcastsRouter from "../modules/admin/broadcasts/broadcast.routes.js";
import dashboardRouter from "../modules/admin/dashboard/dashboard.routes.js";

const routerHandler = async (app, express) => {
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/match", matchRouter);
  app.use("/api/v1/notifications", notificationRouter);
  app.use("/api/v1/reports", reportRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/payments", paymentRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("/api/v1/admin/users", adminUserRoutes);
  app.use("/api/v1/admin/transactions", adminTransRouter);
  app.use("/api/v1/admin/communities", communityRouter);
  app.use("/api/v1/admin/reports", adminRouter);
  app.use("/api/v1/support", supportRouter);
  app.use("/api/v1/admin/broadcasts", broadcastsRouter);
  app.use("/api/v1/admin/dashboard", dashboardRouter);   
    // app.use("/api/v1/users", userRouter)

  app.use("/{*any}", (req, res) => {
    res.status(404).json({ message: "this Router is not found" });
  });
};

export default routerHandler;
