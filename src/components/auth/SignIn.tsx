import { useState, type FormEvent } from "react";
import { Mail, Unlock, XCircle } from "lucide-react";

interface SignInProps {
  onSignedIn: (email: string) => void;
}

export function SignIn({ onSignedIn }: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Wrong email or password. Please try again.");
      return;
    }
    setSubmitting(true);
    // Auth stub: any non-empty input "signs in". Real TokScript auth lands here later.
    await new Promise((r) => setTimeout(r, 350));
    onSignedIn(email.trim());
  };

  const continueSocial = async (provider: "google" | "facebook") => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 350));
    onSignedIn(`${provider}@example.com`);
  };

  return (
    <>
      <h1>Welcome Back to SocialPulse</h1>
      <p className="lede">
        Welcome to SocialPulse! 🎉 Capture what's working on Facebook —
        grab posts as you scroll and keep them organized. 😊
      </p>

      <form className="auth-body" onSubmit={submit} noValidate>
        <label className="field" aria-label="Email">
          <span className="field-icon"><Mail size={14} strokeWidth={2} /></span>
          <input
            type="email"
            placeholder="Enter your email here"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="field" aria-label="Password">
          <span className="field-icon"><Unlock size={14} strokeWidth={2} /></span>
          <input
            type="password"
            placeholder="Enter your password here"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && (
          <div className="field-error" role="alert">
            <span className="field-error-icon"><XCircle size={14} strokeWidth={2.25} /></span>
            Error: {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign In"}
        </button>

        <div className="or-divider">or</div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => continueSocial("google")}
          disabled={submitting}
        >
          <GoogleLogo />
          Sign in with Google
        </button>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => continueSocial("facebook")}
          disabled={submitting}
        >
          <FacebookLogo />
          Sign in with Facebook
        </button>
      </form>

      <div className="auth-footer center">
        <span className="auth-footer-text">
          Don't have an account?{" "}
          <a href="https://tokscript.com/signup" target="_blank" rel="noreferrer">
            Sign up here
          </a>
        </span>
      </div>
    </>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.86 2.69-6.61Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.47-.81 5.96-2.19l-2.9-2.26c-.81.54-1.83.86-3.06.86-2.36 0-4.36-1.59-5.07-3.73H.96v2.34A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.93 10.68A5.41 5.41 0 0 1 3.63 9c0-.58.1-1.15.3-1.68V4.98H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.82.96 4.02l2.97-2.34Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.98l2.97 2.34C4.64 5.17 6.64 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="#1877F2" />
      <path d="M11.7 9.34h-1.8V15H7.55V9.34H6.3V7.43h1.25V6.3c0-1.04.5-2.66 2.67-2.66l1.95.01v1.86h-1.42c-.23 0-.55.12-.55.6v1.32h2l-.5 1.91Z" fill="#fff"/>
    </svg>
  );
}
