import path from "path";
import crypto from "crypto";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import { getGridFSBucket } from "../../config/gridfs.js";

const FOLDER_MAP = {
    images: "images",
    pdfs: "pdfs",
    profile: "profile",
    workshops: "workshops",
    articles: "articles",
    news: "news",
    certificates: "certificates",
};

const MIME_TO_FOLDER = {
    image: "images",
    "application/pdf": "pdfs",
};

export const uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError("No file uploaded", 400);
    }

    const requested = req.body.folder || req.query.folder;

    let folder = MIME_TO_FOLDER[req.file.mimetype] || "images";

    if (requested && FOLDER_MAP[requested]) {
        folder = FOLDER_MAP[requested];
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const gridFileName = `${folder}/${fileName}`;

    const bucket = getGridFSBucket();

    await new Promise((resolve, reject) => {
        const stream = bucket.openUploadStream(gridFileName, {
            metadata: {
                folder,
                contentType: req.file.mimetype,
            },
        });

        stream.on("error", reject);
        stream.on("finish", resolve);

        stream.end(req.file.buffer);
    });

    const webPath = `/uploads/${gridFileName}`;

    res.status(200).json({
        success: true,
        message: "File Uploaded Successfully",
        file: fileName,
        path: webPath,
        url: `${req.protocol}://${req.get("host")}${webPath}`,
    });
});
