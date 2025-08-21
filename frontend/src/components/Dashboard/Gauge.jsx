// src/components/CircularGauge.jsx
import { useState, useEffect } from "react";

const Gauge = () => {
  const [value, setValue] = useState(65); // percent (0–100)

  // Auto update for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setValue(Math.floor(Math.random() * 101)); // random % 0–100
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Circle math
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg height={radius * 2} width={radius * 2}>
        {/* Background circle */}
        <circle
          stroke="#e5e7eb" // gray-200
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke="#3b82f6" // blue-500
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
        {/* Text in center */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="20"
          fill="#111827"
        >
          {value}%
        </text>
      </svg>
    </div>
  );
}

export default Gauge;
