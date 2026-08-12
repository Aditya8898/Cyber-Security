export const notFound = (req, res) => {
    const isFileRequest = req.path.startsWith("/uploads");
    res.status(404).json({
        success: false,
        message: isFileRequest
            ? `File not found: ${req.method} ${req.originalUrl}`
            : `Route not found: ${req.method} ${req.originalUrl}`,
    });
};

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.code === 11000 && err.keyValue) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }

    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path} value`;
    }

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(", ");
    }

    if (err.name === "MulterError") {
        statusCode = 400;
        if (err.code === "LIMIT_FILE_SIZE") {
            message = "File too large. Maximum allowed size is 5MB";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            message = "Unexpected file field";
        } else {
            message = err.message;
        }
    }

    if (statusCode >= 500 && process.env.NODE_ENV !== "production") {
        console.error(err);
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};
