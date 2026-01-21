import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import errorMiddleware from './middleware/error.middleware.js'
import { FRONTEND_URL } from './config/env.js'

const app = express()

app.set("trust proxy", 1);
app.use(cookieParser())
app.use(helmet())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}))
app.use(express.json())

app.use("/api/health" , (req, res) => {
    res.status(200).send("OK")
})

app.use("/api/auth", authRoutes);

app.use(errorMiddleware);

export default app

