import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function AdminChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

 const sendMessage = async () => {
  if (!input.trim()) return;

  const userMsg = { role: "user", text: input };
  setMessages((prev) => [...prev, userMsg]);
  setInput("");
  setLoading(true);

  try {
    const res = await axiosInstance.post("/api/chat/ask", {
      question: input,  
    });

    setMessages((prev) => [
      ...prev,
      { role: "bot", text: res.data.answer },
    ]);
  } catch (e) {
    console.error("CHAT ERROR:", e.response?.data || e.message);
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: "⚠️ AI service unavailable" },
    ]);
  } finally {
    setLoading(false);
  }
};


  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 bg-purple-600 hover:bg-green-500
                   text-white p-4 rounded-full shadow-lg"
      >
        🤖
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-[420px]
                        bg-[#0f172a] rounded-xl shadow-2xl flex flex-col">
          
          <div className="p-3 bg-purple-600 rounded-t-xl font-bold">
            Admin AI Assistant
          </div>

          <div className="flex-1 p-3 overflow-y-auto text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-2 ${
                  m.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block px-3 py-2 rounded-lg ${
                    m.role === "user"
                      ? "bg-blue-600"
                      : "bg-green-700"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))}

            {loading && (
              <p className="text-gray-400 italic">AI is thinking…</p>
            )}
          </div>

          <div className="p-2 flex gap-2 border-t border-gray-700">
            <input
              className="flex-1 p-2 rounded text-white text-sm"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="px-3 bg-purple-600 rounded text-sm font-bold"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
