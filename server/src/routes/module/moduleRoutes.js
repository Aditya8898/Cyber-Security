import express from "express";

import {
    createModule,
    getAllModules,
    getModulesByWorkshop,
    getSingleModule,
    updateModule,
    deleteModule,
} from "../../controllers/module/moduleController.js";

import authMiddleware from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";
import { validate } from "../../utils/validate.js";

const router = express.Router();

// Public
router.get("/", getAllModules);
router.get("/workshop/:workshopId", getModulesByWorkshop);
router.get("/:id", getSingleModule);

// Admin
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    validate({
        workshop: { required: true, isMongoId: true },
        title: { required: true, minLength: 3 },
        description: { required: true },
        theory: { required: true },
        order: { required: true, isNumber: true },
    }),
    createModule
);
router.put("/:id", authMiddleware, adminMiddleware, updateModule);
router.delete("/:id", authMiddleware, adminMiddleware, deleteModule);

export default router;
