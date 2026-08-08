import express from "express";

import {
    createQuiz,
    getQuizByWorkshop,
    submitQuiz,
    getMyResults,
    updateQuiz,
    deleteQuiz,
} from "../../controllers/quiz/quizController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import { validate } from "../../utils/validate.js";

const router = express.Router();

// Public/User
router.get("/workshop/:workshopId", authMiddleware, getQuizByWorkshop);

router.post(
    "/submit",
    authMiddleware,
    validate({
        workshopId: { required: true, isMongoId: true },
        answers: { required: true, isArray: true, arrayMin: 1 },
    }),
    submitQuiz
);

router.get("/results", authMiddleware, getMyResults);

// Admin
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    validate({
        workshop: { required: true, isMongoId: true },
        question: { required: true, minLength: 5 },
        options: { required: true, isArray: true, arrayMin: 2 },
        correctAnswer: { required: true, isNumber: true },
        marks: { isNumber: true },
    }),
    createQuiz
);

router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    validate({
        question: { minLength: 5 },
        options: { isArray: true, arrayMin: 2 },
        correctAnswer: { isNumber: true },
        marks: { isNumber: true },
    }),
    updateQuiz
);

router.delete("/:id", authMiddleware, adminMiddleware, deleteQuiz);

export default router;
