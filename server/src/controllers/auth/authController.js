import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import generateToken from "../../utils/generateToken.js";
import cookieOptions from "../../utils/cookieOptions.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";

export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() }).select("_id").lean();

    if (existingUser) {
        throw new AppError("User already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
    });

    const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };

    return res.status(201).json({
        success: true,
        message: "User Registered Successfully",
        user: userResponse,
    });
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new AppError("Invalid Email or Password", 400);
    }

    if (!user.isActive) {
        throw new AppError("Account has been deactivated. Contact support.", 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new AppError("Invalid Email or Password", 400);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.cookie("token", token, cookieOptions());

    return res.status(200).json({
        success: true,
        message: "Login Successful",
        token,
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
});

export const logoutUser = (req, res) => {
    res.clearCookie("token", cookieOptions());

    return res.status(200).json({
        success: true,
        message: "Logout Successful",
    });
};

export const getProfile = (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: req.user,
    });
};
