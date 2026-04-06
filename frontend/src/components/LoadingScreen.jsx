import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Connecting to Backend...</h2>
      <p className="text-gray-500 max-w-md text-center">
        The server might be waking up from sleep mode. This usually takes around 30-50 seconds. Please wait!
      </p>
    </div>
  );
}