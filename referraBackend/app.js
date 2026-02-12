import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import { FRONTEND_URL } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import hrRoutes from "./routes/hr.routes.js";
import userRoutes from "./routes/user.routes.js";
import directRoutes from "./routes/direct.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Normalize origin - remove trailing slash if present
const getFrontendUrl = () => {
  const url =
    FRONTEND_URL ||
    process.env.FRONTEND_URL ||
    "https://referra.space";
  return url.replace(/\/$/, ""); // Remove trailing slash
};

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigin = getFrontendUrl();
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Normalize origin - remove trailing slash
      const normalizedOrigin = origin.replace(/\/$/, "");

      if (normalizedOrigin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Idempotency-Key",
      "X-Idempotency-Key",
    ],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

app.use("/api/health", (req, res) => {
  res.status(200).send("OK");
});

// Direct routes - no middlewares, fastest access
app.use("/api/direct", directRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/user", userRoutes);
app.use(errorMiddleware);

export default app;
