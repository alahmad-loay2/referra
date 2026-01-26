// middleware for handling errors in the application

const errorMiddleware = (err, req, res, next) => {
    try {
        let error = { ...err };
        error.message = err.message;
        // console.error(err);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    } catch (error) {
        next(error);
    }
}

export default errorMiddleware;