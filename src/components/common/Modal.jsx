import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ title, subtitle, onClose, children, wide = false }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card${wide ? " modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading"><div><h2 id="modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>
        {children}
      </section>
    </div>
  );
}
