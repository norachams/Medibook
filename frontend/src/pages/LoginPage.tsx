import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AuthResponse } from "../types/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Tab = "signin" | "signup";

interface FieldErrors {
  email?:     string;
  password?:  string;
  full_name?: string;
  general?:   string;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
const API = "http://localhost:8000/api/auth";

async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw data; // { error, fields? }
  return data as AuthResponse;
}

async function apiRegister(
  email: string,
  password: string,
  full_name: string
): Promise<AuthResponse> {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name }),
    // Note: role is intentionally NOT sent — backend always assigns "patient"
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data as AuthResponse;
}

// ---------------------------------------------------------------------------
// Where to send each role after a successful login
// ---------------------------------------------------------------------------
const HOME_FOR_ROLE = {
  patient:   "/patient/book",
  physician: "/physician/dashboard",
} as const;

// ---------------------------------------------------------------------------
// Shared input component
// ---------------------------------------------------------------------------
function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full rounded-lg border px-3 py-2 text-sm outline-none transition",
          "focus:ring-2 focus:ring-teal-500 focus:border-teal-500",
          error
            ? "border-red-400 bg-red-50"
            : "border-gray-300 bg-white",
        ].join(" ")}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, send them straight to their home
  if (isAuthenticated && user) {
    navigate(HOME_FOR_ROLE[user.role], { replace: true });
  }

  const [tab, setTab]           = useState<Tab>("signin");
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<FieldErrors>({});

  // Form fields
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const clearErrors = () => setErrors({});

  const switchTab = (t: Tab) => {
    setTab(t);
    clearErrors();
  };

  // ── Sign in ──────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const authResponse = await apiLogin(email, password);
      login(authResponse);
      navigate(HOME_FOR_ROLE[authResponse.user.role], { replace: true });
    } catch (err: unknown) {
      const data = err as { error?: string; fields?: FieldErrors };
      setErrors({ general: data.error ?? "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  // ── Sign up ──────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      const authResponse = await apiRegister(email, password, fullName);
      login(authResponse);
      navigate(HOME_FOR_ROLE[authResponse.user.role], { replace: true });
    } catch (err: unknown) {
      const data = err as { error?: string; fields?: FieldErrors };
      // Surface per-field errors if the API returned them
      setErrors(data.fields ?? { general: data.error ?? "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">MedBook</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={[
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  tab === t
                    ? "text-teal-700 border-b-2 border-teal-600 bg-white"
                    : "text-gray-500 hover:text-gray-700 bg-gray-50",
                ].join(" ")}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Form body */}
          <form
            onSubmit={tab === "signin" ? handleSignIn : handleSignUp}
            className="p-6 flex flex-col gap-4"
          >
            {/* General error banner */}
            {errors.general && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            {/* Name field — only on signup tab */}
            {tab === "signup" && (
              <Field
                label="Full name"
                id="full_name"
                value={fullName}
                onChange={setFullName}
                error={errors.full_name}
                placeholder="Jane Smith"
              />
            )}

            <Field
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              error={errors.email}
              placeholder="you@example.com"
            />

            <Field
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              placeholder={tab === "signup" ? "At least 6 characters" : ""}
            />

            <button
              type="submit"
              disabled={loading}
              className={[
                "w-full rounded-lg py-2.5 text-sm font-semibold text-white transition",
                loading
                  ? "bg-teal-400 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
              ].join(" ")}
            >
              {loading
                ? "Please wait…"
                : tab === "signin"
                ? "Sign in"
                : "Create account"}
            </button>

            {/* Subtle note on the signup tab */}
            {tab === "signup" && (
              <p className="text-center text-xs text-gray-400">
                Physician accounts are created by clinic staff.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}