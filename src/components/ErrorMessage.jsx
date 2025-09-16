import React from "react";
import { AlertCircle } from "lucide-react";

const ErrorMessage = ({ error, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
    <h3 className="text-lg font-semibold text-red-700 mb-2">
      Something went wrong
    </h3>
    <p className="text-red-600 mb-4">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

export default ErrorMessage;
