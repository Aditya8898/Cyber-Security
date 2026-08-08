import express from "express";

import {
    generateCertificate,
    getMyCertificates,
    downloadCertificate,
} from "../../controllers/certificate/certificateController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import { validate } from "../../utils/validate.js";

const router = express.Router();

router.post(
    "/generate",
    authMiddleware,
    validate({
        quizResultId: { required: true, isMongoId: true },
    }),
    generateCertificate
);

router.get("/my", authMiddleware, getMyCertificates);

router.get("/download/:id", authMiddleware, downloadCertificate);

export default router;
