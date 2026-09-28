import React from 'react';

interface ToastProps {
  message: string | null;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      id="toast"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3.5 rounded-2xl bg-zinc-900 text-white text-sm font-semibold shadow-2xl flex items-center gap-2.5 transition-all duration-300 animate-bounce"
    >
      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>{message}</span>
    </div>
  );
};

export default Toast;
