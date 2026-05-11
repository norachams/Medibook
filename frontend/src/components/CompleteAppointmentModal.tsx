import { motion } from "framer-motion";

interface CompleteAppointmentModalProps {
  patientName: string;
  appointmentLabel: string;
  notes: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CompleteAppointmentModal({
  patientName,
  appointmentLabel,
  notes,
  loading,
  onClose,
  onConfirm,
}: CompleteAppointmentModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl shadow-slate-900/20"
      >
        <h2 className="text-2xl font-bold text-slate-900">
          Complete appointment?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          This will mark the appointment as completed and move it to the patient’s past appointments. Please review the notes before saving.
        </p>

        <div className="mt-5 rounded-2xl bg-sky-50 px-5 py-4 ring-1 ring-sky-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-500">
            Appointment
          </p>
          <p className="mt-1 font-semibold text-slate-900">{patientName}</p>
          <p className="mt-1 text-sm text-slate-600">{appointmentLabel}</p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Notes to save
          </p>

          <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {notes.trim() || "No notes added."}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Go back
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-100 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {loading ? "Completing..." : "Confirm complete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}