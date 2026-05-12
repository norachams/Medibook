import { useEffect, useState,useRef } from "react";
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

// const API = "http://localhost:8000/api/bookings";

const API = "https://medibook-backend-1qi8.onrender.com/api/bookings";

const HOUR_HEIGHT = 88;



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

function appointmentTop(time: string, startHour: number) {
  const startOfDay = startHour * 60;
  const minutesFromStart = timeToMinutes(time) - startOfDay;

  return Math.max(0, (minutesFromStart / 60) * HOUR_HEIGHT);
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

function buildWeekDays() {
  const today = new Date();
  const currentDay = today.getDay(); // Sunday = 0

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

    const dateKey = date.toISOString().slice(0, 10);

    return {
      date: dateKey,
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: date.toLocaleDateString("en-US", { day: "numeric" }),
      isToday: dateKey === getTodayKey(),
    };
  });
}

function buildMonthDays() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = firstDayOfMonth.getDay(); // Sunday = 0
  const totalDays = lastDayOfMonth.getDate();

  const days: {
    date: string;
    day: number | null;
    isToday: boolean;
  }[] = [];

  for (let i = 0; i < startDay; i++) {
    days.push({
      date: "",
      day: null,
      isToday: false,
    });
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().slice(0, 10);

    days.push({
      date: dateKey,
      day,
      isToday: dateKey === getTodayKey(),
    });
  }

  return days;
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
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("day");
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

async function updateBookingStatus(
  id: number,
  status: BookingStatus,
  declineReason?: string
) {
  try {
    const res = await fetch(`${API}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status,
        decline_reason: declineReason,
      }),
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

  const pendingRequests = bookings.filter(
  (booking) => booking.status === "pending"
);

const upcomingAppointments = bookings.filter(
  (booking) =>
    booking.status === "confirmed" || booking.status === "pending"
);



const weekDays = buildWeekDays();

const weekAppointmentsByDate = upcomingAppointments.reduce<Record<string, Booking[]>>(
  (groups, booking) => {
    const dateKey = getBookingDateKey(booking);

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push(booking);
    return groups;
  },
  {}
);

const today = getTodayKey();

const todayAppointments = upcomingAppointments.filter(
  (booking) => getBookingDateKey(booking) === today
);

const sortedTodayAppointments = [...todayAppointments].sort(
  (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
);

const sortedUpcomingAppointments = [...upcomingAppointments].sort((a, b) => {
  const dateCompare = getBookingDateKey(a).localeCompare(getBookingDateKey(b));
  if (dateCompare !== 0) return dateCompare;

  return timeToMinutes(a.time) - timeToMinutes(b.time);
});

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const monthAppointments = sortedUpcomingAppointments.filter((booking) => {
  const dateKey = getBookingDateKey(booking);
  if (!dateKey) return false;

  const bookingDate = new Date(`${dateKey}T00:00:00`);

  return (
    bookingDate.getMonth() === currentMonth &&
    bookingDate.getFullYear() === currentYear
  );
});

const monthDays = buildMonthDays();

const monthAppointmentsByDate = monthAppointments.reduce<Record<string, Booking[]>>(
  (groups, booking) => {
    const dateKey = getBookingDateKey(booking);

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push(booking);
    return groups;
  },
  {}
);

const currentMonthLabel = now.toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
});

let dayCalendarBounds = { startHour: 8, endHour: 18 };

if (sortedTodayAppointments.length > 0) {
  const appointmentMinutes = sortedTodayAppointments.map((booking) =>
    timeToMinutes(booking.time)
  );

  const earliest = Math.min(...appointmentMinutes);
  const latest = Math.max(...appointmentMinutes);

  dayCalendarBounds = {
    startHour: Math.min(8, Math.floor(earliest / 60)),
    endHour: Math.max(18, Math.ceil((latest + 60) / 60)),
  };
}

const visibleDayHours = Array.from(
  { length: dayCalendarBounds.endHour - dayCalendarBounds.startHour + 1 },
  (_, index) => dayCalendarBounds.startHour + index
);



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
      {calendarView === "day"
        ? "Today's Schedule"
        : calendarView === "week"
        ? "This Week"
        : "This Month"}
    </h2>

    <p className="mt-2 text-sm text-slate-500">
      {calendarView === "day"
        ? new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
        : calendarView === "week"
        ? "View upcoming appointments grouped by day."
        : "View all appointments for the month."}
    </p>
  </div>

  <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
    {(["day", "week", "month"] as const).map((option) => (
      <button
        key={option}
        type="button"
        onClick={() => setCalendarView(option)}
        className={[
          "rounded-xl px-6 py-3 text-sm font-semibold capitalize transition",
          calendarView === option
            ? "bg-white text-sky-700 shadow-sm"
            : "text-slate-500 hover:text-slate-800",
        ].join(" ")}
      >
        {option}
      </button>
    ))}
  </div>
</div>
       

            {loading ? (
  <div className="rounded-3xl border border-slate-100 bg-slate-50 px-6 py-12 text-center text-slate-500">
    Loading appointments...
  </div>
) : calendarView === "day" ? (
  <section>
    {sortedTodayAppointments.length > 0 ? (
      <div className="rounded-3xl border border-slate-100 bg-white p-5">
        <div className="max-h-[70vh] overflow-y-auto">
          <div
            className="relative"
            style={{
              minHeight: `${visibleDayHours.length * HOUR_HEIGHT}px`,
            }}
          >
            <div className="absolute bottom-0 left-[86px] top-0 w-px bg-slate-100" />

            {visibleDayHours.map((hour) => (
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
                      top: appointmentTop(
                        appointment.time,
                        dayCalendarBounds.startHour
                      ),
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
      </div>
    ) : (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
        <h3 className="font-bold text-slate-900">No appointments today</h3>
        <p className="mt-2 text-sm text-slate-500">
          Switch to week or month view to see upcoming appointments.
        </p>
      </div>
    )}
  </section>
) : calendarView === "week" ? (
  <section>
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {weekDays.map((day) => (
          <div
            key={day.date}
            className="px-3 py-4 text-center"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {day.dayName}
            </p>

            <div className="mt-2 flex justify-center">
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                  day.isToday
                    ? "bg-sky-500 text-white"
                    : "text-slate-700",
                ].join(" ")}
              >
                {day.dayNumber}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weekDays.map((day, index) => {
          const appointmentsForDay = (weekAppointmentsByDate[day.date] ?? [])
            .slice()
            .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

          return (
            <div
              key={day.date}
              className={[
                "min-h-[520px] border-r border-slate-100 p-3",
                index === 6 ? "border-r-0" : "",
                day.isToday ? "bg-sky-50/30" : "bg-white",
              ].join(" ")}
            >
              {appointmentsForDay.length > 0 ? (
                <div className="space-y-2">
                  {appointmentsForDay.map((appointment) => {
                    const patientName = getPatientName(appointment);

                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => setSelectedBooking(appointment)}
                        className={[
                          "w-full rounded-2xl px-3 py-3 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                          appointment.status === "pending"
                            ? "border border-amber-100 bg-amber-50 text-amber-700"
                            : "border border-sky-100 bg-sky-50 text-sky-700",
                        ].join(" ")}
                      >
                        <p className="font-bold">{appointment.time}</p>
                        <p className="mt-1 truncate font-semibold">
                          {patientName}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] opacity-80">
                          {appointment.reason || "No reason provided"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-100 bg-slate-50/60 px-3 text-center">
                  <p className="text-xs font-medium text-slate-300">
                    No appointments
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </section>
) : (
  <section>
    <div className="mb-5 flex items-center justify-between">
      <h3 className="text-xl font-bold text-slate-900">
        {currentMonthLabel}
      </h3>

      <p className="text-sm font-medium text-slate-400">
        {monthAppointments.length} appointment
        {monthAppointments.length === 1 ? "" : "s"}
      </p>
    </div>

    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="px-3 py-3 text-center text-xs font-bold uppercase tracking-widest text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthDays.map((day, index) => {
          const appointmentsForDay = day.date
            ? monthAppointmentsByDate[day.date] ?? []
            : [];

          return (
            <div
              key={`${day.date}-${index}`}
              className={[
                "min-h-[135px] border-b border-r border-slate-100 p-3",
                index % 7 === 6 ? "border-r-0" : "",
                day.day ? "bg-white" : "bg-slate-50/60",
              ].join(" ")}
            >
              {day.day && (
                <>
                  <div className="mb-3 flex justify-end">
                    <span
                      className={[
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                        day.isToday
                          ? "bg-sky-500 text-white"
                          : "text-slate-500",
                      ].join(" ")}
                    >
                      {day.day}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {appointmentsForDay.slice(0, 3).map((appointment) => {
                      const patientName = getPatientName(appointment);

                      return (
                        <button
                          key={appointment.id}
                          type="button"
                          onClick={() => setSelectedBooking(appointment)}
                          className={[
                            "w-full rounded-xl px-3 py-2 text-left text-xs transition hover:shadow-sm",
                            appointment.status === "pending"
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "bg-sky-50 text-sky-700 hover:bg-sky-100",
                          ].join(" ")}
                        >
                          <p className="font-bold">{appointment.time}</p>
                          <p className="truncate">{patientName}</p>
                        </button>
                      );
                    })}

                    {appointmentsForDay.length > 3 && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-slate-400"
                      >
                        +{appointmentsForDay.length - 3} more
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
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