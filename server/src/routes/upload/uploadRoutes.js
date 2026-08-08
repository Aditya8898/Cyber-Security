import express from "express";

import upload from "../../middleware/uploadMiddleware.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import { uploadFile } from "../../controllers/upload/uploadController.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    upload.single("file"),
    uploadFile
);

export default router;
