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
} from "../../controllers/blog/blogController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import upload from "../../middleware/uploadMiddleware.js";

const router = express.Router();

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

router.delete(
    "/admin/:id",
    authMiddleware,
    adminMiddleware,
    adminDeleteBlogPost
);

export default router;