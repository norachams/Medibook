import { useEffect, useMemo, useState,useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

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

function buildWeekDays() {
  const today = new Date();

  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + daysFromMonday);

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      key: date.toISOString().slice(0, 10),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      dateLabel: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullLabel: date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      isToday: date.toDateString() === today.toDateString(),
    };
  });
}

function groupBookingsByDate(bookings: Booking[]) {
  return bookings.reduce<Record<string, Booking[]>>((groups, booking) => {
    const date = getDisplayDate(booking);

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(booking);
    return groups;
  }, {});
}



export default function PhysicianDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const currentUser = user as
  | {
      full_name?: string;
      fullName?: string;
      name?: string;
      email?: string;
    }
  | null
  | undefined;

const doctorName =
  currentUser?.full_name ??
  currentUser?.fullName ??
  currentUser?.name ??
  "Physician";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [view, setView] = useState<"upcoming" | "schedule">("upcoming");
  const [scheduleView, setScheduleView] = useState<"day" | "week" | "month">("week");
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node)
    ) {
      setProfileOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  


  function handleSignOut() {
  setProfileOpen(false);
  logout();
  navigate("/login");
}


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

  const weekDays = useMemo(() => buildWeekDays(), []);

  const upcomingAppointments = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "confirmed" || booking.status === "pending"
      ),
    [bookings]
  );

  const appointmentsByDate = useMemo(
  () => groupBookingsByDate(upcomingAppointments),
  [upcomingAppointments]
);



  const firstDayLabel =
    upcomingAppointments.length > 0
      ? getDisplayDate(upcomingAppointments[0])
      : "Today";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="relative z-30 mb-10 flex items-start justify-between gap-6">          <div>
            <h1 className="text-4xl font-light tracking-tight text-sky-600">
              MediBook
            </h1>
           
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


             <div ref={menuRef} className="relative">

            <button
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {doctorName}
                </p>
                <p className="text-xs text-slate-500">Physician </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                {getInitials(doctorName)}
              </div>

            </button>

            {profileOpen && (
              <div className="absolute right-0 top-16 z-30 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60">
                  <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/physician/past-patients");
                  }}
                  className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                >
                  Past patients
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
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
              {view === "upcoming" ? "Upcoming appointments" : "Schedule"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
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
                onClick={() => setView("schedule")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  view === "schedule"
                    ? "bg-sky-100 text-sky-700"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Schedule
              </button>
            </div>

            {view === "schedule" && (
              <select
                value={scheduleView}
                onChange={(e) =>
                  setScheduleView(e.target.value as "day" | "week" | "month")
                }
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold capitalize text-slate-700 shadow-sm outline-none transition hover:border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            )}
          </div>
        </div>

            {loading ? (
              <div className="rounded-3xl border border-slate-100 bg-slate-50 px-6 py-12 text-center text-slate-500">
                Loading appointments...
              </div>
            ) : view === "upcoming" ? (
              <div>
                <section className="space-y-6">
  {upcomingAppointments.length > 0 ? (
    Object.entries(appointmentsByDate).map(([date, appointments]) => (
      <div key={date}>
        <div className="mb-3 flex items-center justify-between">
         <div className="mb-3">
          <h3 className="text-lg font-bold text-slate-900">{date}</h3>
          <p className="text-sm text-slate-500">
            {appointments.length} appointment{appointments.length === 1 ? "" : "s"}
          </p>
        </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white">
          {appointments.map((appointment, index) => {
            const patientName = getPatientName(appointment);

            return (
              <div
                key={appointment.id}
                className={`grid gap-4 px-5 py-5 md:grid-cols-[56px_1.1fr_0.7fr_1fr_auto] md:items-center ${
                  index !== appointments.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-700">
                  {getInitials(patientName)}
                </div>

                <div>
                  <p className="font-bold text-slate-900">{patientName}</p>
                  <p className="text-sm text-slate-500">Patient</p>
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
                  <p className="text-sm text-slate-500">Reason for visit</p>
                </div>

                <StatusBadge status={appointment.status} />
              </div>
            );
          })}
        </div>
      </div>
    ))
  ) : (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 px-6 py-14 text-center">
      <h3 className="font-bold text-slate-900">
        No upcoming appointments
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        Confirmed and pending bookings will appear here.
      </p>
    </div>
  )}
</section>

              </div>
       
  ) : (
  <section>
    {scheduleView === "day" && (
      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h4 className="mb-4 font-bold text-slate-900">{firstDayLabel}</h4>

          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-sky-50 px-5 py-4"
                >
                  <div>
                    <p className="font-bold text-slate-900">
                      {appointment.time} · {getPatientName(appointment)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {appointment.reason}
                    </p>
                  </div>

                  <StatusBadge status={appointment.status} />
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                No appointments scheduled.
              </p>
            )}
          </div>
        </div>
      </div>
    )}

    {scheduleView === "week" && (
      <div className="grid gap-3 md:grid-cols-5">
        {weekDays.map((day) => {
          const dayAppointments = upcomingAppointments.filter(
            (appointment) => getDisplayDate(appointment) === day.fullLabel
          );

          return (
            <div
              key={day.key}
              className={`min-h-[260px] rounded-3xl p-4 shadow-sm ring-1 transition ${
                day.isToday
                  ? "bg-sky-50 ring-sky-200"
                  : "bg-white ring-slate-100"
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{day.weekday}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {day.dateLabel}
                  </p>
                </div>

                {day.isToday && (
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                    Today
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {dayAppointments.length > 0 ? (
                  dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-sky-100"
                    >
                      <p className="text-sm font-bold text-slate-900">
                        {appointment.time}
                      </p>
                      <p className="text-sm text-slate-600">
                        {getPatientName(appointment)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {appointment.reason}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No visits</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}

    {scheduleView === "month" && (
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-bold text-slate-900">May 2026</h4>
          <p className="text-sm text-slate-500">
            {upcomingAppointments.length} appointments
          </p>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2 text-sm">
          {Array.from({ length: 35 }, (_, index) => {
            const day = index - 3;
            const hasAppointment = upcomingAppointments.some((appointment) =>
              getDisplayDate(appointment).includes(`May ${day}, 2026`)
            );

            return (
              <div
                key={index}
                className={`min-h-[72px] rounded-2xl border p-2 ${
                  day < 1 || day > 31
                    ? "border-transparent text-slate-300"
                    : hasAppointment
                    ? "border-sky-100 bg-sky-50 text-slate-900"
                    : "border-slate-100 bg-white text-slate-600"
                }`}
              >
                {day >= 1 && day <= 31 && (
                  <>
                    <p className="font-semibold">{day}</p>
                    {hasAppointment && (
                      <p className="mt-2 rounded-full bg-sky-500 px-2 py-1 text-xs font-bold text-white">
                        Visit
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}
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