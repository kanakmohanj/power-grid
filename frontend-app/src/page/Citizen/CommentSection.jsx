import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";

const CommentSection = ({ complaintId }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComments = useCallback(async () => {
    if (!complaintId) return;

    try {
      setError(null);
      const res = await axiosInstance.get(`/api/comments/${complaintId}`);
      setComments(res.data);
    } catch (err) {
      setError("Failed to load comments");
      console.error(err);
    }
  }, [complaintId]);

  const addComment = async () => {
    if (!text.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await axiosInstance.post(`/api/comments/${complaintId}`, { text });
      setText("");
      await loadComments();
    } catch (err) {
      setError("Failed to add comment. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return (
    <div className="mt-6 p-6 glass-panel rounded-xl shadow-lg border border-cyan-500/30">
      <h2 className="text-xl font-bold text-cyan-400 mb-4 drop-shadow-md font-orbitron">Comments</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm shadow-[0_0_5px_rgba(248,113,113,0.3)]">{error}</p>
        </div>
      )}

      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-cyan-200/50 text-sm text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((c, idx) => (
            <div key={idx} className="bg-cyan-900/10 p-4 rounded-lg border border-cyan-500/20 hover:bg-cyan-900/20 transition">
              <p className="text-cyan-50 text-sm mb-1">{c.text}</p>
              <p className="text-cyan-400 text-xs mt-2">
                {c.user?.username || 'Anonymous'} • {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3">
        <input
          className="neon-input flex-1 p-3 rounded-lg bg-black/40 text-white placeholder-cyan-200/50"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !loading) {
              e.preventDefault();
              addComment();
            }
          }}
        />
        <button
          className={`px-6 py-3 rounded-lg font-bold transition font-orbitron border ${loading
              ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
              : "neon-btn text-cyan-300"
            }`}
          onClick={addComment}
          disabled={loading || !text.trim()}
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
};

export default CommentSection;