import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import AppError from "../utils/AppError.js";

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

const ALLOWED_MIME = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const requested = req.body.folder || req.query.folder;

        let folder = MIME_TO_FOLDER[file.mimetype] || "images";

        if (requested && FOLDER_MAP[requested]) {
            folder = FOLDER_MAP[requested];
        }

        const absoluteDir = path.join(process.cwd(), "uploads", folder);

        fs.mkdirSync(absoluteDir, { recursive: true });

        cb(null, path.join("uploads", folder));
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
        cb(null, name);
    },
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
        return cb(null, true);
    }

    cb(new AppError("Only images and PDF files are allowed", 400));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});

export default upload;
