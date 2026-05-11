import { useEffect, useMemo, useState,useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PatientDetailDrawer from "../../components/PatientDetailDrawer";
import { AnimatePresence, motion } from "framer-motion";

type BookingStatus = "pending" | "confirmed" | "cancelled"| "completed";

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

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;
const HOUR_HEIGHT = 88;

const DAY_HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, index) => DAY_START_HOUR + index
);

function formatHour(hour: number) {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

function timeToMinutes(time: string) {
  const [rawTime, modifier] = time.split(" ");
  const [rawHours, minutes] = rawTime.split(":").map(Number);
  let hours = rawHours;

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function appointmentTop(time: string) {
  const startOfDay = DAY_START_HOUR * 60;
  const minutesFromStart = timeToMinutes(time) - startOfDay;

  return (minutesFromStart / 60) * HOUR_HEIGHT;
}


function getPatientName(booking: Booking) {
  return booking.patient_name ?? booking.patientName ?? "Patient";
}

function getDisplayDate(booking: Booking) {
  return booking.display_date ?? booking.displayDate ?? booking.date ?? "Upcoming";
}

function getBookingDateKey(booking: Booking) {
  return booking.date ?? "";
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateHeading(dateString: string) {
  if (!dateString) return "Upcoming";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getCreatedAt(booking: Booking) {
  return booking.created_at ?? booking.createdAt ?? "";
}

function normalizeBookingForDrawer(booking: Booking) {
  return {
    id: booking.id,
    status: booking.status,
    reason: booking.reason,
    patient_name: booking.patient_name ?? booking.patientName ?? "Patient",
    patient_email: booking.patient_email ?? booking.patientEmail ?? "",
    patient_phone: booking.patient_phone ?? booking.patientPhone ?? "",
    display_date: booking.display_date ?? booking.displayDate ?? booking.date ?? "Upcoming",
    date: booking.date ?? "",
    time: booking.time,
  };
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

function getAppointmentCardStyle(status: BookingStatus) {
  if (status === "pending") {
    return "border-amber-300 bg-amber-50 shadow-amber-100/70 hover:bg-amber-100/70";
  }

  if (status === "confirmed") {
    return "border-sky-100 bg-white hover:bg-sky-50/70";
  }

  if (status === "completed") {
    return "border-slate-200 bg-slate-50 hover:bg-slate-100";
  }

  return "border-red-200 bg-red-50 hover:bg-red-100/70";
}

function getStatusPillStyle(status: BookingStatus) {
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "completed") return "bg-slate-100 text-slate-600";
  return "bg-red-100 text-red-700";
}

function getStatusLabel(status: BookingStatus) {
  if (status === "pending") return "Pending request";
  if (status === "confirmed") return "Confirmed";
  if (status === "completed") return "Completed";
  return "Cancelled";
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getStatusPillStyle(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
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
  // const [scheduleView, setScheduleView] = useState<"day" | "week" | "month">("week");
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
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

  function handleBookingCompleted(bookingId: number) {
  setBookings((current) =>
    current.filter((booking) => booking.id !== bookingId)
  );

  setSelectedBooking(null);
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

  // const weekDays = useMemo(() => buildWeekDays(), []);

  const upcomingAppointments = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "confirmed" || booking.status === "pending"
      ),
    [bookings]
  );



const appointmentsByDateKey = useMemo(() => {
  return upcomingAppointments.reduce<Record<string, Booking[]>>((groups, booking) => {
    const dateKey = getBookingDateKey(booking) || getDisplayDate(booking);

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push(booking);
    return groups;
  }, {});
}, [upcomingAppointments]);

const todayAppointments = useMemo(() => {
  const today = getTodayKey();

  return upcomingAppointments.filter(
    (booking) => getBookingDateKey(booking) === today
  );
}, [upcomingAppointments]);

const sortedTodayAppointments = useMemo(() => {
  return [...todayAppointments].sort(
    (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
  );
}, [todayAppointments]);


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
              className={[
                "flex items-center gap-3 rounded-2xl px-5 py-3 text-left shadow-sm ring-1 transition",
                profileOpen
                  ? "bg-sky-50 ring-sky-100 shadow-md"
                  : "bg-white ring-slate-100 hover:bg-sky-50/70 hover:shadow-md",
              ].join(" ")}
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

            <AnimatePresence>
  {profileOpen && (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute right-0 top-[4.75rem] z-40 w-full min-w-[280px] rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/70"
    >
      <button
        onClick={() => {
          setProfileOpen(false);
          navigate("/physician/past-patients");
        }}
        className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
      >
        Past patients
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
              Today's Schedule
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
                Appointments
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

          
          </div>
        </div>
    

            {loading ? (
              <div className="rounded-3xl border border-slate-100 bg-slate-50 px-6 py-12 text-center text-slate-500">
                Loading appointments...
              </div>
           ) : view === "upcoming" ? (
  <section>
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h3 className="text-sm text-slate-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h3>
      </div>

   
    </div>

    {sortedTodayAppointments.length > 0 ? (
      <div className="relative rounded-3xl border border-slate-100 bg-white p-5">
        <div className="absolute left-[86px] top-5 bottom-5 w-px bg-slate-100" />

        <div className="relative">
          {DAY_HOURS.map((hour) => (
            <div
              key={hour}
              className="grid min-h-[88px] grid-cols-[86px_1fr] border-b border-slate-100 last:border-b-0"
            >
              <div className="pt-2 text-sm font-medium text-slate-400">
                {formatHour(hour)}
              </div>
              <div />
            </div>
          ))}

          <div className="absolute left-[106px] right-0 top-0">
            {sortedTodayAppointments.map((appointment) => {
              const patientName = getPatientName(appointment);

              return (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => setSelectedBooking(appointment)}
                  style={{
                    top: appointmentTop(appointment.time),
                    height: 92,
                  }}
                  className={[
                    "absolute left-0 right-0 rounded-2xl border px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                    getAppointmentCardStyle(appointment.status),
                  ].join(" ")}
                >
                  <div className="flex h-full items-center justify-between gap-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                        {getInitials(patientName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {patientName}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {appointment.reason || "No reason provided"}
                        </p>
                      </div>
                    </div>

                   <div className="flex shrink-0 flex-col items-end justify-center">
                    <p className="text-lg font-bold text-slate-900">
                      {appointment.time}
                    </p>

                    <div className="mt-2">
                      <StatusBadge status={appointment.status} />
                    </div>
                  </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    ) : (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
        <h3 className="font-bold text-slate-900">No appointments today</h3>
        <p className="mt-2 text-sm text-slate-500">
          Use the schedule tab to view upcoming appointments.
        </p>
      </div>
    )}
  </section>

          
 ) : (
  <section className="space-y-5">
    

    {upcomingAppointments.length > 0 ? (
      Object.entries(appointmentsByDateKey).map(([dateKey, appointments]) => (
        <div
          key={dateKey}
          className="overflow-hidden rounded-3xl border border-slate-100 bg-white"
        >
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <h4 className="font-bold text-slate-900">
              {dateKey.includes("-") ? formatDateHeading(dateKey) : dateKey}
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              {appointments.length} appointment
              {appointments.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {appointments.map((appointment) => {
              const patientName = getPatientName(appointment);

              return (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => setSelectedBooking(appointment)}
                  className={[
                    "grid w-full gap-4 rounded-2xl border px-5 py-5 text-left shadow-sm transition md:grid-cols-[90px_1fr_1.2fr_auto] md:items-center",
                    getAppointmentCardStyle(appointment.status),
                  ].join(" ")}                >
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {appointment.time}
                    </p>
                    <p className="text-xs font-medium text-slate-400">
                      30 min
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                      {getInitials(patientName)}
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">{patientName}</p>
                      <p className="text-sm text-slate-500">Patient</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {appointment.reason || "No reason provided"}
                    </p>
                    <p className="text-sm text-slate-500">Reason for visit</p>
                  </div>

                  <StatusBadge status={appointment.status} />
                </button>
              );
            })}
          </div>
        </div>
      ))
    ) : (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
        <h3 className="font-bold text-slate-900">No scheduled appointments</h3>
        <p className="mt-2 text-sm text-slate-500">
          Confirmed and pending appointments will appear here.
        </p>
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
                        onClick={() => setSelectedBooking(request)}
                        className="cursor-pointer rounded-3xl border border-slate-100 p-5 transition hover:bg-sky-50/50"
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
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBookingStatus(request.id, "confirmed");
                            }}
                            className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-bold text-white hover:bg-sky-600"
                          >
                            Accept
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBookingStatus(request.id, "cancelled");
                            }}
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
       <AnimatePresence>
      {selectedBooking && (
        <PatientDetailDrawer
          booking={normalizeBookingForDrawer(selectedBooking)}
          token={token}
          onClose={() => setSelectedBooking(null)}
          onCompleted={handleBookingCompleted}
          onStatusChange={updateBookingStatus}
        />
      )}
    </AnimatePresence>
    </div>
  );
}