import express from "express";

import {
    addComment,
    getComments,
    deleteOwnComment,
    adminDeleteComment,
} from "../../controllers/comment/commentController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";

const router = express.Router();

// Public
router.get(
    "/post/:postId",
    getComments
);

// User
router.post(
    "/post/:postId",
    authMiddleware,
    addComment
);

router.delete(
    "/:id",
    authMiddleware,
    deleteOwnComment
);

// Admin
router.delete(
    "/admin/:id",
    authMiddleware,
    adminMiddleware,
    adminDeleteComment
);

export default router;