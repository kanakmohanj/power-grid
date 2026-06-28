import axiosInstance from "./axiosInstance";

export const classifyComplaintAI = async (description) => {
  const res = await axiosInstance.post("/api/ai/classify", {
    description,
  });
  return res.data;
};
