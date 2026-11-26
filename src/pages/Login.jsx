import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AuthPage from "../components/common/AuthPage";

export default function Login() {
  const { login } = useAuth();
  const notify = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await login(form);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPage className="admin-auth-page" eyebrow="HOSPITAL ADMIN" title="Welcome back" description="Sign in to your secure hospital operations workspace." backTo="/" backLabel="← Back to workspaces">
      <form onSubmit={submit} className="login-form auth-form">
        <label>Email address<input type="email" autoComplete="username" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password
          <span className="password-input-wrap">
            <input type={showPassword ? "text" : "password"} autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <button className="password-visibility" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </span>
        </label>
        <button className="button button-primary login-submit" disabled={busy}>{busy ? "Signing in…" : "Sign in to admin"} <ArrowRight size={17} /></button>
      </form>
      <p className="auth-provisioning-note"><b>Secure administrator access</b><span>Use the email and password provisioned for your role.</span></p>
    </AuthPage>
  );
}
