import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
 
interface Booking {
  id: number;
  status: "pending" | "confirmed" | "cancelled";
  reason: string;
  created_at: string;
  physician_name: string;
  specialty: string;
  display_date: string;
  time: string;
}
 
const STATUS_STYLES: Record<Booking["status"], string> = {
  pending:   "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-500",
};
 

export default function PatientDashboardPage() {
  const navigate        = useNavigate();
  const { token, user } = useAuth();
 
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/bookings/my", {
      headers: { Authorization: `Bearer ${token}` }, // identify the logged-in patient
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load bookings.");
        return res.json();
      })
      .then((data: Booking[]) => setBookings(data))
      .catch(() => setError("Could not load bookings."))
      .finally(() => setLoading(false));
  }, [token]);
 
  // Derive counts from real data
  const counts = {
    upcoming:  bookings.filter((b) => b.status === "confirmed").length,
    pending:   bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
  };

  const handleCancelBooking = async (bookingId: number) => {
  try {
    const res = await fetch(`http://localhost:8000/api/bookings/${bookingId}/cancel`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to cancel booking.");

    // Update the UI without needing to refresh the page
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status: "cancelled" }
          : booking
      )
    );

    setOpenMenuId(null);
  } catch {
    setError("Could not cancel appointment.");
  }
};

const handleRescheduleBooking = (bookingId: number) => {
  navigate(`/patient/book?reschedule=${bookingId}`);
};
 

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-8 text-gray-800">
      <div className="mx-auto max-w-7xl">
 
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-sky-600">MediBook</h1>
            <p className="mt-1 text-sm text-gray-500">Patient dashboard</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-white/85 px-4 py-3 shadow-sm">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user?.name ?? "Patient"}</p>
              <p className="text-xs font-medium text-gray-400">Patient account</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
              {user?.name?.[0] ?? "P"}
            </div>
          </div>
        </header>
 
        <main className="space-y-6">
 
          {/* Stats — derived from real bookings */}
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
 
            {/* Loading */}
            {loading && (
              <p className="py-10 text-center text-sm text-gray-400">Loading appointments…</p>
            )}
 
            {/* Error */}
            {error && (
              <p className="py-10 text-center text-sm text-red-500">{error}</p>
            )}
 
            {/* Empty state */}
            {!loading && !error && bookings.length === 0 && (
              <div className="rounded-3xl border border-dashed border-sky-200 bg-sky-50/70 p-10 text-center">
                <h3 className="text-xl font-semibold text-gray-900">No appointments yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  Once you book an appointment, it will appear here with its current status.
                </p>
              </div>
            )}
 
            {/* Booking cards */}
            {!loading && !error && bookings.length > 0 && (
              <div className="flex flex-col gap-4">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="relative rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5"
                  >
                    {b.status !== "cancelled" && (
                      <div className="absolute right-4 top-4">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === b.id ? null : b.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-white hover:text-gray-700"
                          aria-label="Appointment options"
                        >
                          <span className="text-xl leading-none">⋯</span>
                        </button>

                        {openMenuId === b.id && (
                          <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg shadow-gray-200/60">
                            <button
                              onClick={() => handleRescheduleBooking(b.id)}
                              className="block w-full px-4 py-3 text-left text-sm text-gray-600 transition hover:bg-sky-50 hover:text-sky-700"
                            >
                              Reschedule
                            </button>

                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="block w-full px-4 py-3 text-left text-sm text-red-500 transition hover:bg-red-50"
                            >
                              Cancel appointment
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-6 pr-12">
                      <div>
                        <p className="font-semibold text-gray-900">{b.physician_name}</p>
                        <p className="text-sm text-sky-500">{b.specialty}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {b.display_date} at {b.time}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 italic">"{b.reason}"</p>
                      </div>

                      <span
                        className={`mt-10 rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[b.status]}`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
 
          </section>
        </main>
      </div>
    </div>
  );
}