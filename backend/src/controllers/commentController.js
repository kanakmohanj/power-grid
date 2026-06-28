import Complaint from "../models/Complaint.js";

export const addComment = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ msg: "Comment text is required" });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ msg: "Complaint not found" });
    }

    complaint.comments.push({
      text,
      user: req.user.id,
      createdAt: new Date(),
    });

    await complaint.save();

    return res.status(201).json({ msg: "Comment added successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getComments = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId).populate(
      "comments.user",
      "username email"
    );

    if (!complaint) {
      return res.status(404).json({ msg: "Complaint not found" });
    }

    return res.status(200).json(complaint.comments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};