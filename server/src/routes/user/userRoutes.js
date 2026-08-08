import express from "express";

import authMiddleware from "../../middleware/authMiddleware.js";

import {

    getProfile,

    updateProfile,

    changePassword,

    deleteAccount,

} from "../../controllers/user/userController.js";

const router = express.Router();

router.get(
    "/profile",
    authMiddleware,
    getProfile
);

router.put(
    "/profile",
    authMiddleware,
    updateProfile
);

router.put(
    "/change-password",
    authMiddleware,
    changePassword
);

router.delete(
    "/delete-account",
    authMiddleware,
    deleteAccount
);

export default router;