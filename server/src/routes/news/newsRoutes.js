import express from "express";

import {
    createNews,
    getAllNews,
    searchNews,
    getSingleNews,
    updateNews,
    deleteNews,
} from "../../controllers/news/newsController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import { validate } from "../../utils/validate.js";

const router = express.Router();

// Public
router.get("/", getAllNews);
router.get("/search", searchNews);
router.get("/:id", getSingleNews);

// Admin
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    validate({
        title: { required: true, minLength: 3, maxLength: 200 },
        shortDescription: { required: true, minLength: 10 },
        content: { required: true, minLength: 20 },
        slug: { maxLength: 200 },
    }),
    createNews
);
router.put("/:id", authMiddleware, adminMiddleware, updateNews);
router.delete("/:id", authMiddleware, adminMiddleware, deleteNews);

export default router;
