import { useEffect, useState } from "react";

export default function APIKeyModal({ isOpen, onClose }) {
  const [key, setKey] = useState("");

  useEffect(() => {
    const key = localStorage.getItem('openai_api_key');

    if (key !== null && key.length > 0) {
      setKey(key);
    }
  })

  if (!isOpen) return null;

  const onSave = (key) => {
    localStorage.setItem('openai_api_key', key);
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 w-full max-w-lg rounded-xl shadow-2xl p-8 relative flex flex-col gap-8 animate-fade-in border border-gray-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-2 transition"
          aria-label="Close"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-100 text-center">Enter OpenAI API Key</h2>

        {/* Input Field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="api-key" className="text-sm font-medium text-gray-300">API Key</label>
          <input
            id="api-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-3 border border-gray-700 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-500 bg-gray-800 text-gray-100"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gray-800 text-gray-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 transition text-base border border-gray-700"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(key);
              onClose();
            }}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-base"
            type="button"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
