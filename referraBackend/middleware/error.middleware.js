// Centralized error handling middleware

import { Prisma } from "../generated/prisma/client.js";

const errorMiddleware = (err, req, res, next) => {
    const isDev = process.env.NODE_ENV === "development";

    // Handle Prisma validation errors
    if (err instanceof Prisma.PrismaClientValidationError) {
        err.statusCode = 400;
        err.message = "Invalid input data.";
    }

    // Handle Prisma errors
    if (err.code === "P2002") {
        // Unique constraint violation
        const fieldName = err.meta?.target?.[0] || "field";
        err.statusCode = 409;
        err.message = `A record with this ${fieldName} already exists.`;
    } else if (err.code === "P2025") {
        // Record not found
        err.statusCode = 404;
        err.message = err.meta?.cause || "The requested record was not found.";
    } else if (err.code === "P2003") {
        // Foreign key constraint violation
        err.statusCode = 400;
        err.message = "Invalid reference: the related record does not exist.";
    }

    // Fallbacks so we always have sane values
    const statusCode = err.statusCode && Number.isInteger(err.statusCode)
        ? err.statusCode
        : 500;

    const message = err.message || "Internal Server Error";

    // In dev: log full error details to the console
    if (isDev) {
        // eslint-disable-next-line no-console
        console.error("Error middleware caught an error:", {
            message: err.message,
            stack: err.stack,
            name: err.name,
            statusCode,
            path: req.originalUrl,
            method: req.method,
        });
    }

    // If headers are already sent, delegate to Express' default handler
    if (res.headersSent) {
        return next(err);
    }

    // Shape of error response differs in dev vs prod
    const responseBody = {
        success: false,
        message: isDev ? message : "Something went wrong. Please try again later.",
    };

    if (isDev) {
        responseBody.error = {
            message,
            stack: err.stack,
        };
    }

    res.status(statusCode).json(responseBody);
};

export default errorMiddleware;