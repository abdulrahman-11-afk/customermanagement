'use client';

export default function SupabaseError() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-red-600 font-semibold mb-2">Connection Error</h2>
        <p className="text-gray-600">Unable to connect to the database. Please check your configuration.</p>
      </div>
    </div>
  );
}