import User from "../../models/User.js";
import Article from "../../models/Article.js";
import News from "../../models/News.js";
import Workshop from "../../models/Workshop.js";
import Module from "../../models/Modules.js";
import Enrollment from "../../models/Enrollment.js";
import Quiz from "../../models/Quiz.js";
import QuizResult from "../../models/QuizResult.js";
import Certificate from "../../models/Certificate.js";
import asyncHandler from "../../utils/asyncHandler.js";

export const getDashboard = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalArticles,
        totalNews,
        totalWorkshops,
        totalModules,
        totalEnrollments,
        totalQuizQuestions,
        totalQuizResults,
        totalCertificates,
        recentUsers,
        recentEnrollments,
        recentCertificates,
        recentWorkshops,
    ] = await Promise.all([
        User.countDocuments(),
        Article.countDocuments(),
        News.countDocuments(),
        Workshop.countDocuments(),
        Module.countDocuments(),
        Enrollment.countDocuments(),
        Quiz.countDocuments(),
        QuizResult.countDocuments(),
        Certificate.countDocuments(),
        User.find({})
            .select("name email role createdAt")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        Enrollment.find({})
            .populate("user", "name email")
            .populate("workshop", "title")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        Certificate.find({})
            .populate("user", "name email")
            .populate("workshop", "title")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        Workshop.find({})
            .select("title thumbnail level instructor createdAt")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
    ]);

    res.status(200).json({
        success: true,
        message: "Dashboard data fetched successfully",
        data: {
            totalUsers,
            totalArticles,
            totalNews,
            totalWorkshops,
            totalModules,
            totalEnrollments,
            totalQuizQuestions,
            totalQuizResults,
            totalCertificates,
            recentUsers,
            recentEnrollments,
            recentCertificates,
            recentWorkshops,
        },
    });
});
