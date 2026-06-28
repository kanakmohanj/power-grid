import axios from "axios";

export const askChatbot = async (req, res) => {
  try {
    const { question } = req.body;
    const { tenantId, role, id } = req.user;

    const response = await axios.post(
      "http://ragbot:8000/ask",
      {
        question,
        tenant_id: tenantId,
        role,
        user_id: role === "admin" ? null : id,
      },
      {
        timeout: 20000,
      }
    );

    res.json({ answer: response.data.answer });

  } catch (err) {
    console.error("RAG BOT ERROR:", err.response?.data || err.message);
    res.status(503).json({ message: "AI service unavailable" });
  }
};
