import express from "express";

import {
    createWorkshop,
    getAllWorkshops,
    searchWorkshops,
    getSingleWorkshop,
    updateWorkshop,
    deleteWorkshop,
} from "../../controllers/workshop/workshopController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import { validate } from "../../utils/validate.js";

const router = express.Router();

const WORKSHOP_LEVELS = ["Beginner", "Intermediate", "Advanced"];

// Public
router.get("/", getAllWorkshops);
router.get("/search", searchWorkshops);
router.get("/:id", getSingleWorkshop);

// Admin
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    validate({
        title: { required: true, minLength: 3, maxLength: 200 },
        shortDescription: { required: true, minLength: 10 },
        description: { required: true, minLength: 20 },
        level: { isIn: WORKSHOP_LEVELS },
        slug: { maxLength: 200 },
    }),
    createWorkshop
);
router.put("/:id", authMiddleware, adminMiddleware, updateWorkshop);
router.delete("/:id", authMiddleware, adminMiddleware, deleteWorkshop);

export default router;
