import { useEffect, useState } from "react";
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
// const API = "http://localhost:8000/api/auth";
const API = "https://medibook-backend-1qi8.onrender.com/api/auth";

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
  patient: "/patient/dashboard",
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
          "focus:ring-2 focus:ring-sky-400 focus:border-sky-500",          error
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
  useEffect(() => {
  if (isAuthenticated && user) {
    navigate(HOME_FOR_ROLE[user.role], { replace: true });
  }
}, [isAuthenticated, user, navigate]);

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-white via-sky-50 to-blue-100 relative overflow-hidden">
    <div className="absolute right-[-120px] top-[-80px] w-[520px] h-[520px] rounded-full bg-sky-200/40 blur-3xl" />
     <div className="absolute right-[80px] bottom-[-160px] w-[420px] h-[420px] rounded-full bg-blue-300/20 blur-3xl" />

    <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-light tracking-tight text-sky-600">
            MediBook
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Simple appointment booking for patients and physicians
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={[
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  tab === t
                    ? "text-sky-700 border-b-2 border-sky-500 bg-white"
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
                  ? "bg-sky-300 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-700 active:bg-sky-800",
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