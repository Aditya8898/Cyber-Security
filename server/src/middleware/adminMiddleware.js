import AppError from "../utils/AppError.js";

const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return next(new AppError("Unauthorized. Please login.", 401));
    }

    if (req.user.role !== "admin") {
        return next(new AppError("Access Denied. Admin Only.", 403));
    }

    next();
};

export default adminMiddleware;
