import { useEffect, useRef, useState } from "react";
import {
  buildGoogleSession,
  initializeGoogleSignIn,
  loadGoogleIdentityScript,
  renderGoogleButton
} from "../services/auth";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function LoginGate({ onLoginSuccess }) {
  const targetRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        if (!CLIENT_ID) {
          throw new Error("Missing VITE_GOOGLE_CLIENT_ID.");
        }

        await loadGoogleIdentityScript();
        if (cancelled) return;

        initializeGoogleSignIn({
          clientId: CLIENT_ID,
          onCredential: (credential) => {
            onLoginSuccess(buildGoogleSession(credential));
          },
          onError: (err) => setError(err.message || "Google sign-in failed.")
        });

        renderGoogleButton(targetRef.current);
      } catch (err) {
        setError(err.message || "Google sign-in setup failed.");
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [onLoginSuccess]);

  return (
    <main className="login-wrap">
      <div className="login-card">
        <p className="eyebrow">Sales Order Workflow</p>
        <h1>Accounts Team Login</h1>
        <p>Sign in with your NTWoods Google account to continue.</p>
        <div ref={targetRef} />
        {error && <p className="error-text">{error}</p>}
      </div>
    </main>
  );
}
