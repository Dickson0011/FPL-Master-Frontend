import React from "react";

const LoadingSpinner = ({ size = "medium", message }) => {
  const sizeClasses = {
    small: "h-5 w-5",
    medium: "h-10 w-10",
    large: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`animate-spin rounded-full border-4 border-gray-300 border-t-fpl-primary ${sizeClasses[size]}`}
      />
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
