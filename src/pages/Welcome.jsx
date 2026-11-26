import { ArrowDown, ArrowRight, HeartPulse, ShieldCheck, Stethoscope, Clock3, MapPin, Phone, CalendarDays, Users, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/welcome.css";

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

        <section className="welcome-care-strip" aria-label="Northside Medical information">
          <div><span className="welcome-care-icon"><Clock3 size={18} /></span><span><small>CARE HOURS</small><b>Monday–Friday · 9 AM–5 PM</b></span></div>
          <div><span className="welcome-care-icon"><MapPin size={18} /></span><span><small>LOCATION</small><b>Northside Medical Center</b></span></div>
          <div><span className="welcome-care-icon"><Phone size={18} /></span><span><small>PATIENT SUPPORT</small><b>Contact the care team</b></span></div>
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

        <section className="welcome-services" aria-labelledby="care-services-heading">
          <div className="welcome-services-heading"><div><span className="eyebrow">CARE, MADE CLEAR</span><h2 id="care-services-heading">Everything for a smoother visit.</h2></div><p>Simple tools for appointments, clinicians and connected hospital care.</p></div>
          <div className="welcome-service-grid">
            <article><span><CalendarDays size={20} /></span><h3>Appointments</h3><p>Choose a clinician and reserve a convenient 30-minute visit.</p></article>
            <article><span><Users size={20} /></span><h3>Patient directory</h3><p>Keep patient details and care records thoughtfully organized.</p></article>
            <article><span><Stethoscope size={20} /></span><h3>Care team</h3><p>Find clinician availability, departments and consultation rooms.</p></article>
            <article><span><Building2 size={20} /></span><h3>Connected care</h3><p>Track queue status and the next step of care in real time.</p></article>
          </div>
        </section>
      </main>
      <footer className="welcome-footer">
        <div className="welcome-footer-main">
          <div className="welcome-footer-brand"><Link className="brand-lockup welcome-brand" to="/"><span className="brand-mark"><HeartPulse size={21} /></span><span>QueueCare</span></Link><p>Thoughtful hospital services, connected appointments and clearer patient care.</p></div>
          <div><b>For patients</b><Link to="/portal/login">Patient sign in</Link><Link to="/portal/register">Create account</Link><Link to="/portal/book">Book a visit</Link></div>
          <div><b>For teams</b><Link to="/login">Hospital admin</Link><span>Northside Medical Center</span><span>Patient care operations</span></div>
          <div><b>Hospital information</b><span><MapPin size={14} /> Northside Medical Center</span><span><Clock3 size={14} /> Monday–Friday · 9 AM–5 PM</span><span><Phone size={14} /> Contact the care team</span></div>
        </div>
        <div className="welcome-footer-bottom"><span>© 2026 QueueCare. All rights reserved.</span><span>Helping every minute matter.</span></div>
      </footer>
    </div>
  );
}
