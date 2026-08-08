import mongoose from "mongoose";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validate = (rules) => (req, res, next) => {
    const errors = {};

    for (const [field, def] of Object.entries(rules)) {
        const value = req.body[field];

        const isEmpty =
            value === undefined ||
            value === null ||
            (typeof value === "string" && value.trim() === "");

        if (def.required && isEmpty) {
            errors[field] = def.message || `${field} is required`;
            continue;
        }

        if (isEmpty) continue;

        if (def.isEmail && !EMAIL_REGEX.test(value)) {
            errors[field] = def.message || "Invalid email address";
        }

        if (def.minLength && String(value).length < def.minLength) {
            errors[field] = `${field} must be at least ${def.minLength} characters`;
        }

        if (def.maxLength && String(value).length > def.maxLength) {
            errors[field] = `${field} must be at most ${def.maxLength} characters`;
        }

        if (def.isArray) {
            if (!Array.isArray(value)) {
                errors[field] = `${field} must be an array`;
            } else if (def.arrayMin && value.length < def.arrayMin) {
                errors[field] = `${field} must contain at least ${def.arrayMin} items`;
            }
        }

        if (def.isNumber && Number.isNaN(Number(value))) {
            errors[field] = `${field} must be a number`;
        }

        if (def.isMongoId && !mongoose.Types.ObjectId.isValid(value)) {
            errors[field] = `Invalid ${field}`;
        }

        if (def.isIn && !def.isIn.includes(value)) {
            errors[field] = `Invalid ${field} value`;
        }

        if (def.sameAs && value !== req.body[def.sameAs]) {
            errors[field] = `${field} must match ${def.sameAs}`;
        }

        if (def.isStrongPassword) {
            const str = String(value);
            if (str.length < 8 || !/[A-Za-z]/.test(str) || !/\d/.test(str)) {
                errors[field] =
                    "Password must be at least 8 characters and include letters and numbers";
            }
        }

        if (def.pattern && !def.pattern.test(value)) {
            errors[field] = def.patternMessage || `Invalid ${field} format`;
        }
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    next();
};
