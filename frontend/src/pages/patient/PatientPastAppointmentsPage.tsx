import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface PastAppointment {
  id: number;
  status: "completed";
  reason: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  created_at: string;
  physician_notes: string;
  completed_at: string;
  physician_name: string;
  physician_id: number;
  specialty: string;
  display_date: string;
  date: string;
  time: string;
}

export default function PatientPastAppointmentsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [appointments, setAppointments] = useState<PastAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/bookings/past", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load past appointments.");
        return res.json();
      })
      .then((data: PastAppointment[]) => setAppointments(data))
      .catch(() => setError("Could not load past appointments."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-sky-50 to-blue-100 px-6 py-8 text-gray-800">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/patient/dashboard")}
          className="mb-6 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
        >
          ← Back to dashboard
        </button>

        <section className="rounded-3xl border border-gray-100 bg-white/95 p-8 shadow-xl shadow-gray-200/50">
          <div className="mb-8">
         
            <h1 className="text-3xl font-bold text-gray-900">
              Past appointments
            </h1>
           
          </div>

          {loading && (
            <div className="rounded-2xl bg-sky-50/60 px-6 py-10 text-center">
              <p className="text-sm text-gray-400">Loading past appointments…</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && appointments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-sky-100 bg-sky-50/60 px-6 py-10 text-center">
              <p className="text-base font-semibold text-gray-800">
                No past appointments yet
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Completed appointments and doctor notes will appear here.
              </p>
            </div>
          )}

          {!loading && !error && appointments.length > 0 && (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {appointment.physician_name}
                      </p>
                      <p className="text-sm font-medium text-sky-500">
                        {appointment.specialty}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {appointment.display_date} at {appointment.time}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Completed
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-gray-50 px-4 py-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                        Reason for visit
                      </p>
                      <p className="text-sm text-gray-700">
                        {appointment.reason || "No reason provided."}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-sky-50 px-4 py-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                        Doctor notes
                      </p>
                      <p className="text-sm text-gray-700">
                        {appointment.physician_notes || "No notes were added for this appointment."}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}