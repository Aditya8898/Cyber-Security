import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

import Certificate from "../../models/Certificate.js";
import QuizResult from "../../models/QuizResult.js";
import Enrollment from "../../models/Enrollment.js";
import generateCertificateId from "../../utils/generateCertificateId.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";

const writePdf = (doc, filePath) =>
    new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filePath);

        stream.on("finish", resolve);
        stream.on("error", reject);

        doc.pipe(stream);

        doc.fontSize(28).text("Certificate of Completion", {
            align: "center",
        });

        doc.moveDown();

        doc.fontSize(18).text("This certificate is proudly awarded to", {
            align: "center",
        });

        doc.moveDown();

        doc.fontSize(24).text(doc.userName, { align: "center" });

        doc.moveDown();

        doc.fontSize(16).text("For successfully completing", {
            align: "center",
        });

        doc.moveDown();

        doc.fontSize(20).text(doc.workshopTitle, { align: "center" });

        doc.moveDown();

        doc.fontSize(14).text(`Certificate ID : ${doc.certificateId}`, {
            align: "center",
        });

        doc.moveDown();

        doc.fontSize(14).text(
            `Issued On : ${new Date().toLocaleDateString()}`,
            { align: "center" }
        );

        doc.end();
    });

export const generateCertificate = asyncHandler(async (req, res) => {
    const { quizResultId } = req.body;

    const result = await QuizResult.findById(quizResultId)
        .populate("user", "name email")
        .populate("workshop", "title")
        .lean();

    if (!result) {
        throw new AppError("Quiz Result not found", 404);
    }

    const isOwner = result.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        throw new AppError("Not authorized to generate this certificate", 403);
    }

    if (!result.passed) {
        throw new AppError("User has not passed the quiz", 400);
    }

    const enrollment = await Enrollment.findOne({
        user: result.user._id,
        workshop: result.workshop._id,
        completed: true,
    }).lean();

    if (!enrollment) {
        throw new AppError(
            "Enrollment not completed. Please finish the workshop first.",
            400
        );
    }

    const existingCertificate = await Certificate.findOne({
        quizResult: quizResultId,
    }).lean();

    if (existingCertificate) {
        return res.status(200).json({
            success: true,
            message: "Certificate already generated",
            data: existingCertificate,
        });
    }

    const certificateId = generateCertificateId();

    const folderPath = path.join(process.cwd(), "uploads", "certificates");

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = `${certificateId}.pdf`;

    const filePath = path.join(folderPath, fileName);

    const doc = new PDFDocument();
    doc.userName = result.user.name;
    doc.workshopTitle = result.workshop.title;
    doc.certificateId = certificateId;

    await writePdf(doc, filePath);

    const certificate = await Certificate.create({
        user: result.user._id,
        workshop: result.workshop._id,
        quizResult: result._id,
        certificateId,
        pdfUrl: `/uploads/certificates/${fileName}`,
    });

    res.status(201).json({
        success: true,
        message: "Certificate Generated Successfully",
        data: certificate,
    });
});

export const getMyCertificates = asyncHandler(async (req, res) => {
    const certificates = await Certificate.find({ user: req.user._id })
        .populate("workshop", "title")
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        success: true,
        message: "Certificates fetched successfully",
        data: certificates,
    });
});

export const downloadCertificate = asyncHandler(async (req, res) => {
    const certificate = await Certificate.findById(req.params.id).lean();

    if (!certificate) {
        throw new AppError("Certificate not found", 404);
    }

    const isOwner = certificate.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        throw new AppError("Not authorized to download this certificate", 403);
    }

    const filePath = path.join(process.cwd(), certificate.pdfUrl);

    if (!fs.existsSync(filePath)) {
        throw new AppError("Certificate file not found", 404);
    }

    res.download(filePath, `${certificate.certificateId}.pdf`, (err) => {
        if (err && !res.headersSent) {
            next(err);
        }
    });
});
