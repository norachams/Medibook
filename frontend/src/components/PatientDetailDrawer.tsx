import { useEffect, useState } from "react";
import { ChevronsRight, Maximize2, Minimize2 } from "lucide-react";
import { motion } from "framer-motion";
import CompleteAppointmentModal from "./CompleteAppointmentModal";
import DeclineAppointmentModal from "./DeclineAppointmentModal";

interface Booking {
  id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  reason: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  display_date: string;
  date: string;
  time: string;
}

interface PatientProfile {
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
}

interface PastVisit {
  id: number;
  reason: string;
  physician_notes: string;
  completed_at: string;
  display_date: string;
  date: string;
  time: string;
}

interface PatientDetailResponse {
  current_booking: {
    id: number;
    status: string;
    reason: string;
    display_date: string;
    date: string;
    time: string;
    physician_notes: string;
  };
  patient: PatientProfile;
  past_visits: PastVisit[];
}

interface PatientDetailDrawerProps {
  booking: Booking;
  token: string | null;
  onClose: () => void;
  onCompleted: (bookingId: number) => void;
  onStatusChange: (
    bookingId: number,
    status: "confirmed" | "cancelled",
    declineReason?: string
  ) => Promise<void>;
}

export default function PatientDetailDrawer({
  booking,
  token,
  onClose,
  onCompleted,
  onStatusChange,
}: PatientDetailDrawerProps) {
  const [details, setDetails] = useState<PatientDetailResponse | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`http://localhost:8000/api/bookings/${booking.id}/patient-detail`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load patient details.");
        const data: PatientDetailResponse = await res.json();
        setDetails(data);
        setNotes(data.current_booking.physician_notes ?? "");
      } catch {
        setError("Could not load patient details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [booking.id, token]);

  const handleComplete = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `http://localhost:8000/api/bookings/${booking.id}/complete`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ physician_notes: notes }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Could not complete appointment.");
      }

      onCompleted(booking.id);
      setCompleteModalOpen(false);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async () => {
  setSaving(true);
  setError(null);

  try {
    await onStatusChange(booking.id, "confirmed");
    onClose();
  } catch {
    setError("Could not accept appointment.");
  } finally {
    setSaving(false);
  }
};

const handleDecline = async (declineReason: string) => {
  setSaving(true);
  setError(null);

  try {
    await onStatusChange(booking.id, "cancelled", declineReason);
    setDeclineModalOpen(false);
    onClose();
  } catch {
    setError("Could not decline appointment.");
  } finally {
    setSaving(false);
  }
};

  const patient = details?.patient;

  return (
  <motion.div
    className="fixed inset-0 z-50 flex justify-end bg-black/30"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >

              <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            className="flex-1"
          />

 <motion.aside
  initial={{ x: "100%" }}
  animate={{ x: 0 }}
  exit={{ x: "100%" }}
  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
  className={[
    "relative h-full overflow-y-auto bg-white shadow-2xl",
    expanded ? "w-full" : "w-full max-w-4xl",
  ].join(" ")}
>
  <div className="absolute left-2 top-2 z-10 flex items-center gap-1">
    <button
      type="button"
      title="Close"
      aria-label="Close patient details"
      onClick={onClose}
      className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
    >
      <ChevronsRight size={24} />
    </button>

    <button
      type="button"
      title={expanded ? "Exit expanded view" : "Expand"}
      aria-label={expanded ? "Exit expanded view" : "Expand patient details"}
      onClick={() => setExpanded((prev) => !prev)}
      className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
    >
      {expanded ? <Minimize2 size={21} /> : <Maximize2 size={21} />}
    </button>
  </div>

  {/* Everything else gets normal spacing */}
<div className="px-14 pb-10 pt-16">

    {loading && (
      <div className="rounded-2xl bg-sky-50 px-5 py-8 text-center text-sm text-gray-400">
        Loading patient details…
      </div>
    )}

    {error && (
      <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
        {error}
      </div>
    )}

        {!loading && patient && (
          <div className="space-y-6">
           <section className="rounded-3xl border border-sky-100 bg-sky-50/70 p-6">
  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          {patient.full_name || booking.patient_name}
        </h2>

        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold capitalize",
            booking.status === "confirmed"
              ? "bg-emerald-50 text-emerald-700"
              : booking.status === "pending"
              ? "bg-amber-50 text-amber-700"
              : booking.status === "cancelled"
              ? "bg-gray-100 text-gray-500"
              : "bg-sky-50 text-sky-700",
          ].join(" ")}
        >
          {booking.status}
        </span>
      </div>

      <p className="text-base font-medium text-gray-800">
        {booking.display_date} at {booking.time}
      </p>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
        <p>
          <span className="font-semibold text-gray-700">Email:</span>{" "}
          {patient.email || booking.patient_email || "Not provided"}
        </p>

        <p>
          <span className="font-semibold text-gray-700">Phone:</span>{" "}
          {patient.phone || booking.patient_phone || "Not provided"}
        </p>

        <p>
          <span className="font-semibold text-gray-700">DOB:</span>{" "}
          {patient.date_of_birth || "Not provided"}
        </p>
      </div>
    </div>
  </div>

  <div className="mt-6 rounded-2xl bg-white/80 px-5 py-4 shadow-sm ring-1 ring-sky-100">
    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-500">
      Reason for visit
    </p>
    <p className="text-base leading-7 text-gray-800">
      {booking.reason || "No reason provided."}
    </p>
  </div>
</section>

            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-bold text-gray-900">
              Medical history
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock label="Allergies" value={patient.allergies} />
              <InfoBlock label="Current medications" value={patient.medications} />
              <InfoBlock label="Medical conditions" value={patient.medical_conditions} />
              <InfoBlock label="Additional notes" value={patient.medical_notes} />
            </div>
          </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Past visits 
              </h3>

              {details.past_visits.length === 0 ? (
                <p className="rounded-2xl bg-gray-50 px-4 py-4 text-sm text-gray-500">
                  No completed visits with this patient yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {details.past_visits.map((visit) => (
                    <div
                      key={visit.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        {visit.display_date} at {visit.time}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Reason: {visit.reason || "Not provided"}
                      </p>
                      <p className="mt-2 text-sm text-gray-700">
                        {visit.physician_notes || "No notes added."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

           <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
  {booking.status === "pending" ? (
    <>
      <h3 className="mb-2 text-lg font-bold text-gray-900">
        Review request
      </h3>

      <p className="mb-4 text-sm text-gray-500">
          Review the request before adding it to your schedule.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleAccept}
          className="rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
        >
          {saving ? "Updating..." : "Accept appointment"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => setDeclineModalOpen(true)}
          className="rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Updating..." : "Decline"}
        </button>
      </div>
    </>
  ) : (
    <>
      <h3 className="mb-2 text-lg font-bold text-gray-900">
        Session notes
      </h3>

      <p className="mb-4 text-sm text-gray-500">
        These notes will be saved to the patient’s past appointment history.
      </p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write notes from this appointment..."
        rows={6}
        className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />

      <button
        type="button"
        disabled={saving || booking.status === "completed"}
        onClick={() => setCompleteModalOpen(true)}
        className={[
          "mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white transition",
          saving || booking.status === "completed"
            ? "cursor-not-allowed bg-emerald-300"
            : "bg-emerald-500 shadow-md shadow-emerald-100 hover:bg-emerald-600",
        ].join(" ")}
      >
        {saving ? "Saving notes..." : "Mark as complete"}
      </button>
    </>
  )}
</section>
                   </div>
        )}
      </div>

       </motion.aside>
       {completeModalOpen && patient && (
  <CompleteAppointmentModal
    patientName={patient.full_name || booking.patient_name}
    appointmentLabel={`${booking.display_date} at ${booking.time}`}
    notes={notes}
    loading={saving}
    onClose={() => setCompleteModalOpen(false)}
    onConfirm={handleComplete}
  />
)}

{declineModalOpen && patient && (
  <DeclineAppointmentModal
    patientName={patient.full_name || booking.patient_name}
    appointmentLabel={`${booking.display_date} at ${booking.time}`}
    loading={saving}
    onClose={() => setDeclineModalOpen(false)}
    onConfirm={handleDecline}
  />
)}
   
  </motion.div>
);
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 px-5 py-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className="text-sm leading-6 text-gray-700">
        {value || "Not provided"}
      </p>
    </div>

  );
}