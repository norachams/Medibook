import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Physician } from "../../types/physician";

// ---------------------------------------------------------------------------
// Physician card
// ---------------------------------------------------------------------------
function PhysicianCard({ physician }: { physician: Physician }) {
  const navigate = useNavigate();
  const availableToday = physician.availabilityLabel === "Available today";

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-100/60 transition hover:shadow-xl hover:shadow-gray-200/60">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-16 w-16 rounded-full bg-sky-100" />
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-medium",
            availableToday ? "bg-sky-50 text-sky-600" : "bg-gray-100 text-gray-500",
          ].join(" ")}
        >
          {physician.availabilityLabel}
        </span>
      </div>

      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-900">{physician.name}</h3>
        <p className="text-sm font-medium text-sky-500">{physician.specialty}</p>
      </div>

      {/* was physician.bio — renamed to description to match DB column */}
      <p className="mb-6 text-sm leading-relaxed text-gray-500">{physician.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">★ {physician.rating}</span>
        <button
          onClick={() => navigate(`/patient/book/${physician.id}`)}
          className="text-sm font-semibold text-sky-600 transition hover:text-sky-800"
        >
          View profile →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BookingPage — fetches physicians from GET /api/physicians
// ---------------------------------------------------------------------------
export default function BookingPage() {
  const navigate = useNavigate();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/physicians/")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load physicians.");
        return res.json();
      })
      .then((data: Physician[]) => setPhysicians(data))
      .catch(() => setError("Could not load physicians. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []); // empty array = run once on mount

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-sky-50 to-blue-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <button
            onClick={() => navigate("/patient/dashboard")}
            className="mb-6 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
            >
            ← Back to dashboard
            </button>

        <div className="mb-10 flex items-start justify-between">
            
          <div>
           
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Choose a physician
            </h1>
            
          </div>
          {!loading && !error && (
            <span className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600">
              {physicians.length} physicians available
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-20">
            <p className="text-sm text-gray-400">Loading physicians…</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Physician grid */}
        {!loading && !error && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {physicians.map((p) => (
              <PhysicianCard key={p.id} physician={p} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}