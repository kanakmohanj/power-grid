import express from 'express';
import { protect, authorizeRoles } from '../middlewares/auth.js';
import { getAllStaff,getStats, getUserById } from '../controllers/userController.js';
import { getStaffStats } from '../controllers/userController.js';
import { getAdminStats } from '../controllers/userController.js';
import { adminCreateUser } from '../controllers/userController.js';
import multer from "multer";
import { bulkCreateUsers } from '../controllers/userController.js';
import { updateComplaintStatus } from '../controllers/complaintController.js';

const upload=multer({dest:"uploads/"});


// import { hi } from '../controllers/userController.js';
console.log("userroutes")
const router = express.Router();

router.get('/staff', protect, authorizeRoles('admin'), getAllStaff);
router.get("/dashboard/stats", protect, getStats);
router.get("/stats",protect,getStaffStats);
router.get("/admin/stats", protect,getAdminStats);
router.get("/:userId", getUserById);
// router.get("/hi",hi)
router.post("/", protect, authorizeRoles("admin"), adminCreateUser);
router.post("/bulk-upload",protect,authorizeRoles("admin"),upload.single("file"),bulkCreateUsers);


// Route to get admin statistics (admin only)
router.get('/admin/stats', protect, authorizeRoles('admin'), getAdminStats);

export default router;