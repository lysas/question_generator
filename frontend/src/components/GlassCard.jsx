import React from "react";

const GlassCard = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`bg-gray-800/60 backdrop-blur-lg border border-gray-600/30 rounded-xl p-4 shadow-soft transition-all duration-300 hover:shadow-glow hover:-translate-y-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
