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

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const allowedOrigin = FRONTEND_URL || process.env.FRONTEND_URL || 'https://referra-five.vercel.app';

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (origin === allowedOrigin || origin === 'https://referra-five.vercel.app') {
            callback(null, true);
        } else {
            callback(null, true); 
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
}))

app.use("/api/health" , (req, res) => {
    res.status(200).send("OK")
})

app.use("/api/auth", authRoutes);

app.use(errorMiddleware);

export default app

