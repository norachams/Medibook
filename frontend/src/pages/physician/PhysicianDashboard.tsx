import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

type BookingStatus = "pending" | "confirmed" | "cancelled";

interface Booking {
  id: number;
  status: BookingStatus;
  reason: string;
  created_at?: string;
  createdAt?: string;

  patient_name?: string;
  patientName?: string;
  patient_email?: string;
  patientEmail?: string;
  patient_phone?: string;
  patientPhone?: string;

  physician_name?: string;
  physicianName?: string;
  specialty?: string;

  display_date?: string;
  displayDate?: string;
  date?: string;
  time: string;
}

const API = "http://localhost:8000/api/bookings";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled: "bg-red-50 text-red-600 border-red-100",
};

function getPatientName(booking: Booking) {
  return booking.patient_name ?? booking.patientName ?? "Patient";
}

function getDisplayDate(booking: Booking) {
  return booking.display_date ?? booking.displayDate ?? booking.date ?? "Upcoming";
}

function getCreatedAt(booking: Booking) {
  return booking.created_at ?? booking.createdAt ?? "";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function PhysicianDashboard() {
  const { token, user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [view, setView] = useState<"upcoming" | "day">("upcoming");
  const [error, setError] = useState("");

  async function loadBookings() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Could not load bookings.");
      }

      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(id: number, status: BookingStatus) {
    try {
      const res = await fetch(`${API}/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const updatedBooking = await res.json();

      if (!res.ok) {
        throw new Error(updatedBooking.error ?? "Could not update booking.");
      }

      setBookings((current) =>
        current.map((booking) =>
          booking.id === id ? { ...booking, ...updatedBooking } : booking
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  useEffect(() => {
    if (token) {
      (async () => {
        await loadBookings();
      })();
    }
  }, [token]);

  const pendingRequests = useMemo(
    () => bookings.filter((booking) => booking.status === "pending"),
    [bookings]
  );

  const upcomingAppointments = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "confirmed" || booking.status === "pending"
      ),
    [bookings]
  );

  const confirmedCount = bookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;

  const firstDayLabel =
    upcomingAppointments.length > 0
      ? getDisplayDate(upcomingAppointments[0])
      : "Today";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-sky-600">
              MediBook
            </h1>
            <p className="mt-1 text-base text-slate-500">
              Physician dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setRequestsOpen((open) => !open)}
              className="relative rounded-2xl bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100 transition hover:bg-sky-100"
            >
              {pendingRequests.length} new requests

              {pendingRequests.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-left shadow-sm ring-1 ring-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {user?.email ?? "Physician"}
                </p>
                <p className="text-xs text-slate-500">Physician account</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                {getInitials(user?.email ?? "DR")}
              </div>

              <span className="text-slate-400">⌄</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div
          className={`grid gap-6 transition-all ${
            requestsOpen ? "lg:grid-cols-[1fr_380px]" : "lg:grid-cols-1"
          }`}
        >
          <main className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-100">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Upcoming appointments
                </h2>
                <p className="mt-2 text-slate-500">
                  Start with the schedule, then open a day view when you need
                  more detail.
                </p>
              </div>

              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setView("upcoming")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    view === "upcoming"
                      ? "bg-sky-100 text-sky-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setView("day")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    view === "day"
                      ? "bg-sky-100 text-sky-700"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Day view
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-slate-100 bg-slate-50 px-6 py-12 text-center text-slate-500">
                Loading appointments...
              </div>
            ) : view === "upcoming" ? (
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="overflow-hidden rounded-3xl border border-slate-100">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment, index) => {
                      const patientName = getPatientName(appointment);

                      return (
                        <div
                          key={appointment.id}
                          className={`grid gap-4 px-5 py-5 md:grid-cols-[56px_1.1fr_0.7fr_1fr_auto] md:items-center ${
                            index !== upcomingAppointments.length - 1
                              ? "border-b border-slate-100"
                              : ""
                          }`}
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-700">
                            {getInitials(patientName)}
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {patientName}
                            </p>
                            <p className="text-sm text-slate-500">
                              {getDisplayDate(appointment)}
                            </p>
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {appointment.time}
                            </p>
                            <p className="text-sm text-slate-500">30 min</p>
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {appointment.reason}
                            </p>
                            <p className="text-sm text-slate-500">
                              Visit request
                            </p>
                          </div>

                          <StatusBadge status={appointment.status} />
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-6 py-14 text-center">
                      <h3 className="font-bold text-slate-900">
                        No upcoming appointments
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Confirmed and pending bookings will appear here.
                      </p>
                    </div>
                  )}
                </section>

                <aside className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Schedule snapshot</h3>
                    <p className="text-sm text-slate-400">
                      {confirmedCount} confirmed
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <p className="font-bold text-slate-900">{firstDayLabel}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {upcomingAppointments.length} appointments to review
                    </p>

                    <button
                      onClick={() => setView("day")}
                      className="mt-4 text-sm font-bold text-sky-600 hover:text-sky-700"
                    >
                      View day
                    </button>
                  </div>

                  <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <p className="text-sm font-bold text-slate-900">
                      Booking requests
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {pendingRequests.length} requests waiting for a response.
                    </p>

                    <button
                      onClick={() => setRequestsOpen(true)}
                      className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-sm font-bold text-white hover:bg-sky-600"
                    >
                      Review requests
                    </button>
                  </div>
                </aside>
              </div>
            ) : (
              <section className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{firstDayLabel}</h3>
                    <p className="text-sm text-slate-500">
                      Detailed day schedule
                    </p>
                  </div>

                  <button
                    onClick={() => setView("upcoming")}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-sky-600 shadow-sm ring-1 ring-slate-100"
                  >
                    Back to upcoming
                  </button>
                </div>

                <div className="space-y-0 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  {["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"].map(
                    (hour) => (
                      <div
                        key={hour}
                        className="grid min-h-[76px] grid-cols-[80px_1fr] border-b border-slate-100 last:border-b-0"
                      >
                        <div className="pt-4 text-sm font-medium text-slate-400">
                          {hour}
                        </div>

                        <div className="relative border-l border-slate-100 pl-5">
                          {upcomingAppointments
                            .filter((appointment) =>
                              appointment.time.startsWith(
                                hour.replace(" AM", ":").replace(" PM", ":")
                              )
                            )
                            .map((appointment) => (
                              <div
                                key={appointment.id}
                                className="my-3 rounded-2xl border border-sky-100 bg-sky-50 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-bold text-slate-900">
                                      {getPatientName(appointment)}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      {appointment.time} · {appointment.reason}
                                    </p>
                                  </div>
                                  <StatusBadge status={appointment.status} />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}
          </main>

          {requestsOpen && (
            <aside className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Booking requests
                    </h2>

                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                      {pendingRequests.length}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Patients waiting for approval
                  </p>
                </div>

                <button
                  onClick={() => setRequestsOpen(false)}
                  className="rounded-full px-3 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-50"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => {
                    const patientName = getPatientName(request);

                    return (
                      <div
                        key={request.id}
                        className="rounded-3xl border border-slate-100 p-5"
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-700">
                            {getInitials(patientName)}
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {patientName}
                            </p>
                            <p className="text-sm text-slate-500">
                              Submitted {getCreatedAt(request) || "recently"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-slate-400">Requested time</p>
                            <p className="font-medium text-slate-800">
                              {getDisplayDate(request)} at {request.time}
                            </p>
                          </div>

                          <div>
                            <p className="text-slate-400">Reason for visit</p>
                            <p className="font-medium text-slate-800">
                              {request.reason}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <button
                            onClick={() =>
                              updateBookingStatus(request.id, "confirmed")
                            }
                            className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-bold text-white hover:bg-sky-600"
                          >
                            Accept
                          </button>

                          <button
                            onClick={() =>
                              updateBookingStatus(request.id, "cancelled")
                            }
                            className="rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                    <p className="font-bold text-slate-900">No requests</p>
                    <p className="mt-2 text-sm text-slate-500">
                      New patient booking requests will appear here.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}