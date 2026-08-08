import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import cookieOptions from "../../utils/cookieOptions.js";

export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password").lean();

    if (!user) {
        throw new AppError("User not found", 404);
    }

    res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: user,
    });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const { name, profileImage } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (name !== undefined && name.trim() !== "") {
        if (name.trim().length < 2) {
            throw new AppError("Name must be at least 2 characters", 400);
        }
        user.name = name.trim();
    }

    if (profileImage !== undefined) {
        user.profileImage = profileImage;
    }

    await user.save();

    const updated = await User.findById(user._id).select("-password").lean();

    res.status(200).json({
        success: true,
        message: "Profile Updated Successfully",
        data: updated,
    });
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        throw new AppError("Passwords do not match", 400);
    }

    if (
        newPassword.length < 8 ||
        !/[A-Za-z]/.test(newPassword) ||
        !/\d/.test(newPassword)
    ) {
        throw new AppError(
            "Password must be at least 8 characters and include letters and numbers",
            400
        );
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
        throw new AppError("Current password is incorrect", 400);
    }

    if (await bcrypt.compare(newPassword, user.password)) {
        throw new AppError("New password must be different from current password", 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password Changed Successfully",
    });
});

export const deleteAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    await user.deleteOne();

    res.clearCookie("token", cookieOptions());

    res.status(200).json({
        success: true,
        message: "Account Deleted Successfully",
    });
});
