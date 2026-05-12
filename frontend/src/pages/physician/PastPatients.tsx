import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface PastAppointment {
  id: number;
  reason: string;
  physician_notes: string;
  completed_at: string;
  display_date: string;
  date: string;
  time: string;
}

interface PastPatient {
  patient_id: number;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  allergies: string;
  medications: string;
  medical_conditions: string;
  medical_notes: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  appointments: PastAppointment[];
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

export default function PhysicianPastPatientsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [patients, setPatients] = useState<PastPatient[]>([]);
  const [openPatientId, setOpenPatientId] = useState<number | null>(null);
  const [openAppointmentId, setOpenAppointmentId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // localhost:8000/api/bookings/past-patients
    fetch(`${import.meta.env.VITE_API_URL}/api/bookings/past-patients`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load past patients.");
        return res.json();
      })
      .then((data: PastPatient[]) => setPatients(data))
      .catch(() => setError("Could not load past patients."))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return patients;

    return patients.filter((patient) => {
      return (
        patient.full_name.toLowerCase().includes(q) ||
        patient.email.toLowerCase().includes(q) ||
        patient.phone.toLowerCase().includes(q)
      );
    });
  }, [patients, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/physician/dashboard")}
          className="mb-6 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-sky-600 shadow-sm transition hover:bg-sky-50"
        >
          ← Back to dashboard
        </button>

        <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-sky-500">
                Patient history
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Past patients
              </h1>
             
            </div>

            <div className="w-full md:w-80">
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Search patients
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          {loading && (
            <div className="rounded-3xl bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              Loading past patients...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && filteredPatients.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <h3 className="font-bold text-slate-900">
                No past patients found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Completed appointments will appear here.
              </p>
            </div>
          )}

          {!loading && !error && filteredPatients.length > 0 && (
            <div className="space-y-4">
              {filteredPatients.map((patient) => {
                const isOpen = openPatientId === patient.patient_id;

                return (
                  <div
                    key={patient.patient_id}
                    className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPatientId(isOpen ? null : patient.patient_id);
                        setOpenAppointmentId(null);
                      }}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-sky-50/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                          {getInitials(patient.full_name)}
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {patient.full_name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {patient.email || "No email"} · {patient.phone || "No phone"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {patient.appointments.length} visit
                          {patient.appointments.length === 1 ? "" : "s"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {isOpen ? "Hide details" : "View details"}
                        </p>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-5">
                        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                          <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
                            <h2 className="mb-4 text-lg font-bold text-slate-900">
                              Basic information
                            </h2>

                            <div className="space-y-3 text-sm">
                              <InfoRow label="Date of birth" value={patient.date_of_birth} />
                              <InfoRow label="Allergies" value={patient.allergies} />
                              <InfoRow label="Medications" value={patient.medications} />
                              <InfoRow label="Medical conditions" value={patient.medical_conditions} />
                              <InfoRow label="Additional notes" value={patient.medical_notes} />
                              <InfoRow
                                label="Emergency contact"
                                value={
                                  patient.emergency_contact_name || patient.emergency_contact_phone
                                    ? `${patient.emergency_contact_name} ${patient.emergency_contact_phone}`
                                    : ""
                                }
                              />
                            </div>
                          </section>

                          <section className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
                            <h2 className="mb-4 text-lg font-bold text-slate-900">
                              Completed appointments
                            </h2>

                            <div className="space-y-3">
                              {patient.appointments.map((appointment) => {
                                const appointmentOpen =
                                  openAppointmentId === appointment.id;

                                return (
                                  <div
                                    key={appointment.id}
                                    className="overflow-hidden rounded-2xl border border-slate-100"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenAppointmentId(
                                          appointmentOpen ? null : appointment.id
                                        )
                                      }
                                      className="flex w-full items-center justify-between gap-4 bg-slate-50 px-4 py-3 text-left transition hover:bg-sky-50"
                                    >
                                      <div>
                                        <p className="font-semibold text-slate-900">
                                          {appointment.display_date} at {appointment.time}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                          {appointment.reason || "No reason provided"}
                                        </p>
                                      </div>

                                      <span className="text-xs font-semibold text-sky-600">
                                        {appointmentOpen ? "Hide notes" : "View notes"}
                                      </span>
                                    </button>

                                    {appointmentOpen && (
                                      <div className="space-y-3 bg-white px-4 py-4 text-sm">
                                        <div>
                                          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                                            Reason for visit
                                          </p>
                                          <p className="text-slate-700">
                                            {appointment.reason || "No reason provided."}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                                            Doctor notes
                                          </p>
                                          <p className="rounded-2xl bg-sky-50 px-4 py-3 text-slate-700">
                                            {appointment.physician_notes ||
                                              "No notes were added for this appointment."}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="text-slate-700">{value || "Not provided"}</p>
    </div>
  );
}