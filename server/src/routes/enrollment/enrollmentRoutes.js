import express from "express";

import {
    enrollWorkshop,
    getMyEnrollments,
    updateProgress,
} from "../../controllers/enrollment/enrollmentController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import { validate } from "../../utils/validate.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    validate({
        workshop: { required: true, isMongoId: true },
    }),
    enrollWorkshop
);

router.get("/my", authMiddleware, getMyEnrollments);

router.put(
    "/:id/progress",
    authMiddleware,
    validate({
        progress: { required: true, isNumber: true },
    }),
    updateProgress
);

export default router;
