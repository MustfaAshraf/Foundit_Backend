import authRouter from "../modules/auth/auth.routes.js"
// import userRouter from "../modules/user/user.routes.js"
import paymentRouter from "../modules/payment/payment.routes.js"


const routerHandler = async (app, express) => {

    app.use("/api/v1/auth", authRouter)
    // app.use("/api/v1/users", userRouter)
    app.use("/api/v1/payments", paymentRouter)

    app.use("/{*any}", (req, res) => {
        res.status(404).json({ message: "this Router is not found" })
    })

}

export default routerHandler