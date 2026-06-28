import express from "express";
import { protect } from "../middlewares/auth.js";
import { addComment, getComments } from "../controllers/commentController.js";

const router = express.Router();


router.post("/:complaintId", protect, addComment);


router.get("/:complaintId", protect, getComments);

export default router;