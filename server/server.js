import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import articleRoutes from "./src/routes/article/articleRoutes.js";
import workshopRoutes from "./src/routes/workshop/workshopRoutes.js";
import moduleRoutes from "./src/routes/module/moduleRoutes.js";
import enrollmentRoutes from "./src/routes/enrollment/enrollmentRoutes.js";
import quizRoutes from "./src/routes/quiz/quizRoutes.js";
import certificateRoutes from "./src/routes/certificate/certificateRoutes.js";
import uploadRoutes from "./src/routes/upload/uploadRoutes.js";
import gridfsFileRoutes from "./src/routes/upload/gridfsRoutes.js";
import adminRoutes from "./src/routes/admin/adminRoutes.js";
import userRoutes from "./src/routes/user/userRoutes.js";
import blogRoutes from "./src/routes/blog/blogRoutes.js";
import commentRoutes from "./src/routes/comment/commentRoutes.js";

//Database
import connectDB from "./src/config/db.js";
import { UPLOAD_DIR } from "./src/config/paths.js";

//Routes
import authRoutes from "./src/routes/auth/authRoutes.js";
import newsRoutes from "./src/routes/news/newsRoutes.js";


//Error Handling
import { notFound, errorHandler } from "./src/middleware/errorMiddleware.js";

dotenv.config();

const app = express();

//Connect Database
connectDB();

//Middlewares
app.use(
    cors({
        origin: process.env.CLIENT_URL || true,
        credentials: true,
    })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Static Files (GridFS first, then legacy disk files as fallback)
app.use("/uploads", gridfsFileRoutes);
app.use("/uploads", express.static(UPLOAD_DIR));

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/workshops", workshopRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);

//Test Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CyberCrime Awareness Backend is Running",
    });
});

//Not Found + Error Handler
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is Running on Port ${PORT}`);
});
