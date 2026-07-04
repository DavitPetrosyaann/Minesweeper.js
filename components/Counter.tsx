import React from 'react';

interface CounterProps {
  value: number;
  label?: string;
}

export const Counter: React.FC<CounterProps> = ({ value, label }) => {
  // Format to 3 digits
  const formattedValue = Math.max(0, Math.min(999, value)).toString().padStart(3, '0');

  return (
    <div className="flex flex-col items-center">
      {label && <span className="text-mahogany-600 text-xs font-bold uppercase tracking-widest mb-1">{label}</span>}
      <div className="bg-black border-2 border-brass-600 rounded p-1 shadow-[0_0_10px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_2px_8px_rgba(0,0,0,1)] pointer-events-none z-10"></div>
        {/* Subtle reflection */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10"></div>
        
        <div className="font-mono text-3xl leading-none tracking-widest text-brass-500 brass-text px-2 py-1 relative z-0">
          {formattedValue}
        </div>
      </div>
    </div>
  );
};
