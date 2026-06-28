// const StatCard = ({ label, value, color }) => (
//   <div className="p-6 rounded-xl border border-white/20 bg-white/10 backdrop-blur-lg shadow-md">
//     <p className="text-sm opacity-70">{label}</p>
//     <h3 style={{ color }} className="text-2xl font-bold mt-1">
//       {value}
//     </h3>
//   </div>
// );
// export default StatCard
import React from 'react';

const StatCard = ({ label, value, color }) => {
  return (
    <div
      className="glass-panel p-6 shadow-lg hover:shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all duration-300 hover:scale-105 w-full flex flex-col items-center justify-center text-center"
      style={{ borderColor: color ? `${color}40` : undefined }} // Optional: tint border with prop color
    >
      <div
        className="text-3xl font-orbitron font-bold drop-shadow-md mb-2"
        style={{ color: color || '#00f3ff' }}
      >
        {value || 0}
      </div>
      <div className="text-cyan-100/70 text-sm font-medium tracking-wide">
        {label}
      </div>
    </div>
  );
};

export default StatCard;
