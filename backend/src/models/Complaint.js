import { Schema, model } from "mongoose";

// Comment Sub-Document
const CommentSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Complaint Schema
const ComplaintSchema = new Schema(
  {
    submitted_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    comments: [CommentSchema],

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    category: {
      type: String,
      enum: ["Infrastructure", "Sanitation", "Water", "Electricity", "Other"],
      default: "Other"
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low"
    },

    status: {
      type: String,
      enum: ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN"
    },

    remarks: {
      type: String,
      trim: true,
      default: ""
    },

    photo_url: {
      type: String,
      trim: true,
      default: ""
    },

    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String, trim: true },
    },

    deadline: {
      type: Date,
      default: () => {
      const now = new Date();
      now.setDate(now.getDate() + 2); 
      return now;
    },
    },
    lastDeadlineAlerted: {
      type: Date,
      default: null,
    },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    tenantId: {
  type: Schema.Types.ObjectId,
  ref: "Tenant",
  required: true
}
  },
  {
    timestamps: true 
  }
);

export default model("Complaint", ComplaintSchema);
