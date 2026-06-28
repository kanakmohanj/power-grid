// src/components/SearchFilter.jsx
import React from "react";

const SearchFilter = ({ search, setSearch, status, setStatus }) => {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        placeholder="Search by title or category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded px-3 py-2 w-64 focus:ring-2 focus:ring-[var(--primary)]"
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border rounded px-3 py-2 focus:ring-2 focus:ring-[var(--primary)]"
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>
    </div>
  );
};

export default SearchFilter;
