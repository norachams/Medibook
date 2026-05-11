import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CancelAppointmentModal from "../../components/CancelAppointmentModal";
import { AnimatePresence, motion } from "framer-motion";
 
interface Booking {
  id: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  reason: string;
  created_at: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  physician_name: string;
  physician_id: number;   
  specialty: string;
  display_date: string;
  time: string;
}
 
const STATUS_STYLES: Record<Booking["status"], { pill: string; dot: string }> = {
  pending:   { pill: "bg-amber-50 text-amber-700",   dot: "bg-amber-400" },
  confirmed: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
  cancelled: { pill: "bg-gray-100 text-gray-400",    dot: "bg-gray-300" },
  completed: { pill: "bg-slate-100 text-slate-500", dot: "bg-slate-300" },

};
 

export default function PatientDashboardPage() {
  const navigate        = useNavigate();
  const { token, user, logout} = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null); 
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node)
    ) {
      setProfileMenuOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  useEffect(() => {
    fetch("http://localhost:8000/api/bookings/my", {
      headers: { Authorization: `Bearer ${token}` }, 
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load bookings.");
        return res.json();
      })
      .then((data: Booking[]) => setBookings(data))
      .catch(() => setError("Could not load bookings."))
      .finally(() => setLoading(false));
  }, [token]);
 
  // // Derive counts from real data
  // const counts = {
  //   upcoming:  bookings.filter((b) => b.status === "confirmed").length,
  //   pending:   bookings.filter((b) => b.status === "pending").length,
  //   confirmed: bookings.filter((b) => b.status === "confirmed").length,
  // };

  const handleSignOut = () => {
  logout();
  navigate("/login");
};

const handleCancel = async (bookingId: number, cancelReason: string) => {
  setCancelling(bookingId);
  setOpenMenuId(null);
  setError(null);

  try {
    const res = await fetch(
      `http://localhost:8000/api/bookings/${bookingId}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cancel_reason: cancelReason }),
      }
    );

    if (!res.ok) throw new Error();

    setBookings((prev) => prev.filter((b) => b.id !== bookingId));

    setBookingToCancel(null);
    setCancelSuccess("Appointment cancelled successfully, you will receive a confirmation email shortly.");

    setTimeout(() => {
      setCancelSuccess(null);
    }, 3500);
  } catch {
    setError("Could not cancel appointment. Try again.");
  } finally {
    setCancelling(null);
  }
};
 
  // ── Reschedule — navigate to the physician page, pass booking id as state ─
  // PhysicianPage will detect this and switch to reschedule mode
  const handleReschedule = (booking: Booking) => {
    setOpenMenuId(null);
    navigate(`/patient/book/${booking.physician_id}`, {
  state: {
    rescheduleBookingId: booking.id,
    bookingDetails: {
      patient_name: booking.patient_name,
      patient_email: booking.patient_email,
      patient_phone: booking.patient_phone,
      reason: booking.reason,
    },
  },
});
  };
 
  // Close dropdown when clicking outside
  useEffect(() => {
    const close = () => setOpenMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
 

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-sky-50 to-blue-100 px-6 py-8 text-gray-800">
      <div className="mx-auto max-w-7xl">
 
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-sky-600">MediBook</h1>
          </div>


  <div ref={menuRef} className="relative">
 <button
  onClick={() => setProfileMenuOpen((open) => !open)}
  className={[
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-left shadow-sm ring-1 transition",
    profileMenuOpen
      ? "bg-sky-50 ring-sky-100 shadow-md"
      : "bg-white/85 ring-sky-100 hover:bg-sky-50/70 hover:shadow-md",
  ].join(" ")}
>
    <div className="text-right">
      <p className="text-sm font-semibold text-gray-900">
        {user?.name ?? "Patient"}
      </p>
      <p className="text-xs font-medium text-gray-400">Patient </p>
    </div>

    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
      {user?.name?.[0] ?? "P"}
    </div>

  </button>

  <AnimatePresence>
  {profileMenuOpen && (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute right-0 top-[4.75rem] z-40 w-full min-w-[280px] rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/70"
    >
      <button
        onClick={() => {
          setProfileMenuOpen(false);
          navigate("/patient/past-appointments");
        }}
        className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
      >
        Past appointments
      </button>

      <button
        onClick={() => {
          setProfileMenuOpen(false);
          navigate("/patient/profile");
        }}
        className="mt-1 flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
      >
        Edit profile
      </button>

      <button
        onClick={handleSignOut}
        className="mt-1 flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600"
      >
        Sign out
      </button>
    </motion.div>
  )}
</AnimatePresence>
</div>

        </header>

        {cancelSuccess && (
  <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
    {cancelSuccess}
  </div>
)}
 
        <main className="space-y-6">
 
          {/* Stats — derived from real bookings
          <section className="rounded-3xl border border-gray-100 bg-white/95 p-6 shadow-xl shadow-gray-200/50">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="text-2xl font-semibold text-gray-900">{counts.upcoming}</p>
                <p className="mt-1 text-sm text-gray-500">Upcoming</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-2xl font-semibold text-gray-900">{counts.pending}</p>
                <p className="mt-1 text-sm text-gray-500">Pending</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-2xl font-semibold text-gray-900">{counts.confirmed}</p>
                <p className="mt-1 text-sm text-gray-500">Confirmed</p>
              </div>
            </div>
          </section>
  */}
          {/* Bookings list */}
          <section className="rounded-3xl border border-gray-100 bg-white/95 p-8 shadow-xl shadow-gray-200/50">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
                Your appointments
              </h2>
              <button
                onClick={() => navigate("/patient/book")}
                className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-100 transition hover:bg-sky-600"
              >
                Book appointment
              </button>
            </div>

            {loading && (
                <div className="rounded-2xl bg-sky-50/60 px-6 py-10 text-center">
                  <p className="text-sm text-gray-400">Loading appointments…</p>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-600">
                  {error}
                </div>
              )}
 
            {!loading && !error && bookings.length > 0 && (
              <div className="flex flex-col gap-3">
                {bookings.map((b) => {
                  const style = STATUS_STYLES[b.status];
                  const isActive = b.status !== "cancelled";
 
                  return (
                    <div key={b.id}
                      className={[
                        "relative rounded-2xl border p-5 transition",
                        // Cancelled cards are visually muted
                        b.status === "cancelled"
                          ? "border-gray-100 bg-gray-50 opacity-60"
                          : "border-gray-100 bg-white shadow-sm hover:shadow-md hover:shadow-gray-100",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
 
                        {/* Left: appointment info */}
                        <div className="flex items-start gap-4">
                          {/* Colored left border accent */}
                          <div className={`mt-1 h-10 w-1 flex-shrink-0 rounded-full ${style.dot}`} />
                          <div>
                            <p className="font-semibold text-gray-900">{b.physician_name}</p>
                            <p className="text-sm font-medium text-sky-500">{b.specialty}</p>
                            <p className="mt-1 text-sm text-gray-500">{b.display_date} at {b.time}</p>
                            <p className="mt-0.5 text-xs italic text-gray-400">"{b.reason}"</p>
                          </div>
                        </div>
 
                        {/* Right: status + menu */}
                        <div className="flex flex-shrink-0 flex-col items-end gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${style.pill}`}>
                            {b.status}
                          </span>
 
                          {/* Three-dot menu — only for active bookings */}
                          {isActive && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation(); // prevent the document click from closing immediately
                                  setOpenMenuId(openMenuId === b.id ? null : b.id);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                              >
                                ···
                              </button>
 
                              {openMenuId === b.id && (
                                <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg shadow-gray-200/60">
                                  <button
                                    type="button"
                                    onClick={() => handleReschedule(b)}
                                    className="block w-full px-4 py-3 text-left text-sm text-gray-600 transition hover:bg-sky-50 hover:text-sky-700"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setBookingToCancel(b);
                                    }}
                                    disabled={cancelling === b.id}
                                    className="block w-full px-4 py-3 text-left text-sm text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                  >
                                    {cancelling === b.id ? "Cancelling…" : "Cancel appointment"}
                                  </button>
                                </div>
                              )}
                              {bookingToCancel && (
                              <CancelAppointmentModal
                                appointmentLabel={`${bookingToCancel.physician_name} on ${bookingToCancel.display_date} at ${bookingToCancel.time}`}
                                loading={cancelling === bookingToCancel.id}
                                onClose={() => setBookingToCancel(null)}
                                onConfirm={(cancelReason) =>
                                  handleCancel(bookingToCancel.id, cancelReason)
                                }
                              />
                            )}
                            </div>
                          )}
                        </div>
 
                      </div>
                    </div>
                  );
                })}
              </div>
            )}  

              {!loading && !error && bookings.length === 0 && (
              <div className="rounded-2xl border border-dashed border-sky-100 bg-sky-50/60 px-6 py-10 text-center">
                <p className="text-base font-semibold text-gray-800">
                  No upcoming appointments
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  You don’t have any appointments booked right now.
                </p>
              
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}