import { useState } from "react";
import { motion } from "framer-motion";

interface DeclineAppointmentModalProps {
  patientName: string;
  appointmentLabel: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function DeclineAppointmentModal({
  patientName,
  appointmentLabel,
  loading,
  onClose,
  onConfirm,
}: DeclineAppointmentModalProps) {
  const [reason, setReason] = useState("");

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
        className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
      >
        <h2 className="text-xl font-bold text-gray-900">
          Decline appointment request?
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          You are declining{" "}
          <span className="font-semibold text-gray-700">{patientName}</span>'s
          appointment request for{" "}
          <span className="font-semibold text-gray-700">{appointmentLabel}</span>.
          Please add a reason so the patient understands why it was declined.
        </p>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Reason for declining
          </label>

          <textarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly explain why you are declining this request..."
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Go back
          </button>

          <button
            type="button"
            disabled={loading || reason.trim().length === 0}
            onClick={() => onConfirm(reason.trim())}
            className={[
              "rounded-xl py-3 text-sm font-semibold text-white transition",
              loading || reason.trim().length === 0
                ? "cursor-not-allowed bg-red-300"
                : "bg-red-500 hover:bg-red-600",
            ].join(" ")}
          >
            {loading ? "Declining..." : "Submit decline"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}