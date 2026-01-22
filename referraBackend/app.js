import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { FRONTEND_URL } from './config/env.js'
import authRoutes from './routes/auth.routes.js'
import employeeRoutes from './routes/employee.routes.js'
import errorMiddleware from './middleware/error.middleware.js'

const app = express()

app.set("trust proxy", 1);

app.use(helmet())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// Normalize origin - remove trailing slash if present
const getFrontendUrl = () => {
  const url = FRONTEND_URL || process.env.FRONTEND_URL || 'https://referra-five.vercel.app';
  return url.replace(/\/$/, ''); // Remove trailing slash
};

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigin = getFrontendUrl();
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Normalize origin - remove trailing slash
        const normalizedOrigin = origin.replace(/\/$/, '');
        
        if (normalizedOrigin === allowedOrigin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use("/api/health" , (req, res) => {
    res.status(200).send("OK")
})

app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);

app.use(errorMiddleware);

export default app

