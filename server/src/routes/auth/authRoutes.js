import express from "express";
import { registerUser, loginUser, logoutUser, getProfile } from "../../controllers/auth/authController.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { validate } from "../../utils/validate.js";

const router = express.Router();

router.post(
    "/register",
    validate({
        name: { required: true, minLength: 2, maxLength: 50 },
        email: { required: true, isEmail: true },
        password: { required: true, isStrongPassword: true },
        confirmPassword: { required: true, sameAs: "password" },
    }),
    registerUser
);

router.post(
    "/login",
    validate({
        email: { required: true, isEmail: true },
        password: { required: true },
    }),
    loginUser
);

router.post("/logout", authMiddleware, logoutUser);

router.get("/profile", authMiddleware, getProfile);

export default router;
