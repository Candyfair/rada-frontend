"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // No real auth — navigate directly to home on submit
  function handleSubmit() {
    router.push("/");
  }

  return (
    <div style={styles.root}>
      {/* ---- APP TITLE ---- */}
      <h1 style={styles.appTitle}>Asset Grid Manager</h1>

      {/* ---- LOGIN CARD ---- */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Login</h2>

        {/* Email field */}
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            autoComplete="email"
            autoCapitalize="none"
          />
        </div>

        {/* Password field */}
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="password">
            Password
          </label>
          <div style={styles.passwordWrapper}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...styles.input, paddingRight: 44 }}
              autoComplete="current-password"
            />
            <button
              style={styles.eyeButton}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={18} color="var(--color-login-eye)" />
              ) : (
                <Eye size={18} color="var(--color-login-eye)" />
              )}
            </button>
          </div>
        </div>

        {/* Forgot password — no-op for now */}
        <button style={styles.forgotButton} onClick={() => {}}>
          Forgot password?
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Google — placeholder */}
        <button style={styles.socialButton} onClick={handleSubmit}>
          <div style={styles.socialIconPlaceholder} />
          <span style={styles.socialText}>Sign in with Google</span>
        </button>

        {/* Apple — placeholder */}
        <button style={styles.socialButton} onClick={handleSubmit}>
          <div style={styles.socialIconPlaceholder} />
          <span style={styles.socialText}>Sign in with Apple</span>
        </button>

        {/* Submit — the checkmark icon from the Figma maquette */}
        <button style={styles.submitButton} onClick={handleSubmit} aria-label="Login">
          ✓
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// STYLES
// -------------------------------------------------------------------
const styles = {
  root: {
    minHeight: "100dvh",
    backgroundColor: "var(--color-bg)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
  },

  appTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "var(--color-text-primary)",
    marginBottom: 32,
    textAlign: "center",
  },

  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "var(--color-login-card-bg)",
    border: "1px solid var(--color-login-card-border)",
    borderRadius: 16,
    padding: "28px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: "700",
    color: "var(--color-text-primary)",
    textAlign: "center",
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "var(--color-text-primary)",
  },

  input: {
    width: "100%",
    height: 44,
    backgroundColor: "var(--color-login-input-bg)",
    border: "1px solid var(--color-login-input-border)",
    borderRadius: 8,
    padding: "0 12px",
    fontSize: 14,
    color: "var(--color-text-primary)",
    outline: "none",
    boxSizing: "border-box",
  },

  passwordWrapper: {
    position: "relative",
  },

  eyeButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },

  forgotButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    color: "var(--color-text-primary)",
    alignSelf: "flex-end",
    padding: 0,
  },

  divider: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "var(--color-login-card-border)",
  },

  dividerText: {
    fontSize: 13,
    color: "var(--color-text-primary)",
  },

  // Social buttons — icons are image placeholders for now
  socialButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    backgroundColor: "var(--color-login-input-bg)",
    border: "1px solid var(--color-login-card-border)",
    borderRadius: 24,
    padding: "10px 16px",
    cursor: "pointer",
  },

  socialIconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    backgroundColor: "var(--color-login-card-border)",
    flexShrink: 0,
  },

  socialText: {
    fontSize: 14,
    fontWeight: "500",
    color: "var(--color-text-primary)",
  },

  submitButton: {
    alignSelf: "center",
    background: "none",
    border: "1px solid var(--color-login-card-border)",
    borderRadius: "50%",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 18,
    color: "var(--color-text-primary)",
    marginTop: 4,
  },
};
