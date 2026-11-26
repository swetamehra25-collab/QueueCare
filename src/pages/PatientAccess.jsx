import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AuthPage from "../components/common/AuthPage";

export default function PatientAccess() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading, loginPatient, registerPatient } = useAuth();
  const notify = useToast();
  const registering = pathname.endsWith("/register");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", age: "", gender: "Prefer not to say" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="screen-loader"><span className="spinner" /> Loading QueueCare…</div>;
  if (user) return <Navigate to={user.role === "patient" ? "/portal" : "/"} replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (registering) {
        const result = await registerPatient({ ...form, age: Number(form.age) });
        notify(result.emailSent
          ? "Account created. A welcome email was sent to your email address."
          : "Account created, but the welcome email could not be sent. Please contact the care team.", result.emailSent ? "success" : "error");
      } else {
        await loginPatient({ email: form.email, password: form.password });
      }
      navigate("/portal", { replace: true });
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPage
      className={`patient-auth-page${registering ? " patient-register-page" : ""}`}
      eyebrow={registering ? "PATIENT REGISTRATION" : "PATIENT PORTAL"}
      title={registering ? "Your care starts here" : "Welcome back"}
      description={registering ? "Create your account to book visits and stay connected to your care." : "Sign in to manage your appointments and follow your care journey."}
      backTo="/"
      backLabel="← Back to workspaces"
    >
      <form onSubmit={submit} className="login-form auth-form patient-access-form">
        {registering && <>
          <label>Full name<input autoComplete="name" maxLength={100} required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
          <div className="patient-form-row">
            <label>Phone<input type="tel" autoComplete="tel" maxLength={30} required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
            <label>Age<input type="number" min="0" max="130" required value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} /></label>
          </div>
          <label>Gender<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option>Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option></select></label>
        </>}
        <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password
          <span className="password-input-wrap">
            <input type={showPassword ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 8 : undefined} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <button className="password-visibility" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </span>
        </label>
        <button className="button button-primary login-submit" disabled={busy}>{busy ? "Please wait…" : registering ? "Create patient account" : "Sign in to patient services"} <ArrowRight size={17} /></button>
      </form>
      <p className="patient-switch">{registering ? "Already have an account?" : "New to QueueCare?"} <Link to={registering ? "/portal/login" : "/portal/register"}>{registering ? "Sign in" : "Create an account"}</Link></p>
    </AuthPage>
  );
}
