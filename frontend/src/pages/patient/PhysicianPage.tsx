import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import type { Physician,Slot } from "../../types/physician";
import { useAuth } from "../../context/AuthContext";



// ---------------------------------------------------------------------------
// Helper — build a 7-day strip starting from today
// Returns array of { date: "2026-05-14", label: "Wed", day: "14" }
// ---------------------------------------------------------------------------
function buildDateStrip() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date:  d.toISOString().split("T")[0],                          
      label: d.toLocaleDateString("en-US", { weekday: "short" }),    
      day:   d.toLocaleDateString("en-US", { day: "numeric" }),      
      month: d.toLocaleDateString("en-US", { month: "short" }),      
    });
  }
  return days;
}

function timeToMinutes(time: string) {
  const [rawTime, period] = time.trim().split(" ");
  const [rawHour, rawMinute] = rawTime.split(":");

  let hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour * 60 + minute;
}


export default function PhysicianPage() {
  const { physicianId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const location = useLocation();

  // If coming from dashboard via "Reschedule", location.state carries the booking id
  const locationState = location.state as {
  rescheduleBookingId?: number;
  bookingDetails?: {
    patient_name: string;
    patient_email: string;
    patient_phone: string;
    reason: string;
  };
} | null;

const rescheduleBookingId: number | null =
  locationState?.rescheduleBookingId ?? null;

const existingBookingDetails = locationState?.bookingDetails ?? null;

const currentUser = user as
  | {
      full_name?: string;
      fullName?: string;
      name?: string;
      email?: string;
      phone?: string;
    }
  | null
  | undefined;

const userFullName =
  currentUser?.full_name ??
  currentUser?.fullName ??
  currentUser?.name ??
  "";

const userEmail = currentUser?.email ?? "";
const userPhone = currentUser?.phone ?? "";


  const [physician, setPhysician]   = useState<Physician | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate]         = useState<string | null>(null); 
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [fullName, setFullName] = useState(
  existingBookingDetails?.patient_name ?? userFullName);

    const [email, setEmail] = useState(
    existingBookingDetails?.patient_email ?? userEmail
    );

    const [phone, setPhone] = useState(
    existingBookingDetails?.patient_phone ?? userPhone
    );

    const [reason, setReason] = useState(
    existingBookingDetails?.reason ?? ""
    );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const dateStrip = buildDateStrip();

  

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


        if (data.slots.length > 0) {
        const sortedSlots = data.slots
            .slice()
            .sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }

            return timeToMinutes(a.time) - timeToMinutes(b.time);
            });

        const firstSlot = sortedSlots[0];

        setSelectedDate(firstSlot.date);
        setSelectedSlot(firstSlot.time);
        setSelectedSlotId(firstSlot.id);
        }

        // Chain a second fetch to check for an existing active booking
        return fetch(`http://localhost:8000/api/bookings/check/${data.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => res.json())
      .then((data: { has_active_booking: boolean }) => {
        setHasActiveBooking(data.has_active_booking);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [physicianId, token]);

   const slotsForSelectedDate: Slot[] =
  physician?.slots
    .filter((s) => s.date === selectedDate)
    .slice()
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)) ?? [];

  const datesWithSlots = new Set(physician?.slots.map((s) => s.date) ?? []);
 
  const handleDateSelect = (date: string) => {
  if (!datesWithSlots.has(date)) return;

  setSelectedDate(date);

  const slotsForDate =
    physician?.slots
      .filter((s) => s.date === date)
      .slice()
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)) ?? [];

  const firstSlot = slotsForDate[0];

  if (firstSlot) {
    setSelectedSlot(firstSlot.time);
    setSelectedSlotId(firstSlot.id);
  } else {
    setSelectedSlot(null);
    setSelectedSlotId(null);
  }
};
 
  const isRescheduling = rescheduleBookingId !== null;
  const isBlocked = submitting || !selectedSlot || (!isRescheduling && hasActiveBooking);

  // ── Submit — real POST to /api/bookings ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId || !physician) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      // If rescheduling, PATCH the existing booking instead of creating a new one
      const url = rescheduleBookingId
        ? `http://localhost:8000/api/bookings/${rescheduleBookingId}/reschedule`
        : "http://localhost:8000/api/bookings/";
      const method = rescheduleBookingId ? "PATCH" : "POST";
 
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          rescheduleBookingId
            ? { slot_id: selectedSlotId }  // reschedule only needs the new slot
            : {
                physician_id:  physician.id,
                slot_id:       selectedSlotId,
                patient_name:  fullName,
                patient_email: email,
                patient_phone: phone,
                reason,
              }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };
 

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-white via-sky-50 to-blue-100">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error || !physician) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-white via-sky-50 to-blue-100">
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
            onClick={() =>
                navigate(isRescheduling ? "/patient/dashboard" : "/patient/book")
            }
            className="mb-8 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
            >
            {isRescheduling ? "← Back to dashboard" : "← Back to physicians"}
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


            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100/60">
              <h2 className="mb-1 text-xl font-bold text-gray-900">Available appointment times</h2>
              <p className="mb-5 text-sm text-gray-400">Select a day, then choose a time.</p>
 
              <div className="mb-6 grid grid-cols-7 gap-2">
                {dateStrip.map(({ date, label, day, month }) => {
                  const hasSlots   = datesWithSlots.has(date);               
                  const isSelected = selectedDate === date;                   
                  const isDisabled = !hasSlots ;        
 
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                    //   disabled={isDisabled}
                      className={[
                        "flex flex-col items-center rounded-2xl py-3 text-center transition",
                        isSelected && !isDisabled
                          ? "bg-sky-500 text-white shadow-md shadow-sky-200"           // selected day
                          : isDisabled
                          ? "cursor-not-allowed bg-gray-50 text-gray-300"              // no slots / blocked
                          : "border border-gray-200 bg-white text-gray-700 hover:border-sky-300 hover:text-sky-600", // available
                      ].join(" ")}
                    >
                      <span className="text-xs font-medium">{label}</span>   {/* Mon, Tue… */}
                      <span className="text-base font-bold">{day}</span>      {/* 14, 15… */}
                      <span className="text-xs opacity-70">{month}</span>     {/* May */}
                    </button>
                  );
                })}
              </div>
 
              {slotsForSelectedDate.length === 0 ? (
                <p className="text-sm text-gray-400">No available slots for this day.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {slotsForSelectedDate.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                    if (!hasActiveBooking || isRescheduling) {
                          setSelectedSlot(slot.time);
                          setSelectedSlotId(slot.id);
                        }
                      }}
                      className={[
                        "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                        hasActiveBooking && !isRescheduling
                          ? "cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-300"  // blocked
                          : selectedSlot === slot.time
                          ? "bg-sky-500 text-white shadow-md shadow-sky-200"                      // selected
                          : "border border-gray-200 bg-white text-gray-700 hover:border-sky-300 hover:text-sky-600", // default
                      ].join(" ")}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: booking form ── */}
          <div className="w-full lg:w-96">
            <div className="sticky top-8 rounded-3xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100/60">
              <h2 className="mb-1 text-xl font-bold text-gray-900">
                    {isRescheduling ? "Request a new appointment" : "Request appointment"}
                    </h2>

                    <p className="mb-6 text-sm text-gray-400">
                    {isRescheduling
                        ? "Choose a new time for your appointment. Your previous slot will become available again."
                        : "Submit your details and the request will start as pending."}
                    </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Warning banner — shows on load if already booked, or on submit error */}
                {((hasActiveBooking && !isRescheduling) || submitError) && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
                    {hasActiveBooking && !isRescheduling
                    ? "You already have an active booking with this physician. Cancel it before booking again."
                    : submitError}
                </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
                  <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
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

        

                {selectedSlot && selectedDate && (
                  <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm">
                    <p className="mb-1 font-semibold text-gray-800">Summary</p>
                    <p className="text-gray-600">{physician.name}</p>
                    <p className="text-gray-600">
                      {/* Find the display_date for the selected date */}
                      {physician.slots.find((s) => s.date === selectedDate)?.display_date} at {selectedSlot}
                    </p>
                  </div>
                )}

                <button type="submit" disabled={isBlocked}
                  className={[
                    "w-full rounded-xl py-3 text-sm font-semibold text-white transition",
                    isBlocked
                      ? "cursor-not-allowed bg-sky-300"
                      : "bg-sky-500 shadow-md shadow-sky-200 hover:bg-sky-600",
                  ].join(" ")}>
                  {submitting
                    ? isRescheduling
                        ? "Rescheduling…"
                        : "Submitting…"
                    : isRescheduling
                        ? "Reschedule appointment"
                        : "Request appointment"}
                </button>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}