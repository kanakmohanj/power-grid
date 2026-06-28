import Complaint from "../models/Complaint.js";
import axios from "axios";

export const aiCategoryPriority = async (req, res) => {
  try {
    const { title, description } = req.body;
    const { id: userId, tenantId } = req.user;

    // 1️⃣ Call AI-category
    const aiRes = await axios.post(
      "http://ai-category:7001/submit",
      { title, description },
      { timeout: 15000 }
    );

    const { category, priority } = aiRes.data;

    // 2️⃣ Save to MongoDB
    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority,
      submitted_by: userId,
      tenant_id: tenantId,
      status: "Open",
    });

    // 3️⃣ Respond
    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint,
    });

  } catch (err) {
    console.error("Create complaint error:", err);
    res.status(500).json({ message: "Failed to submit complaint" });
  }
};
