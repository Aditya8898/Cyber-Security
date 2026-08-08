import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

const authMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies.token;

        const authHeader = req.headers.authorization;
        if (!token && authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if (!token) {
            return next(new AppError("Unauthorized. Please login.", 401));
        }

        if (!process.env.JWT_SECRET) {
            return next(new AppError("JWT secret is not configured", 500));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return next(new AppError("User not found", 404));
        }

        if (!user.isActive) {
            return next(
                new AppError("Account has been deactivated. Contact support.", 403)
            );
        }

        req.user = user;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return next(new AppError("Session expired. Please login again.", 401));
        }

        if (error.name === "JsonWebTokenError") {
            return next(new AppError("Invalid token. Please login again.", 401));
        }

        return next(error);
    }
};

export default authMiddleware;
