import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AuthPage from "../components/common/AuthPage";
import { useToast } from "../context/ToastContext";
import { post } from "../services/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (password !== confirm) return notify("The two passwords do not match.", "error");
    setBusy(true);
    try {
      await post("/auth/password-reset/confirm", { token, password });
      notify("Password reset successfully. Please sign in.", "success");
      navigate("/login", { replace: true });
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPage eyebrow="SECURE ACCOUNT RECOVERY" title="Create a new password" description="Choose a strong password with at least 12 characters.">
      <form onSubmit={submit} className="login-form auth-form">
        <label>New password
          <span className="password-input-wrap">
            <input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
            <button className="password-visibility" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </span>
        </label>
        <label>Confirm password<input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
        <button className="button button-primary login-submit" disabled={busy}>{busy ? "Resetting…" : "Reset administrator password"}<ArrowRight size={17} /></button>
      </form>
    </AuthPage>
  );
}
