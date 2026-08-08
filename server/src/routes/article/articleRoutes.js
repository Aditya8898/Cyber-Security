import express from "express";

import {
    createArticle,
    getAllArticles,
    searchArticles,
    getSingleArticle,
    updateArticle,
    deleteArticle,
} from "../../controllers/article/articleController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import { validate } from "../../utils/validate.js";

const router = express.Router();

const ARTICLE_CATEGORIES = [
    "Phishing",
    "UPI Fraud",
    "OTP Scam",
    "Social Media",
    "Password Security",
    "Ransomware",
    "AI Scam",
    "General",
];

// Public
router.get("/", getAllArticles);
router.get("/search", searchArticles);
router.get("/:id", getSingleArticle);

// Admin
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    validate({
        title: { required: true, minLength: 3, maxLength: 200 },
        shortDescription: { required: true, minLength: 10 },
        content: { required: true, minLength: 20 },
        category: { isIn: ARTICLE_CATEGORIES },
        slug: { maxLength: 200 },
    }),
    createArticle
);
router.put("/:id", authMiddleware, adminMiddleware, updateArticle);
router.delete("/:id", authMiddleware, adminMiddleware, deleteArticle);

export default router;
