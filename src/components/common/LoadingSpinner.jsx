import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-azure/20 animate-spin border-t-azure"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-azure rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}