import { useState } from "react";

let toastId = 0;

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = (message, type = "success") => {
    const id = ++toastId;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };
  return { toasts, add };
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type === "error" ? "toast-error" : "toast-success"}`}>
          <span className="toast-icon">{t.type === "error" ? "✕" : "✓"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
