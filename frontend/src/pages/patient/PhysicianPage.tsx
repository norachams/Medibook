import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Physician } from "../../types/physician";
import { useAuth } from "../../context/AuthContext";


export default function PhysicianPage() {
  const { physicianId } = useParams();
  const navigate = useNavigate();
  const { token }       = useAuth();

  const [physician, setPhysician]   = useState<Physician | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

//   // Fetch this specific physician from GET /api/physicians/:id
//   useEffect(() => {
//     fetch(`http://localhost:8000/api/physicians/${physicianId}`)
//       .then((res) => {
//         if (res.status === 404) throw new Error("Physician not found.");
//         if (!res.ok) throw new Error("Failed to load physician.");
//         return res.json();
//       })
//       .then((data: Physician) => setPhysician(data))
//       .catch((err: Error) => setError(err.message))
//       .finally(() => setLoading(false));
//   }, [physicianId]); // re-fetch if the ID in the URL changes

  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [reason, setReason]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

   // Single fetch — sets physician AND pre-selects first slot in one .then()
  useEffect(() => {
    fetch(`http://localhost:8000/api/physicians/${physicianId}`)
      .then((res) => {
        if (res.status === 404) throw new Error("Physician not found.");
        if (!res.ok) throw new Error("Failed to load physician.");
        return res.json();
      })
      .then((data: Physician) => {
        setPhysician(data);
        // Pre-select first available slot (both display time and id)
        if (data.slots.length > 0) {
          setSelectedSlot(data.slots[0].time);
          setSelectedSlotId(data.slots[0].id);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [physicianId]);

  // ── Submit — real POST to /api/bookings ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId || !physician) return;
    setSubmitError(null);
    setSubmitting(true);
 
    try {
      const res = await fetch("http://localhost:8000/api/bookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // send JWT so Flask knows who's booking
        },
        body: JSON.stringify({
          physician_id:  physician.id,
          slot_id:       selectedSlotId,   // ID of the slot, not just the time string
          patient_name:  fullName,
          patient_email: email,
          patient_phone: phone,
          reason,
        }),
      });
 
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as Error;
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };
 

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-sky-50 to-blue-100">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error || !physician) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-sky-50 to-blue-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">{error ?? "Physician not found."}</p>
          <button
            onClick={() => navigate("/patient/book")}
            className="mt-4 text-sm font-medium text-sky-600 hover:underline"
          >
            ← Back to physicians
          </button>
        </div>
      </div>
    );
  }

  // ── Submit ───────────────────────────────────────────────────────────────
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedSlot) return;
//     setSubmitError(null);
//     setSubmitting(true);

//     try {
//       // TODO: replace with real POST /api/bookings once backend route exists
//       await new Promise((r) => setTimeout(r, 800)); // simulated delay
//       setSubmitted(true);
//     } catch {
//       setSubmitError("Something went wrong. Please try again.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✓
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Request sent!</h2>
          <p className="mb-1 text-sm text-gray-500">
            Your appointment with{" "}
            <span className="font-semibold text-gray-700">{physician.name}</span> at{" "}
            <span className="font-semibold text-gray-700">{selectedSlot}</span> is pending confirmation.
          </p>
          <p className="mb-8 text-sm text-gray-400">
            You'll be notified once the physician confirms.
          </p>
          <button
            onClick={() => navigate("/patient/dashboard")}
            className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => navigate("/patient/book")}
          className="mb-8 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
        >
          ← Back to physicians
        </button>

        <div className="flex flex-col gap-6 lg:flex-row">

          {/* ── Left: physician info + slots ── */}
          <div className="flex-1 space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100/60">
              <div className="mb-6 flex items-center gap-5">
                <div className="h-20 w-20 flex-shrink-0 rounded-full bg-sky-100" />
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900">{physician.name}</h1>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600">
                      {physician.availabilityLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-base font-medium text-sky-500">{physician.specialty}</p>
                  {/* was physician.bio — field is called description in the DB */}
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{physician.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-sky-50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">Rating</p>
                  <p className="text-lg font-semibold text-gray-800">★ {physician.rating}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">Location</p>
                  <p className="text-sm font-semibold text-gray-800">{physician.location}</p>
                </div>
              </div>
            </div>

            {/* Slot picker */}
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100/60">
              <h2 className="mb-1 text-xl font-bold text-gray-900">Available appointment times</h2>
              <p className="mb-5 text-sm text-gray-400">Choose one of the open times below.</p>
              <div className="flex flex-wrap gap-3">
                {physician.slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot.time)}
                    className={[
                      "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                      selectedSlot === slot.time
                        ? "bg-sky-500 text-white shadow-md shadow-sky-200"
                        : "border border-gray-200 bg-white text-gray-700 hover:border-sky-300 hover:text-sky-600",
                    ].join(" ")}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: booking form ── */}
          <div className="w-full lg:w-96">
            <div className="sticky top-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100/60">
              <h2 className="mb-1 text-xl font-bold text-gray-900">Request appointment</h2>
              <p className="mb-6 text-sm text-gray-400">
                Submit your details and the request will start as pending.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {submitError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
                  <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nora Chamseddin"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="nora@example.com"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone number</label>
                  <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 123 456 7890"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Reason for visit</label>
                  <textarea required value={reason} onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe the reason for your appointment..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                </div>

                {selectedSlot && (
                  <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm">
                    <p className="mb-1 font-semibold text-gray-800">Summary</p>
                    <p className="text-gray-600">{physician.name}</p>
                    <p className="text-gray-600">{selectedSlot}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className={[
                    "w-full rounded-xl py-3 text-sm font-semibold text-white transition",
                    submitting || !selectedSlot
                      ? "cursor-not-allowed bg-sky-300"
                      : "bg-sky-500 shadow-md shadow-sky-200 hover:bg-sky-600",
                  ].join(" ")}
                >
                  {submitting ? "Submitting…" : "Request appointment"}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}