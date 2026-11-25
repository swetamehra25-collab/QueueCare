import { ArrowDown, ArrowRight, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <Link className="brand-lockup welcome-brand" to="/" aria-label="QueueCare home">
          <span className="brand-mark"><HeartPulse size={23} /></span><span>QueueCare</span>
        </Link>
        <span className="welcome-header-note"><ShieldCheck size={15} /> A connected care experience</span>
      </header>
      <main className="welcome-main">
        <section className="welcome-hero" aria-labelledby="welcome-title">
          <div className="welcome-hero-copy">
            <span className="eyebrow light-eyebrow"><HeartPulse size={14} /> SMART HOSPITAL CONTROL CENTER</span>
            <h1 id="welcome-title">Care flows better<br />when everything<br /><em>works together.</em></h1>
            <p>One thoughtful workspace for hospital teams and patients—from the first appointment to the next step in care.</p>
            <a className="welcome-explore-link" href="#workspaces">Explore workspaces <ArrowDown size={15} /></a>
          </div>
          <div className="welcome-hero-visual">
            <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=85" alt="Bright, modern hospital interior" />
            <div className="welcome-image-caption"><span className="welcome-caption-icon"><Stethoscope size={17} /></span><span><b>Care, in sync</b><small>People and services, connected.</small></span><i /></div>
          </div>
          <span className="welcome-hero-glow" aria-hidden="true" />
        </section>

        <section className="welcome-access" id="workspaces" aria-labelledby="welcome-heading">
          <div className="welcome-access-heading">
            <div><span className="eyebrow">YOUR QUEUECARE WORKSPACE</span><h2 id="welcome-heading">Choose where to begin.</h2></div>
            <p>Secure access, designed around the way you receive or deliver care.</p>
          </div>
          <div className="welcome-cards">
            <article className="welcome-card welcome-admin-card">
              <span className="welcome-card-icon"><ShieldCheck size={21} /></span>
              <span className="welcome-card-eyebrow">FOR HOSPITAL TEAMS</span>
              <h3>Hospital Admin</h3>
              <p>Coordinate patients, appointments, clinicians, and the live queue from one clear control center.</p>
              <Link className="button button-primary welcome-card-button" to="/login">Enter admin workspace <ArrowRight size={17} /></Link>
            </article>
            <article className="welcome-card welcome-patient-card">
              <span className="welcome-card-icon"><HeartPulse size={21} /></span>
              <span className="welcome-card-eyebrow">FOR PATIENTS</span>
              <h3>Patient Services</h3>
              <p>Find a doctor, book an appointment, and keep track of your visit and queue.</p>
              <div className="welcome-patient-actions">
                <Link className="button button-primary welcome-card-button" to="/portal/login">Open patient services <ArrowRight size={17} /></Link>
                <Link className="welcome-register-link" to="/portal/register">New to QueueCare? <span>Create a patient account</span></Link>
              </div>
            </article>
          </div>
          <p className="welcome-privacy"><ShieldCheck size={14} /> Your care information is protected with secure, role-based access.</p>
        </section>
      </main>
      <footer className="welcome-footer"><span>QueueCare · Helping every minute matter.</span><span>Thoughtful care, made simple.</span></footer>
    </div>
  );
}
