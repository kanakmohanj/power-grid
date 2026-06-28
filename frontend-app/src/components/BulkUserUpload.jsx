import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

function BulkUserUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return alert("Please select a CSV file");

    const form = new FormData();
    form.append("file", file);

    try {
      setLoading(true);
      const res = await axiosInstance.post("/api/users/bulk-upload", form);

      alert(
        ` Uploaded!
Created: ${res.data.createdCount}
Skipped: ${res.data.skippedCount}`
      );
    } catch (err) {
      alert(err.response?.data?.msg || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 p-6 rounded-xl border border-white/20 max-w-md">
      <h2 className="text-lg text-yellow-400 mb-4 font-orbitron">
        Bulk User Upload
      </h2>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4 text-sm"
      />

      <button
        onClick={upload}
        disabled={loading}
        className="w-full py-2 bg-yellow-400 text-black rounded font-semibold"
      >
        {loading ? "Uploading..." : "Upload CSV"}
      </button>
    </div>
  );
}

export default BulkUserUpload;
