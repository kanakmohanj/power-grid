import React, { useState, useEffect } from "react";
import axios from "axios";
import axiosInstance from "../../api/axiosInstance";

const ComplaintForm = ({ neon }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",

    address: "",
    latitude: null,
    longitude: null,
    photo: null,
  });
  const [aiPreview, setAiPreview] = useState(null);


  const [preview, setPreview] = useState(null);


  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({ ...prev, latitude, longitude }));
      },
      () => alert("Please enable location access.")
    );
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, photo: file });
    setPreview(URL.createObjectURL(file));
  };

  const refreshLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({ ...prev, latitude, longitude }));
        alert("Location updated!");
      },
      () => alert("Unable to refresh location")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      alert("Location needed");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) data.append(key, formData[key]);
    });

    try {
      const token = localStorage.getItem("token");

      const res = await axiosInstance.post(
        "/api/complaints",
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ backend already predicted & saved
      alert("Complaint submitted successfully22!");

      // OPTIONAL: show AI result returned from backend
      console.log("FULL RESPONSE:", res);
console.log("DATA:", res.data);

 const complaint = res.data.complaint || res.data;

if (complaint?.category && complaint?.priority) {
  const category = complaint.category;
  const priority = complaint.priority;

  setAiPreview({ category, priority });

  alert(
    `Complaint submitted successfully!\n\nDetected Category: ${category}\nDetected Priority: ${priority}`
  );
} else {
  alert("Complaint submitted successfully!");
}


      setFormData({
        title: "",
        description: "",
        address: "",
        latitude: formData.latitude,
        longitude: formData.longitude,
        photo: null,
      });
      setPreview(null);

    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };


  return (
    <div className="w-full max-w-lg mx-auto font-orbitron">
      <div className="">
        <h2 className="text-center text-2xl font-bold text-cyan-400 mb-6 drop-shadow-md">
          Submit a Complaint
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block mb-2 text-cyan-300 font-medium tracking-wide">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Complaint Title"
              required
              className="neon-input w-full p-3 rounded-lg bg-black/40 text-white placeholder-cyan-200/50"
            />
          </div>

          <div>
            <label className="block mb-2 text-cyan-300 font-medium tracking-wide">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              required
              placeholder="Complaint Description"
              className="neon-input w-full p-3 rounded-lg bg-black/40 text-white placeholder-cyan-200/50"
            />
          </div>

          <div>
            <label className="block mb-2 text-cyan-300 font-medium tracking-wide">Address (optional)</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Your Address"
              className="neon-input w-full p-3 rounded-lg bg-black/40 text-white placeholder-cyan-200/50"
            />
          </div>

          <div>
            <label className="block mb-2 text-cyan-300 font-medium tracking-wide">Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="mt-1 block w-full text-sm text-cyan-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-cyan-900/40 file:text-cyan-300
                hover:file:bg-cyan-900/60
                cursor-pointer"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="w-full mt-2 rounded-lg border border-cyan-500/30 shadow-[0_0_10px_rgba(0,243,255,0.2)]"
              />
            )}
          </div>

          {formData.latitude && (
            <p className="text-cyan-200 text-sm">
              📍 Location: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
            </p>
          )}

          <button
            type="button"
            onClick={refreshLocation}
            className="w-full py-2 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition font-semibold"
          >
            Confirm / Update Location
          </button>

          {aiPreview && (
            <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg text-cyan-200">
              <p><b>Predicted Category:</b> {aiPreview.category}</p>
              <p><b>Predicted Priority:</b> {aiPreview.priority}</p>
            </div>
          )}

          <button
            type="submit"
            className="neon-btn w-full py-3 rounded-lg font-bold text-lg bg-gradient-to-r from-blue-600/30 to-cyan-400/30 hover:from-blue-600/50 hover:to-cyan-400/50 border border-cyan-400/50 text-cyan-50"
          >
            Submit Complaint
          </button>

        </form>
      </div>
    </div>
  );
};

export default ComplaintForm;