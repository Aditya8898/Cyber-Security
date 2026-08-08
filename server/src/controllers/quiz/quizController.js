import mongoose from "mongoose";
import Quiz from "../../models/Quiz.js";
import QuizResult from "../../models/QuizResult.js";
import Enrollment from "../../models/Enrollment.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";

export const createQuiz = asyncHandler(async (req, res) => {
    const { options, correctAnswer } = req.body;

    if (!Array.isArray(options) || correctAnswer < 0 || correctAnswer >= options.length) {
        throw new AppError(
            `correctAnswer must be between 0 and ${options.length - 1}`,
            400
        );
    }

    const quiz = await Quiz.create(req.body);

    res.status(201).json({
        success: true,
        message: "Quiz Question Added Successfully",
        data: quiz,
    });
});

export const getQuizByWorkshop = asyncHandler(async (req, res) => {
    const { workshopId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(workshopId)) {
        throw new AppError("Invalid workshop id", 400);
    }

    const quizzes = await Quiz.find({ workshop: workshopId })
        .sort({ createdAt: 1 })
        .lean();

    const isAdmin = req.user.role === "admin";

    const data = isAdmin
        ? quizzes
        : quizzes.map(({ correctAnswer, ...question }) => question);

    res.status(200).json({
        success: true,
        message: "Quiz questions fetched successfully",
        count: data.length,
        data,
    });
});

export const submitQuiz = asyncHandler(async (req, res) => {
    const { workshopId, answers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(workshopId)) {
        throw new AppError("Invalid workshop id", 400);
    }

    const enrollment = await Enrollment.findOne({
        user: req.user._id,
        workshop: workshopId,
    }).lean();

    if (!enrollment) {
        throw new AppError("Please enroll in the workshop before taking the quiz", 400);
    }

    const questions = await Quiz.find({ workshop: workshopId })
        .sort({ createdAt: 1 })
        .lean();

    if (questions.length === 0) {
        throw new AppError("No quiz questions found for this workshop", 404);
    }

    if (!Array.isArray(answers) || answers.length < questions.length) {
        throw new AppError("Please answer all questions", 400);
    }

    let score = 0;

    questions.forEach((question, index) => {
        const selected = Number(answers[index]);
        if (Number.isInteger(selected) && selected === question.correctAnswer) {
            score += question.marks || 1;
        }
    });

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const passed = totalMarks > 0 && score >= totalMarks * 0.6;

    const result = await QuizResult.create({
        user: req.user._id,
        workshop: workshopId,
        score,
        totalQuestions: questions.length,
        totalMarks,
        passed,
    });

    res.status(200).json({
        success: true,
        message: passed ? "Quiz Passed" : "Quiz Failed",
        data: result,
    });
});

export const getMyResults = asyncHandler(async (req, res) => {
    const results = await QuizResult.find({ user: req.user._id })
        .populate("workshop", "title")
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        success: true,
        message: "Quiz results fetched successfully",
        data: results,
    });
});

export const updateQuiz = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { options, correctAnswer } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid quiz id", 400);
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
        throw new AppError("Quiz Question not found", 404);
    }

    if (options !== undefined) {
        if (!Array.isArray(options) || options.length < 2) {
            throw new AppError("At least 2 options are required", 400);
        }
        if (correctAnswer !== undefined && (correctAnswer < 0 || correctAnswer >= options.length)) {
            throw new AppError(`correctAnswer must be between 0 and ${options.length - 1}`, 400);
        }
    } else if (correctAnswer !== undefined && (correctAnswer < 0 || correctAnswer >= quiz.options.length)) {
        throw new AppError(`correctAnswer must be between 0 and ${quiz.options.length - 1}`, 400);
    }

    Object.assign(quiz, req.body);
    await quiz.save();

    res.status(200).json({
        success: true,
        message: "Quiz Question Updated Successfully",
        data: quiz,
    });
});

export const deleteQuiz = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid quiz id", 400);
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
        throw new AppError("Quiz Question not found", 404);
    }

    await quiz.deleteOne();

    res.status(200).json({
        success: true,
        message: "Quiz Question Deleted Successfully",
    });
});
