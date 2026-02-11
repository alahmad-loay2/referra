// Centralized error handling middleware
// Express knows this is an error handler because it has 4 args: (err, req, res, next)
// `next` is kept in the signature even if we don't always call it, so Express wires it correctly.

const errorMiddleware = (err, req, res, next) => {
    const isDev = process.env.NODE_ENV === "development";

    // Fallbacks so we always have sane values
    const statusCode = err.statusCode && Number.isInteger(err.statusCode)
        ? err.statusCode
        : 500;

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