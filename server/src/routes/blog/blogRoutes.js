import express from "express";

import {
    createBlogPost,
    getAllBlogPosts,
    getSingleBlogPost,
    getMyBlogPosts,
    deleteOwnBlogPost,
    toggleLike,
    pinBlogPost,
    unpinBlogPost,
    adminDeleteBlogPost,
    getAdminBlogPosts,
    approveBlogPost,
    rejectBlogPost,
} from "../../controllers/blog/blogController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import upload from "../../middleware/uploadMiddleware.js";

const router = express.Router();

// Admin
router.get(
    "/admin",
    authMiddleware,
    adminMiddleware,
    getAdminBlogPosts
);

// Public
router.get("/", getAllBlogPosts);
router.get("/:id", getSingleBlogPost);

// User
router.post(
    "/",
    authMiddleware,
    upload.single("image"),
    createBlogPost
);

router.get(
    "/user/my-posts",
    authMiddleware,
    getMyBlogPosts
);

router.delete(
    "/:id",
    authMiddleware,
    deleteOwnBlogPost
);

router.post(
    "/:id/like",
    authMiddleware,
    toggleLike
);

// Admin
router.patch(
    "/:id/pin",
    authMiddleware,
    adminMiddleware,
    pinBlogPost
);

router.patch(
    "/:id/unpin",
    authMiddleware,
    adminMiddleware,
    unpinBlogPost
);

router.patch(
    "/:id/approve",
    authMiddleware,
    adminMiddleware,
    approveBlogPost
);

router.patch(
    "/:id/reject",
    authMiddleware,
    adminMiddleware,
    rejectBlogPost
);

router.delete(
    "/admin/:id",
    authMiddleware,
    adminMiddleware,
    adminDeleteBlogPost
);

export default router;