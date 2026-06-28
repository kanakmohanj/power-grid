import { useState } from "react";
import axiosInstance from "../api/axiosInstance";


const CreateUserForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "staff",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/api/users", form);
      alert("User created successfully");
      onCreated();
    } catch (err) {
      alert(err.response?.data?.msg || " user created");
    }
  };

  return (
    <div className="flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="
          w-full max-w-xl
          bg-white/10 backdrop-blur-xl
          border border-white/20
          rounded-2xl
          px-8 py-9
          shadow-[0_0_28px_rgba(255,215,0,0.12)]
        "
      >
        {/* Header */}
        <div className="mb-7 text-center">
          <h2 className="text-2xl font-orbitron text-yellow-400 tracking-wide">
            Create User/Staff
          </h2>
          <p className="text-white/60 mt-1 text-sm">
            Add staff or citizens to your organisation
          </p>
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block text-white/70 mb-1 text-sm font-medium">
            Username
          </label>
          <input
            required
            placeholder="john_doe"
            className="
              w-full p-3
              rounded-lg
              bg-black/40
              border border-white/30
              text-white text-sm
              placeholder-white/40
              focus:border-yellow-400
              focus:ring-2 focus:ring-yellow-400/30
              outline-none transition
            "
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-white/70 mb-1 text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            required
            placeholder="user@company.com"
            className="
              w-full p-3
              rounded-lg
              bg-black/40
              border border-white/30
              text-white text-sm
              placeholder-white/40
              focus:border-yellow-400
              focus:ring-2 focus:ring-yellow-400/30
              outline-none transition
            "
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-white/70 mb-1 text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            className="
              w-full p-3
              rounded-lg
              bg-black/40
              border border-white/30
              text-white text-sm
              placeholder-white/40
              focus:border-yellow-400
              focus:ring-2 focus:ring-yellow-400/30
              outline-none transition
            "
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {/* Role */}
        <div className="mb-6">
          <label className="block text-white/70 mb-1 text-sm font-medium">
            Role
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="
              w-full p-3
              rounded-lg
              bg-black/40
              border border-white/30
              text-white text-sm
              focus:border-yellow-400
              focus:ring-2 focus:ring-yellow-400/30
              outline-none transition
            "
          >
            <option value="staff" className="text-black">
              Staff
            </option>
            <option value="citizen" className="text-black">
              Citizen
            </option>
          </select>
        </div>

        {/* Submit */}
        <button
          className="
            w-full
            py-3
            text-sm font-semibold
            rounded-lg
            text-black
            bg-gradient-to-r from-yellow-400 to-yellow-300
            hover:from-yellow-300 hover:to-yellow-200
            transition
            shadow-md
            active:scale-[0.98]
          "
        >
          Create User
        </button>
      </form>
    </div>
  );
};

export default CreateUserForm;
