import { HeartPulse, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import "../../styles/auth-back.css";

export default function AuthPage({ className = "", eyebrow, title, description, children, backTo = null, backLabel = "Back" }) {
  return (
    <main className={`auth-page ${className}`}>
      <div className="auth-page-glow auth-page-glow-one" />
      <div className="auth-page-glow auth-page-glow-two" />
      <header className="auth-brand-row">
        <Link className="brand-lockup auth-brand" to="/" aria-label="QueueCare home">
          <span className="brand-mark"><HeartPulse size={22} /></span><span>QueueCare</span>
        </Link>
        <span className="auth-brand-note"><ShieldCheck size={15} /> Care, connected</span>
        {backTo && <Link className="auth-back-link" to={backTo}>{backLabel}</Link>}
      </header>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-photo">
          <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=85" alt="Bright, modern hospital interior" />
          <span className="auth-photo-label"><HeartPulse size={14} /> Thoughtful care starts here</span>
        </div>
        <div className="auth-content">
          <span className="eyebrow auth-eyebrow">{eyebrow}</span>
          <h1 id="auth-title">{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
          <p className="auth-footer"><ShieldCheck size={13} /> Your information is protected with secure access.</p>
        </div>
      </section>
      <p className="auth-page-foot">QueueCare · Helping every minute matter.</p>
    </main>
  );
}
